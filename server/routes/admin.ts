import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
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
  const header = [
    "id", "sessionId", "status", "respondentEmail", "startedAt", "completedAt",
    "configId", "configVersion", "careerPaths", "shown", "recognized", "answers",
  ];
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
      r.surveyConfigId ?? "",
      r.metadata?.surveyVersion ?? "",
      (exposure?.careerPaths ?? []).join("; "),
      (exposure?.shown ?? []).join("; "),
      (exposure?.recognized ?? []).join("; "),
      answersFlat,
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

// One row per (response, employer shown) so analysts can pivot on recognition.
function exposureToCsv(rows: SurveyResponse[]): string {
  const header = ["responseId", "respondentEmail", "status", "careerPath", "employer", "recognized"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const ex = r.metadata?.employerExposure;
    if (!ex) continue;
    const recognized = new Set(ex.recognized ?? []);
    const careerPaths = (ex.careerPaths ?? []).join("; ");
    for (const employer of ex.shown ?? []) {
      lines.push([
        r.id,
        r.respondentEmail ?? "",
        r.status,
        careerPaths,
        employer,
        recognized.has(employer) ? "yes" : "no",
      ].map(csvEscape).join(","));
    }
  }
  return lines.join("\n");
}

function employerItemsToCsv(items: EmployerItem[]): string {
  const header = [
    "id", "employerName", "displayName", "aliases", "careerPath", "industry",
    "location", "isClient", "priorityTier", "popularityScore", "rankingScore", "active",
  ];
  const lines = [header.join(",")];
  for (const it of items) {
    lines.push([
      it.id,
      it.employerName,
      it.displayName ?? "",
      (it.aliases ?? []).join("; "),
      it.careerPath ?? "",
      it.industry ?? "",
      it.location ?? "",
      it.isClient ? "yes" : "no",
      it.priorityTier ?? 0,
      it.popularityScore ?? 0,
      it.rankingScore ?? 0,
      it.active === false ? "no" : "yes",
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

// Parse the shared response-filter query params used by list + export endpoints.
function parseResponseFilter(req: Request) {
  const status: "completed" | "partial" | undefined =
    req.query.status === "completed" || req.query.status === "partial" ? req.query.status : undefined;
  const email = typeof req.query.email === "string" && req.query.email ? req.query.email : undefined;
  const careerPath = typeof req.query.careerPath === "string" && req.query.careerPath ? req.query.careerPath : undefined;
  const startDate = typeof req.query.startDate === "string" && req.query.startDate ? new Date(req.query.startDate) : undefined;
  const endDate = typeof req.query.endDate === "string" && req.query.endDate ? new Date(req.query.endDate) : undefined;
  return { status, email, careerPath, startDate, endDate };
}

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/me", (_req: Request, res: Response) => {
    res.json({ isAdmin: true });
  });

  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    const [total, completed, partial, configs, taxonomies] = await Promise.all([
      storage.countResponses(),
      storage.countResponses({ status: "completed" }),
      storage.countResponses({ status: "partial" }),
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
  app.get("/api/admin/configs", async (_req, res) => {
    res.json(await storage.listSurveyConfigs());
  });
  app.get("/api/admin/configs/:id", async (req, res) => {
    const config = await storage.getSurveyConfig(Number(req.params.id));
    if (!config) { res.status(404).json({ message: "Not found" }); return; }
    res.json(config);
  });
  app.post("/api/admin/configs", async (req, res) => {
    const parsed = insertSurveyConfigSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid config", errors: parsed.error.flatten() }); return; }
    res.json(await storage.createSurveyConfig(parsed.data));
  });
  app.patch("/api/admin/configs/:id", async (req, res) => {
    const parsed = insertSurveyConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid config", errors: parsed.error.flatten() }); return; }
    const updated = await storage.updateSurveyConfig(Number(req.params.id), parsed.data);
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.post("/api/admin/configs/:id/activate", async (req, res) => {
    const updated = await storage.activateSurveyConfig(Number(req.params.id));
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.post("/api/admin/configs/:id/duplicate", async (req, res) => {
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
  app.delete("/api/admin/configs/:id", async (req, res) => {
    await storage.deleteSurveyConfig(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- Responses ---
  app.get("/api/admin/responses", async (req, res) => {
    const filter = parseResponseFilter(req);
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const [rows, total] = await Promise.all([
      storage.listResponses({ ...filter, limit, offset }),
      storage.countResponses(filter),
    ]);
    res.json({ rows, total });
  });
  app.get("/api/admin/responses/export.csv", async (req, res) => {
    const filter = parseResponseFilter(req);
    const rows = await storage.listResponses({ ...filter, limit: 100000, offset: 0 });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="responses.csv"`);
    res.send(responsesToCsv(rows));
  });
  // Exposure export: one row per (response, employer shown) with recognition flag.
  app.get("/api/admin/responses/exposure.csv", async (req, res) => {
    const filter = parseResponseFilter(req);
    const rows = await storage.listResponses({ ...filter, limit: 100000, offset: 0 });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="employer-exposure.csv"`);
    res.send(exposureToCsv(rows));
  });
  app.get("/api/admin/responses/:id", async (req, res) => {
    const row = await storage.getResponse(Number(req.params.id));
    if (!row) { res.status(404).json({ message: "Not found" }); return; }
    res.json(row);
  });
  app.delete("/api/admin/responses/:id", async (req, res) => {
    await storage.deleteResponse(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- Taxonomies ---
  app.get("/api/admin/taxonomies", async (_req, res) => {
    res.json(await storage.listTaxonomies());
  });
  app.get("/api/admin/taxonomies/:id", async (req, res) => {
    const tax = await storage.getTaxonomy(Number(req.params.id));
    if (!tax) { res.status(404).json({ message: "Not found" }); return; }
    res.json(tax);
  });
  app.post("/api/admin/taxonomies", async (req, res) => {
    const parsed = insertTaxonomySchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid taxonomy", errors: parsed.error.flatten() }); return; }
    res.json(await storage.createTaxonomy(parsed.data));
  });
  app.patch("/api/admin/taxonomies/:id", async (req, res) => {
    const parsed = insertTaxonomySchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid taxonomy", errors: parsed.error.flatten() }); return; }
    const updated = await storage.updateTaxonomy(Number(req.params.id), parsed.data);
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });
  app.delete("/api/admin/taxonomies/:id", async (req, res) => {
    await storage.deleteTaxonomy(Number(req.params.id));
    res.json({ ok: true });
  });
  // Export taxonomy items as CSV (employer-shaped columns).
  app.get("/api/admin/taxonomies/:id/export.csv", async (req, res) => {
    const tax = await storage.getTaxonomy(Number(req.params.id));
    if (!tax) { res.status(404).json({ message: "Not found" }); return; }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${tax.name.replace(/[^a-z0-9]+/gi, "-")}.csv"`);
    res.send(employerItemsToCsv(tax.items as EmployerItem[]));
  });
  // Replace the full item list for a taxonomy (used by manual item management).
  app.put("/api/admin/taxonomies/:id/items", async (req, res) => {
    const itemsSchema = z.object({ items: z.array(z.record(z.unknown())) });
    const parsed = itemsSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid items", errors: parsed.error.flatten() }); return; }
    const updated = await storage.updateTaxonomy(Number(req.params.id), { items: parsed.data.items as unknown as EmployerItem[] });
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  });

  // --- CSV import flow: preview then commit ---
  const previewSchema = z.object({
    filename: z.string(),
    content: z.string(),
    mapping: z.record(z.string()).optional(),
  });
  // Preview: parse CSV, return headers + first rows so the admin can map columns.
  app.post("/api/admin/taxonomies/:id/import/preview", async (req, res) => {
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
      active: z.string().optional(),
    }),
    mode: z.enum(["replace", "merge"]).default("merge"),
    // Processing rules applied to the parsed rows before saving.
    rules: z
      .object({
        dedupe: z.boolean().default(true), // collapse duplicate names/aliases
        mergeAliases: z.boolean().default(true), // keep aliases when merging dupes
        filterActive: z.boolean().default(false), // drop rows with active=no
        markAllClients: z.boolean().default(false), // force isClient=true
        defaultPriorityTier: z.number().int().nonnegative().default(0),
      })
      .partial()
      .optional(),
  });
  app.post("/api/admin/taxonomies/:id/import/commit", async (req, res) => {
    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() }); return; }
    const taxId = Number(req.params.id);
    const tax = await storage.getTaxonomy(taxId);
    if (!tax) { res.status(404).json({ message: "Taxonomy not found" }); return; }

    const { rows } = parseCsv(parsed.data.content);
    const m = parsed.data.mapping;
    const rules = parsed.data.rules ?? {};
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    let skipped = 0;
    const importedItems: EmployerItem[] = [];
    for (const row of rows) {
      const name = (row[m.employerName] ?? "").trim();
      if (!name) continue;
      const careerPath = m.careerPath ? (row[m.careerPath] ?? "").trim() : undefined;
      // Active defaults to true; only false when an active column is mapped and parses falsey.
      const active = m.active ? toBool(row[m.active]) : true;
      const aliases = m.aliases ? (row[m.aliases] ?? "").split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [];
      const item: EmployerItem = {
        id: slug(name) || slug(`${name}-${importedItems.length}`),
        employerName: name,
        displayName: m.displayName ? row[m.displayName] : name,
        aliases,
        careerPath,
        industry: m.industry ? row[m.industry] : "",
        location: m.location ? row[m.location] : "",
        isClient: rules.markAllClients ? true : m.isClient ? toBool(row[m.isClient]) : false,
        priorityTier: m.priorityTier ? (toNum(row[m.priorityTier]) ?? rules.defaultPriorityTier ?? 0) : (rules.defaultPriorityTier ?? 0),
        popularityScore: m.popularityScore ? (toNum(row[m.popularityScore]) ?? 0) : 0,
        rankingScore: m.rankingScore ? (toNum(row[m.rankingScore]) ?? 0) : 0,
        source: "import",
        active,
        metadata: careerPath ? { careerPaths: [careerPath] } : {},
      };
      importedItems.push(item);
    }

    // Drop inactive imported rows up front so the rule affects input, not just
    // pre-existing items, regardless of merge/replace mode.
    let processed: EmployerItem[] = rules.filterActive
      ? importedItems.filter((i) => i.active !== false)
      : importedItems;
    if (rules.dedupe !== false) {
      const byId = new Map<string, EmployerItem>();
      for (const it of processed) {
        const prev = byId.get(it.id);
        if (!prev) { byId.set(it.id, it); continue; }
        skipped++;
        const aliases = rules.mergeAliases !== false
          ? Array.from(new Set([...(prev.aliases ?? []), ...(it.aliases ?? [])]))
          : it.aliases;
        byId.set(it.id, { ...prev, ...it, aliases });
      }
      processed = Array.from(byId.values());
    }

    let finalItems: EmployerItem[];
    if (parsed.data.mode === "replace") {
      finalItems = processed;
    } else {
      const byId = new Map<string, EmployerItem>();
      (tax.items as EmployerItem[]).forEach((i) => byId.set(i.id, i));
      processed.forEach((i) => {
        const prev = byId.get(i.id);
        const aliases = prev && rules.mergeAliases !== false
          ? Array.from(new Set([...(prev.aliases ?? []), ...(i.aliases ?? [])]))
          : i.aliases;
        byId.set(i.id, { ...prev, ...i, aliases });
      });
      finalItems = Array.from(byId.values());
    }

    const updated = await storage.updateTaxonomy(taxId, { items: finalItems });
    if (parsed.data.importId) {
      await storage.updateTaxonomyImport(parsed.data.importId, {
        status: "imported",
        processingSummary: { imported: processed.length, skipped, total: finalItems.length, mode: parsed.data.mode, rules },
      });
    }
    res.json({ ok: true, imported: processed.length, skipped, total: finalItems.length, taxonomy: updated });
  });

  // Matrix import: TSV with career-path columns (row 0) and ranked employer rows (row 1+).
  // Deduplicates employers across columns and collects all associated career paths.
  app.post("/api/admin/taxonomies/:id/import/matrix", async (req, res) => {
    const schema = z.object({
      content: z.string(),
      mode: z.enum(["replace", "merge"]).default("merge"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid payload" }); return; }

    const taxId = Number(req.params.id);
    const tax = await storage.getTaxonomy(taxId);
    if (!tax) { res.status(404).json({ message: "Taxonomy not found" }); return; }

    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const lines = parsed.data.content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { res.status(400).json({ message: "Need at least a header row and one data row" }); return; }

    const careerPaths = lines[0].split("\t").map((s) => s.trim()).filter(Boolean);

    // employerKey → { employerName, careerPaths, scoreSum, scoreCount }
    type Entry = { employerName: string; paths: Set<string>; scoreSum: number; scoreCount: number };
    const byKey = new Map<string, Entry>();

    for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
      const cells = lines[rowIdx].split("\t");
      for (let col = 0; col < careerPaths.length; col++) {
        const name = (cells[col] ?? "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (!byKey.has(key)) byKey.set(key, { employerName: name, paths: new Set(), scoreSum: 0, scoreCount: 0 });
        const e = byKey.get(key)!;
        e.paths.add(careerPaths[col]);
        e.scoreSum += (1 / rowIdx) * 100; // rank 1 → 100, rank 2 → 50, etc.
        e.scoreCount++;
      }
    }

    const importedItems: EmployerItem[] = [];
    for (const [, e] of byKey) {
      const paths = Array.from(e.paths).sort();
      importedItems.push({
        id: slug(e.employerName),
        employerName: e.employerName,
        displayName: e.employerName,
        careerPaths: paths,
        careerPath: paths[0],
        popularityScore: Math.round((e.scoreSum / e.scoreCount) * 10) / 10,
        priorityTier: 0,
        rankingScore: 0,
        source: "matrix_import",
        active: true,
      });
    }

    let finalItems: EmployerItem[];
    if (parsed.data.mode === "replace") {
      finalItems = importedItems;
    } else {
      const byId = new Map<string, EmployerItem>();
      (tax.items as EmployerItem[]).forEach((i) => byId.set(i.id, i));
      importedItems.forEach((i) => {
        const prev = byId.get(i.id);
        const mergedPaths = prev
          ? Array.from(new Set([...(prev.careerPaths ?? (prev.careerPath ? [prev.careerPath] : [])), ...(i.careerPaths ?? [])]))
          : (i.careerPaths ?? []);
        byId.set(i.id, { ...prev, ...i, careerPaths: mergedPaths });
      });
      finalItems = Array.from(byId.values());
    }

    const updated = await storage.updateTaxonomy(taxId, { items: finalItems });
    res.json({ ok: true, imported: importedItems.length, total: finalItems.length, careerPaths: careerPaths.length });
  });

  app.get("/api/admin/imports", async (req, res) => {
    const taxonomyId = req.query.taxonomyId ? Number(req.query.taxonomyId) : undefined;
    res.json(await storage.listTaxonomyImports(taxonomyId));
  });

  // --- Settings: employer display logic ---
  app.get("/api/admin/settings/employer-logic", async (_req, res) => {
    const logic = (await storage.getSetting<EmployerDisplayLogic>("employerDisplayLogic")) ?? DEFAULT_EMPLOYER_DISPLAY_LOGIC;
    res.json(logic);
  });
  app.put("/api/admin/settings/employer-logic", async (req, res) => {
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
