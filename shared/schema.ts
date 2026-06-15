import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// SURVEY CONFIG STRUCTURE
// ---------------------------------------------------------------------------
// A SurveyConfig describes the entire survey. Pages (and the questions inside
// them) are stored as JSON so the structure can evolve without DB migrations.
// The public survey keeps its bespoke UI but reads the active config to know
// which config/version it is running and how to label answers. The admin
// survey editor reads/writes this same structure.
// ---------------------------------------------------------------------------

// The kinds of questions the editor understands.
export const QUESTION_TYPES = [
  "text",
  "email",
  "month_year",
  "single_select",
  "multi_select",
  "tagbox",
  "drag_rank",
  "pairwise",
  "employer_grid",
  "final_reorder",
  "hidden",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// A single static option for select-style questions.
export interface SurveyOption {
  label: string;
  value: string;
}

// A conditional display / navigation rule. Stored as JSON; the admin UI offers
// a readable editor plus an "Advanced JSON" escape hatch.
export interface ConditionRule {
  // "show": only display this page/question when the condition is met.
  // "skip": jump to targetPageId when the condition is met.
  action: "show" | "skip";
  questionId: string; // which previous answer to inspect
  operator: "equals" | "contains" | "not_equals";
  value: string;
  targetPageId?: string; // used by "skip"
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  helperText?: string;
  required: boolean;
  // Where the options come from: hardcoded ("static") or a taxonomy lookup.
  optionsSource: "static" | "taxonomy" | "none";
  options?: SurveyOption[];
  taxonomyId?: number | null;
  // Optional filter applied to taxonomy items (e.g. filter employers by the
  // respondent's chosen career path question).
  taxonomyFilter?: Record<string, unknown> | null;
  validation?: Record<string, unknown> | null;
  conditions?: ConditionRule[];
  // Free-form behaviour config for richer/custom question types (e.g. a
  // "pairwise" question's comparison count, allowSkip, algorithm). Stored as
  // JSON so new custom question types can carry their own settings without a
  // schema migration. See client/src/lib/questionTemplates.ts for the
  // human/agent-friendly templates and the documented question shape.
  config?: Record<string, unknown>;
}

export interface SurveyPageDef {
  id: string;
  title: string;
  subtitle?: string;
  // Optional semantic tag so the bespoke front-end can map config pages to its
  // hand-built steps (e.g. "intro", "personal", "education", "careers",
  // "career_order", "recognition", "pairwise", "final", "thankyou").
  kind?: string;
  questions: SurveyQuestion[];
  conditions?: ConditionRule[];
}

export const SURVEY_STATUSES = ["draft", "active", "archived"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const surveyConfigs = pgTable("survey_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"), // draft | active | archived
  pages: jsonb("pages").$type<SurveyPageDef[]>().notNull().default([]),
  // Global logic for the config (employer display logic lives in app_settings,
  // but per-config overrides / branching rules can live here).
  logic: jsonb("logic").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSurveyConfigSchema = createInsertSchema(surveyConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SurveyConfig = typeof surveyConfigs.$inferSelect;
export type InsertSurveyConfig = z.infer<typeof insertSurveyConfigSchema>;

// ---------------------------------------------------------------------------
// SURVEY RESPONSE
// ---------------------------------------------------------------------------
// Each respondent gets one response row keyed by a sessionId. Progress is saved
// after each page (status "partial") and finalised on submit ("completed").
// `answers` stores a snapshot of question id + label + value so the data stays
// interpretable even if the survey config later changes.
// ---------------------------------------------------------------------------

export const RESPONSE_STATUSES = ["partial", "completed"] as const;
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

// One stored answer. Snapshots the label so old responses remain readable.
export interface StoredAnswer {
  questionId: string;
  label: string;
  value: unknown;
}

// Records what employers a respondent was shown vs recognized, plus the
// algorithm/config used to pick them. Critical for analysis.
export interface EmployerExposure {
  careerPaths: string[];
  shown: string[]; // employer names/ids shown
  recognized: string[]; // employer names/ids the respondent recognized
  notRecognized: string[];
  algorithmVersion?: number;
  displayLogicSnapshot?: Record<string, unknown>;
}

export interface ResponseMetadata {
  userAgent?: string;
  surveyVersion?: number;
  source?: string;
  utm?: Record<string, string>;
  employerExposure?: EmployerExposure;
  [key: string]: unknown;
}

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyConfigId: integer("survey_config_id"),
  sessionId: text("session_id").notNull().unique(),
  respondentEmail: text("respondent_email"),
  status: text("status").notNull().default("partial"), // partial | completed
  answers: jsonb("answers").$type<StoredAnswer[]>().notNull().default([]),
  metadata: jsonb("metadata").$type<ResponseMetadata>().notNull().default({}),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
  completedAt: true,
});
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

// ---------------------------------------------------------------------------
// TAXONOMY
// ---------------------------------------------------------------------------
// A configurable option set (employers, career paths, study fields, etc). Items
// are stored as JSON. Employer items use the rich shape in EmployerItem.
// ---------------------------------------------------------------------------

export const TAXONOMY_TYPES = [
  "employers",
  "career_paths",
  "study_fields",
  "countries",
  "universities",
  "locations",
  "work_rights",
  "custom",
] as const;
export type TaxonomyType = (typeof TAXONOMY_TYPES)[number];

// Rich shape for employer taxonomy items. Other taxonomy types may store a
// simpler { id, label, value, active } shape inside the same items array.
export interface EmployerItem {
  id: string;
  employerName: string;
  displayName?: string;
  aliases?: string[];
  careerPath?: string;
  industry?: string;
  location?: string;
  isClient?: boolean;
  priorityTier?: number; // 0 = none, higher = more priority
  popularityScore?: number;
  rankingScore?: number;
  source?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SimpleTaxonomyItem {
  id: string;
  label: string;
  value: string;
  active?: boolean;
  [key: string]: unknown;
}

export type TaxonomyItem = EmployerItem | SimpleTaxonomyItem;

export const taxonomies = pgTable("taxonomies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("custom"),
  description: text("description"),
  items: jsonb("items").$type<TaxonomyItem[]>().notNull().default([]),
  processingLogic: jsonb("processing_logic").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaxonomySchema = createInsertSchema(taxonomies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Taxonomy = typeof taxonomies.$inferSelect;
export type InsertTaxonomy = z.infer<typeof insertTaxonomySchema>;

// ---------------------------------------------------------------------------
// TAXONOMY IMPORT
// ---------------------------------------------------------------------------
// Tracks a CSV upload through the map -> preview -> confirm flow.
// ---------------------------------------------------------------------------

export const IMPORT_STATUSES = ["uploaded", "mapped", "previewed", "imported", "failed"] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const taxonomyImports = pgTable("taxonomy_imports", {
  id: serial("id").primaryKey(),
  taxonomyId: integer("taxonomy_id"),
  filename: text("filename").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  status: text("status").notNull().default("uploaded"),
  rawPreview: jsonb("raw_preview").$type<Record<string, unknown>>().notNull().default({}),
  mappingConfig: jsonb("mapping_config").$type<Record<string, unknown>>().notNull().default({}),
  processingSummary: jsonb("processing_summary").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaxonomyImportSchema = createInsertSchema(taxonomyImports).omit({
  id: true,
  createdAt: true,
});
export type TaxonomyImport = typeof taxonomyImports.$inferSelect;
export type InsertTaxonomyImport = z.infer<typeof insertTaxonomyImportSchema>;

// ---------------------------------------------------------------------------
// APP SETTINGS
// ---------------------------------------------------------------------------
// Simple key/value JSON store. Holds the employer display-logic config under
// the key "employerDisplayLogic".
// ---------------------------------------------------------------------------

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type AppSetting = typeof appSettings.$inferSelect;

// Employer display logic config shape. Numbers are editable in admin.
export interface EmployerDisplayLogic {
  version: number;
  totalEmployers: number; // total to show, e.g. 20
  buckets: {
    popular: number; // e.g. 6
    client: number; // e.g. 5
    ranking: number; // e.g. 5
    exploration: number; // e.g. 4
  };
  weights: {
    popularity: number; // weight on popularityScore
    ranking: number; // weight on rankingScore
    clientBoost: number; // additive score for clients
    priorityTierBoost: number; // additive score per priority tier
    exploration: number; // 0..1 magnitude of random factor
  };
  guaranteeClients: boolean; // ensure at least some clients appear
  onlyMatchingCareerPath: boolean; // restrict to employers in chosen career paths
  fallback: "fill_from_all" | "show_fewer"; // when not enough matching employers
  shuffle: boolean; // shuffle final display order
}

// Strict validation for the employer display-logic payload. Counts are
// non-negative integers, exploration magnitude is bounded to [0,1], and
// enum/boolean fields are constrained. All fields are optional so the admin can
// send partial updates that get merged over the current/default config.
export const employerDisplayLogicSchema = z
  .object({
    version: z.number().int().nonnegative(),
    totalEmployers: z.number().int().min(1).max(200),
    buckets: z
      .object({
        popular: z.number().int().nonnegative(),
        client: z.number().int().nonnegative(),
        ranking: z.number().int().nonnegative(),
        exploration: z.number().int().nonnegative(),
      })
      .partial(),
    weights: z
      .object({
        popularity: z.number().nonnegative(),
        ranking: z.number().nonnegative(),
        clientBoost: z.number().nonnegative(),
        priorityTierBoost: z.number().nonnegative(),
        exploration: z.number().min(0).max(1),
      })
      .partial(),
    guaranteeClients: z.boolean(),
    onlyMatchingCareerPath: z.boolean(),
    fallback: z.enum(["fill_from_all", "show_fewer"]),
    shuffle: z.boolean(),
  })
  .partial();

export const DEFAULT_EMPLOYER_DISPLAY_LOGIC: EmployerDisplayLogic = {
  version: 1,
  totalEmployers: 20,
  buckets: { popular: 6, client: 5, ranking: 5, exploration: 4 },
  weights: {
    popularity: 1,
    ranking: 1,
    clientBoost: 50,
    priorityTierBoost: 30,
    exploration: 0.2,
  },
  guaranteeClients: true,
  onlyMatchingCareerPath: true,
  fallback: "fill_from_all",
  shuffle: true,
};

// ---------------------------------------------------------------------------
// Legacy users table (kept for compatibility; unused by the survey).
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
});
export const insertUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Shared survey role types (still used by the front-end prototype).
export const RoleEnum = z.enum([
  "Business, Commerce & Management",
  "Finance and Banking",
  "Law",
]);
export type Role = z.infer<typeof RoleEnum>;
export interface Company {
  name: string;
  role: Role;
}
