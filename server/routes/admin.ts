import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdmin, getAdminPassword } from "../auth";
import { parseCsv, toBool, toNum } from "../csv";
import {
  insertSurveyConfigSchema,
  insertTaxonomySchema,
  DEFAULT_EMPLOYER_DISPLAY_LOGIC,
  employerDisplayLogicSchema,
  type EmployerItem,
  type EmployerDisplayLogic,
  type SurveyResponse,
} from "@shared/schema";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function responsesToCsv(rows: SurveyResponse[]): string {
  const header = ["id", "sessionId", "status", "respondentEmail", "startedAt", "completedAt", "careerPaths", "shown", "recognized", "answers"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const exposure = r.metadata?.employerExposure;
    const answersFlat = (r.answers || []).map((a) => `${a.label}=${JSON.stringify(a.value)}`).join(" | ");
    lines.push([
      r.id,
      r.sessionId,
      r.status,
      r.respondentEmail ?? "",
      r.startedAt?.toISOString?.() ?? "",
      r.completedAt?.toISOString?.() ?? "",
      (exposure?.careerPaths ?? []).join("; "),
      (exposure?.shown ?? []).join("; "),
      (exposure?.recognized ?? []).join("; "),
      answersFlat,
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

export function registerAdminRoutes(app: Express): void {
  // --- Auth ---
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const password = String(req.body?.password ?? "");
    if (password && password === getAdminPassword()) {
      req.session.isAdmin = true;
      res.json({ ok: true });
      return;
    }
    res.status(401).json({ message: "Incorrect password" });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/admin/me", (req: Request, res: Response) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  // Everything below requires admin.
  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    const [total, completed, partial, configs, taxonomies] = await Promise.all([
      storage.countResponses(),
      storage.countResponses("completed"),
      storage.countResponses("partial"),
      storage.listSurveyConfigs(),
      storage.listTaxonomies(),
    ]);
    res.json({
      responses: { total, completed, partial },
      configs: configs.length,
      taxonomies: taxonomies.length,
      activeConfig: configs.find((c) => c.status === "active")?.name ?? null,
    });
  });

  // --- Survey configs ---
  app.get("/api/admin/configs", requireAdmin, async (_req, res) => {
    res.json(await storage.listSurveyConfigs());
  });
  app.get("/api/admin/configs/:id", requireAdmin, async (req, res) => {
    const config = await storage.getSurveyConfig(Number(req.params.id));
    if (!config) { res.status(404).json({ message: "Not found" }); return; }
    res.json(config);
  });
  app.post("/api/admin/configs", requireAdmin, async (req, res) => {
    const parsed = insertSurveyConfigSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid config", errors: parsed.error.flatten() }); return; }
    res.json(await storage.createSurveyConfig(parsed.data));
  });
  app.patch("/api/admin/configs/:id", requireAdmin, async (req, res) => {
    const parsed = insertSurveyConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid config", errors: parsed.error.flatten() }); return; }
    const updated = await storage.updateSurveyConfig(Number(req.params.id), parsed.data);
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.post("/api/admin/configs/:id/activate", requireAdmin, async (req, res) => {
    const updated = await storage.activateSurveyConfig(Number(req.params.id));
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.post("/api/admin/configs/:id/duplicate", requireAdmin, async (req, res) => {
    const config = await storage.getSurveyConfig(Number(req.params.id));
    if (!config) { res.status(404).json({ message: "Not found" }); return; }
    const copy = await storage.createSurveyConfig({
      name: `${config.name} (copy)`,
      version: config.version + 1,
      status: "draft",
      pages: config.pages,
      logic: config.logic,
    });
    res.json(copy);
  });
  app.delete("/api/admin/configs/:id", requireAdmin, async (req, res) => {
    await storage.deleteSurveyConfig(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- Responses ---
  app.get("/api/admin/responses", requireAdmin, async (req, res) => {
    const status = req.query.status === "completed" || req.query.status === "partial" ? req.query.status : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const [rows, total] = await Promise.all([
      storage.listResponses({ status, limit, offset }),
      storage.countResponses(status),
    ]);
    res.json({ rows, total });
  });
  app.get("/api/admin/responses/export.csv", requireAdmin, async (req, res) => {
    const status = req.query.status === "completed" || req.query.status === "partial" ? req.query.status : undefined;
    const rows = await storage.listResponses({ status, limit: 100000, offset: 0 });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="responses.csv"`);
    res.send(responsesToCsv(rows));
  });
  app.get("/api/admin/responses/:id", requireAdmin, async (req, res) => {
    const row = await storage.getResponse(Number(req.params.id));
    if (!row) { res.status(404).json({ message: "Not found" }); return; }
    res.json(row);
  });
  app.delete("/api/admin/responses/:id", requireAdmin, async (req, res) => {
    await storage.deleteResponse(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- Taxonomies ---
  app.get("/api/admin/taxonomies", requireAdmin, async (_req, res) => {
    res.json(await storage.listTaxonomies());
  });
  app.get("/api/admin/taxonomies/:id", requireAdmin, async (req, res) => {
    const tax = await storage.getTaxonomy(Number(req.params.id));
    if (!tax) { res.status(404).json({ message: "Not found" }); return; }
    res.json(tax);
  });
  app.post("/api/admin/taxonomies", requireAdmin, async (req, res) => {
    const parsed = insertTaxonomySchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid taxonomy", errors: parsed.error.flatten() }); return; }
    res.json(await storage.createTaxonomy(parsed.data));
  });
  app.patch("/api/admin/taxonomies/:id", requireAdmin, async (req, res) => {
    const parsed = insertTaxonomySchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid taxonomy", errors: parsed.error.flatten() }); return; }
    const updated = await storage.updateTaxonomy(Number(req.params.id), parsed.data);
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.delete("/api/admin/taxonomies/:id", requireAdmin, async (req, res) => {
    await storage.deleteTaxonomy(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- CSV import flow: preview then commit ---
  const previewSchema = z.object({
    filename: z.string(),
    content: z.string(),
    mapping: z.record(z.string()).optional(),
  });
  // Preview: parse CSV, return headers + first rows so the admin can map columns.
  app.post("/api/admin/taxonomies/:id/import/preview", requireAdmin, async (req, res) => {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload" }); return; }
    const { headers, rows } = parseCsv(parsed.data.content);
    if (headers.length === 0) { res.status(400).json({ message: "Empty or invalid CSV" }); return; }
    const imp = await storage.createTaxonomyImport({
      taxonomyId: Number(req.params.id),
      filename: parsed.data.filename,
      rowCount: rows.length,
      status: "previewed",
      rawPreview: { headers, sample: rows.slice(0, 10) },
      mappingConfig: parsed.data.mapping ?? {},
      processingSummary: {},
    });
    res.json({ importId: imp.id, headers, rowCount: rows.length, sample: rows.slice(0, 10) });
  });

  // Commit: map rows into employer items and merge into the taxonomy.
  const commitSchema = z.object({
    content: z.string(),
    filename: z.string().optional(),
    importId: z.number().optional(),
    // Maps target field -> CSV column header.
    mapping: z.object({
      employerName: z.string(),
      careerPath: z.string().optional(),
      displayName: z.string().optional(),
      industry: z.string().optional(),
      location: z.string().optional(),
      isClient: z.string().optional(),
      priorityTier: z.string().optional(),
      popularityScore: z.string().optional(),
      rankingScore: z.string().optional(),
      aliases: z.string().optional(),
    }),
    mode: z.enum(["replace", "merge"]).default("merge"),
  });
  app.post("/api/admin/taxonomies/:id/import/commit", requireAdmin, async (req, res) => {
    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() }); return; }
    const taxId = Number(req.params.id);
    const tax = await storage.getTaxonomy(taxId);
    if (!tax) { res.status(404).json({ message: "Taxonomy not found" }); return; }

    const { rows } = parseCsv(parsed.data.content);
    const m = parsed.data.mapping;
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const importedItems: EmployerItem[] = [];
    for (const row of rows) {
      const name = (row[m.employerName] ?? "").trim();
      if (!name) continue;
      const careerPath = m.careerPath ? (row[m.careerPath] ?? "").trim() : undefined;
      importedItems.push({
        id: slug(name) || slug(`${name}-${importedItems.length}`),
        employerName: name,
        displayName: m.displayName ? row[m.displayName] : name,
        aliases: m.aliases ? (row[m.aliases] ?? "").split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [],
        careerPath,
        industry: m.industry ? row[m.industry] : "",
        location: m.location ? row[m.location] : "",
        isClient: m.isClient ? toBool(row[m.isClient]) : false,
        priorityTier: m.priorityTier ? (toNum(row[m.priorityTier]) ?? 0) : 0,
        popularityScore: m.popularityScore ? (toNum(row[m.popularityScore]) ?? 0) : 0,
        rankingScore: m.rankingScore ? (toNum(row[m.rankingScore]) ?? 0) : 0,
        source: "import",
        active: true,
        metadata: careerPath ? { careerPaths: [careerPath] } : {},
      });
    }

    let finalItems: EmployerItem[];
    if (parsed.data.mode === "replace") {
      finalItems = importedItems;
    } else {
      const byId = new Map<string, EmployerItem>();
      (tax.items as EmployerItem[]).forEach((i) => byId.set(i.id, i));
      importedItems.forEach((i) => byId.set(i.id, { ...byId.get(i.id), ...i }));
      finalItems = Array.from(byId.values());
    }

    const updated = await storage.updateTaxonomy(taxId, { items: finalItems });
    if (parsed.data.importId) {
      await storage.updateTaxonomyImport(parsed.data.importId, {
        status: "imported",
        processingSummary: { imported: importedItems.length, total: finalItems.length, mode: parsed.data.mode },
      });
    }
    res.json({ ok: true, imported: importedItems.length, total: finalItems.length, taxonomy: updated });
  });

  app.get("/api/admin/imports", requireAdmin, async (req, res) => {
    const taxonomyId = req.query.taxonomyId ? Number(req.query.taxonomyId) : undefined;
    res.json(await storage.listTaxonomyImports(taxonomyId));
  });

  // --- Settings: employer display logic ---
  app.get("/api/admin/settings/employer-logic", requireAdmin, async (_req, res) => {
    const logic = (await storage.getSetting<EmployerDisplayLogic>("employerDisplayLogic")) ?? DEFAULT_EMPLOYER_DISPLAY_LOGIC;
    res.json(logic);
  });
  app.put("/api/admin/settings/employer-logic", requireAdmin, async (req, res) => {
    // Validate the incoming payload (bounds + types) before merging.
    const parsed = employerDisplayLogicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid display logic", errors: parsed.error.flatten() });
      return;
    }
    const incoming = parsed.data;
    const merged: EmployerDisplayLogic = {
      ...DEFAULT_EMPLOYER_DISPLAY_LOGIC,
      ...incoming,
      buckets: { ...DEFAULT_EMPLOYER_DISPLAY_LOGIC.buckets, ...(incoming.buckets ?? {}) },
      weights: { ...DEFAULT_EMPLOYER_DISPLAY_LOGIC.weights, ...(incoming.weights ?? {}) },
      version: (incoming.version ?? DEFAULT_EMPLOYER_DISPLAY_LOGIC.version),
    };
    await storage.setSetting("employerDisplayLogic", merged as unknown as Record<string, unknown>);
    res.json(merged);
  });
}
