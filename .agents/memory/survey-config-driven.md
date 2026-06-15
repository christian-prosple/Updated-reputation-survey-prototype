---
name: Config-driven survey copy
description: How Survey.tsx and the DB config stay in sync for copy changes
---

## Rule
Survey.tsx reads ALL user-visible copy (step headings, question labels, dropdown
options) from the DB via the `useSurveyConfig` hook (client/src/hooks/use-survey-config.ts).
The DB is the single source of truth. Hardcoded strings in Survey.tsx are **fallbacks only**
— used if the config hasn't loaded yet.

**Why:** Admin editor changes → live survey updates without a code deploy. Agent copy
changes must also update the DB so both stay in sync.

## How to apply
When changing a label/heading/option via chat:
1. Edit the hardcoded fallback string in Survey.tsx (so the code matches the intent)
2. Also run `npx tsx server/migrate-config-labels.ts` or an equivalent SQL UPDATE to push
   the same change into the DB config (survey_configs id=1)
3. seed.ts buildDefaultPages() is the canonical source for fresh installs — update it too

## What is config-driven
- Personal page: title, email label, city label, gender label, gender options
- Education page: title, country label, educationLevel label+options, study fields label, school label, graduation label
- Careers page: selectedRoles question label (shown as step heading)
- Top pick reason page: title
- Thankyou page: title, subtitle (first paragraph)

## What stays hardcoded (too complex for generic config)
- COUNTRIES array (needs ISO codes for flag images)
- ROLES / career paths (need category grouping for grouped dropdown)
- DEGREE_TAXONOMY (need category grouping for suggestions)
- All step-specific UI/UX logic (pairwise algorithm, drag ranking, employer grid)

## Migration script
server/migrate-config-labels.ts — idempotent, reads getActiveSurveyConfig(),
patches by page.kind, calls updateSurveyConfig(config.id, { pages: updatedPages }).
