import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { selectEmployers } from "../employer-logic";
import {
  DEFAULT_EMPLOYER_DISPLAY_LOGIC,
  type EmployerItem,
  type EmployerDisplayLogic,
  type StoredAnswer,
  type ResponseMetadata,
} from "@shared/schema";

async function getDisplayLogic(): Promise<EmployerDisplayLogic> {
  const stored = await storage.getSetting<EmployerDisplayLogic>("employerDisplayLogic");
  return stored ?? DEFAULT_EMPLOYER_DISPLAY_LOGIC;
}

const answerSchema = z.object({
  questionId: z.string(),
  label: z.string(),
  value: z.unknown(),
});

export function registerPublicRoutes(app: Express): void {
  // Active survey config (public, read-only).
  app.get("/api/survey/active", async (_req: Request, res: Response) => {
    const config = await storage.getActiveSurveyConfig();
    if (!config) {
      res.status(404).json({ message: "No active survey" });
      return;
    }
    res.json({ id: config.id, name: config.name, version: config.version, pages: config.pages });
  });

  // Start (or resume) a survey session.
  app.post("/api/survey/start", async (req: Request, res: Response) => {
    const config = await storage.getActiveSurveyConfig();
    const sessionId = (typeof req.body?.sessionId === "string" && req.body.sessionId) || randomUUID();

    let response = await storage.getResponseBySession(sessionId);
    if (!response) {
      const metadata: ResponseMetadata = {
        userAgent: req.headers["user-agent"] || "",
        surveyVersion: config?.version,
        source: "web",
      };
      response = await storage.createResponse({
        sessionId,
        surveyConfigId: config?.id ?? null,
        respondentEmail: null,
        status: "partial",
        answers: [],
        metadata,
      });
    }
    res.json({ sessionId: response.sessionId, responseId: response.id });
  });

  // Save partial progress.
  const saveSchema = z.object({
    sessionId: z.string(),
    answers: z.array(answerSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
    respondentEmail: z.string().optional(),
  });
  app.post("/api/survey/save", async (req: Request, res: Response) => {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }
    const { sessionId, answers, metadata, respondentEmail } = parsed.data;
    const existing = await storage.getResponseBySession(sessionId);
    if (!existing) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    const updated = await storage.updateResponseBySession(sessionId, {
      ...(answers ? { answers: answers as StoredAnswer[] } : {}),
      ...(metadata ? { metadata: { ...existing.metadata, ...(metadata as ResponseMetadata) } } : {}),
      ...(respondentEmail ? { respondentEmail } : {}),
    });
    res.json({ ok: true, responseId: updated?.id });
  });

  // Select employers for the recognition step.
  // Algorithm: up to 20 core employers (isCore=true, ranked lowest first) +
  // random 10 from non-core, giving 30 total. Falls back to the legacy
  // selectEmployers() when the new table is empty.
  const TOTAL_SHOWN = 30;
  const CORE_SLOTS = 20;
  const employersSchema = z.object({
    sessionId: z.string().optional(),
    careerPaths: z.array(z.string()).default([]),
  });
  app.post("/api/survey/employers", async (req: Request, res: Response) => {
    const parsed = employersSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload" }); return; }
    const { sessionId, careerPaths } = parsed.data;

    // --- New algorithm: query careerPathEmployers table ---
    const allRows = await storage.listCareerPathEmployers();
    const relevant = allRows.filter(
      (r) => r.active && (careerPaths.length === 0 || careerPaths.includes(r.careerPath)),
    );

    let shownNames: string[];
    if (relevant.length > 0) {
      // Deduplicate by employer name (lowest rank wins when same employer appears in multiple paths).
      const byName = new Map<string, typeof relevant[0]>();
      for (const row of relevant.sort((a, b) => a.rank - b.rank)) {
        if (!byName.has(row.employerName)) byName.set(row.employerName, row);
      }
      const unique = Array.from(byName.values());
      const core = unique.filter((r) => r.isCore).slice(0, CORE_SLOTS);
      const nonCore = unique.filter((r) => !r.isCore).sort(() => Math.random() - 0.5);
      const needed = TOTAL_SHOWN - core.length;
      const fill = nonCore.slice(0, needed);
      shownNames = [...core, ...fill].map((r) => r.employerName);
    } else {
      // Legacy fallback
      const tax = await storage.getTaxonomyByType("employers");
      if (!tax) { res.status(404).json({ message: "No employer taxonomy configured" }); return; }
      const logic = await getDisplayLogic();
      const result = selectEmployers(tax.items as EmployerItem[], careerPaths, logic);
      shownNames = result.shown.map((e) => e.employerName);
    }

    // Record exposure (best-effort).
    if (sessionId) {
      const existing = await storage.getResponseBySession(sessionId);
      if (existing) {
        await storage.updateResponseBySession(sessionId, {
          metadata: {
            ...existing.metadata,
            employerExposure: {
              ...(existing.metadata.employerExposure ?? { recognized: [], notRecognized: [] }),
              careerPaths,
              shown: shownNames,
              recognized: existing.metadata.employerExposure?.recognized ?? [],
              notRecognized: existing.metadata.employerExposure?.notRecognized ?? [],
              algorithmVersion: 2,
            },
          },
        });
      }
    }

    res.json({
      employers: shownNames.map((name, i) => ({ id: `emp-${i}`, name, displayName: name })),
    });
  });

  // Complete the survey.
  const completeSchema = z.object({
    sessionId: z.string(),
    answers: z.array(answerSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
    respondentEmail: z.string().optional(),
  });
  app.post("/api/survey/complete", async (req: Request, res: Response) => {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload" });
      return;
    }
    const { sessionId, answers, metadata, respondentEmail } = parsed.data;
    const existing = await storage.getResponseBySession(sessionId);
    if (!existing) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    const updated = await storage.updateResponseBySession(sessionId, {
      status: "completed",
      completedAt: new Date(),
      ...(answers ? { answers: answers as StoredAnswer[] } : {}),
      ...(metadata ? { metadata: { ...existing.metadata, ...(metadata as ResponseMetadata) } } : {}),
      ...(respondentEmail ? { respondentEmail } : {}),
    });
    res.json({ ok: true, responseId: updated?.id });
  });
}
