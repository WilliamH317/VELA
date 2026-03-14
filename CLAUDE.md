# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

VELA is an AI-powered knowledge management platform — "ChatGPT for company knowledge." Built as a 30-day MVP sprint, currently on **Day 21 of 30 (67% complete)**. VELA helps knowledge workers find answers across scattered documents using AI, with chaos theory–powered self-organizing intelligence (the LAMINAR algorithm). **Beachhead market: freelance agencies** (5–25 person service firms — marketing agencies, design studios, IT consultancies) with business budgets and measurable ROI from billable hours recovered.

## Companion Context File

This file (`CLAUDE.md`) works alongside `.claude/vela-context.md`.

| File | Contains |
|---|---|
| `CLAUDE.md` | Permanent constraints · discovered anti-patterns · brand rules · algorithm formulas · non-obvious Convex patterns |
| `vela-context.md` | Today's created file paths · this session's failures · in-progress work state · active schema divergences found today |

**Rule:** Do NOT update `CLAUDE.md` during a session unless a new *permanent* pattern was discovered. Session-specific observations → `vela-context.md` only.

## Key Constraints

- **LAMINAR is pure TypeScript — NO Python, NO sklearn, NO external ML deps. No exceptions.**
- `ANTHROPIC_API_KEY` is consumed in Convex actions (server-side), not in Next.js API routes.
- All environment variables are in `.env.local`.
- `identity.subject` is the Clerk user ID / `userId` everywhere — **never** `identity.tokenIdentifier`.

## Development Commands

```bash
# Both must run simultaneously during development
npm run dev          # Next.js dev server (port 3000)
npx convex dev       # Convex backend (syncs schema, generates types)

npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
```

Convex auto-generates types into `convex/_generated/` — never edit those files.

---

## Phase 0 — Schema Audit Hard-Stop

**Mandatory before writing ANY integration code on a new day.**

Deployed Convex schemas silently diverge from documentation. Before writing integration code, read `convex/schema.ts` directly and record actual field names. Do not trust field names in this file or vela-context.md without verifying first.

**PowerShell (Windows):**
```powershell
Get-Content convex/schema.ts
Select-String -Pattern 'query\("documents"\)|query\("users"\)' -Path convex/laminar/*.ts
Select-String -Pattern "import.*convex|import.*_generated" -Path convex/laminar/tfidf.ts, convex/laminar/kmeans.ts, convex/laminar/confidence.ts, convex/laminar/processors.ts, convex/laminar/pipeline.ts
```

Both `Select-String` commands must return zero matches before writing any code.

**Known Day 18 divergences (never repeat):**

| Documentation said | Deployed schema has |
|---|---|
| `membershipScore` | `probability` |
| `clusters.label` | `clusters.name` |
| `clusters.topTerms` | `clusters.topKeywords` |
| `clusteringRuns` status `"complete"` | `"completed"` |
| `clusteringRuns` status `"error"` | `"failed"` |
| `edges` (table name) | `knowledgeEdges` |
| `clusteringRuns.createdAt` | `clusteringRuns.startedAt` |

---

## LAMINAR Architecture (All 5 Stages Complete)

LAMINAR = **L**atent **A**ssociation **M**apping via **I**ntelligent **N**atural-language **A**nalysis and **R**etrieval. Chaos theory–powered self-organizing knowledge clusters. Pure TypeScript, zero external ML dependencies.

### Stage Status

| Stage | Name | Status | Key Output |
|---|---|---|---|
| 1 | ARCHIPELAGOS | ✅ Verified | TF-IDF + K-Means, `clusters` + `clusterMemberships` |
| 2 | CURRENTS | ✅ Verified | `cooccurrences` + `temporalPatterns` |
| 3 | Knowledge Graph | ✅ Verified | `knowledgeEdges`, 21 edges, 4-signal fusion |
| 4 | CASCADE | ✅ Verified | `cascadeRuns` + `cascadeImpacts`, BFS with decay |
| 5 | Fractal Wisdom | ✅ Verified | Multi-scale patterns, wisdom cards |

### File Boundary Rules (SC2 Architecture — Hard Rules)

```
convex/laminar/
├── tfidf.ts        ← PURE TS — ZERO Convex imports
├── kmeans.ts       ← PURE TS — ZERO Convex imports
├── confidence.ts   ← PURE TS — ZERO Convex imports
├── temporal.ts     ← PURE TS — ZERO Convex imports
├── cooccurrence.ts ← PURE TS — ZERO Convex imports
├── pipeline.ts     ← PURE TS — LaminarStage interface + runPipeline
├── processors.ts   ← PURE TS — IProcessable + document signal extractors
├── engine.ts       ← Convex — reads ONLY via getForLaminar bridge
├── graph.ts        ← Convex — reads ONLY via getForLaminar bridge
├── runner.ts       ← Convex — reactive trigger entry point
├── cascade.ts      ← Convex — BFS butterfly effect
└── fractal.ts      ← Convex — wisdom distillation
```

**Rule 1 — SoC Boundary:** The 7 pure files above must never import from `convex/_generated/` or `convex/server`. If grep finds a match, it is a violation. Fix before writing new code.

**Rule 2 — Bounded Context:** `engine.ts`, `graph.ts`, `runner.ts`, `cascade.ts`, `fractal.ts` must NEVER call `ctx.db.query("documents")` or `ctx.db.query("users")` directly. All document reads go through the bridge:
```typescript
// ONLY legal way to read documents inside laminar/
const docs = await ctx.runQuery(internal.documents.getForLaminar, { userId });
```

**Rule 3 — Reactive Trigger:** Document creation fires a scheduler trigger, not a blocking mutation:
```typescript
// convex/documents.ts — after ctx.db.insert("documents", {...})
await ctx.scheduler.runAfter(0, internal.laminar.runner.onDocumentIngested, {
  documentId: docId,
  userId: identity.subject,
});
```

**Rule 4 — Non-blocking Signals:** Access event logging must NEVER block AI responses:
```typescript
// ✅ CORRECT — fire-and-forget
await ctx.scheduler.runAfter(0, internal.laminar.access.logAccessInternal, {
  documentId: doc._id, userId: identity.subject, action: "ai_query", timestamp: Date.now(),
});

// ❌ WRONG — blocks streaming response
await ctx.runMutation(internal.laminar.access.logAccessInternal, { ... });
```

**Rule 5 — Batch Limit:** Hard cap of **25 items** per Convex batch mutation. At ~200 bytes/record × 25 = 5KB, safely under Convex's ~8KB argument limit.

### Knowledge Domain Bridge

The single authorized crossing point between Knowledge Domain (documents) and Intelligence Domain (laminar/):

```typescript
// convex/documents.ts — ALL laminar/ reads go through here
export const getForLaminar = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db.query("documents")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "ready"))
      .collect();
  },
});
```

### Algorithm Formulas (Calibrated — Do Not Change Without Testing)

**4-signal edge fusion:**

| Signal | Cold-Start Weight | Source |
|---|---|---|
| Content Similarity | 0.60 | TF-IDF cosine from `tfidf.ts` |
| Structural Link | 0.20 | Shared tags + batch proximity |
| Temporal Proximity | 0.10 | `0.7 × exp(-timeDiffHours / 8)` |
| Behavioral Co-occurrence | 0.10 | `cooccurrences` table |

**Thresholds:**

| Metric | Threshold | Purpose |
|---|---|---|
| Edge storage | `weight ≥ 0.15` | Minimum to persist in `knowledgeEdges` |
| Edge UI display | `weight ≥ 0.25` | Minimum for user-facing graph |
| Bridge condition 1 | `probability ≥ 0.25` in 2+ clusters | Ambiguous membership |
| Bridge condition 2 | `≥1 cross-cluster edge with weight ≥ 0.30` | Confirmed bridge |
| Knowledge Center | `attractorScore ≥ 0.70` | ⚓ Top-tier hub |
| Rising Attractor | `attractorScore ≥ 0.50` | 🧭 Emerging hub |

**Attractor scoring formula:**
```
attractorScore = 0.40 × degreeCentrality + 0.30 × accessFrequency + 0.30 × temporalConsistency
temporalConsistency = 1 / (1 + coefficientOfVariation(interAccessIntervals))
```

**CASCADE decay formula:**
```
propagated_impact = current_impact × edge_weight × decay_rate ^ depth
decay_rate = 0.8 · min_threshold = 0.30 · max_depth = 3
```

**Importing from tfidf.ts** — always reuse, never reimplement:
```typescript
import { buildVocabulary, computeTFIDF, cosineSimilarity } from "./tfidf";
```

### LAMINAR Action Pattern

All LAMINAR Convex actions MUST have explicit return type annotations (prevents TS7022 circular inference — discovered Day 16):

```typescript
export const runPipeline = action({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<{ runId: string; count: number }> => {
    // ← EXPLICIT return type required on ALL action handlers
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    // ...
  },
});
```

### Composable Pipeline (pipeline.ts)

New stages must implement `LaminarStage` from `convex/laminar/pipeline.ts`:
```typescript
import { LaminarStage, LaminarState } from "./pipeline";

const myStage: LaminarStage = {
  name: "MY_STAGE",
  async process(state: LaminarState, ctx): Promise<Partial<LaminarState>> {
    // read from state, return only the slice this stage owns
    return { /* partial LaminarState */ };
  }
};
```

---

## VELA Brand Compliance (Mandatory)

### Colors — Only These Hex Values

| Color | Hex | Tailwind | Usage |
|---|---|---|---|
| Deep Ocean Navy | `#1B3D5C` | `bg-[#1B3D5C]` | Primary backgrounds, headers |
| Bright Teal | `#00BCD4` | `bg-[#00BCD4]` | Interactive elements, accents, CTAs |
| LAMINAR Gradient | — | `bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4]` | Progress bars, LAMINAR branding |
| Coral Accent | `#FF6B6B` | `text-[#FF6B6B]` | Error states ONLY |
| Sunset Gold | `#F4B860` | `text-[#F4B860]` | Premium features ONLY |

**FORBIDDEN — never use:**
- `#0000FF`, `#00FFFF`, `#1E90FF`, `#007BFF`, `#87CEEB`
- Any Tailwind `blue-*` or `cyan-*` class (e.g., `bg-blue-500`, `text-cyan-400`)

### Loading Animation — Wave Only, Never Spinner

```tsx
// ✅ CORRECT
<div className="h-1 w-64 bg-[#1B3D5C]/20 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse" />
</div>
<p className="text-sm text-[#00BCD4] mt-4">Navigating your knowledge sea...</p>

// ❌ WRONG
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
```

### Nautical Naming Convention

| Feature | Nautical Name |
|---|---|
| Dashboard | HELM |
| Document Upload | PORT |
| Full-Text Search | COMPASS |
| AI Q&A | LIGHTHOUSE |
| Document Clusters | ARCHIPELAGOS |
| Temporal Patterns | CURRENTS |
| Butterfly Effect | CASCADE |
| Knowledge Graph | CHARTS |
| Documents | CARGO |
| Onboarding | MAIDEN VOYAGE |
| Loading State | NAVIGATING |
| Empty State | STILL WATERS |
| Error State | STORMY SEAS |

### UI State Copy

| State | Correct | Never |
|---|---|---|
| Loading | "Navigating your knowledge sea..." | "Loading..." |
| Loading (clustering) | "Charting the knowledge sea..." | "Processing..." |
| Empty (general) | "Still waters — ready for your first voyage" | "No items found" |
| Empty (clusters) | "Still waters — upload documents through PORT to discover ARCHIPELAGOS" | "No clusters" |
| Error | "Stormy seas — trying again..." | "Error occurred" |
| Success | "Smooth sailing!" | "Success!" |

### Forbidden Jargon

**Never use:** "optimize", "workflow", "efficiency", "synergy", "leverage", "strategic", "scalable", "paradigm"

**Use instead:** "navigate", "discover", "illuminate", "explore", "smooth sailing", "chart your course"

### Target User Context

Agency teams. User-facing examples must reference client briefs, SOWs, meeting notes, project plans. Never reference gear notes, venues, or setlists.

---

## Anti-Patterns

### TypeScript / Convex — Critical

1. **TS7022 circular inference** — all Convex action handlers that reference `internal.*` from the same module MUST have explicit `Promise<ReturnType>` annotations. Discovered Day 16.

2. **Never skip auth checks** — every query, mutation, and action starts with:
   ```typescript
   const identity = await ctx.auth.getUserIdentity();
   if (!identity) throw new Error("Not authenticated");
   ```

3. **Never use `.filter()` for indexed fields** — use `.withIndex()`:
   ```typescript
   // ❌ O(n) full scan
   ctx.db.query("documents").filter(q => q.eq(q.field("userId"), userId))
   // ✅ O(log n) index lookup
   ctx.db.query("documents").withIndex("by_user", q => q.eq("userId", userId))
   ```

4. **Never exceed batch size of 25** for Convex mutation arguments.

5. **Never ignore `useQuery` returning `undefined`** — it means loading, not empty:
   ```typescript
   if (data === undefined) return <LoadingState />; // ALWAYS handle
   ```

6. **Never use blocking `ctx.runMutation` for access event logging** inside actions — use `ctx.scheduler.runAfter(0, ...)`. A synchronous mutation write blocks streaming AI responses.

7. **Never use `exactOptionalPropertyTypes` incompatible spread** — conditional spread required:
   ```typescript
   // ✅ Correct
   ...(value !== undefined ? { field: value } : {})
   // ❌ Wrong — assigns undefined to optional field
   field: value ?? undefined
   ```

### LAMINAR-Specific

8. **Never reimplement TF-IDF** — import from `convex/laminar/tfidf.ts`.

9. **Never call `ctx.db.query("documents")` inside `laminar/`** — use `internal.documents.getForLaminar`.

10. **Never import Convex modules in pure LAMINAR files** (`tfidf.ts`, `kmeans.ts`, `confidence.ts`, `temporal.ts`, `cooccurrence.ts`, `pipeline.ts`, `processors.ts`).

11. **Never store all-pairs edges without the 0.15 threshold** — at 100 docs, N(N-1)/2 = 4,950 potential edges. Filter to meaningful connections only.

12. **Guard against O(n²) blowup** — if `documents.length > 200`, throw a protective error and partition by cluster.

### Brand

13. **Never use generic blue** — Navy `#1B3D5C` only.
14. **Never use Tailwind `blue-*` or `cyan-*`** classes.
15. **Never create `animate-spin` spinners** — wave/pulse animations only.
16. **Never write "Loading..."** — use nautical equivalents.
17. **Never use corporate jargon** in user-facing text.

---

## Post-Generation Review Checklist

1. `Select-String -Pattern "blue-|cyan-|#0000FF|#00FFFF" -Path <files>` → brand violation
2. `Select-String -Pattern "Loading\.\.\.|Searching|Uploading" -Path <files>` → should be nautical
3. `Select-String -Pattern "optimize|workflow|efficiency" -Path <files>` → forbidden jargon
4. `Select-String -Pattern "animate-spin" -Path <files>` → spinner violation
5. Verify every Convex function starts with auth check
6. Verify every action handler has explicit `Promise<ReturnType>` annotation
7. Verify no `laminar/` pure file imports from `convex/_generated/`
8. Verify no `laminar/` Convex file calls `ctx.db.query("documents")` directly