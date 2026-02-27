# VELA Project Context

Deep context for AI assistants working on the VELA codebase. This is the companion to `CLAUDE.md` — while CLAUDE.md covers rules, patterns, and anti-patterns, this file covers domain knowledge, product context, implementation history, and cross-stage dependencies.

**Last Updated:** February 27, 2026 (Day 18 of 30-day sprint)

## Product Domain

VELA is a knowledge management platform for knowledge workers (beachhead: freelance agencies — 5–25 person service firms). Users upload documents (PDF, text, markdown), search across them, and ask AI-powered questions that return cited answers from their knowledge base. The platform's differentiator is LAMINAR — a chaos theory–powered algorithm that makes documents self-organize into clusters (ARCHIPELAGOS), tracks access patterns (CURRENTS), and builds a knowledge graph connecting related content.

**Mission**: Instantly connect knowledge workers with answers across scattered documents.
**Positioning**: "ChatGPT for company knowledge" / "Stop searching, start navigating"
**Expansion path**: Freelance Agencies (M0-6) → Customer Support (M3-9) → Sales (M9-15) → Medical/Legal (M15-36)

**90% code reuse architecture**: Core platform is shared across all verticals. Only onboarding language, example templates, industry-specific search filters, and integration connectors are customized per vertical (~10%).

## Brand Requirements

- **Colors**: ONLY Navy `#1B3D5C` and Teal `#00BCD4`. See CLAUDE.md for complete palette and forbidden colors.
- **Terminology**: Use nautical names in all user-facing copy. See full naming table in CLAUDE.md.
- **Messaging**: Nautical theme — "navigate", "discover", "illuminate". No corporate jargon — never "optimize", "workflow", "efficiency".
- **Loading**: Wave/pulse animations using LAMINAR gradient. NEVER generic spinners.
- **Voice**: "The Knowledgeable Captain" — confident guide who respects user autonomy. Sophisticated but not corporate, intelligent but not cold.

## Current Status

```
Phase 1: FOUNDATION (Days 1-5)        ████████████████████ 100% ✅
Phase 2: INFRASTRUCTURE (Days 6-8)    ████████████████████ 100% ✅
Phase 3: CORE FEATURES (Days 9-15)    ████████████████████ 100% ✅
Phase 4: DIFFERENTIATION (Days 16-20) ████████████░░░░░░░░  60% 🔧 ← YOU ARE HERE
Phase 5: POLISH & BILLING (Days 21-25)                          🔒
Phase 6: LAUNCH (Days 26-30)                                    🔒
```

- **Day 18 of 30** (60% complete)
- **Phase**: LAMINAR Algorithm — Stage 3 (Cross-Document Intelligence) in progress
- **Shipped**: PORT, COMPASS, LIGHTHOUSE, ARCHIPELAGOS (Day 16), CURRENTS (Day 17)
- **Building**: Knowledge Graph / CHARTS (Day 18)
- **Next**: Butterfly Effect cascade prediction (Day 19)

## 30-Day Sprint Context

Development started January 19, 2026.

| Phase | Days | Focus | Status |
|---|---|---|---|
| Foundation | 1-5 | JS fundamentals, async/await, API patterns | ✅ |
| Infrastructure | 6-8 | Next.js 16 + Convex + Clerk auth | ✅ |
| Core Features | 9-15 | PORT, COMPASS, LIGHTHOUSE, real-time sync | ✅ |
| LAMINAR Stage 1 | 16 | ARCHIPELAGOS — TF-IDF + K-Means clustering | ✅ Shipped |
| LAMINAR Stage 2 | 17 | CURRENTS — temporal patterns, co-occurrence | ✅ Shipped |
| LAMINAR Stage 3 | 18 | Knowledge graph, bridges, attractors | 🔧 In Progress |
| LAMINAR Stage 4 | 19 | Butterfly Effect — cascade prediction | 📋 Planned |
| LAMINAR Stage 5 | 20 | Fractal Wisdom — multi-scale patterns | 📋 Planned |
| Polish & Billing | 21-25 | Stripe, analytics, UI refinement | 🔒 |
| Launch | 26-30 | Marketing, Product Hunt, documentation | 🔒 |

## Convex Backend Patterns

### Function Types
- **query** — Read-only, real-time subscribed via WebSocket. Use for data fetching. Returns reactive data that auto-updates across all connected clients.
- **mutation** — Transactional writes. Cannot call external APIs. Use for database operations.
- **action** — Can call external APIs (Claude, etc.) but NOT directly read/write DB. Must use `ctx.runQuery()` / `ctx.runMutation()` to access data. Used for LAMINAR orchestration and AI calls.
- **internalQuery/internalMutation/internalAction** — Not exposed to client. Used for background jobs (e.g., `processFile`) and LAMINAR pipeline stages.

### Authentication Pattern
Every public query/mutation MUST start with:
```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");
const userId = identity.subject;
```
User ID comes from `identity.subject` (Clerk user ID string). All document queries filter by `userId` for data isolation.

### Background Processing
File uploads use a two-phase pattern:
1. Mutation creates document with `status: "processing"` and schedules an internal action
2. Internal action (`processFile`) extracts text, then calls an internal mutation to update content and set `status: "ready"`

Use `ctx.scheduler.runAfter(0, internal.module.function, args)` to schedule background work from mutations.

### LAMINAR Orchestration Pattern
All LAMINAR stages (Days 16-18+) follow an action → internal mutation pipeline:

1. **Action** (exposed to client): handles auth, creates a "run" record, orchestrates the pipeline
2. **Pure functions** (imported, no Convex ctx): TF-IDF, K-Means, graph algorithms — pure computation
3. **Internal mutations** (batch inserts): store results in batches of 25 (Convex ~8KB argument limit)
4. **Run status update**: mark run as "complete" or "error"

This pattern lives in `engine.ts` (Day 16), `temporalRunner.ts` (Day 17), and `graphRunner.ts` (Day 18). See CLAUDE.md for the code template.

**Critical**: Actions referencing `internal.*` from the same file MUST have explicit `Promise<ReturnType>` return type annotations to avoid TS7022 circular inference errors.

### Search
Full-text search uses Convex's `searchIndex` on the `contentPlain` field:
```typescript
ctx.db.query("documents")
  .withSearchIndex("search_content", q =>
    q.search("contentPlain", query).eq("userId", identity.subject)
  )
  .take(20);
```

## Frontend Patterns

### Data Fetching
```typescript
// Real-time subscription (re-renders on DB changes)
const docs = useQuery(api.documents.list);

// Conditional query (skip when not authenticated)
const docs = useQuery(api.documents.list, isAuthenticated ? {} : "skip");

// Mutations (writes)
const create = useMutation(api.documents.create);

// Actions (server-side operations like AI calls, LAMINAR pipelines)
const ask = useAction(api.ai.askQuestion);
const runClustering = useAction(api.laminar.engine.runClustering);
```

**Critical**: `useQuery` returns `undefined` while loading. Always handle this:
```typescript
if (data === undefined) return <LoadingState />; // wave animation, not spinner
if (data.length === 0) return <EmptyState />;    // "Still waters..." copy
```

### Component Organization
- `src/components/ui/` — Shadcn UI primitives (button, card, dialog, etc.). Do not modify directly.
- `src/components/` — App-level components (lighthouse-search, upload-zone, user-setup, knowledge-graph-panel)
- `src/components/dashboard/` — Dashboard-specific components
- `src/components/shared/` — Reusable app components
- `src/components/marketing/` — Landing page components

### Styling
- Tailwind CSS 4 with VELA brand colors via CSS variables
- Primary navy: `#1B3D5C` (backgrounds, text)
- Accent teal: `#00BCD4` (interactive elements, CTAs)
- Navy-to-teal gradients for LAMINAR features and premium branding
- Dark mode via `next-themes` (class-based strategy)
- Shadcn UI uses "new-york" style variant

## AI Integration (LIGHTHOUSE)

Two modes in `convex/ai.ts`:
- **`askQuestion`** — Manual mode: user selects specific document IDs. Best for focused queries.
- **`generateAnswer`** — Auto mode: uses full-text search to find relevant documents automatically.

Both call Claude Sonnet 4 via `@anthropic-ai/sdk` and log results to the `queries` table for analytics.

**Constraints:**
- Max 20 documents per query (`MAX_DOCUMENTS`)
- Max 8000 chars per document in context (`MAX_CHARS_PER_DOC`)
- Max 1000 char queries (`MAX_QUERY_LENGTH`)
- Default 2048 max response tokens
- Retry logic with exponential backoff (3 retries)

## LAMINAR Implementation History

### Day 16: ARCHIPELAGOS — What Shipped

**Result**: 7 documents clustered in 202ms, K=2, silhouette score 0.1531, converged in 1 iteration.

**Files created** (all in `convex/laminar/`):
- `tfidf.ts` — TF-IDF vectorization engine (835 terms extracted from 7 docs). Exports: `tokenize`, `buildVocabulary`, `computeTFIDF`, `cosineSimilarity`. Pure TS, zero external deps.
- `kmeans.ts` — K-Means clustering with K-Means++ initialization. Exports: `kMeansCluster`, `calculateSilhouette`, `suggestK`.
- `confidence.ts` — Probabilistic membership via softmax. Exports: `distancesToProbabilities`, `calculateMemberships`.
- `engine.ts` — Convex action orchestrating the full pipeline.
- `queries.ts` — Real-time queries: `listClusters`, `getClusteringStatus`, `getClusterMembers`, etc.

**Schema tables added**: `clusteringRuns`, `clusters`, `clusterMemberships`, `clusterHistory`

**UI**: `app/(dashboard)/archipelagos/page.tsx` — cluster cards with expand/collapse, navigation confidence bar, "Re-chart ARCHIPELAGOS" button.

**Bugs discovered and fixed**:
- **TS7022 circular inference**: Actions using `internal.*` from the same file caused TypeScript circular type inference. Fix: explicit `Promise<ReturnType>` annotation on handler. Added to CLAUDE.md anti-patterns.
- **Batch size limit**: Initial batch of 50 items per mutation exceeded Convex's ~8KB argument limit. Fix: reduced to 25 items per batch.
- **Nav link**: Added "ISLANDS" link to dashboard navigation (desktop + mobile).

**What Claude Code got right on first try**: TF-IDF algorithm, K-Means++ initialization, softmax confidence scoring. The pure math was solid.

**What needed manual fixes**: TS7022 return type issue, batch size, some brand color violations (used generic blue instead of Navy), and a few missing auth checks.

### Day 17: CURRENTS — What Shipped

**Files created**:
- `temporal.ts` — Access trajectory estimation: rising/stable/declining/periodic trends. `estimateAccessTrajectory()`, `detectPeriodicity()`, `predictRelevance()`.
- `cooccurrence.ts` — Co-occurrence tracking. `trackCoAccess()`, `buildCoOccurrenceMatrix()`, `suggestRelated()`.
- `temporalRunner.ts` — Orchestration action for temporal analysis pipeline.

**Schema tables added**: `accessEvents`, `temporalPatterns`, `cooccurrences`

**Key implementation details**:
- Access events are logged **silently** on all document touchpoints (view, search, ai_query) — no user action required.
- Co-occurrence uses session-based grouping: documents accessed within same session are linked.
- Trajectory estimation models access as state estimation (rate + rate of change), not just discrete events.
- CURRENTS panel integrated into document detail view (`documents/[id]/page.tsx`).

### Day 18: Knowledge Graph — In Progress

**Goal**: Build a weighted knowledge graph connecting documents via 4 signal types, detect bridge documents spanning multiple clusters, and identify attractor states (Knowledge Centers).

**Files being created**:
- `graph.ts` — `buildKnowledgeGraph()`, `calculateDegreeCentrality()`, `calculateAttractorScore()`
- `bridges.ts` — `detectBridges()` (dual-condition), `classifyDocumentRole()`
- `graphRunner.ts` — Orchestration action for graph pipeline
- `graphQueries.ts` — Reactive queries for graph data

**Schema tables being added**: `knowledgeEdges`, `graphRuns`, `documentMetrics`

**See CLAUDE.md for**: signal weights, thresholds, attractor formulas, cascade amplifier mapping.

## Cross-Stage Data Dependencies

This is critical context for any work touching LAMINAR — each stage builds on previous outputs:

```
Day 16 (ARCHIPELAGOS)
├── clusters → Day 18 needs cluster IDs for bridge detection
├── clusterMemberships → Day 18 uses isAmbiguous + probability scores
├── tfidf.ts exports → Day 18 imports cosineSimilarity for content edges
└── clusteringRuns → Day 18 references latest run for current state

Day 17 (CURRENTS)
├── accessEvents → Day 18 uses for access frequency + temporal consistency
├── cooccurrences → Day 18 uses for behavioral edge signal
└── temporalPatterns → Day 18 uses for trajectory-aware attractor scoring

Day 18 (Knowledge Graph)
├── knowledgeEdges → Day 19 uses for BFS cascade traversal
├── documentMetrics.attractorScore → Day 19 uses as cascade amplifier
└── documentMetrics.attractorTier → Day 19 maps to cascade radius + urgency
```

**If any upstream data is missing**, Day 18 health check pattern applies:
1. Query the table to check count
2. If below minimum threshold, generate synthetic data via `seedData.ts`
3. Minimum thresholds: accessEvents ≥50 events across ≥10 docs, cooccurrences ≥5 non-zero pairs, documents ≥5

## §1.3 Pricing Strategy

| Tier | Price | Limits | Target |
|---|---|---|---|
| Free | $0/month | 10 documents, 20 queries/month | Trial users |
| Individual | $15/month | 100 documents, LAMINAR clustering (ARCHIPELAGOS) | Solo consultants |
| Team | $25/user/month (min 3 users) | Unlimited documents, full LAMINAR (all 5 stages), team workspace, admin controls | Agency teams (5–25 people) |

Revenue targets (per GTM Strategy v2): ~$1,250 MRR at Month 1-2 (3-4 paid teams), ~$4K MRR at Month 3 (after Product Hunt), scaling to $17K+ MRR by Month 6 (50 paying agency teams + 80 solo subscribers).

## Strategic Decisions Archive

### §1.1 Beachhead Market: Freelance Agencies

**Date:** February 2026 (pivoted from original musician beachhead — messaging-only change, zero code impact)
**Target:** Freelance agencies — 5–25 person service firms (marketing agencies, design studios, IT consultancies, accounting firms, law practices)

**Why agencies:**
1. Individual decision makers — agency founders approve $25–50/month on personal card, no procurement
2. Business budget spending — tool cost is trivial against $150–500/hr billing rates
3. Measurable ROI — billable hours recovered from knowledge searching ($300–1,000 saved per week)
4. Current MVP fit — agencies upload client docs (PORT), search them (COMPASS), ask AI questions (LIGHTHOUSE). Zero new integrations needed.
5. Expansion leverage — individual → team plan → client enterprise accounts
6. LAMINAR value — client projects self-organize by engagement, industry, and deliverable type

**Personas:**

| Persona | Role | Pain Point | Example Query |
|---|---|---|---|
| Agency Founder/MD | Decision Maker | Runs 5–25 person shop, has budget authority, needs instant answers across all client work | "What did we promise Acme in the Q4 SOW?" |
| Operations/Project Manager | Champion | Manages 8–20 concurrent projects, fields "where is...?" questions all day | "Find the approved budget for the Meridian redesign" |
| Senior Strategist/Account Lead | Power User | Billing $150–300/hr, loses 6+ hours/week searching for client docs | "What competitive research did we do for FinCo last quarter?" |

**Distribution:**
- **Primary:** LinkedIn outreach to agency founders (3-touch sequence)
- **Secondary:** Agency communities (r/agency, Agency Life Slack, LinkedIn groups)
- **Supporting:** Product Hunt, content marketing (2–3 LinkedIn posts/week)

**Positioning:** "ChatGPT for company knowledge" / "Stop searching, start navigating"
**Expansion path:** Freelance Agencies (M0-6) → Customer Support (M3-9) → Sales (M9-15) → Medical/Legal (M15-36)

**Reversibility:** HIGH — this is a messaging pivot. If agency validation fails within 90 days, the same product can target customer support teams, content creators, or any other knowledge-intensive segment.

## Known Limitations

- **PDF text extraction**: ⚠️ Verify current status — was flagged as partial due to `pdf-parse` module resolution in Convex runtime, but may have been resolved during Phase 3. Text/markdown files work fully. Check actual behavior before assuming either way.
- **No pagination**: Document list queries return all documents. Needs pagination for users with 100+ docs.
- **No test framework**: No Jest, Vitest, or other test runner configured. Validation is manual integration testing.
- **Schema drift in docs**: Some project knowledge files contain outdated schema examples (e.g., `organizationId` field, `clerkUserId` field name, `vertical` field on documents). The **actual schema** is always in `convex/schema.ts` — reference that file directly, never documentation examples.
- **LAMINAR cold-start**: With few documents (<10) and no usage history, behavioral/temporal signals are near-zero. System is designed content-first (0.60 weight) with signals that grow as usage accumulates.
- **O(n²) graph scaling**: Knowledge graph edge computation is O(n²) for document pairs. Guard at 200 documents; above that, partition by cluster.

## Development Patterns Discovered

### What Works Well
1. **Schema-first development**: Write Convex tables by hand before any algorithm work. Deploy with `npx convex dev` to validate types immediately.
2. **Sequential Claude Code delegation**: One file per prompt, review before proceeding. Never generate 5 files in one session.
3. **Pure function extraction**: Keep math (TF-IDF, K-Means, graph algorithms) in pure functions importable without Convex context. Test mentally, then wire into actions.
4. **Internal mutation pipeline**: Actions orchestrate, internal mutations write. Keeps actions focused and mutations transactional.
5. **Silent logging**: Access events logged transparently on every document touchpoint without user awareness. Builds behavioral data from day one.

### What Failed / Needed Fixing
1. **Large batch inserts**: 50 items per mutation hit Convex's argument limit. Always use 25.
2. **Missing return type annotations**: TS7022 error on any action that references `internal.*` from same file. Always annotate explicitly.
3. **Brand drift in generated code**: Claude Code defaults to generic `blue-500` colors. Must specify exact hex values in every frontend prompt.
4. **Assuming schema from docs**: Project knowledge files contain aspirational/outdated schema. Always `grep` the actual `convex/schema.ts` before building anything.
5. **Overloading single mutations**: Early attempts put too much logic in mutations. Better pattern: actions for orchestration, mutations for simple writes.

## Git Conventions

```bash
# Feature commits
git commit -m "feat(day-18): knowledge graph schema + health check"

# Bug fixes
git commit -m "fix: TS7022 explicit return type on engine.ts handler"

# Day completion tags
git tag -a day-18-knowledge-graph -m "Day 18: LAMINAR Stage 3"
```

Conventional commits with day prefix for LAMINAR work. Tag each completed day.