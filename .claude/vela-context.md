# VELA Project Context

Deep context for AI assistants working on the VELA codebase. Companion to `CLAUDE.md` — while CLAUDE.md covers permanent rules and anti-patterns, this file covers current state, actual file paths, implementation history, and cross-stage dependencies.

**Last Updated:** March 14, 2026 (Day 21 of 30-day sprint)

---

## Current Status

```
Phase 1: FOUNDATION (Days 1-5)        ████████████████████ 100% ✅
Phase 2: INFRASTRUCTURE (Days 6-8)    ████████████████████ 100% ✅
Phase 3: CORE FEATURES (Days 9-15)    ████████████████████ 100% ✅
Phase 4: DIFFERENTIATION (Days 16-20) ████████████████████ 100% ✅
Phase 5: POLISH & BILLING (Days 21-25)                     ← YOU ARE HERE
Phase 6: LAUNCH (Days 26-30)                               🔒
```

- **Day 21 of 30** (67% complete)
- **Phase 4 complete:** All 5 LAMINAR stages shipped + verified + SC2 architecture refactor done
- **Phase 5 focus:** UI/UX polish (Day 21) → Accessibility (Day 22) → Stripe billing (Day 23) → MAIDEN VOYAGE onboarding (Day 24) → Pre-launch hardening (Day 25)

---

## Product Domain

VELA is a knowledge management platform for knowledge workers — beachhead market is **freelance agencies** (5–25 person service firms: marketing agencies, design studios, IT consultancies). Users upload documents (PDF, text, markdown), search across them, and ask AI questions that return cited answers. The differentiator is LAMINAR — a chaos theory–powered algorithm that self-organizes documents into clusters (ARCHIPELAGOS), tracks access patterns (CURRENTS), builds a knowledge graph (CHARTS), predicts butterfly-effect cascade impacts (CASCADE), and extracts multi-scale insights (Fractal Wisdom).

**Mission:** Instantly connect knowledge workers with answers across scattered documents.  
**Positioning:** "ChatGPT for company knowledge" / "Stop searching, start navigating"  
**Expansion path:** Freelance Agencies (M0–6) → Customer Support (M3–9) → Sales (M9–15) → Medical/Legal (M15–36)

User-facing examples must reference **client briefs, SOWs, meeting notes, project plans** — never gear notes, venues, or setlists.

---

## Pricing

| Tier | Price | Limits | Target |
|---|---|---|---|
| Free | $0/month | 10 documents, 20 queries/month | Trial |
| Individual | $15/month | 100 documents, unlimited queries | Solo consultants |
| Team | $25/user/month (min 3 users) | Unlimited docs, full LAMINAR (all 5 stages), team workspace | Agency teams (5–25) |

---

## Complete File Inventory (All Created)

### App Routes
```
app/
├── (auth)/sign-in/[[...sign-in]]/page.tsx       ✅
├── (auth)/sign-up/[[...sign-up]]/page.tsx       ✅
├── (dashboard)/dashboard/page.tsx               ✅  ← HELM (needs Day 21 redesign)
├── (dashboard)/documents/page.tsx               ✅
├── (dashboard)/documents/[id]/page.tsx          ✅
├── (dashboard)/documents/new/page.tsx           ✅
├── (dashboard)/search/page.tsx                  ✅  (COMPASS + LIGHTHOUSE dual-mode)
├── (dashboard)/archipelagos/page.tsx            ✅  (LAMINAR Stage 1)
├── (dashboard)/connections/page.tsx             ✅  (LAMINAR Stage 3 — Knowledge Graph)
├── (dashboard)/cascade/page.tsx                 ✅  (LAMINAR Stage 4)
├── (dashboard)/wisdom/page.tsx                  ✅  (LAMINAR Stage 5)
└── (marketing)/page.tsx                         ✅
```

### Components
```
components/
├── ui/                     ✅ (Shadcn)
├── user-setup.tsx          ✅
├── document-card.tsx       ✅
├── search-box.tsx          ✅
└── cascade-preview.tsx     ✅
```

### Convex Backend
```
convex/
├── schema.ts               ✅ (all LAMINAR tables deployed)
├── documents.ts            ✅ (+ getForLaminar bridge + scheduler trigger)
├── users.ts                ✅
├── ai.ts                   ✅ (LIGHTHOUSE — non-blocking accessEvents)
├── queries.ts              ✅ (AI query logging)
└── laminar/
    ├── tfidf.ts            ✅  Pure TS (+ buildTFIDFFromSignals)
    ├── kmeans.ts           ✅  Pure TS
    ├── confidence.ts       ✅  Pure TS
    ├── temporal.ts         ✅  Pure TS
    ├── cooccurrence.ts     ✅  Pure TS
    ├── pipeline.ts         ✅  Pure TS — LaminarStage interface + runPipeline
    ├── processors.ts       ✅  Pure TS — IProcessable (Markdown/PDF/Plaintext)
    ├── engine.ts           ✅  Convex (bounded context enforced)
    ├── graph.ts            ✅  Convex (bounded context enforced)
    ├── runner.ts           ✅  Convex (reactive trigger)
    ├── cascade.ts          ✅  Convex
    └── fractal.ts          ✅  Convex
```

---

## LAMINAR Implementation History

### Day 16: ARCHIPELAGOS ✅

- 7 docs clustered in 202ms, K=2, silhouette 0.1531, converged in 1 iteration
- Tables: `clusteringRuns`, `clusters`, `clusterMemberships`, `clusterHistory`
- **Bugs fixed:** TS7022 circular inference (explicit return type); batch size 50→25; brand color violations

### Day 17: CURRENTS ✅

- Tables: `accessEvents`, `temporalPatterns`, `cooccurrences`
- Access events logged silently on every document touchpoint (view, search, ai_query)
- Co-occurrence uses session-based grouping; trajectory models rate + rate of change

### Day 18: Knowledge Graph ✅

- Tables: `knowledgeEdges` (NOT "edges"), `documentMetrics`
- 21 edges created, 4/4 signals active, weight range 0.2545–0.4598, 11/11 tests pass
- **Critical schema drift discovered:** 6+ field names diverged from documentation — see CLAUDE.md Phase 0 for full list. Mandatory audit protocol established.

### Day 19: CASCADE ✅

- Tables: `cascadeRuns`, `cascadeImpacts` (pre-deployed in schema before Day 19)
- BFS traversal with `decay=0.8`, `min_threshold=0.30`, `max_depth=3`
- Impact scores monotonically decrease with depth; no cycles via visited set

### Day 20: Fractal Wisdom ✅ + SC2 Architecture Refactor ✅

- Fractal wisdom tables deployed; multi-scale pattern recognition working; wisdom cards rendering
- SC2 refactor shipped in 5 phases (see below)

### Day 20: SC2 Architecture Refactor (All Phases Complete)

| Phase | What Changed | Files |
|---|---|---|
| 1: Event-Driven | Reactive LAMINAR trigger on document creation via `ctx.scheduler.runAfter(0, ...)` | `documents.ts`, `runner.ts` |
| 2: SoC Boundary | Boundary enforcement comments on all 7 pure files; zero Convex contamination confirmed | `tfidf.ts`, `kmeans.ts`, `confidence.ts`, `temporal.ts`, `cooccurrence.ts` |
| 3: Bounded Context | Removed `ctx.db.query("documents")` from `engine.ts` and `graph.ts`; routes through `getForLaminar` | `engine.ts`, `graph.ts`, `documents.ts` |
| 4: Composable Pipeline | `LaminarStage` interface, `LaminarState` type, `runPipeline` orchestrator | `pipeline.ts` (new) |
| 5: Signal Polymorphism | `IProcessable` with `MarkdownProcessor`, `PdfProcessor`, `PlaintextProcessor`; `buildTFIDFFromSignals` additive export | `processors.ts` (new), `tfidf.ts` |

**LIGHTHOUSE hot path fix (Day 20):** Both `askQuestion` and `generateAnswer` modes in `convex/ai.ts` converted from blocking `ctx.runMutation(...)` to `ctx.scheduler.runAfter(0, ...)` for accessEvent emission. 14 insertions, 20 deletions. Verified `scheduler` on both matches via `Select-String`.

---

## Cross-Stage Data Dependencies (Current State)

All stages complete. Dependencies are fully resolved:

```
Stage 1 (ARCHIPELAGOS) → provides:
  clusters.id + clusters.name + clusters.topKeywords
  clusterMemberships.probability + .isPrimary + .isAmbiguous
  tfidf.ts exports (cosineSimilarity) → used by graph.ts

Stage 2 (CURRENTS) → provides:
  accessEvents (view | search_hit | ai_query | ai_cited)
  cooccurrences.strength → used as behavioral edge signal in graph.ts
  temporalPatterns.predictedRelevance → used in attractor scoring

Stage 3 (Knowledge Graph) → provides:
  knowledgeEdges.weight + .signals + .isBridge → used by cascade.ts BFS
  documentMetrics.attractorScore → cascade amplifier

Stage 4 (CASCADE) → provides:
  cascadeRuns + cascadeImpacts → surfaces in /cascade UI
  cascade-preview.tsx warns on document edit

Stage 5 (Fractal Wisdom) → provides:
  Cross-scale pattern insights → surfaces in /wisdom UI
```

---

## Phase 5 Focus Areas (Days 21–25)

### Day 21: UI/UX Polish (current)
- Redesign HELM dashboard — integrate LAMINAR cluster preview + wisdom teaser
- Consistent wave loading states across all pages
- Empty state polish with nautical messaging
- Navigation improvements for LAMINAR section pages
- Trust layer indicators: "Why LAMINAR made this suggestion"
- Cluster stability badges: "Stable for 7 days" vs "Still forming"

### Day 22: Accessibility & Performance
- ARIA labels throughout all components
- Full keyboard tab order
- Core Web Vitals: LCP < 2.5s, CLS < 0.1
- Lighthouse 90+ all pages
- Performance targets: page load < 3s, AI < 5s, search < 1s, LAMINAR < 5s

### Day 23: Stripe Billing
- Packages: `stripe`, `@stripe/stripe-js`
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Three products: Free / Individual ($15/mo) / Team ($25/user/mo)
- Webhook handler: `app/api/webhooks/stripe/route.ts`
- Schema addition: `users` table needs `subscriptionTier`, `subscriptionId`, `currentPeriodEnd`
- Feature gating: document limits + LAMINAR stage access by tier
- ⚠️ Schema change — requires manual review before Claude Code writes any billing code

### Day 24: MAIDEN VOYAGE Onboarding
- First-time user guided tour
- Sample agency documents pre-loaded (client brief, SOW, meeting notes, project plan)
- Goal: time-to-first-ARCHIPELAGO under 5 minutes
- Cold-start bridge: show flat document list with "Upload 3 more documents to discover ARCHIPELAGOS"

### Day 25: Pre-Launch Hardening
- Error boundary coverage throughout
- Rate limiting on AI endpoints
- Graceful degradation: LIGHTHOUSE unavailable → COMPASS fallback; LAMINAR stale → flat document view
- Final regression: PORT, COMPASS, LIGHTHOUSE, all LAMINAR stages, auth flow, multi-tab sync

---

## Known Limitations

- **PDF text extraction:** `pdf-parse` had module resolution issues in Convex runtime during Phase 3 — verify current status before assuming resolved.
- **No pagination:** Document list queries return all documents. Users with 100+ docs will see performance degradation. Needs pagination.
- **No test runner:** No Jest, Vitest, or test framework configured. Validation is manual integration testing.
- **LAMINAR cold-start:** With < 3 documents, clustering is skipped (`onDocumentIngested` guard). With < 10 docs, behavioral/temporal signals are near-zero — content similarity (0.60 weight) dominates appropriately.
- **O(n²) graph scaling:** Edge computation throws a protective error at 200+ documents. Partition by cluster for larger sets.
- **`processors.ts` not yet wired into hot path:** `IProcessable` and `buildTFIDFFromSignals` are deployed as infrastructure but `runner.ts` still uses the original `contentPlain` path. Activate only after Day 25 regression testing passes.

---

## Development Patterns (What Works / What Fails)

### What Works
- **Schema-first:** Write Convex tables by hand, deploy via `npx convex dev`, validate types before writing algorithms
- **Sequential delegation:** One file per Claude Code session, reviewed before proceeding
- **Pure function extraction:** Math in pure files (`tfidf.ts`, `kmeans.ts`), Convex in separate files (`engine.ts`, `runner.ts`)
- **Silent logging:** `ctx.scheduler.runAfter(0, ...)` for all access event emission — zero user-visible latency

### What Failed / Needs Watching
- **Schema drift:** Never trust documentation field names — always read `convex/schema.ts` directly (Phase 0 protocol)
- **Batch size:** 50 items per mutation hit Convex's 8KB limit on Day 16. Always 25.
- **Missing return type annotations:** TS7022 on any action referencing `internal.*` from same file. Always annotate explicitly.
- **Brand drift in generated code:** Claude Code defaults to `blue-500`. Always specify `#1B3D5C` and `#00BCD4` explicitly in prompts.
- **Blocking logging in hot path:** `ctx.runMutation` for access events blocks streaming — always use `ctx.scheduler.runAfter(0, ...)`.

---

## AI Integration Constraints

Both LIGHTHOUSE modes in `convex/ai.ts` (`askQuestion` + `generateAnswer`):
- Max 20 documents per query (`MAX_DOCUMENTS`)
- Max 8000 chars per document in context (`MAX_CHARS_PER_DOC`)
- Max 1000 char queries (`MAX_QUERY_LENGTH`)
- Model: `claude-sonnet-4-20250514`
- Retry: exponential backoff, 3 retries

---

## Git Conventions

```bash
# Feature commits
git commit -m "feat(day-21): HELM dashboard redesign with LAMINAR integration"

# Refactor commits
git commit -m "refactor(laminar): composable pipeline architecture"

# Performance fixes
git commit -m "perf(laminar): non-blocking accessEvent emission in LIGHTHOUSE"

# Day completion tags
git tag -a day-20-laminar-complete -m "Day 20: All 5 LAMINAR stages + SC2 refactor"
```

Co-author line on all commits: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`