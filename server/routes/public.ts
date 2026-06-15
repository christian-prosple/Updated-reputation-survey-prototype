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

  // Select employers for the recognition step using the display algorithm.
  const employersSchema = z.object({
    sessionId: z.string().optional(),
    careerPaths: z.array(z.string()).default([]),
  });
  app.post("/api/survey/employers", async (req: Request, res: Response) => {
    const parsed = employersSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload" });
      return;
    }
    const { sessionId, careerPaths } = parsed.data;
    const tax = await storage.getTaxonomyByType("employers");
    if (!tax) {
      res.status(404).json({ message: "No employer taxonomy configured" });
      return;
    }
    const logic = await getDisplayLogic();
    const result = selectEmployers(tax.items as EmployerItem[], careerPaths, logic);

    // Record what was shown on the response (best-effort).
    if (sessionId) {
      const existing = await storage.getResponseBySession(sessionId);
      if (existing) {
        await storage.updateResponseBySession(sessionId, {
          metadata: {
            ...existing.metadata,
            employerExposure: {
              ...(existing.metadata.employerExposure ?? { recognized: [], notRecognized: [] }),
              careerPaths,
              shown: result.shown.map((e) => e.employerName),
              recognized: existing.metadata.employerExposure?.recognized ?? [],
              notRecognized: existing.metadata.employerExposure?.notRecognized ?? [],
              algorithmVersion: result.logicVersion,
              displayLogicSnapshot: logic as unknown as Record<string, unknown>,
            },
          },
        });
      }
    }

    res.json({
      employers: result.shown.map((e) => ({
        id: e.id,
        name: e.employerName,
        displayName: e.displayName || e.employerName,
        careerPath: e.careerPath,
        isClient: e.isClient ?? false,
      })),
      candidatesConsidered: result.candidatesConsidered,
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
