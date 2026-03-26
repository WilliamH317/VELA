# VELA Project Context

Deep context for AI assistants working on the VELA codebase. Companion to `CLAUDE.md` — while CLAUDE.md covers permanent rules and anti-patterns, this file covers current state, actual file paths, implementation history, and cross-stage dependencies.

**Last Updated:** March 26, 2026 (Day 26 of 30-day sprint)

---

## Current Status

```
Phase 1: FOUNDATION (Days 1-5)        ████████████████████ 100% ✅
Phase 2: INFRASTRUCTURE (Days 6-8)    ████████████████████ 100% ✅
Phase 3: CORE FEATURES (Days 9-15)    ████████████████████ 100% ✅
Phase 4: DIFFERENTIATION (Days 16-20) ████████████████████ 100% ✅
Phase 5: POLISH & BILLING (Days 21-25)████████████████████ 100% ✅
Phase 6: LAUNCH (Days 26-30)          ████░░░░░░░░░░░░░░░░  ← YOU ARE HERE
```

- **Day 26 of 30** (87% complete)
- **Phase 5 complete:** Stripe billing, MAIDEN VOYAGE onboarding, error boundaries, rate limiting
- **Post-Phase 5:** LAMINAR algorithm improvements sprint complete — all 5 stages upgraded, 4 patent claims strengthened
- **Phase 6 focus:** Help center (Day 26) → Landing page + demo video (Day 27) → Beta testing (Day 28) → Launch assets (Day 29) → Product Hunt + outreach (Day 30)

---

## Product Domain

VELA is a knowledge management platform for knowledge workers — beachhead market is **freelance agencies** (5–25 person service firms: marketing agencies, design studios, IT consultancies). Users upload documents (PDF, text, markdown), search across them, and ask AI questions that return cited answers. The differentiator is LAMINAR — a chaos theory–powered algorithm that self-organizes documents into clusters (ARCHIPELAGOS), tracks access patterns (CURRENTS), builds a knowledge graph (CHARTS), predicts butterfly-effect cascade impacts (CASCADE), and extracts multi-scale insights (Fractal Wisdom).

**Mission:** Instantly connect knowledge workers with answers across scattered documents.
**Positioning:** "ChatGPT for company knowledge" / "Stop searching, start navigating"
**Expansion path:** Freelance Agencies (M0–6) → Customer Support (M3–9) → Sales (M9–15) → Medical/Legal (M15–36)

User-facing examples must reference **client briefs, SOWs, meeting notes, project plans** — never gear notes, venues, or setlists.

---

## Pricing

| Tier | Price | Limits | Internal Value | Target |
|---|---|---|---|---|
| Free | $0/month | 10 documents, 20 queries/month | `"free"` | Trial |
| Individual | $15/month | 100 documents, unlimited queries | `"pro"` | Solo consultants |
| Team | $25/user/month (min 3 users) | Unlimited docs, full LAMINAR (all 5 stages) | `"enterprise"` | Agency teams (5–25) |

---

## Performance Baselines (Verified Live — March 26, 2026)

| Metric | Value | Conditions |
|---|---|---|
| LAMINAR clustering — F1 baseline | 218ms | 14 documents, full K-Means, BIC K=2, silhouette 0.030 |
| LAMINAR clustering — F5 baseline | 240ms | 19 documents, full K-Means, BIC K=2, silhouette 0.038 |
| CASCADE prediction | ~111ms | 14 documents, direction="both", bidirectional BFS |
| COMPASS search | < 100ms | real-time |
| LIGHTHOUSE response | 7–9 seconds | Claude API streaming |
| Document upload | 1–3 seconds | text/markdown |
| Stripe webhook → tier update | < 2 seconds | |

Original Day 16 baseline (historical reference only): 202ms / 7 docs / silhouette 0.1531.

**Note on silhouette score decline:** Silhouette drops as corpus grows (0.153 → 0.030 at 19 docs). This is correct — more diverse documents produce harder-to-separate clusters. The stability confidence label system communicates this to users ("Still forming", confidence 0.50 at silhouette 0.031).

---

## Complete File Inventory (All Created)

### App Routes
```
app/
├── (auth)/sign-in/[[...sign-in]]/page.tsx       ✅
├── (auth)/sign-up/[[...sign-up]]/page.tsx       ✅
├── (dashboard)/layout.tsx                       ✅  (nav includes CASCADE link)
├── (dashboard)/dashboard/page.tsx               ✅  HELM — tier-aware with LAMINAR integration
├── (dashboard)/documents/page.tsx               ✅
├── (dashboard)/documents/[id]/page.tsx          ✅
├── (dashboard)/documents/new/page.tsx           ✅
├── (dashboard)/search/page.tsx                  ✅  (COMPASS + LIGHTHOUSE dual-mode)
├── (dashboard)/archipelagos/page.tsx            ✅  (LAMINAR Stage 1 — stability confidence UI)
├── (dashboard)/connections/page.tsx             ✅  (LAMINAR Stage 3 — 5-signal knowledge graph, 🧠 icon)
├── (dashboard)/cascade/page.tsx                 ✅  (LAMINAR Stage 4 — NEW: bidirectional impact tree + CI ranges)
├── (dashboard)/wisdom/page.tsx                  ✅  (LAMINAR Stage 5 — Hurst attractor labels)
├── (dashboard)/upgrade/page.tsx                 ✅  (pricing + Stripe checkout)
├── (dashboard)/test-center/page.tsx             ✅  (Day 21 — in-memory LAMINAR simulator)
├── (marketing)/page.tsx                         ✅
└── api/stripe/
    ├── checkout/route.ts                        ✅
    └── webhook/route.ts                         ✅
```

### Components
```
components/
├── ui/                          ✅ (Shadcn)
├── user-setup.tsx               ✅
├── loading-wave.tsx             ✅
├── laminar-summary-widget.tsx   ✅  (HELM cluster preview + stability badge)
├── laminar-preview.tsx          ✅  (frosted-glass teaser for free tier)
├── search-box.tsx               ✅
└── cascade-preview.tsx          ✅  (inline warning on document edit)
```

### Convex Backend
```
convex/
├── schema.ts               ✅  (all tables + 7 new fields from LAMINAR improvements sprint)
├── documents.ts            ✅  (+ getForLaminar bridge + scheduler trigger at lines 237, 516)
├── users.ts                ✅
├── ai.ts                   ✅  (LIGHTHOUSE — non-blocking accessEvents)
├── subscriptions.ts        ✅  (getUserTier, updateUserTier, createCheckoutSession)
├── queries.ts              ✅  (AI query logging + LAMINAR tier-gated queries + getCascadeImpacts + getLatestCascadeRun)
├── auth.config.ts          ✅
└── laminar/
    ├── tfidf.ts            ✅  Pure TS — TF-IDF + buildTFIDFFromSignals + computeVerticalWeightedTFIDF
    ├── kmeans.ts           ✅  Pure TS — K-Means++ + selectOptimalK (BIC) + silhouette
    ├── confidence.ts       ✅  Pure TS — softmax membership + silhouetteToStabilityConfidence
    ├── temporal.ts         ✅  Pure TS — FFT periodicity + computeAccessProbabilityCurve + computeHurstExponent
    ├── cooccurrence.ts     ✅  Pure TS — per-user co-occurrence + computeMultiUserCoAccess
    ├── pipeline.ts         ✅  Pure TS — LaminarStage interface + runPipeline
    ├── processors.ts       ✅  Pure TS — IProcessable (Markdown/PDF/Plaintext)
    ├── engine.ts           ✅  Convex — run (public) / internalRun (internal, userId as arg)
    ├── graph.ts            ✅  Convex — 5-signal fusion + Claude API embeddings + SignalInputs interface
    ├── runner.ts           ✅  Convex — reactive trigger (onDocumentIngested → triggerClustering)
    ├── cascade.ts          ✅  Convex — run (public) / internalRunCascade (internal) — bidirectional BFS + bootstrap CI
    ├── fractal.ts          ✅  Convex — Hurst exponent + cross-vertical transfer scoring
    └── temporalRunner.ts   ✅  Convex — CURRENTS pipeline (accessProbabilityCurve + hurstExponent wired)

convex/lib/
└── tierGuard.ts            ✅  Pure TS — canAccessLaminarLayer(), getLaminarPreviewMode()
```

---

## LAMINAR Algorithm — Current State (Post-Improvements Sprint)

### Stage 1: ARCHIPELAGOS

**New since Day 20:**
- `selectOptimalK` (BIC-based) in `kmeans.ts` — evaluates K=2..min(10, floor(n/2)), falls back to heuristic if BIC produces K<2
- `silhouetteToStabilityConfidence` in `confidence.ts` — 5-tier label mapping (0.031 → "Still forming", confidence 0.50)
- `stabilityConfidence` written to `clusters` table after every full K-Means run
- Incremental clustering in `engine.ts` — `DRIFT_THRESHOLD = 0.05`. Drift < threshold: assign new docs to nearest existing centroid, insert memberships, increment documentCount, complete run. Drift ≥ threshold: full K-Means recompute.
- `computeVerticalWeightedTFIDF` in `tfidf.ts` — global IDF (0.6) + vertical-specific IDF (0.4). All docs default to `'agency'` vertical.

**Incremental clustering bug fixed (March 26):** Original incremental path called `completeRun` but never inserted `clusterMembership` rows for new documents. Fix: incremental path now queries existing memberships, runs `computeDocumentConfidence`, inserts memberships in 25-item batches via `batchInsertMemberships`, increments `documentCount` on assigned clusters.

### Stage 2: CURRENTS

**New since Day 20:**
- `detectPeriodicity` (FFT-based) in `temporal.ts` — naive DFT over 90-day binary time series, rounds to common periods (7/14/30 days) within ±1.5 day tolerance, significance threshold 0.3×(max+mean)
- `computeAccessProbabilityCurve` in `temporal.ts` — exponential decay P(t) = 1 - exp(-lambda×t), recency dampening exp(-daysSinceLast/30), guard: <3 accesses → {day1:0, day7:0, day30:0}
- `computeHurstExponent` in `temporal.ts` — R/S analysis, window sizes [4,8,16,32] days, drops 32-day window if <40 access events, H clamped [0.01, 0.99], classification: H>0.6→attractor, H<0.4→cycling, else→random
- `computeMultiUserCoAccess` in `cooccurrence.ts` — cross-user co-access in 5-min windows, threshold 0.05
- Both `accessProbabilityCurve` and `hurstExponent` wired into `temporalRunner.ts` via `batchUpsertTemporalPatterns`

### Stage 3: CHARTS (Knowledge Graph)

**New since Day 20:**
- Signal 5: `embeddingSimilarity` via Claude API structured prompt, batched 10 pairs/call
- Skip pairs where `contentSimilarity < 0.1` (cost control — ~2–3 API calls per graph build at 19-doc corpus)
- Fallback: null embedding → dynamic renormalization across remaining 4 signals automatically
- New `IDEAL_WEIGHTS`: `{content:0.20, embedding:0.25, temporal:0.20, coAccess:0.25, structural:0.10}`
- `SignalInputs` interface updated: `embeddingSimilarity?: number | null`
- `coAccessStrength` now blends per-user (0.6×) + multi-user (0.4×) signals
- Connections page: 🧠 Semantic icon for Signal 5
- Current corpus: 24 edges, 5/5 signals

### Stage 4: CASCADE

**New since Day 20:**
- `adaptiveDecay`: structuralLink>0.5→0.88, temporalProximity>0.5→0.82, coAccess>0.5→0.75, default→0.80
- Bidirectional BFS: `direction="both"` runs forward + reverse, deduplicates by docId, stores `direction` field on each `cascadeImpacts` row
- Bootstrap CI: N=50, EDGE_WEIGHT_VARIANCE=0.12, Box-Muller Gaussian perturbation, guards: impactScore≥0.3 AND depth≤2, writes `confidenceLow` + `confidenceHigh`
- `cascade.ts` created from scratch as a Convex file (bounded context enforced)
- `app/(dashboard)/cascade/page.tsx` created — document selector, run button, bidirectional impact tree with CI ranges

**Reactive auth fix applied (March 26):** `cascade.ts` split into `runCascade` (public, auth-gated) and `internalRunCascade` (internal, `userId` as arg). Same pattern as `engine.ts`. Previous version used `"fake_id"` fallback — cascades returned zero results from function runner.

### Stage 5: DEPTHS (Fractal Wisdom)

**New since Day 20:**
- `computeHurstExponent` — R/S analysis (see Stage 2 above, same function used by both)
- `computeCrossVerticalTransferScore` in `fractal.ts` — cosine similarity on `PatternEmbedding` vectors, `TRANSFER_THRESHOLD=0.75`
- Single-vertical baseline: all patterns tagged `'agency'` → inter-cluster cosine similarity returned (0.0–1.0 range). Cross-vertical behavior activates with second vertical.
- `fractal.ts` created from scratch as a Convex file (bounded context enforced)
- DEPTHS action returns insights sorted by H descending; attractor documents labeled in wisdom cards

---

## New Schema Fields (Added LAMINAR Improvements Sprint)

All fields are `v.optional(...)` except `direction` (optional union — see note).

| Table | Field | Type | Purpose |
|---|---|---|---|
| `clusters` | `stabilityConfidence` | `v.optional(v.number())` | Derived from silhouette score, range 0–1 |
| `cascadeImpacts` | `direction` | `v.optional(v.union(v.literal("forward"), v.literal("reverse")))` | BFS direction — written explicitly on all new rows |
| `cascadeImpacts` | `confidenceLow` | `v.optional(v.number())` | 5th percentile bootstrap CI |
| `cascadeImpacts` | `confidenceHigh` | `v.optional(v.number())` | 95th percentile bootstrap CI |
| `knowledgeEdges.signals` | `embeddingSimilarity` | `v.optional(v.number())` | Signal 5 — Claude API semantic similarity |
| `temporalPatterns` | `accessProbabilityCurve` | `v.optional(v.object({day1, day7, day30: v.number()}))` | Predictive access probability at 3 horizons |
| `temporalPatterns` | `hurstExponent` | `v.optional(v.number())` | R/S analysis result, range 0–1 |
| `cooccurrences` | `multiUserStrength` | `v.optional(v.number())` | Cross-user co-access score, range 0–1 |

`direction` is `v.optional` (not required) because existing `cascadeImpacts` rows predate bidirectional CASCADE. New rows always write `direction` explicitly.

---

## Critical Architecture Patterns

### Scheduled Action Auth Pattern (CLAUDE.md Rule 3b)

**Problem:** Scheduled actions run without an authenticated session. `ctx.auth.getUserIdentity()` returns null in scheduler context. Previous implementation used `"fake_id"` fallback — caused cascade and clustering to find zero results.

**Pattern (applies to `engine.ts` and `cascade.ts`, must apply to any future scheduled LAMINAR action):**

```typescript
// Public action — auth-gated, user-facing
export const run = action({
  handler: async (ctx, args): Promise<ReturnType> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return ctx.runAction(internal.laminar.engine.internalRun, {
      ...args,
      userId: identity.subject,
    });
  },
});

// Internal action — no auth check, userId as explicit arg
export const internalRun = internalAction({
  args: { userId: v.string(), ...otherArgs },
  handler: async (ctx, { userId, ...args }): Promise<ReturnType> => {
    // Use userId directly — NEVER ctx.auth.getUserIdentity()
  },
});
```

### LAMINAR SoC Boundary

Pure files (zero Convex imports): `tfidf.ts`, `kmeans.ts`, `confidence.ts`, `temporal.ts`, `cooccurrence.ts`, `pipeline.ts`, `processors.ts`

Convex files (read documents via `getForLaminar` only): `engine.ts`, `graph.ts`, `runner.ts`, `cascade.ts`, `fractal.ts`, `temporalRunner.ts`

Verification (run before any integration work):
```powershell
# Must return zero matches
Select-String -Pattern "import.*convex|import.*_generated" `
  -Path convex/laminar/tfidf.ts, convex/laminar/kmeans.ts, `
         convex/laminar/confidence.ts, convex/laminar/pipeline.ts, `
         convex/laminar/processors.ts, convex/laminar/temporal.ts, `
         convex/laminar/cooccurrence.ts

# Must return zero matches
Select-String -Pattern 'query\("documents"\)|query\("users"\)' `
  -Path convex/laminar/*.ts
```

### Knowledge Domain Bridge

All LAMINAR files read documents ONLY through:
```typescript
// convex/documents.ts
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

Never `ctx.db.query("documents")` directly inside `laminar/`.

### Reactive Pipeline Entry Points

Two trigger sites in `convex/documents.ts`:
- Line 237: Text/markdown document creation — fires immediately on insert
- Line 516: File-based document after `processFile` completes and status transitions to `"ready"`

Both call: `ctx.scheduler.runAfter(0, internal.laminar.runner.onDocumentIngested, { documentId, userId: ... })`

The `onDocumentIngested` → `triggerClustering` → `internalRun` chain. All three steps log successfully in Convex dashboard when working correctly.

### Incremental vs Full Recompute

`engine.ts` `internalRun` checks centroid drift before deciding:
- `DRIFT_THRESHOLD = 0.05`
- Drift < 0.05: incremental mode — assign new docs to nearest existing centroid, insert memberships in 25-item batches, increment `documentCount`
- Drift ≥ 0.05: full K-Means recompute with BIC K selection

Both paths write a `clusteringRuns` row with `status: "completed"`. Full recompute also writes `stabilityConfidence`. Incremental path does not recompute `stabilityConfidence` (existing value remains valid).

### Claude API Embedding (Signal 5)

- Computed inside `buildKnowledgeGraph` action in `graph.ts`
- Batched: 10 document pairs per API call
- Skip condition: `contentSimilarity < 0.1` (zero vocabulary overlap)
- ~2–3 API calls per graph build at 19-document corpus
- Fallback: `embeddingSimilarity = null` → dynamic renormalization across 4 remaining signals
- Cached in `knowledgeEdges.signals.embeddingSimilarity` — never recomputed unless edges are rebuilt

---

## Cross-Stage Data Dependencies (Current State)

```
Stage 1 (ARCHIPELAGOS) → provides:
  clusters.{name, topKeywords, centroid, stabilityConfidence}
  clusterMemberships.{probability, isPrimary, isAmbiguous}
  tfidf.ts exports (cosineSimilarity) → used by graph.ts + fractal.ts

Stage 2 (CURRENTS) → provides:
  accessEvents (view | search_hit | ai_query | ai_cited)
  cooccurrences.{strength, multiUserStrength} → coAccessStrength in graph.ts
  temporalPatterns.{predictedRelevance, accessProbabilityCurve, hurstExponent}

Stage 3 (CHARTS) → provides:
  knowledgeEdges.{weight, signals{5}, isBridge} → used by cascade.ts BFS
  attractor classification via attractorScore

Stage 4 (CASCADE) → provides:
  cascadeRuns + cascadeImpacts.{impactScore, depth, direction, confidenceLow, confidenceHigh}
  Surfaces in /cascade UI — document selector + bidirectional impact tree

Stage 5 (DEPTHS) → provides:
  Hurst exponent classification (attractor/cycling/random) → labels in /wisdom UI
  Cross-vertical transfer scores (trivial in single-vertical mode, activates at V2)
  SOUNDINGS wisdom cards
```

---

## Phase 6 Focus Areas (Days 26–30)

### Day 26: Help Center + Documentation (current)
- Help center at `app/(dashboard)/help/page.tsx`
- Onboarding documentation for agency context
- FAQ covering LAMINAR concepts in nautical language

### Day 27: Landing Page + Demo Video
- High-converting marketing page at `app/(marketing)/page.tsx` (update existing)
- Demo video showing PORT → COMPASS → LIGHTHOUSE → ARCHIPELAGOS aha moment
- Target: time-to-aha under 60 seconds in video

### Day 28: Beta Testing (5–8 Agency Founders)
- Recruit from LinkedIn agency groups
- Focus: time-to-first-ARCHIPELAGO, LIGHTHOUSE answer quality, upgrade friction
- Collect: qualitative feedback on nautical naming comprehension

### Day 29: Critical Bug Fixes + Launch Assets
- Fix any blockers surfaced in beta testing
- Product Hunt assets: tagline, description, gallery screenshots
- LinkedIn post draft for agency founder outreach

### Day 30: Product Hunt + Launch
- Product Hunt submission at 12:01 AM PT
- LinkedIn agency outreach (5–10 direct messages to identified founders)
- Monitor: sign-ups, first uploads, first LIGHTHOUSE queries, first upgrades

---

## Known Limitations

- **PDF text extraction:** `pdf-parse` had module resolution issues in Convex runtime during Phase 3 — verify current status before assuming resolved. Text and Markdown files work fully.
- **No pagination:** Document list queries return all documents. Users with 100+ docs will see performance degradation. Month 2 roadmap.
- **No automated test framework:** Vitest configured (`vitest.config.ts`), tests exist for `tfidf.test.ts`, `kmeans.test.ts`, `confidence.test.ts`. Schema audit script at `scripts/schema-audit.ts`. Run: `npm test`, `npm run audit:schema`.
- **LAMINAR cold-start:** With <3 documents, clustering is skipped. With <10 docs, behavioral/temporal signals are near-zero. Content similarity dominates appropriately at cold-start. Hurst exponent requires ≥20 access events for reliable estimate (confidence <1.0 below that threshold).
- **O(n²) graph scaling:** Edge computation guarded at 200 documents; above that, partitions by cluster. Embedding API batched at 10 pairs/call, skips pairs with zero TF-IDF overlap.
- **processors.ts not yet in hot path:** `IProcessable` and `buildTFIDFFromSignals` are deployed infrastructure but `runner.ts` still uses original `contentPlain` path. Activation deferred to Month 2 after usage data validates.
- **No Customer Portal:** Subscription self-service requires contacting support until Stripe Customer Portal route is wired (`app/api/stripe/portal/route.ts`).
- **Cross-vertical transfer:** `computeCrossVerticalTransferScore` deployed and functional; returns inter-cluster similarity scores in single-vertical mode (correct — activates meaningfully when Customer Support vertical launches).
- **SignalInputs interface location:** `graph.ts` — uses dynamic key iteration, not direct destructuring. Phase C of LAMINAR improvements added `embeddingSimilarity?: number | null` to the interface and `embeddingSimilarity: 0.25` to `IDEAL_WEIGHTS` constant. Any future signal additions must touch both.

---

## Development Patterns (What Works / What Fails)

### What Works
- **Schema-first:** Write Convex tables by hand, deploy via `npx convex dev`, validate types before writing algorithms
- **Sequential delegation:** One file per Claude Code session, reviewed before proceeding
- **Pure function extraction:** Math in pure files, Convex in separate files
- **Silent logging:** `ctx.scheduler.runAfter(0, ...)` for all access event emission — zero user-visible latency
- **run/internalRun split:** Public action is auth-gated; internal action accepts userId as arg — required for all scheduled actions

### What Failed / Needs Watching
- **Schema drift:** Never trust documentation field names — always read `convex/schema.ts` directly (Phase 0 protocol). Day 18: 6 field names wrong. Day 26: 7 new fields added — schema is canonical.
- **Batch size:** 50 items per mutation hit Convex's limit. Always 25.
- **Missing return type annotations:** TS7022 on any action referencing `internal.*` from same file. Always annotate explicitly.
- **Brand drift in generated code:** Claude Code defaults to `blue-500`. Always specify `#1B3D5C` and `#00BCD4` explicitly in prompts.
- **Blocking logging in hot path:** `ctx.runMutation` for access events blocks streaming — always `ctx.scheduler.runAfter(0, ...)`.
- **Scheduled action auth:** Never `ctx.auth.getUserIdentity()` in a scheduled function. Pass `userId` as arg. Failure mode: cascade/clustering finds zero results, logs `"fake_id"` as userId, no error thrown. (CLAUDE.md Rule 3b)
- **Stripe webhook port mismatch:** If Next.js shifts to 3001, Stripe CLI listener must be restarted with `--forward-to localhost:3001/api/stripe/webhook`. Port mismatch silently drops all webhook events.
- **Tailwind v4 config pattern:** `globals.css` requires `@import "tailwindcss";` then `@config "../../tailwind.config.ts";` then `@source` directives. Old `@tailwind base/components/utilities` directives silently ignored by v4.
- **Document preview pattern:** Always use `contentPlain ?? contentPreview ?? ''`. Always apply markdown strip chain before rendering preview. HELM: 80-char truncation. Document list: 120-char.

---

## AI Integration Constraints

Both LIGHTHOUSE modes in `convex/ai.ts` (`askQuestion` + `generateAnswer`):
- Max 20 documents per query (`MAX_DOCUMENTS`)
- Max 8000 chars per document in context (`MAX_CHARS_PER_DOC`)
- Max 1000 char queries (`MAX_QUERY_LENGTH`)
- Model: `claude-sonnet-4-20250514`
- Retry: exponential backoff, 3 retries

Claude API also used in `graph.ts` for embedding similarity (Signal 5):
- Structured prompt: "Rate semantic similarity 0.0 to 1.0, respond ONLY with JSON {similarity: <number>}"
- Batched: 10 pairs per call
- Only for pairs where `contentSimilarity > 0.1`

---

## Lighthouse Performance (Day 22 Final — Production Build)

| Route | Performance | Accessibility | LCP (ms) | CLS |
|---|---|---|---|---|
| home | 85 | 100 | 3,884 | 0.000 |
| dashboard | 74 | 95 | 5,421 | 0.010 |
| search | 73 | 100 | 6,444 | 0.000 |

**Contrast pattern:** White on `#00BCD4` = 2.19:1 (fails AA). Navy `#1B3D5C` on `#00BCD4` = 5.2:1 (passes AA). Always use navy for text on teal backgrounds.

**LCP pattern:** Dashboard/search LCP dominated by Clerk dev-mode handshake — resolves in production with persistent cookies.

---

## Git Conventions

```bash
# Feature commits
git commit -m "feat(laminar): BIC K selection + stability confidence + incremental clustering"

# Bug fix commits
git commit -m "fix(runner): scheduled action auth — run/internalRun split pattern"

# Day completion tags
git tag -a day-25-phase5-complete -m "Day 25: Phase 5 complete — billing, onboarding, hardening"
git tag -a laminar-improvements-complete -m "LAMINAR algorithm improvements — all 5 stages, 4 patent claims"
```

Co-author line on all commits: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

---

## Single-Vertical Cross-Vertical Baseline (Document for Future Reference)

When `computeCrossVerticalTransferScore` is called with two patterns from the same `'agency'` vertical:
- Returns cosine similarity between cluster centroid vectors from same corpus
- Expected range: 0.0–1.0 depending on cluster separation
- This is correct and expected behavior in single-vertical mode
- Activates meaningfully when Customer Support (Vertical 2) is onboarded
- The baseline inter-cluster similarity at Day 26 corpus state is the **before** measurement for future cross-vertical delta validation