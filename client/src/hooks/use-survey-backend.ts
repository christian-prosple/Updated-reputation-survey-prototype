import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { useSurvey } from "./use-survey";

type SurveyApi = ReturnType<typeof useSurvey>;
type State = SurveyApi["state"];
type Actions = SurveyApi["actions"];

const SESSION_KEY = "survey_session_id";

interface StoredAnswer {
  questionId: string;
  label: string;
  value: unknown;
}

// Build a snapshot of the respondent's answers from local survey state. Labels
// are stored alongside values so saved responses stay readable.
function buildAnswers(state: State): StoredAnswer[] {
  const p = state.personalInfo;
  const recognized = Array.from(new Set(state.selectedCompanies.map((c) => c.name)));
  return [
    { questionId: "email", label: "Email", value: p.email },
    { questionId: "gender", label: "Gender", value: p.gender === "Self-described" ? p.customGender : p.gender },
    { questionId: "educationStatus", label: "Education status", value: p.educationStatus },
    { questionId: "educationLevel", label: "Education level", value: p.educationLevel },
    { questionId: "graduation", label: "Graduation", value: [p.graduationMonth, p.graduationYear].filter(Boolean).join(" ") },
    { questionId: "country", label: "Country of study", value: p.country },
    { questionId: "university", label: "School", value: p.university },
    { questionId: "preferredCity", label: "Preferred work location", value: p.preferredCity },
    { questionId: "selectedDegrees", label: "Study fields", value: state.selectedDegrees },
    { questionId: "selectedRoles", label: "Career paths", value: state.selectedRoles },
    { questionId: "roleOrder", label: "Career path order", value: state.roleOrder },
    { questionId: "recognizedEmployers", label: "Recognised employers", value: recognized },
    { questionId: "finalRanking", label: "Final ranking", value: state.finalRanking.map((c) => c.name) },
    { questionId: "topPickReason", label: "Top pick reason", value: p.topPickReason },
  ];
}

function buildMetadata(state: State) {
  const shown = state.displayedCompanies.map((c) => c.name);
  const recognized = Array.from(new Set(state.selectedCompanies.map((c) => c.name)));
  const notRecognized = shown.filter((n) => !recognized.includes(n));
  return {
    employerExposure: {
      careerPaths: state.selectedRoles,
      shown,
      recognized,
      notRecognized,
    },
    eloRatings: state.eloRatings,
  };
}

// Wires the bespoke survey UI to the backend: starts a session, saves progress
// on each step, fetches the employer pool from the display algorithm, and marks
// the response complete on the thank-you step. All failures are non-fatal so the
// survey keeps working even if the backend is unavailable.
export function useSurveyBackend(state: State, actions: Actions) {
  const sessionIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const employersFetchedRef = useRef(false);
  const completedRef = useRef(false);

  // Start / resume a session. Returns the session id, or null on failure.
  // Safe to call repeatedly: it reuses an existing session and retries if a
  // previous start attempt failed, so transient errors don't permanently drop
  // response persistence.
  async function ensureSession(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current;
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      const res = await apiRequest("POST", "/api/survey/start", existing ? { sessionId: existing } : {});
      const data = await res.json();
      sessionIdRef.current = data.sessionId;
      sessionStorage.setItem(SESSION_KEY, data.sessionId);
      return data.sessionId;
    } catch {
      return null;
    }
  }

  // Start / resume a session on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void ensureSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the employer pool from the backend display algorithm when reaching the
  // recognition step (step 4). Falls back to the local pool on error.
  useEffect(() => {
    if (state.step !== 4) {
      employersFetchedRef.current = false;
      return;
    }
    if (employersFetchedRef.current || state.selectedRoles.length === 0) return;
    employersFetchedRef.current = true;
    (async () => {
      try {
        const res = await apiRequest("POST", "/api/survey/employers", {
          sessionId: sessionIdRef.current,
          careerPaths: state.selectedRoles,
        });
        const data = await res.json();
        if (Array.isArray(data.employers) && data.employers.length > 0) {
          const mapped = data.employers.map((e: { name: string; careerPath?: string }) => {
            const role = (e.careerPath && state.selectedRoles.includes(e.careerPath as any)
              ? e.careerPath
              : state.selectedRoles[0]) as any;
            return { name: e.name, role, id: `${e.name}|${role}` };
          });
          actions.setDisplayedCompanies(mapped);
        }
      } catch {
        /* keep local pool */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.selectedRoles]);

  // Save partial progress whenever the step changes.
  useEffect(() => {
    if (state.step === 0 || state.step === 8) return;
    (async () => {
      try {
        const sessionId = await ensureSession();
        if (!sessionId) return;
        await apiRequest("POST", "/api/survey/save", {
          sessionId,
          answers: buildAnswers(state),
          metadata: buildMetadata(state),
          respondentEmail: state.personalInfo.email || undefined,
        });
      } catch {
        /* non-fatal */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  // Mark complete on the thank-you step.
  useEffect(() => {
    if (state.step !== 8 || completedRef.current) return;
    completedRef.current = true;
    (async () => {
      try {
        const sessionId = await ensureSession();
        if (!sessionId) {
          completedRef.current = false;
          return;
        }
        await apiRequest("POST", "/api/survey/complete", {
          sessionId,
          answers: buildAnswers(state),
          metadata: buildMetadata(state),
          respondentEmail: state.personalInfo.email || undefined,
        });
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* non-fatal */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);
}
