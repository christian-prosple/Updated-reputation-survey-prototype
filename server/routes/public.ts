import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { selectEmployers } from "../employer-logic";
import { allocateCompaniesByRolePreference } from "../role-allocation";
import {
  DEFAULT_EMPLOYER_DISPLAY_LOGIC,
  DEFAULT_ROLE_ALLOCATION_CONFIG,
  type EmployerItem,
  type EmployerDisplayLogic,
  type RoleAllocationConfig,
  type StoredAnswer,
  type ResponseMetadata,
} from "@shared/schema";

async function getDisplayLogic(): Promise<EmployerDisplayLogic> {
  const stored = await storage.getSetting<EmployerDisplayLogic>("employerDisplayLogic");
  return stored ?? DEFAULT_EMPLOYER_DISPLAY_LOGIC;
}

async function getAllocationConfig(): Promise<RoleAllocationConfig> {
  const stored = await storage.getSetting<RoleAllocationConfig>("roleAllocationConfig");
  return stored ?? DEFAULT_ROLE_ALLOCATION_CONFIG;
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
  // New algorithm (when enabled): role-preference allocation across career paths.
  // Legacy fallback: 20 core + 10 random non-core from the careerPathEmployers table,
  // or selectEmployers() from the taxonomy if that table is empty.
  const employersSchema = z.object({
    sessionId: z.string().optional(),
    careerPaths: z.array(z.string()).default([]),
  });

  app.post("/api/survey/employers", async (req: Request, res: Response) => {
    const parsed = employersSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload" }); return; }
    const { sessionId, careerPaths } = parsed.data;

    const allocationCfg = await getAllocationConfig();
    const T = allocationCfg.totalCompanies;

    // Fetch all active employer rows for the selected career paths.
    const allRows = await storage.listCareerPathEmployers();
    const relevant = allRows.filter(
      (r) => r.active && (careerPaths.length === 0 || careerPaths.includes(r.careerPath)),
    );

    let shownNames: string[] = [];
    let exposureMeta: Record<string, unknown> = {};

    if (relevant.length > 0 && careerPaths.length > 0 && allocationCfg.enabled) {
      // -----------------------------------------------------------------------
      // ROLE-PREFERENCE ALLOCATION ALGORITHM
      // -----------------------------------------------------------------------
      const allocation = allocateCompaniesByRolePreference(careerPaths, T, allocationCfg);

      // Build per-path pool (ordered by rank ascending).
      const byPath = new Map<string, typeof relevant>();
      for (const row of [...relevant].sort((a, b) => a.rank - b.rank)) {
        const arr = byPath.get(row.careerPath) ?? [];
        arr.push(row);
        byPath.set(row.careerPath, arr);
      }

      const taken = new Set<string>(); // deduplicate by lowercase name
      const rolePoolBreakdown: unknown[] = [];

      // First pass: pick exactly `finalCompanies` from each role's pool,
      // splitting into core and non-core according to coreRatio.
      const coreRatio = allocationCfg.coreRatio ?? 0.67;
      for (const alloc of allocation.rows) {
        if (alloc.finalCompanies === 0) continue;
        const pool = byPath.get(alloc.roleId) ?? [];

        // Split the pool by isCore flag (pool already sorted by rank asc)
        const corePool = pool.filter((e) => e.isCore);
        const nonCorePool = pool.filter((e) => !e.isCore).sort(() => Math.random() - 0.5);

        const nCore = Math.round(alloc.finalCompanies * coreRatio);
        const nNonCore = alloc.finalCompanies - nCore;

        const picked: string[] = [];

        // Pick from core pool first
        for (const emp of corePool) {
          if (picked.length >= nCore) break;
          const key = emp.employerName.toLowerCase();
          if (!taken.has(key)) { taken.add(key); picked.push(emp.employerName); }
        }
        // If core pool ran short, fill overflow from non-core
        const coreShortfall = nCore - picked.length;
        let nonCoreTarget = nNonCore + coreShortfall;

        // Pick from non-core pool
        for (const emp of nonCorePool) {
          if (picked.length >= nCore + nonCoreTarget) break;
          const key = emp.employerName.toLowerCase();
          if (!taken.has(key)) { taken.add(key); picked.push(emp.employerName); }
        }
        // If non-core ran short, fill remaining from core leftovers
        if (picked.length < alloc.finalCompanies) {
          for (const emp of corePool) {
            if (picked.length >= alloc.finalCompanies) break;
            const key = emp.employerName.toLowerCase();
            if (!taken.has(key)) { taken.add(key); picked.push(emp.employerName); }
          }
        }

        rolePoolBreakdown.push({
          role: alloc.roleId,
          rank: alloc.rank,
          allocated: alloc.finalCompanies,
          nCore,
          nNonCore,
          actuallyUsed: picked.length,
          poolSize: pool.length,
        });
        shownNames.push(...picked);
      }

      // Refill if deduplication left us short of T.
      if (shownNames.length < T) {
        // Iterate roles by rank (highest priority first) for refill.
        for (const alloc of [...allocation.rows].sort((a, b) => a.rank - b.rank)) {
          if (!alloc.considered) continue;
          if (shownNames.length >= T) break;
          const pool = byPath.get(alloc.roleId) ?? [];
          for (const emp of pool) {
            if (shownNames.length >= T) break;
            const key = emp.employerName.toLowerCase();
            if (!taken.has(key)) {
              taken.add(key);
              shownNames.push(emp.employerName);
            }
          }
        }
      }

      // Shuffle display order.
      shownNames = shownNames.sort(() => Math.random() - 0.5);

      exposureMeta = {
        careerPaths,
        shown: shownNames,
        recognized: [],
        notRecognized: [],
        algorithmVersion: "role_preference_allocation_v1",
        allocationConfig: allocationCfg,
        allocationResult: allocation.meta,
        rolePoolBreakdown,
      };
    } else if (relevant.length > 0) {
      // -----------------------------------------------------------------------
      // LEGACY ALGORITHM: 20 core + 10 random non-core
      // -----------------------------------------------------------------------
      const byName = new Map<string, typeof relevant[0]>();
      for (const row of relevant.sort((a, b) => a.rank - b.rank)) {
        if (!byName.has(row.employerName)) byName.set(row.employerName, row);
      }
      const unique = Array.from(byName.values());
      const core = unique.filter((r) => r.isCore).slice(0, 20);
      const nonCore = unique.filter((r) => !r.isCore).sort(() => Math.random() - 0.5);
      const needed = T - core.length;
      shownNames = [...core, ...nonCore.slice(0, needed)].map((r) => r.employerName);

      exposureMeta = {
        careerPaths,
        shown: shownNames,
        recognized: [],
        notRecognized: [],
        algorithmVersion: 2,
      };
    } else {
      // -----------------------------------------------------------------------
      // TAXONOMY FALLBACK (table empty)
      // -----------------------------------------------------------------------
      const tax = await storage.getTaxonomyByType("employers");
      if (!tax) { res.status(404).json({ message: "No employer taxonomy configured" }); return; }
      const logic = await getDisplayLogic();
      const result = selectEmployers(tax.items as EmployerItem[], careerPaths, logic);
      shownNames = result.shown.map((e) => e.employerName);

      exposureMeta = {
        careerPaths,
        shown: shownNames,
        recognized: [],
        notRecognized: [],
        algorithmVersion: 1,
      };
    }

    // Record exposure best-effort.
    if (sessionId) {
      const existing = await storage.getResponseBySession(sessionId);
      if (existing) {
        await storage.updateResponseBySession(sessionId, {
          metadata: {
            ...existing.metadata,
            employerExposure: {
              ...(existing.metadata.employerExposure ?? {}),
              ...exposureMeta,
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
      status: "completed",
      completedAt: new Date(),
      ...(answers ? { answers: answers as StoredAnswer[] } : {}),
      ...(metadata ? { metadata: { ...existing.metadata, ...(metadata as ResponseMetadata) } } : {}),
      ...(respondentEmail ? { respondentEmail } : {}),
    });
    res.json({ ok: true, responseId: updated?.id });
  });
}
