---
name: Survey rendering architecture
description: How the public survey is built vs. how admin preview must render it
---

# Survey rendering

The public respondent survey (`client/src/pages/Survey.tsx`) is one large
monolithic component (~2000 lines, `SurveyPage`) with every step hand-coded
inline. There are NO reusable per-question respondent components to import.

**Why this matters:** any admin-side "preview" of a survey config cannot reuse
the real survey's render path. It must be a separate config-driven renderer that
interprets `SurveyPageDef`/`SurveyQuestion` and re-creates the styling.

**How to apply:** the config-driven preview lives in
`client/src/components/SurveyPreview.tsx`. If you add a new question `type` to
`QUESTION_TYPES`, add a render branch there too (and to `Survey.tsx` if it ships
to real respondents). Brand accent is `#96D2C0`; headings use
`text-xl md:text-2xl font-medium text-slate-700`, centered `max-w-2xl`.

Survey config (`pages`) is stored in a loose JSONB column, so adding optional
fields to `SurveyQuestion` (e.g. `config`) needs no migration and won't be
rejected by the backend's `insertSurveyConfigSchema` validation.
