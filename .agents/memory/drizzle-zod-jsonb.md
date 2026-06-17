---
name: drizzle-zod jsonb typing
description: Why insert payloads for jsonb columns fail drizzle insert/update typing and how to fix
---

`createInsertSchema` (drizzle-zod) infers `unknown` for `jsonb` columns, so a value typed via `z.infer<typeof insertSchema>` does not satisfy Drizzle's `$inferInsert` at `db.insert(...).values(x)` / `.set(x)`.

**Rule:** cast locally at the drizzle call site — `.values(x as typeof table.$inferInsert)` and `.set({...patch, updatedAt: new Date()} as Partial<typeof table.$inferInsert>)`. Validate the payload with Zod *before* the cast so bad data can't slip through.

**Why:** keeps the shared types honest (no `any` leaking into the schema layer) and contains the workaround to the persistence boundary. **How to apply:** any storage method writing a table with jsonb columns (configs, responses, taxonomies, imports here).
