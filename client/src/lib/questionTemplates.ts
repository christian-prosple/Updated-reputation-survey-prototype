// ===========================================================================
// CUSTOM QUESTION JSON — TEMPLATES, GENERATION & VALIDATION
// ===========================================================================
//
// WHERE SURVEY QUESTION JSON IS DEFINED
// ------------------------------------
// The canonical shape of a question is the `SurveyQuestion` interface in
// `shared/schema.ts`. A survey is a `SurveyConfig` with `pages`, and each page
// has a `questions` array. The admin Survey Editor reads/writes that same
// structure, and the public survey renders from the active config.
//
// EXPECTED SCHEMA FOR CUSTOM QUESTIONS
// ------------------------------------
// Required fields:   id (string), type (QuestionType), label (string)
// Optional fields (auto-filled with defaults by `normalizeQuestion` below):
//   required      -> false
//   helperText    -> ""
//   optionsSource -> "none" ("static" | "taxonomy" | "none")
//   options       -> []        (for optionsSource "static")
//   taxonomyId    -> null      (for optionsSource "taxonomy")
//   conditions    -> []        (show/skip rules, see ConditionRule)
//   config        -> {}        (free-form behaviour settings per type)
//
// HOW TO ADD A NEW CUSTOM QUESTION TYPE
// -------------------------------------
// 1. Add the type string to `QUESTION_TYPES` in `shared/schema.ts`.
// 2. Add a render branch for it in `client/src/components/SurveyPreview.tsx`
//    (and the real flow in `client/src/pages/Survey.tsx` if it ships to users).
// 3. (Optional) add a starter template to `QUESTION_TEMPLATES` below so it shows
//    up in the editor's Custom Question Builder.
//
// HOW REPLIT AGENT CAN INSERT A GENERATED QUESTION
// ------------------------------------------------
// The Custom Question Builder in the Survey Editor has an "Advanced JSON"
// editor. An agent (or a human) can paste a question object matching the shape
// above into that editor, click "Validate", and then "Insert into survey". The
// builder validates required fields, fills defaults, and assigns a unique id if
// the pasted id collides with an existing question.
// ===========================================================================

import { QUESTION_TYPES } from "@shared/schema";
import type { SurveyQuestion, QuestionType } from "@shared/schema";

// A loose shape for incoming/raw question JSON before normalization.
export type RawQuestion = Record<string, unknown>;

// The example question we surface in the builder's collapsible help section.
export const EXAMPLE_QUESTION_JSON = `{
  "id": "pairwise_employer_comparison",
  "type": "pairwise",
  "label": "Which employer would you prefer?",
  "helperText": "Choose the employer you would be more likely to apply to.",
  "required": true,
  "optionsSource": "taxonomy",
  "config": {
    "comparisons": 10,
    "allowSkip": true,
    "allowUndo": true,
    "storeExposureData": true,
    "algorithm": "coverage_booster"
  },
  "conditions": []
}`;

let counter = 0;
// Generate a reasonably-unique id. Combines a prefix, time, and a counter so
// rapid successive calls don't collide.
export function makeQuestionId(prefix = "q"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

// Ensure an id is unique within a set of existing ids. If it collides (or is
// empty), append a numeric suffix until it's free.
export function ensureUniqueId(desired: string, existing: Set<string>): string {
  let base = (desired || "").trim();
  if (!base) base = makeQuestionId();
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

// -------------------------------------------------------------------------
// VALIDATION + NORMALIZATION
// -------------------------------------------------------------------------
export interface NormalizeResult {
  ok: boolean;
  errors: string[];
  question?: SurveyQuestion;
}

const VALID_SOURCES = new Set(["static", "taxonomy", "none"]);

// Validate a raw question object and fill in defaults for any missing optional
// fields. `existingIds` is used to keep ids unique. Returns the normalized
// `SurveyQuestion` plus any validation errors.
export function normalizeQuestion(raw: unknown, existingIds: Set<string> = new Set()): NormalizeResult {
  const errors: string[] = [];

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["Question must be a JSON object."] };
  }
  const r = raw as RawQuestion;

  // --- Required: type (must be one of the known question types) ---
  const type = r.type;
  const typeValid = typeof type === "string" && (QUESTION_TYPES as readonly string[]).includes(type);
  if (typeof type !== "string" || !type.trim()) {
    errors.push('Field "type" is required (e.g. "single_select", "pairwise").');
  } else if (!typeValid) {
    errors.push(`Field "type" "${type}" is not a known question type. Allowed: ${QUESTION_TYPES.join(", ")}.`);
  }

  // --- Required: label ---
  const label = r.label;
  if (typeof label !== "string" || !label.trim()) {
    errors.push('Field "label" is required.');
  }

  // --- Required: id (we can generate one if missing, but warn) ---
  let id = typeof r.id === "string" ? r.id.trim() : "";
  if (!id) {
    id = makeQuestionId();
    errors.push(`Field "id" was missing — generated "${id}".`);
  }

  const labelValid = typeof label === "string" && !!label.trim();
  if (errors.length && (!typeValid || !labelValid)) {
    // Hard failures on type/label — can't build a usable question.
    return { ok: false, errors };
  }

  // Unique id within the survey.
  id = ensureUniqueId(id, existingIds);

  // --- optionsSource (default "none", coerce unknown values) ---
  let optionsSource = typeof r.optionsSource === "string" ? r.optionsSource : "none";
  if (!VALID_SOURCES.has(optionsSource)) {
    // Friendly remap of common aliases used in agent-generated JSON.
    if (optionsSource === "recognized_employers" || optionsSource === "employers") {
      optionsSource = "taxonomy";
    } else {
      optionsSource = "none";
    }
  }

  const question: SurveyQuestion = {
    id,
    type: type as QuestionType,
    label: label as string,
    helperText: typeof r.helperText === "string" ? r.helperText : "",
    required: typeof r.required === "boolean" ? r.required : false,
    optionsSource: optionsSource as SurveyQuestion["optionsSource"],
    options: Array.isArray(r.options) ? (r.options as SurveyQuestion["options"]) : [],
    conditions: Array.isArray(r.conditions) ? (r.conditions as SurveyQuestion["conditions"]) : [],
    config: r.config && typeof r.config === "object" && !Array.isArray(r.config)
      ? (r.config as Record<string, unknown>)
      : {},
  };
  if (r.taxonomyId !== undefined) question.taxonomyId = (r.taxonomyId as number) ?? null;

  // Soft warnings (non-blocking) — these still return ok:true.
  const onlyWarnings = errors.every((e) => e.startsWith('Field "id" was missing'));
  return { ok: errors.length === 0 || onlyWarnings, errors, question };
}

// -------------------------------------------------------------------------
// KEYWORD-BASED GENERATOR
// -------------------------------------------------------------------------
// Turns a plain-English description into a best-guess starter question. This is
// intentionally simple (no AI call) — it picks a type from keywords and seeds a
// sensible config. The result is meant to be reviewed/edited before inserting.
export function generateQuestionFromDescription(description: string): SurveyQuestion {
  const text = (description || "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  // First line (or first sentence) makes a decent default label.
  const firstLine = (description || "").split(/[\n.]/)[0].trim();
  const label = firstLine || "New question";

  const allowSkip = has("skip", "optional", "allow skip");
  const storeExposureData = has("exposure", "track exposure", "store exposure");

  if (has("pairwise", "compare", "comparison", "head-to-head", "head to head", "versus", " vs ")) {
    const m = text.match(/(\d+)\s*(comparisons|comparison|pairs|rounds)/);
    const comparisons = m ? Number(m[1]) : 10;
    return {
      id: makeQuestionId("pairwise"),
      type: "pairwise",
      label,
      helperText: "Choose the option you prefer.",
      required: true,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: {
        comparisons,
        allowSkip,
        allowUndo: true,
        storeExposureData,
        algorithm: "coverage_booster",
      },
    };
  }

  if (has("recognition", "recognize", "which companies", "which employers", "heard of", "grid")) {
    return {
      id: makeQuestionId("recognition"),
      type: "employer_grid",
      label,
      helperText: "Select all that you recognize.",
      required: false,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: { storeExposureData },
    };
  }

  if (has("rank", "reorder", "drag", "prioritize", "order them", "priority")) {
    return {
      id: makeQuestionId("rank"),
      type: "drag_rank",
      label,
      helperText: "Drag to put these in order.",
      required: false,
      optionsSource: "static",
      options: [],
      conditions: [],
      config: {},
    };
  }

  if (has("career path", "career", "role", "roles", "job title")) {
    return {
      id: makeQuestionId("careers"),
      type: "tagbox",
      label,
      helperText: "Search and select all that apply.",
      required: false,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: {},
    };
  }

  if (has("multi", "multiple", "select all", "checkboxes", "tags")) {
    return {
      id: makeQuestionId("multi"),
      type: "multi_select",
      label,
      helperText: "Select all that apply.",
      required: false,
      optionsSource: "static",
      options: [],
      conditions: [],
      config: {},
    };
  }

  if (has("email")) {
    return {
      id: makeQuestionId("email"),
      type: "email",
      label: label || "Your email",
      helperText: "",
      required: true,
      optionsSource: "none",
      options: [],
      conditions: [],
      config: {},
    };
  }

  if (has("choose one", "single", "dropdown", "radio", "pick one")) {
    return {
      id: makeQuestionId("single"),
      type: "single_select",
      label,
      helperText: "",
      required: false,
      optionsSource: "static",
      options: [],
      conditions: [],
      config: {},
    };
  }

  // Default: a plain text question.
  return {
    id: makeQuestionId("text"),
    type: "text",
    label,
    helperText: "",
    required: false,
    optionsSource: "none",
    options: [],
    conditions: [],
    config: {},
  };
}

// -------------------------------------------------------------------------
// TEMPLATE LIBRARY
// -------------------------------------------------------------------------
export interface QuestionTemplate {
  key: string;
  label: string;
  description: string;
  build: () => SurveyQuestion;
}

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    key: "blank",
    label: "Blank custom question",
    description: "An empty text question to start from scratch.",
    build: () => ({
      id: makeQuestionId("custom"),
      type: "text",
      label: "New question",
      helperText: "",
      required: false,
      optionsSource: "none",
      options: [],
      conditions: [],
      config: {},
    }),
  },
  {
    key: "employer_recognition",
    label: "Employer recognition",
    description: "Grid where respondents pick the employers they recognize.",
    build: () => ({
      id: makeQuestionId("recognition"),
      type: "employer_grid",
      label: "Which of these employers do you recognize?",
      helperText: "Select all that you've heard of.",
      required: false,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: { storeExposureData: true },
    }),
  },
  {
    key: "pairwise",
    label: "Pairwise employer comparison",
    description: "Head-to-head comparisons that rank employers by preference.",
    build: () => ({
      id: makeQuestionId("pairwise"),
      type: "pairwise",
      label: "Which employer would you prefer?",
      helperText: "Choose the employer you would be more likely to apply to.",
      required: true,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: {
        comparisons: 10,
        allowSkip: true,
        allowUndo: true,
        storeExposureData: true,
        algorithm: "coverage_booster",
      },
    }),
  },
  {
    key: "drag_rank",
    label: "Drag ranking / reorder",
    description: "Respondents drag items into their preferred order.",
    build: () => ({
      id: makeQuestionId("rank"),
      type: "drag_rank",
      label: "Drag these into your order of preference",
      helperText: "Top = most preferred.",
      required: false,
      optionsSource: "static",
      options: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
        { label: "Option C", value: "c" },
      ],
      conditions: [],
      config: {},
    }),
  },
  {
    key: "career_path",
    label: "Career path selector",
    description: "Searchable tag picker for career paths / roles.",
    build: () => ({
      id: makeQuestionId("careers"),
      type: "tagbox",
      label: "What career path(s) are you most interested in?",
      helperText: "Search and select all that apply.",
      required: true,
      optionsSource: "taxonomy",
      options: [],
      conditions: [],
      config: {},
    }),
  },
  {
    key: "searchable_multi",
    label: "Searchable multi-select",
    description: "Multi-select with a search box, from a static list.",
    build: () => ({
      id: makeQuestionId("multi"),
      type: "multi_select",
      label: "Select all that apply",
      helperText: "",
      required: false,
      optionsSource: "static",
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ],
      conditions: [],
      config: {},
    }),
  },
  {
    key: "static_content",
    label: "Static content block",
    description: "A non-interactive block of text/instructions (hidden input).",
    build: () => ({
      id: makeQuestionId("content"),
      type: "hidden",
      label: "Welcome to this section",
      helperText: "Add your instructions or context here.",
      required: false,
      optionsSource: "none",
      options: [],
      conditions: [],
      config: { content: true },
    }),
  },
];
