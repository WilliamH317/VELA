# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

VELA is an AI-powered knowledge management platform — "ChatGPT for company knowledge." Built as a 30-day MVP sprint, currently on **Day 18 of 30 (60% complete)**. VELA helps knowledge workers find answers across scattered documents using AI, with chaos theory–powered self-organizing intelligence (the LAMINAR algorithm). **Beachhead market: freelance agencies** (5–25 person service firms — marketing agencies, design studios, IT consultancies, accounting firms, law practices) with business budgets and measurable ROI from billable hours recovered.

**Nautical naming convention throughout — use these terms in all user-facing copy:**

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

## Companion Context File

This CLAUDE.md works alongside `.claude/vela-context.md` which contains session-specific notes, patterns that worked or failed, and file paths discovered during development. Update `vela-context.md` at the end of each development day with actual file paths created, patterns Claude Code got wrong (so it doesn't repeat), and Convex-specific conventions discovered.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Backend**: Convex (real-time BaaS with WebSocket sync)
- **Auth**: Clerk (JWT-based, integrated with Convex)
- **AI**: Anthropic Claude Sonnet 4 via `@anthropic-ai/sdk`
- **Styling**: Tailwind CSS 4 + Shadcn UI (new-york style, lucide-react icons)
- **File Processing**: pdf-parse for PDF text extraction
- **LAMINAR Algorithm**: Pure TypeScript — NO Python, NO sklearn, NO external ML deps

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

### Provider Chain (src/app/providers.tsx)

```
ClerkProvider → ConvexProviderWithClerk → ThemeProvider → UserSetup → children
```

`UserSetup` auto-creates/updates the Convex user record on sign-in using Clerk identity data.

### Route Groups (Next.js App Router)

- `(auth)/` — Sign-in/sign-up pages (public)
- `(dashboard)/` — All protected routes share a layout with nav, footer, mobile menu
- `(marketing)/` — Public landing page

Protected routes are enforced in `src/middleware.ts` via Clerk's `createRouteMatcher`.

### Convex Backend (convex/)

**13 tables total** after Day 18 schema additions. Schema is in `convex/schema.ts`.

**Core tables (Days 1-15):**
- `users` — Clerk ID mapping, profile data
- `documents` — All uploaded CARGO with content, metadata, status flow (`processing → ready → error`)
- `queries` — AI query logging for analytics

**LAMINAR Stage 1 tables (Day 16 — ARCHIPELAGOS):**
- `clusteringRuns` — Tracks each clustering execution (status, silhouette score, timing)
- `clusters` — The ARCHIPELAGOS themselves (name, keywords, centroid vector, coherence)
- `clusterMemberships` — Probabilistic membership: doc → cluster with probability score + isPrimary + isAmbiguous flags
- `clusterHistory` — Tracks cluster evolution over time (for Day 17+ temporal analysis)

**LAMINAR Stage 2 tables (Day 17 — CURRENTS):**
- `accessEvents` — Logs every document access with timestamp and action type (view, search, ai_query)
- `temporalPatterns` — Stores trajectory estimates per document (rising/stable/declining/periodic trends)
- `cooccurrences` — Co-occurrence matrix: document pairs accessed within the same session

**LAMINAR Stage 3 tables (Day 18 — Knowledge Graph):**
- `knowledgeEdges` — Weighted edges between documents with 4 individual signal scores + combined weight
- `graphRuns` — Tracks each graph analysis execution
- `documentMetrics` — Per-document role classification (bridge, knowledge_center, rising_attractor, satellite, island) + attractor scores

**Core backend files:**

| File | Purpose |
|---|---|
| `convex/documents.ts` | Document CRUD, file upload/processing, full-text search |
| `convex/ai.ts` | LIGHTHOUSE actions calling Claude API (two modes: `askQuestion` + `generateAnswer`) |
| `convex/users.ts` | User management, Clerk ID lookups |
| `convex/queries.ts` | AI query logging for analytics |

**LAMINAR backend files (convex/laminar/):**

| File | Day | Exports / Purpose |
|---|---|---|
| `tfidf.ts` | 16 | `tokenize`, `buildVocabulary`, `computeTFIDF`, `cosineSimilarity` — pure TS, no deps |
| `kmeans.ts` | 16 | `kMeansCluster`, `calculateSilhouette`, `suggestK` — K-Means++ init |
| `confidence.ts` | 16 | `distancesToProbabilities`, `calculateMemberships` — softmax scoring |
| `engine.ts` | 16 | Convex action orchestrating the full clustering pipeline |
| `queries.ts` | 16 | Real-time queries: `listClusters`, `getClusteringStatus`, etc. |
| `temporal.ts` | 17 | Access trajectory modeling (rising/stable/declining/periodic) |
| `cooccurrence.ts` | 17 | Co-occurrence matrix builder from access events |
| `temporalRunner.ts` | 17 | Orchestration action for temporal analysis pipeline |
| `graph.ts` | 18 | `buildKnowledgeGraph`, `calculateDegreeCentrality`, `calculateAttractorScore` |
| `bridges.ts` | 18 | `detectBridges`, `classifyDocumentRole` — dual-condition bridge detection |
| `graphRunner.ts` | 18 | Orchestration action for knowledge graph pipeline |
| `graphQueries.ts` | 18 | `getDocumentEdges`, `getGraphStats`, `getBridgeDocuments`, `getAttractorDocuments` |

### Frontend Data Patterns

```typescript
// Real-time query (auto-updates via WebSocket — NEVER use fetch/polling)
const docs = useQuery(api.documents.list);

// Skip query when not authenticated
const docs = useQuery(api.documents.list, isAuthenticated ? {} : "skip");

// Mutations (transactional, no external APIs)
const createDoc = useMutation(api.documents.create);

// Actions (server-side, for AI calls or multi-step LAMINAR pipelines)
const askQuestion = useAction(api.ai.askQuestion);
const runClustering = useAction(api.laminar.engine.runClustering);
const runGraphAnalysis = useAction(api.laminar.graphRunner.runGraphAnalysis);
```

**Critical:** `useQuery` returns `undefined` while loading. ALWAYS handle this state — never assume data exists.

### Path Aliases

- `@/*` → `./src/*`
- `convex/*` → `./convex/*`

## File Structure

```
src/
├── app/
│   ├── (auth)/sign-in/[[...sign-in]]/page.tsx     ✅
│   ├── (auth)/sign-up/[[...sign-up]]/page.tsx     ✅
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx                      ✅ HELM
│   │   ├── documents/page.tsx                      ✅ PORT + list
│   │   ├── documents/[id]/page.tsx                 ✅ Detail + CURRENTS panel
│   │   ├── documents/new/page.tsx                  ✅ Upload
│   │   ├── search/page.tsx                         ✅ COMPASS + LIGHTHOUSE
│   │   ├── archipelagos/page.tsx                   ✅ LAMINAR cluster view
│   │   └── knowledge-graph/page.tsx                🔧 CHARTS (Day 18)
│   ├── (marketing)/page.tsx                        ✅ Landing page
│   ├── providers.tsx                               ✅
│   ├── layout.tsx                                  ✅
│   └── globals.css                                 ✅
├── components/
│   ├── ui/                                         ✅ Shadcn components
│   ├── user-setup.tsx                              ✅
│   ├── document-card.tsx                           ✅
│   ├── search-box.tsx                              ✅
│   └── knowledge-graph-panel.tsx                   🔧 Day 18
├── lib/
│   ├── utils.ts                                    ✅
│   └── constants.ts                                ✅
├── middleware.ts                                    ✅
convex/
├── _generated/                     ⚠️ Auto-generated — NEVER edit
├── schema.ts                       ✅ All 13 tables
├── documents.ts                    ✅
├── users.ts                        ✅
├── ai.ts                           ✅
├── queries.ts                      ✅
├── auth.config.ts                  ✅
└── laminar/
    ├── tfidf.ts                    ✅ Day 16
    ├── kmeans.ts                   ✅ Day 16
    ├── confidence.ts               ✅ Day 16
    ├── engine.ts                   ✅ Day 16
    ├── queries.ts                  ✅ Day 16
    ├── temporal.ts                 ✅ Day 17
    ├── cooccurrence.ts             ✅ Day 17
    ├── temporalRunner.ts           ✅ Day 17
    ├── graph.ts                    🔧 Day 18
    ├── bridges.ts                  🔧 Day 18
    ├── graphRunner.ts              🔧 Day 18
    └── graphQueries.ts             🔧 Day 18
```

## Environment Variables

Required in `.env.local`:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Client | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Server | Convex deployment identifier |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | Clerk frontend auth key |
| `CLERK_SECRET_KEY` | Server | Clerk backend key (NEVER expose to client) |
| `CLERK_JWT_ISSUER_DOMAIN` | Server | Clerk JWT issuer for Convex auth |
| `ANTHROPIC_API_KEY` | Server | Claude API key (used in Convex actions) |
| `ANTHROPIC_MODEL` | Server | Model name (default: `claude-sonnet-4-20250514`) |
| `ANTHROPIC_MAX_TOKENS` | Server | Max response tokens (default: 2048) |

## Key Implementation Details

- Production document types: `pdf`, `text`, `markdown` (future post-MVP: `slack`, `drive`, `notion` — see MVP Spec §NOT in MVP)
- PDF text extraction happens server-side in Convex actions using `pdf-parse`
- Duplicate detection uses SHA-256 content hashing (`by_user_and_hash` index)
- Full-text search uses Convex's `searchIndex` on `contentPlain` field
- AI responses are capped at `MAX_CHARS_PER_DOC = 8000` chars per document context
- Dark mode via `next-themes` with class-based toggling
- All schema fields use **camelCase**: `userId`, `contentPlain`, `membershipScore` — never `snake_case`

---

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

### Stage 1: ARCHIPELAGOS (Day 16 — Shipped)

- TF-IDF vectorization → K-Means clustering (K-Means++ init) → softmax confidence scoring
- Pipeline result: 7 docs clustered in 202ms, K=2, silhouette 0.1531
- Reusable exports from `tfidf.ts`: `buildVocabulary`, `computeTFIDF`, `cosineSimilarity`
- Probabilistic membership: document belongs 72% to cluster A, 18% to cluster B (not binary)
- `isAmbiguous` flag: true when top two cluster probabilities are within 15%

### Stage 2: CURRENTS (Day 17 — Shipped)

- Silent access event logging on all document touchpoints (view, search, ai_query)
- Trajectory estimation: rising / stable / declining / periodic trends
- Co-occurrence matrix: documents accessed within same session are linked
- CURRENTS panel integrated into document detail view

### Stage 3: Knowledge Graph (Day 18 — In Progress)

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

2. **Never use `any` type** without a justifying comment explaining why.

3. **Never skip auth checks.** Every query, mutation, and action MUST start with:
   ```typescript
   const identity = await ctx.auth.getUserIdentity();
   if (!identity) throw new Error("Not authenticated");
   ```

4. **Never use `.filter()` for indexed fields.** Use `.withIndex()` — `.filter()` causes full table scans:
   ```typescript
   // WRONG — O(n) full scan
   ctx.db.query("documents").filter(q => q.eq(q.field("userId"), userId))

   // CORRECT — O(log n) index lookup
   ctx.db.query("documents").withIndex("by_user", q => q.eq("userId", userId))
   ```

5. **Never edit `convex/_generated/`** — auto-generated by `npx convex dev`.

6. **Never use `fetch` or `useEffect` for data** — use Convex `useQuery` for real-time subscriptions.

7. **Never poll for updates** — Convex WebSocket subscriptions handle real-time automatically.

8. **Never exceed batch size of 25** for Convex mutation arguments. Each LAMINAR record ~200 bytes × 25 = 5KB, safely under Convex's ~8KB limit. Day 16 originally used 50 and hit the limit.

9. **Never ignore `useQuery` returning `undefined`** — this means data is loading:
   ```typescript
   const data = useQuery(api.something.list);
   if (data === undefined) return <LoadingState />;  // ALWAYS handle this
   ```

### LAMINAR-Specific

10. **Never use Python, sklearn, NetworkX, or any external ML library.** All LAMINAR is pure TypeScript within Convex.

11. **Never reimplement TF-IDF** — import from `convex/laminar/tfidf.ts`.

12. **Never store all-pairs edges for large doc sets** without the 0.15 minimum threshold. At 100 docs, N(N-1)/2 = 4,950 potential edges — filter to meaningful connections only.

13. **Guard against O(n²) blowup** — if `documents.length > 200`, the graph builder should throw a protective error. Partition by cluster for larger sets.

### Brand

14. **Never use generic blue** (`#0000FF`, Tailwind `blue-500`, etc.) instead of Navy `#1B3D5C`.
15. **Never use generic cyan** instead of Teal `#00BCD4`.
16. **Never create circular loading spinners** — use wave/pulse animations.
17. **Never write "Loading..."** — use nautical equivalents.
18. **Never use corporate jargon** ("optimize", "workflow", "efficiency") in user-facing text.

---

## Patterns That Work

### 1. Convex Action → Internal Mutation Pipeline

All LAMINAR orchestration follows this pattern (see "LAMINAR Orchestration Pattern" above). The action fetches data and runs pure functions; internal mutations store results. This avoids timeout issues and keeps mutations transactional.

### 2. Explicit Return Type Annotations

After discovering TS7022 on Day 16, ALL actions and internal mutations that reference `internal.*` from the same module use explicit `Promise<ReturnType>` annotations. This is non-negotiable for any new LAMINAR file.

### 3. Batch Insert at 25

Convex mutations have an ~8KB argument limit. Each LAMINAR record (edge, membership, etc.) is ~200 bytes. 25 × 200 = 5KB, safely under the limit.

### 4. Wave Animation Loading

Every loading state uses the LAMINAR gradient pulse bar with nautical copy (see "Loading Animation Pattern" above).

### 5. Schema Field Naming

All fields are camelCase: `userId`, `contentPlain`, `membershipScore`, `combinedWeight`, `attractorScore`. Never snake_case.

### 6. Silent Access Event Logging

Day 17 introduced silent logging on all document touchpoints. When building new features that touch documents, always emit an access event:
```typescript
await ctx.runMutation(internal.laminar.cooccurrence.logAccess, {
  documentId: args.id,
  userId: identity.subject,
  action: "view",  // or "search" or "ai_query"
});
```

---

## Delegation Boundaries

### Claude Code SHOULD handle:
- Pure TypeScript algorithm implementations (TF-IDF, K-Means, graph analysis)
- Boilerplate-heavy Convex mutations/queries/actions
- React component generation (cluster cards, graph panels, visualization pages)
- Test scaffolding (synthetic corpus generators, validation metrics)

### Claude Code should NOT handle:
- **Schema design** — Will owns all `convex/schema.ts` changes
- **Architecture decisions** — signal weights, thresholds, data flow between stages
- **Brand compliance judgment** — no tool reliably catches wrong shades of blue
- **Integration testing** — multi-tab sync, auth flow, regression checks
- **Simple CRUD operations** — faster to code manually

### Post-generation review checklist:
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