---
name: tsconfig low iteration target
description: Map/Set iteration TS errors caused by an unset compile target
---

This project's tsconfig sets no `target`, so it defaults low and `for (const x of someMap.entries())` / Set iteration raises a downlevelIteration error, and destructured elements can degrade to `unknown`.

**Rule:** wrap the iterator in `Array.from(...)` (e.g. `for (const [k, v] of Array.from(map.entries()))`) rather than editing tsconfig.

**Why:** config files here are pre-tuned and editing `target`/`downlevelIteration` risks side effects across build/Vite. **How to apply:** any server/shared code iterating Map/Set entries.
