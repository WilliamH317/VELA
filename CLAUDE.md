# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

VELA is an AI-powered knowledge management platform — "ChatGPT for company knowledge." Built as a 30-day MVP sprint, currently on **Day 18 of 30 (60% complete)**. VELA helps knowledge workers find answers across scattered documents using AI, with chaos theory–powered self-organizing intelligence (the LAMINAR algorithm). **Beachhead market: freelance agencies** (5–25 person service firms — marketing agencies, design studios, IT consultancies, accounting firms, law practices) with business budgets and measurable ROI from billable hours recovered.

## Companion Context File

This file (`CLAUDE.md`) works alongside `.claude/vela-context.md`.

**What belongs where:**

| File | Contains |
|---|---|
| `CLAUDE.md` | Permanent constraints · discovered anti-patterns · brand rules · algorithm formulas · non-obvious Convex patterns |
| `vela-context.md` | Today's created file paths · this session's failures · in-progress work state · active schema divergences found today |

**Rule:** Do NOT update `CLAUDE.md` during a session unless a new *permanent* pattern
was discovered (e.g., a new Convex failure mode, a new brand violation class).
Session-specific observations, file paths, and in-progress notes → `vela-context.md` only.

Update `vela-context.md` at the end of each development day with:
- Actual file paths created
- Any patterns Claude Code got wrong (prevents repetition)
- Convex-specific conventions discovered during the session

## Key Constraints

- **LAMINAR is pure TypeScript — NO Python, NO sklearn, NO external ML deps. No exceptions.**
- `ANTHROPIC_API_KEY` is consumed in Convex actions (server-side), not in Next.js API routes.
- All environment variables are in `.env.local`.

## Development Commands

```bash
# Both must run simultaneously during development
npm run dev          # Next.js dev server (port 3000)
npx convex dev       # Convex backend (syncs schema, generates types)

npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
```

There is no test runner configured. Convex auto-generates types into `convex/_generated/` — never edit those files.

## Architecture

### Convex Backend (convex/)

| File | Purpose |
|---|---|
| `convex/documents.ts` | Document CRUD, file upload/processing, full-text search |
| `convex/ai.ts` | LIGHTHOUSE actions calling Claude API (two modes: `askQuestion` + `generateAnswer`) |
| `convex/users.ts` | User management, Clerk ID lookups |
| `convex/queries.ts` | AI query logging for analytics |

### Frontend Data Patterns

```typescript
// Skip query when not authenticated
const docs = useQuery(api.documents.list, isAuthenticated ? {} : "skip");

// Actions (server-side, for AI calls or multi-step LAMINAR pipelines)
const runClustering = useAction(api.laminar.engine.runClustering);
const runGraphAnalysis = useAction(api.laminar.graphRunner.runGraphAnalysis);
```

**Critical:** `useQuery` returns `undefined` while loading. ALWAYS handle this state — never assume data exists.

**Path aliases:** `@/*` → `./src/*` · `convex/*` → `./convex/*`

## Key Implementation Details

- Duplicate detection uses SHA-256 content hashing (`by_user_and_hash` index)
- AI responses are capped at `MAX_CHARS_PER_DOC = 8000` chars per document context

---

## Phase 0 — Schema Audit Hard-Stop

**This step is mandatory before writing ANY integration code on a new Day.**

Deployed Convex table schemas silently diverge from documentation. Before writing
integration code: query each target table and log actual field names. Do not trust
field name documentation in this file or vela-context.md without verifying first.

**Known Day 18 divergences (documentation field → actual deployed field):**
- `clusterMemberships.membershipScore` → `.probability`
- `clusters.label` → `.name`
- `clusters.topTerms` → `.topKeywords`
- `clusteringRuns` status: `"complete"` → `"completed"` · `"error"` → `"failed"`

**Protocol:**
1. Before writing a new LAMINAR stage: run a quick query on each target table
2. Log the actual returned field names
3. Update vela-context.md with any new divergences found
4. Then write integration code against verified field names

## LAMINAR Algorithm Context

LAMINAR = **L**atent **A**ssociation **M**apping via **I**ntelligent **N**atural-language **A**nalysis and **R**etrieval. A chaos theory–powered algorithm that transforms scattered information into self-organizing knowledge clusters (ARCHIPELAGOS). Implemented entirely in pure TypeScript within Convex — no Python, no sklearn, no external ML dependencies.

### LAMINAR Stages

| Stage | Day | Name | What It Does | Status |
|---|---|---|---|---|
| 1 | 16 | ARCHIPELAGOS | TF-IDF + K-Means clustering with probabilistic confidence | ✅ Shipped |
| 2 | 17 | CURRENTS | Temporal access pattern detection, co-occurrence tracking | ✅ Shipped |
| 3 | 18 | Cross-Document Intelligence | Knowledge graph edges, bridge documents, attractor states | 🔧 In Progress |
| 4 | 19 | Butterfly Effect | Cascade prediction across knowledge graph | 📋 Planned |
| 5 | 20 | Fractal Wisdom | Multi-scale pattern recognition | 📋 Planned |

**4-signal edge fusion architecture:**

| Signal | Weight (Cold-Start) | Source | Notes |
|---|---|---|---|
| Content Similarity | 0.60 | TF-IDF cosine from `tfidf.ts` | Always available, dominates at cold-start |
| Behavioral Co-occurrence | 0.10 | `cooccurrences` table (Day 17) | Grows as usage data accumulates |
| Temporal Proximity | 0.10 | Upload timestamp closeness | `0.7 × exp(-timeDiffHours / 8)` |
| Structural Link | 0.20 | Shared tags + upload batch proximity | `min(sharedTagCount/3, 0.5) + batchScore` |

Per-signal scores stored individually for future adaptive reweighting.

**Thresholds:**

| Metric | Threshold | Purpose |
|---|---|---|
| Edge storage | `combinedWeight ≥ 0.15` | Minimum to persist in `knowledgeEdges` |
| Edge UI display | `combinedWeight ≥ 0.25` | Minimum for user-facing CHARTS view |
| Bridge membership | `membershipScore ≥ 0.25` in 2+ clusters | First bridge condition |
| Bridge edge confirmation | `≥1 cross-cluster edge with weight ≥ 0.30` | Second bridge condition (dual-condition) |
| Knowledge Center | `attractorScore ≥ 0.70` | ⚓ Top-tier attractor |
| Rising Attractor | `attractorScore ≥ 0.50` | 🧭 Emerging hub |

**Attractor scoring formula:**
```
attractorScore = 0.40 × degreeCentrality + 0.30 × accessFrequency + 0.30 × temporalConsistency
```

Where `temporalConsistency = 1 / (1 + coefficientOfVariation(interAccessIntervals))` — stable oscillators (weekly access) score higher than decaying impulses (one-time spike).

**Day 19 cascade amplifier (pre-built in Day 18):**

| Attractor Tier | Cascade Radius | Urgency |
|---|---|---|
| Knowledge Center (≥0.70) | 3 hops | high |
| Rising Attractor (≥0.50) | 2 hops | medium |
| Normal document | 1 hop | low |

### LAMINAR Orchestration Pattern

All LAMINAR stages follow this Convex action → internal mutation pipeline (used in `engine.ts`, `temporalRunner.ts`, `graphRunner.ts`):

```typescript
export const runPipeline = action({
  args: { /* ... */ },
  handler: async (ctx, args): Promise<PipelineResult> => {  // ← EXPLICIT return type required!
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Create run record via internal mutation
    const runId = await ctx.runMutation(internal.laminar.module.createRun, { ... });

    try {
      // 2. Fetch data via queries
      const docs = await ctx.runQuery(api.documents.list, {});

      // 3. Run pure functions (no Convex ctx needed)
      const results = buildSomething(docs);

      // 4. Store results via internal mutations — BATCH at 25 items max
      for (const batch of chunk(results, 25)) {
        await ctx.runMutation(internal.laminar.module.batchInsert, { items: batch });
      }

      // 5. Update run status
      await ctx.runMutation(internal.laminar.module.updateRun, { runId, status: "complete" });
      return { runId, count: results.length };
    } catch (error) {
      await ctx.runMutation(internal.laminar.module.updateRun, { runId, status: "error" });
      throw error;
    }
  },
});
```

**Key rules for this pattern:**
- Action handler MUST have explicit `Promise<ReturnType>` annotation (prevents TS7022)
- Batch inserts at **25 items** per mutation call (Convex ~8KB argument limit)
- Pure computation functions are defined outside the action, imported as needed
- Internal mutations handle all database writes — the action orchestrates

### Importing from tfidf.ts

When building new LAMINAR files that need content similarity, import from the existing engine — do NOT reimplement:

```typescript
// CORRECT — reuse existing exports
import { buildVocabulary, computeTFIDF, cosineSimilarity } from "./tfidf";

// WRONG — never reimplement TF-IDF
function myCosineSimilarity(a: number[], b: number[]) { ... }
```

---

## VELA Brand Compliance (MANDATORY)

### Nautical Naming Convention

Use these terms in all user-facing copy:

| Feature | Nautical Name | Status |
|---|---|---|
| Dashboard | HELM | ✅ |
| Document Upload | PORT | ✅ |
| Full-Text Search | COMPASS | ✅ |
| AI Q&A | LIGHTHOUSE | ✅ |
| Document Clusters | ARCHIPELAGOS | ✅ Day 16 |
| Related Documents | CURRENTS | ✅ Day 17 |
| Knowledge Graph | CHARTS | 🔧 Day 18 |
| Cascade Prediction | BUTTERFLY EFFECT | 📋 Day 19 |
| Documents | CARGO | — |
| User | CAPTAIN | — |
| Onboarding | MAIDEN VOYAGE | — |
| Loading State | NAVIGATING | — |
| Empty State | STILL WATERS | — |
| Error State | STORMY SEAS | — |

### Colors — ONLY These Hex Values

| Color | Hex | Tailwind | Usage |
|---|---|---|---|
| Deep Ocean Navy | `#1B3D5C` | `bg-[#1B3D5C]` `text-[#1B3D5C]` | Primary backgrounds, headers, body text |
| Bright Teal | `#00BCD4` | `bg-[#00BCD4]` `text-[#00BCD4]` | Interactive elements, accents, CTAs, links |
| LAMINAR Gradient | — | `bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4]` | Progress bars, LAMINAR branding |
| Coral Accent | `#FF6B6B` | `text-[#FF6B6B]` | Error states, urgent alerts ONLY |
| Sunset Gold | `#F4B860` | `text-[#F4B860]` | Premium features, achievements ONLY |
| White | `#FFFFFF` | `bg-white` `text-white` | Content backgrounds, text on dark |

**FORBIDDEN colors — NEVER use these:**
- `#0000FF` (generic blue)
- `#00FFFF` (generic cyan)
- `#1E90FF` (Dodger blue)
- `#007BFF` (Bootstrap primary)
- `#87CEEB` (sky blue)
- Any Tailwind `blue-*` or `cyan-*` utility classes (e.g., `bg-blue-500`, `text-cyan-400`)

### UI State Copy (Nautical Language)

| State | Correct Text | NEVER Say |
|---|---|---|
| Loading | "Navigating your knowledge sea..." | "Loading..." |
| Loading (clustering) | "Charting the knowledge sea..." | "Processing..." |
| Loading (graph) | "Mapping connections between your knowledge islands..." | "Building graph..." |
| Empty (general) | "Still waters — ready for your first voyage" | "No items found" |
| Empty (clusters) | "Still waters — upload documents through PORT to discover ARCHIPELAGOS" | "No clusters" |
| Error | "Stormy seas — trying again..." | "Error occurred" |
| Success | "Smooth sailing!" | "Success!" |
| Navigation Confidence | "Navigation Confidence: 78%" | "Silhouette: 0.78" |

### Loading Animation Pattern

ALWAYS use wave/pulse animations. NEVER use circular spinners (`animate-spin`).

```tsx
// CORRECT — wave animation loading state
<div className="flex flex-col items-center py-12">
  <div className="h-1 w-64 bg-[#1B3D5C]/20 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse" />
  </div>
  <p className="text-sm text-[#00BCD4] mt-4">Navigating your knowledge sea...</p>
</div>

// WRONG — circular spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
```

### Forbidden Jargon (User-Facing Copy)

**NEVER use:** "optimize", "workflow", "efficiency", "synergy", "leverage", "strategic", "scalable", "paradigm"

**USE instead:** "navigate", "discover", "illuminate", "explore", "smooth sailing", "chart your course", "find answers in seconds"

### Target User Context

Target user is agency teams, not musicians. User-facing examples should reference client briefs, SOWs, meeting notes, project plans — never gear notes, venues, or setlists.

---

## Anti-Patterns (Do NOT)

### TypeScript / Convex — Critical

1. **TS7022 circular inference** — Convex actions that use `internal.*` from the same file MUST have explicit return type annotations on the handler. This was discovered on Day 16 and applies to ALL runner/engine files.
   ```typescript
   // WRONG — causes TS7022
   handler: async (ctx, args) => { ... }

   // CORRECT — explicit return type breaks circular inference
   handler: async (ctx, args): Promise<{ runId: string; count: number }> => { ... }
   ```

2. **Never skip auth checks.** Every query, mutation, and action MUST start with:
   ```typescript
   const identity = await ctx.auth.getUserIdentity();
   if (!identity) throw new Error("Not authenticated");
   ```

3. **Never use `.filter()` for indexed fields.** Use `.withIndex()` — `.filter()` causes full table scans:
   ```typescript
   // WRONG — O(n) full scan
   ctx.db.query("documents").filter(q => q.eq(q.field("userId"), userId))

   // CORRECT — O(log n) index lookup
   ctx.db.query("documents").withIndex("by_user", q => q.eq("userId", userId))
   ```

4. **Never exceed batch size of 25** for Convex mutation arguments. Each LAMINAR record ~200 bytes × 25 = 5KB, safely under Convex's ~8KB limit. Day 16 originally used 50 and hit the limit.

5. **Never ignore `useQuery` returning `undefined`** — this means data is loading:
   ```typescript
   const data = useQuery(api.something.list);
   if (data === undefined) return <LoadingState />;  // ALWAYS handle this
   ```

### LAMINAR-Specific

6. **Never reimplement TF-IDF** — import from `convex/laminar/tfidf.ts`.

7. **Never store all-pairs edges for large doc sets** without the 0.15 minimum threshold. At 100 docs, N(N-1)/2 = 4,950 potential edges — filter to meaningful connections only.

8. **Guard against O(n²) blowup** — if `documents.length > 200`, the graph builder should throw a protective error. Partition by cluster for larger sets.

### Brand

9. **Never use generic blue** (`#0000FF`, Tailwind `blue-500`, etc.) instead of Navy `#1B3D5C`.
10. **Never use generic cyan** instead of Teal `#00BCD4`.
11. **Never create circular loading spinners** — use wave/pulse animations.
12. **Never write "Loading..."** — use nautical equivalents.
13. **Never use corporate jargon** ("optimize", "workflow", "efficiency") in user-facing text.

---

## Critical Patterns

All schema fields use **camelCase**: `userId`, `contentPlain`, `membershipScore` — never `snake_case`.

**Silent Access Event Logging:** When building new features that touch documents, always emit an access event:
```typescript
await ctx.runMutation(internal.laminar.cooccurrence.logAccess, {
  documentId: args.id,
  userId: identity.subject,
  action: "view",  // or "search" or "ai_query"
});
```

---

## Post-Generation Review Checklist
1. Search generated files for `blue-`, `cyan-`, `#0000FF`, `#00FFFF` → brand violation
2. Search for "Loading...", "Search", "Upload" → should be nautical terms
3. Search for "optimize", "workflow", "efficiency" → forbidden jargon
4. Search for `animate-spin` → spinner violation (use wave animation)
5. Verify every Convex function starts with auth check
6. Verify every action referencing `internal.*` has explicit return type

---

## Beachhead Pivot (February 2026)

- **Market:** Freelance Agencies (5–25 person service firms)
- **Previous market** (Musicians) preserved in Strategic Decisions Archive only
- **Pricing:** Free ($0) / Individual ($15/mo) / Team ($25/user/mo)
- **User-facing copy:** agency examples (client briefs, SOWs, meeting notes)
- **DO NOT** reference musicians in any new user-facing content
- **Brand story preserved:** "Built by a musician who understood knowledge chaos"
