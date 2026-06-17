/**
 * migrate-config-labels.ts
 * ------------------------
 * Updates survey config id=1 to have correct titles and question labels
 * matching the live Survey.tsx copy, and adds static options for gender
 * and education level dropdowns so the admin editor can control them.
 *
 * Safe to re-run; it only updates config id=1.
 *
 * Usage:  npx tsx server/migrate-config-labels.ts
 */
import { storage } from "./storage";
import type { SurveyPageDef, SurveyOption } from "../shared/schema";

const EDUCATION_LEVEL_OPTIONS: SurveyOption[] = [
  "Accelerated master's",
  "Advanced certificate",
  "Associate's",
  "Bachelor's",
  "Bachelor's (Honours)",
  "Certificate",
  "Community / Technical college",
  "Diploma",
  "Doctorate",
  "Doctorate (PhD)",
  "High School Certificate",
  "Juris Doctor",
  "M.D.",
  "Masters (Coursework)",
  "Masters (Research)",
  "Master's of Business Administration",
  "Non-award",
  "Postdoctoral studies",
  "Professional Certificate",
  "Short course or microcredential",
  "Technical diploma",
  "Non-degree seeking",
].map((v) => ({ label: v, value: v }));

const GENDER_OPTIONS: SurveyOption[] = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
].map((v) => ({ label: v, value: v }));

async function run() {
  const config = await storage.getActiveSurveyConfig();
  if (!config) {
    console.error("No active survey config found.");
    process.exit(1);
  }

  const patchMap: Record<string, Partial<SurveyPageDef>> = {
    personal: {
      title: "Let's start with a bit about you",
      subtitle: "A few details to start.",
      questions: [
        { id: "email", type: "email", label: "Email (so we can send you your results)", required: true, optionsSource: "none" },
        {
          id: "gender",
          type: "single_select",
          label: "Gender",
          required: true,
          optionsSource: "static",
          options: GENDER_OPTIONS,
        },
        { id: "preferredCity", type: "text", label: "Preferred work location (city)", required: true, optionsSource: "none" },
      ],
    },
    education: {
      title: "Tell us about your education",
      subtitle: "Where and what you study.",
      questions: [
        { id: "country", type: "single_select", label: "Country of study", required: true, optionsSource: "none" },
        {
          id: "educationLevel",
          type: "single_select",
          label: "Highest education level (completed or in progress)",
          required: false,
          optionsSource: "static",
          options: EDUCATION_LEVEL_OPTIONS,
        },
        { id: "selectedDegrees", type: "multi_select", label: "Study field(s)", required: true, optionsSource: "none" },
        { id: "university", type: "text", label: "School", required: true, optionsSource: "none" },
        { id: "graduation", type: "text", label: "Graduation date (expected or actual)", required: true, optionsSource: "none" },
      ],
    },
    careers: {
      title: "Career paths",
      subtitle: "Pick the career paths you're interested in.",
      questions: [
        { id: "selectedRoles", type: "tagbox", label: "What career path(s) are you most interested in?", required: true, optionsSource: "none" },
      ],
    },
    top_pick_reason: {
      title: "One last thing...",
      subtitle: "Tell us why you chose your top employer.",
      questions: [
        { id: "topPickReason", type: "text", label: "Why did you choose your top pick?", required: true, optionsSource: "none" },
      ],
    },
    thankyou: {
      title: "Thanks for submitting your list!",
      subtitle: "Your preferences have been saved and will contribute towards Prosple's global employer rankings!",
      questions: [],
    },
  };

  const updatedPages: SurveyPageDef[] = config.pages.map((page) => {
    const patch = patchMap[page.kind ?? ""];
    if (!patch) return page;
    return { ...page, ...patch };
  });

  await storage.updateSurveyConfig(1, { pages: updatedPages });
  console.log("✅ Config labels updated for id=1.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
