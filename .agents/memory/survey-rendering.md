---
name: Survey rendering architecture
description: Why admin previews must re-implement the survey instead of reusing it
---

# Survey rendering

The public respondent survey is one large monolithic page component with every
step hand-coded inline. There are NO reusable per-question respondent
components to import.

**Decision:** the admin-side "preview" is a separate config-driven renderer that
interprets the survey config and re-creates each question type's markup/styling.

**Why:** there is nothing reusable to mount; a config can also contain
question/page shapes the live survey never renders.

**How to apply:** when a preview must "match the live survey," copy the live
survey's exact markup per question type and use the theme color classes
(primary/border/card/secondary/muted) rather than hardcoded hex, so it tracks
the theme. If you add a new question type, add a render branch in BOTH the live
survey and the preview renderer.

Survey config pages are stored in a loose JSONB column, so adding optional
fields to a question (e.g. `config`) needs no migration and won't be rejected by
backend validation.
