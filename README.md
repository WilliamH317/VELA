# VELA — Navigate Your Knowledge

**AI-Powered Knowledge Management Platform**
*Transform scattered information into instant answers using chaos theory and AI*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat-square)](https://convex.dev/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-blue?style=flat-square)](https://anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Status](https://img.shields.io/badge/Sprint-Day%2026%2F30-success?style=flat-square)](https://github.com/WilliamH317/VELA)

---

## What is VELA?

VELA is an AI-powered knowledge management platform that helps knowledge workers find answers in **seconds instead of hours**. Upload your documents, ask natural language questions, and get cited answers — while a chaos theory algorithm quietly organizes everything behind the scenes.

No folders. No tags. No manual categorization. Documents organize themselves.

**Stop searching. Start navigating.** ⚓

---

## Features

### ARCHIPELAGOS — Self-Organizing Knowledge Clusters

Documents organize themselves into topic clusters powered by **LAMINAR**, VELA's chaos theory algorithm. Upload 3+ documents and VELA discovers groups automatically — no folders needed. Each document gets a probability distribution across all clusters (72% to cluster A, 18% to cluster B), not a binary assignment. Documents near cluster boundaries are flagged as bridges connecting knowledge islands. Each cluster surfaces a **stability confidence score** derived from silhouette analysis — visible in the UI as labels like "Stable", "Still forming", or "Unstable — reorganizing".

Built entirely in pure TypeScript — TF-IDF vectorization with BIC-based optimal K selection, K-Means++ clustering, softmax confidence scoring, incremental recompute with drift detection. Zero external ML dependencies. Latest production run: 19 documents clustered in 240ms.

### CURRENTS — Temporal Pattern Detection

VELA silently tracks how you interact with documents — which ones you view, search for, and ask AI about — then models access trajectories using exponential decay regression. Documents are classified as rising, stable, declining, or periodic based on access patterns. **FFT-based periodicity detection** identifies weekly, biweekly, and monthly access cycles. **Predictive access probability curves** estimate likelihood of access at 1-day, 7-day, and 30-day horizons. Co-occurrence tracking links documents accessed within the same session, with cross-user behavioral signals strengthening the knowledge graph over time. **Hurst exponent analysis** (R/S method) classifies each document as an attractor state (H > 0.6), cycling (H < 0.4), or random (H ≈ 0.5).

### CHARTS — Knowledge Graph

A weighted knowledge graph connecting documents through **5 signal types**: content similarity (TF-IDF cosine, weight 0.20), semantic similarity (Claude API embeddings, weight 0.25), temporal proximity (weight 0.20), behavioral co-occurrence (weight 0.25), and structural links (weight 0.10). Dynamic weight renormalization ensures edge weights are coherent when semantic similarity is unavailable for a pair. Bridge documents spanning multiple clusters are detected via dual-condition verification. High-connectivity documents are classified as Knowledge Centers (attractor score ≥ 0.70) or Rising Attractors (≥ 0.50). Verified: 24 edges, 5/5 signals active.

### CASCADE — Butterfly Effect Prediction

When a document changes, VELA predicts which other documents may be affected. **Bidirectional BFS** traversal of the knowledge graph with adaptive exponential decay — structural links decay at 0.88, temporal co-occurrence at 0.82, behavioral signals at 0.75. Forward cascade answers "what breaks if I change this?" Reverse cascade answers "what does this document depend on?" **Bootstrap confidence intervals** (N=50, ±12% edge weight variance) quantify prediction uncertainty — each impact shows a score range rather than a point estimate. Minimum impact threshold 0.30, maximum depth 3. Fully interactive at `/cascade` — select any document, run prediction, view forward and reverse impact trees with CI ranges.

### Fractal Wisdom — Multi-Scale Pattern Recognition

Cross-document pattern recognition at micro, meso, and macro scales. Extracts transferable insights across documents — identifying recurring approaches, common structures, and cross-project patterns. **Cross-vertical pattern transfer scoring** computes cosine similarity between pattern embeddings from different document corpora, establishing a baseline that activates when a second vertical is added. Renders as SOUNDINGS wisdom cards on the `/wisdom` page.

### LIGHTHOUSE — AI-Powered Q&A

Ask natural language questions and get intelligent answers from your knowledge base. Two modes: **Smart Search** (AI automatically finds relevant documents) and **Manual Selection** (you choose specific documents). Every answer includes source citations. Powered by `claude-sonnet-4-20250514` with streaming responses. Access event logging is fire-and-forget — never blocks the streaming response.

### COMPASS — Full-Text Search

Lightning-fast search across all documents using Convex's search indexes. Real-time results via WebSocket as documents are added or modified.

### PORT — Document Upload

Drag-and-drop file upload supporting PDF, TXT, and Markdown. Automatic full-text indexing, server-side PDF text extraction, duplicate detection via SHA-256 content hashing, and real-time synchronization. On upload, LAMINAR automatically re-clusters via reactive pipeline — no manual trigger needed. **Incremental clustering** detects whether centroid drift exceeds 0.05 before deciding between a fast membership assignment or full K-Means recompute. Document limits enforced at the Convex mutation layer by subscription tier.

### Stripe Billing — Three-Tier Subscriptions

Recurring subscription billing via Stripe Checkout. Tier enforcement is applied at the Convex query layer via `tierGuard.ts` — not just the UI. Free users see real computed LAMINAR cluster names behind a cosmetic blur. Upgrades unlock immediately via webhook — no page reload required. Subscription cancellations downgrade in real time via `customer.subscription.deleted`.

### Authentication and Real-Time Sync

Multi-provider sign-in (Google, GitHub, Email) via Clerk with JWT integration into Convex for per-user data isolation. Protected routes enforced by middleware. Every query, mutation, and subscription is real-time via WebSocket — never polling.

---

## LAMINAR Algorithm

**LAMINAR** (Latent Association Mapping via Intelligent Natural-language Analysis and Retrieval) applies chaos theory principles to knowledge management. Documents self-organize without folders, tags, or manual categorization.

### Pipeline

```
Documents
    |
    v
Stage 1: ARCHIPELAGOS  — TF-IDF vectorization + BIC K selection + K-Means++ + softmax confidence + stability scoring
    |
    v
Stage 2: CURRENTS      — FFT periodicity detection + exponential decay probability curves + Hurst exponent + cross-user co-occurrence
    |
    v
Stage 3: CHARTS        — 5-signal edge fusion (TF-IDF + embedding + temporal + behavioral + structural) + bridge detection + attractor classification
    |
    v
Stage 4: CASCADE       — Bidirectional BFS with adaptive decay + bootstrap confidence intervals
    |
    v
Stage 5: Fractal Wisdom — Hurst attractor identification + cross-vertical pattern transfer scoring + SOUNDINGS wisdom cards
```

Document uploads auto-trigger the pipeline via `ctx.scheduler.runAfter(0, ...)` — reactive, non-blocking. Scheduled actions receive `userId` as an explicit argument; auth context is never assumed in the scheduler chain.

### Stage Status

| Stage | Name | Description | Verified Metrics |
|---|---|---|---|
| 1 | ARCHIPELAGOS | TF-IDF + BIC K selection + K-Means++ + stability confidence | 19 docs, 240ms, BIC K=2 |
| 2 | CURRENTS | FFT periodicity + probability curves + Hurst exponent + cross-user co-occurrence | temporalPatterns + cooccurrences deployed |
| 3 | CHARTS | 5-signal edge fusion, bridges, attractors | 24 edges, 5/5 signals, semantic via Claude API |
| 4 | CASCADE | Bidirectional BFS + adaptive decay + bootstrap CI | cascadeRuns + cascadeImpacts verified, /cascade page live |
| 5 | Fractal Wisdom | Hurst attractor classification + cross-vertical transfer | Wisdom cards + transfer scoring deployed |

### Knowledge Graph Signal Weights

| Signal | Weight | Source |
|---|---|---|
| Semantic Similarity | 0.25 | Claude API embeddings — catches meaning TF-IDF misses |
| Behavioral Co-occurrence | 0.25 | Session-based co-access + cross-user signal (0.6/0.4 blend) |
| Content Similarity | 0.20 | TF-IDF cosine similarity |
| Temporal Proximity | 0.20 | Time-decay weighted co-access recency |
| Structural Links | 0.10 | Shared tags + cluster membership |

When semantic similarity is unavailable for a pair (content similarity below 0.1 threshold), weights renormalize dynamically across the remaining 4 signals.

### Cascade Decay Rates

Adaptive decay replaces the previous uniform 0.8 factor:

| Dominant Signal | Decay Rate | Rationale |
|---|---|---|
| Structural link > 0.5 | 0.88 | Explicit references stay relevant longer |
| Temporal proximity > 0.5 | 0.82 | Co-access recency fades at medium rate |
| Behavioral co-access > 0.5 | 0.75 | Behavioral patterns fade faster |
| Default | 0.80 | Original behavior preserved |

### Architecture

Every stage is pure TypeScript in the Convex runtime — no Python, no sklearn, no external ML dependencies. All LAMINAR files live in `convex/laminar/` and follow a strict boundary system:

- **SoC boundary:** 7 pure computation files have zero Convex imports
- **Bounded context:** All document reads route through `internal.documents.getForLaminar` — never direct `ctx.db.query("documents")`
- **Reactive trigger:** Document uploads auto-enqueue LAMINAR via `ctx.scheduler.runAfter(0, ...)`
- **Scheduled auth pattern:** Public actions split into `run` (auth-gated) and `internalRun` (accepts `userId` as arg, safe for scheduler). Scheduled functions never call `ctx.auth.getUserIdentity()`.
- **Non-blocking signals:** Access event logging never blocks AI streaming responses
- **Composable pipeline:** `LaminarStage` interface + `runPipeline` orchestrator in `pipeline.ts`
- **Tier gating:** `convex/lib/tierGuard.ts` enforces feature access per subscription tier at the query layer

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript strict | App Router, Server + Client Components |
| UI | Shadcn UI, Tailwind CSS 4, Lucide Icons | Accessible components, VELA brand palette |
| Database | Convex | Real-time BaaS — queries, mutations, actions, file storage, search, WebSocket |
| Auth | Clerk | JWT + Convex integration, multi-provider (Google, GitHub, Email) |
| AI | claude-sonnet-4-20250514 (Anthropic) | RAG-based Q&A, 200K token context, streaming, citations, semantic graph embeddings |
| LAMINAR | Pure TypeScript (14 files) | TF-IDF, BIC K selection, K-Means++, softmax, FFT, Hurst exponent, BFS graph traversal — zero ML deps |
| Billing | Stripe | Recurring subscriptions, Checkout, webhooks, tier enforcement |
| Hosting | Vercel + Convex Cloud | Edge functions, global CDN, managed backend |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [Anthropic](https://anthropic.com), [Stripe](https://stripe.com)
- Stripe CLI for local webhook testing: `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli && scoop install stripe`

### Installation

```bash
git clone https://github.com/WilliamH317/VELA.git
cd VELA
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://[your-deployment].convex.cloud
CONVEX_DEPLOYMENT=prod:[your-deployment-name]

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://[your-app].clerk.accounts.dev

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_INDIVIDUAL=price_...
STRIPE_PRICE_TEAM=price_...
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...
```

### Running Locally

Three terminals required when testing billing:

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev

# Terminal 3: Stripe webhook forwarding (billing only)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Open [http://localhost:3000](http://localhost:3000).

Use Stripe test card `4242 4242 4242 4242` with any future expiry and any CVC for checkout testing.

> **Note:** If Next.js shifts to port 3001 because 3000 is occupied, restart the Stripe listener with `--forward-to localhost:3001/api/stripe/webhook`. Port mismatch will silently drop all webhook events.

---

## Project Structure

```
vela/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx    public
│   │   │   └── sign-up/[[...sign-up]]/page.tsx    public
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                          navigation + footer
│   │   │   ├── dashboard/page.tsx                  HELM — tier-aware dashboard
│   │   │   ├── documents/page.tsx                  document list
│   │   │   ├── documents/[id]/page.tsx             document detail + CURRENTS panel
│   │   │   ├── documents/new/page.tsx              PORT — file upload
│   │   │   ├── search/page.tsx                     COMPASS + LIGHTHOUSE
│   │   │   ├── archipelagos/page.tsx               LAMINAR Stage 1 — cluster view + stability scores
│   │   │   ├── connections/page.tsx                LAMINAR Stage 3 — knowledge graph
│   │   │   ├── cascade/page.tsx                    LAMINAR Stage 4 — butterfly effect + bidirectional impact
│   │   │   ├── wisdom/page.tsx                     LAMINAR Stage 5 — fractal wisdom + SOUNDINGS
│   │   │   └── upgrade/page.tsx                    pricing + Stripe checkout
│   │   ├── (marketing)/page.tsx                    public landing page
│   │   ├── api/
│   │   │   └── stripe/
│   │   │       ├── checkout/route.ts               Stripe Checkout session handler
│   │   │       └── webhook/route.ts                Stripe webhook — tier updates
│   │   ├── layout.tsx                              root layout
│   │   └── globals.css                             VELA brand CSS variables
│   │
│   └── components/
│       ├── ui/                                     Shadcn components (Radix primitives)
│       ├── user-setup.tsx                          auto user creation on sign-in
│       ├── document-card.tsx                       document list item
│       ├── search-box.tsx                          search input
│       ├── cascade-preview.tsx                     inline cascade warning on document edit
│       ├── loading-wave.tsx                        reusable wave loading component
│       ├── laminar-summary-widget.tsx              LAMINAR summary card for paid HELM
│       └── laminar-preview.tsx                     frosted-glass teaser for free tier
│
├── convex/
│   ├── schema.ts                               all tables + indexes
│   ├── documents.ts                            PORT: upload, list, search, CRUD + limit enforcement
│   │                                           + getForLaminar bridge (Knowledge Domain boundary)
│   ├── ai.ts                                   LIGHTHOUSE: Claude API (two modes, non-blocking)
│   ├── users.ts                                user management + getSubscriptionTier fallback
│   ├── subscriptions.ts                        getUserTier, updateUserTier, createCheckoutSession
│   ├── queries.ts                              AI query logging + LAMINAR tier-gated queries
│   ├── auth.config.ts                          Clerk JWT config
│   └── laminar/
│       ├── tfidf.ts          Pure TS — TF-IDF vectorization + vertical-weighted IDF
│       ├── kmeans.ts         Pure TS — K-Means++ + BIC optimal K selection + silhouette
│       ├── confidence.ts     Pure TS — probabilistic membership (softmax) + stability confidence mapping
│       ├── temporal.ts       Pure TS — FFT periodicity + exponential decay probability curves + Hurst exponent
│       ├── cooccurrence.ts   Pure TS — per-user co-occurrence + cross-user multi-session signals
│       ├── pipeline.ts       Pure TS — LaminarStage interface + runPipeline orchestrator
│       ├── processors.ts     Pure TS — IProcessable: MarkdownProcessor, PdfProcessor, PlaintextProcessor
│       ├── engine.ts         Convex — Stage 1 orchestration, run/internalRun split, incremental drift guard
│       ├── graph.ts          Convex — 5-signal edge fusion, Claude API embeddings, bridge detection
│       ├── runner.ts         Convex — reactive pipeline entry point
│       ├── cascade.ts        Convex — Stage 4 bidirectional BFS + adaptive decay + bootstrap CI
│       ├── fractal.ts        Convex — Stage 5 Hurst analysis + cross-vertical transfer scoring
│       └── temporalRunner.ts Convex — CURRENTS pipeline orchestration
│
├── convex/lib/
│   └── tierGuard.ts          Pure TS — canAccessLaminarLayer(), getLaminarPreviewMode()
│
├── CLAUDE.md                                   AI coding agent rules + anti-patterns
├── .claude/vela-context.md                     current sprint state + session context
├── middleware.ts                               Clerk route protection
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Database Schema

12 Convex tables across core features, LAMINAR stages, and billing. All field names below are verified against the deployed schema.

| Group | Table | Key Fields |
|---|---|---|
| Core | `users` | `clerkId`, `email`, `name`, `subscription` (`free`/`pro`/`enterprise`), `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd` |
| | `documents` | `userId`, `contentPlain`, `status`, `type` |
| | `queries` | AI query logging for analytics |
| LAMINAR Stage 1 | `clusteringRuns` | `userId`, `status`, `startedAt`, `silhouetteScore` |
| | `clusters` | `userId`, `runId`, `name`, `topKeywords`, `centroid`, `stabilityConfidence` |
| | `clusterMemberships` | `documentId`, `clusterId`, `probability`, `isPrimary`, `isAmbiguous` |
| LAMINAR Stage 2 | `accessEvents` | `documentId`, `userId`, `action`, `timestamp` |
| | `temporalPatterns` | `userId`, `documentId`, `accessRate`, `rateOfChange`, `trend`, `accessProbabilityCurve`, `hurstExponent` |
| | `cooccurrences` | `userId`, `documentA`, `documentB`, `count`, `strength`, `multiUserStrength` |
| LAMINAR Stage 3–4 | `knowledgeEdges` | `userId`, `sourceDocId`, `targetDocId`, `weight`, `signals` (5-signal including `embeddingSimilarity`), `isBridge` |
| | `cascadeRuns` | `userId`, `sourceDocId`, `impactedCount`, `decay`, `threshold` |
| | `cascadeImpacts` | `runId`, `documentId`, `impactScore`, `depth`, `direction`, `confidenceLow`, `confidenceHigh`, `path` |

**Tier mapping:** The `subscription` field uses internal values `"free"`, `"pro"`, `"enterprise"` which map to the marketing names Free, Individual ($15/mo), and Team ($25/user/mo) respectively.

**Known field name corrections (Day 18 drift, now resolved):** `probability` (not `membershipScore`), `name` (not `label`), `topKeywords` (not `topTerms`), `startedAt` (not `createdAt`), `knowledgeEdges` (not `edges`). The canonical truth is always the deployed `convex/schema.ts` — never documentation.

---

## Brand Identity

### Colors

| Color | Hex | Usage |
|---|---|---|
| Deep Ocean Navy | `#1B3D5C` | Primary backgrounds, headings, body text |
| Bright Teal | `#00BCD4` | Accents, interactive elements, CTAs, links |
| LAMINAR Gradient | Navy → Teal | Progress bars, LAMINAR branding, premium features |
| Coral Accent | `#FF6B6B` | Error states and urgent alerts only |
| Sunset Gold | `#F4B860` | Premium features and achievements only |

**Never use:** Generic blue (`#0000FF`, Tailwind `blue-*`), generic cyan (`cyan-*`), circular spinners (`animate-spin`).

### Nautical Metaphor System

| Feature | Nautical Name | Meaning |
|---|---|---|
| Document Upload | PORT | Cargo arrives at port |
| Full-Text Search | COMPASS | Navigation tool |
| AI Answers | LIGHTHOUSE | Guiding beacon |
| Document Clusters | ARCHIPELAGOS | Self-organizing knowledge islands |
| Temporal Patterns | CURRENTS | Ocean flows connecting islands |
| Knowledge Graph | CHARTS | Mapped navigable connections |
| Butterfly Effect | CASCADE | Ripple propagation through channels |
| Fractal Wisdom | DEPTHS | Deep-sea patterns invisible from surface |
| Wisdom Cards | SOUNDINGS | Depth measurements surfaced from DEPTHS |
| Dashboard | HELM | Ship's control center |
| Onboarding | MAIDEN VOYAGE | First journey |
| Loading State | NAVIGATING | Wave/pulse animation — never spinner |
| Empty State | STILL WATERS | "Ready for your first voyage" |
| Error State | STORMY SEAS | "Trying again..." |
| Doc limit hit | CARGO HOLD FULL | "Upgrade to carry more knowledge" |

### Design Principles

- Wave/pulse animations for all loading states — never circular spinners (`animate-spin`)
- Nautical copy throughout — no "workflow," "optimize," "efficiency," "synergy"
- Time-focused messaging — seconds saved, not features listed
- Mobile-first responsive design across all features
- Free-tier LAMINAR previews use real computed data with cosmetic blur — never placeholder text

---

## Pricing

| Tier | Price | Documents | Queries | LAMINAR Access | Internal Value |
|---|---|---|---|---|---|
| Free | $0/month | 10 | 20/month | Blurred preview (real data) | `"free"` |
| Individual | $15/month | 100 | Unlimited | ARCHIPELAGOS + CURRENTS full | `"pro"` |
| Team | $25/user/month | Unlimited | Unlimited | All 5 stages full access | `"enterprise"` |

Tier enforcement is applied at the Convex query layer via `tierGuard.ts` — not just the UI. Free users see real cluster names behind a cosmetic blur to demonstrate LAMINAR is actively working on their documents. Upgrades and downgrades take effect in real time via Stripe webhooks.

---

## Sprint Progress

```
Phase 1: FOUNDATION (Days 1-5)         100% COMPLETE
Phase 2: INFRASTRUCTURE (Days 6-8)     100% COMPLETE
Phase 3: CORE FEATURES (Days 9-15)     100% COMPLETE
Phase 4: DIFFERENTIATION (Days 16-20)  100% COMPLETE
Phase 5: POLISH & BILLING (Days 21-25) 100% COMPLETE
Phase 6: LAUNCH (Days 26-30)            IN PROGRESS  <- NOW
```

**Day 26 of 30 — 87% Complete**

### Complete

- [x] JavaScript async/await fundamentals (Days 1–5)
- [x] Next.js 16 + React 19 + TypeScript infrastructure (Day 6)
- [x] Convex real-time database + Clerk authentication (Days 7–8)
- [x] PORT — document upload with PDF extraction (Days 9–10)
- [x] COMPASS — full-text search with real-time results (Days 11–12)
- [x] LIGHTHOUSE — AI Q&A with streaming + citations, dual-mode (Days 13–15)
- [x] LAMINAR Stage 1 — ARCHIPELAGOS clustering (Day 16)
- [x] LAMINAR Stage 2 — CURRENTS temporal patterns + co-occurrence (Day 17)
- [x] LAMINAR Stage 3 — CHARTS knowledge graph, 24 edges (Day 18)
- [x] LAMINAR Stage 4 — CASCADE butterfly effect prediction (Day 19)
- [x] LAMINAR Stage 5 — Fractal Wisdom multi-scale patterns (Day 20)
- [x] SC2 Architecture Refactor — reactive pipeline, bounded context, composable stages (Day 20)
- [x] HELM dashboard redesign — tier-aware LAMINAR integration, LoadingWave, LaminarSummaryWidget (Day 21)
- [x] WCAG 2.1 AA accessibility + Lighthouse 90+ performance (Day 22)
- [x] Stripe billing — 3-tier checkout, webhooks, real-time tier enforcement, document limits (Day 23)
- [x] MAIDEN VOYAGE onboarding flow + sample agency documents (Day 24)
- [x] Error boundaries + rate limiting + regression test (Day 25)
- [x] LAMINAR algorithm improvements — BIC K selection, FFT periodicity, Hurst exponent, 5-signal graph, bidirectional CASCADE, bootstrap CI, cross-vertical transfer scoring (post-Day 25)
- [x] Reactive pipeline auth fix — run/internalRun split pattern across engine.ts and cascade.ts
- [x] CASCADE page — /cascade with document selector, bidirectional impact tree, CI ranges

### Active (Phase 6)

- [ ] Help center and documentation (Day 26)
- [ ] High-converting landing page + demo video (Day 27)
- [ ] Beta testing with 5–8 agency founders (Day 28)
- [ ] Critical bug fixes + launch assets (Day 29)
- [ ] Product Hunt + LinkedIn agency outreach (Day 30)

---

## Performance

| Metric | Value |
|---|---|
| LIGHTHOUSE response | 7–9 seconds |
| COMPASS search | < 100ms |
| Document upload | 1–3 seconds |
| LAMINAR clustering (19 docs) | 240ms |
| LAMINAR clustering (7 docs, original baseline) | 202ms |
| Knowledge graph build | < 500ms |
| CASCADE prediction | < 200ms |
| Page load (first visit) | 1–2 seconds |
| Page load (cached) | < 500ms |
| Stripe webhook → tier update | < 2 seconds |

---

## Known Limitations

- **PDF extraction:** Status under verification — `pdf-parse` had module resolution issues in the Convex runtime during Phase 3; may have been resolved. Text and Markdown files work fully.
- **No pagination:** Document list returns all documents. Needs pagination for 100+ docs (Month 2 roadmap).
- **No automated test framework:** Validation is manual integration testing — no Jest or Vitest configured.
- **LAMINAR cold-start:** With fewer than 3 documents, clustering is skipped. With fewer than 10 documents and no usage history, behavioral and temporal signals are near-zero. Content similarity dominates appropriately at cold-start. Hurst exponent requires ≥ 20 access events for a reliable estimate.
- **O(n²) graph scaling:** Knowledge graph edge computation is quadratic. Guarded at 200 documents; above that, partitions by cluster. Semantic embedding via Claude API is batched (10 pairs/call) and skipped for pairs with zero TF-IDF overlap.
- **processors.ts not yet active in hot path:** `IProcessable` and `buildTFIDFFromSignals` are deployed infrastructure but `runner.ts` still uses the original `contentPlain` path. Activation deferred to Month 2 after usage data validates the improvement.
- **No Customer Portal:** Subscription self-service requires contacting support until the Stripe Customer Portal route is wired up.
- **Cross-vertical transfer scoring:** `computeCrossVerticalTransferScore` is deployed and functional, but returns trivially high scores in single-vertical mode (all documents tagged `"agency"`). Full cross-vertical intelligence activates when a second vertical (Customer Support) is onboarded.
- **Silhouette scores decline with corpus growth:** As the document corpus grows beyond 10–15 documents, silhouette scores will be lower than the original 0.1531 baseline. This is correct — more documents with diverse content produce harder-to-separate clusters. The stability confidence label system communicates this honestly to users.

---

## Architecture Notes

### Scheduled Action Auth Pattern

All Convex actions called via `ctx.scheduler.runAfter()` must receive `userId` as an explicit argument. Scheduled functions run without an authenticated session — `ctx.auth.getUserIdentity()` returns null. The pattern:

```typescript
// Public action (auth-gated, user-facing)
export const run = action({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return ctx.runAction(internal.laminar.engine.internalRun, {
      ...args,
      userId: identity.subject,
    });
  },
});

// Internal action (no auth check — userId passed explicitly)
export const internalRun = internalAction({
  args: { userId: v.string(), ...otherArgs },
  handler: async (ctx, { userId, ...args }) => {
    // Use userId directly — never ctx.auth.getUserIdentity()
  },
});
```

This pattern is applied to `engine.ts` and `cascade.ts`. Any future scheduled LAMINAR action must follow it.

### Schema Drift Prevention

Field names in documentation have historically diverged from deployed schema. The canonical truth is always the deployed `convex/schema.ts`. Before writing any Convex integration code:

```powershell
# Read deployed schema
Get-Content convex/schema.ts

# Verify LAMINAR SoC boundary — must return zero matches
Select-String -Pattern "import.*convex|import.*_generated" `
  -Path convex/laminar/tfidf.ts, convex/laminar/kmeans.ts, `
         convex/laminar/confidence.ts, convex/laminar/pipeline.ts, `
         convex/laminar/processors.ts, convex/laminar/temporal.ts, `
         convex/laminar/cooccurrence.ts

# Verify bounded context — must return zero matches
Select-String -Pattern 'query\("documents"\)|query\("users"\)' `
  -Path convex/laminar/*.ts
```

---

## About VELA

**Mission:** Give knowledge workers their time back by instantly connecting them with answers, wherever those answers live.

**Beachhead Market:** Freelance agencies (5–25 person service firms — marketing agencies, design studios, IT consultancies) with business budgets, measurable ROI from billable hours recovered, and individual decision makers who adopt without procurement.

**Expansion Path:** Freelance Agencies (M0–6) → Customer Support (M3–9) → Sales (M9–15) → Legal/Medical (M15+). 90% code reuse — only onboarding language, example templates, and integration connectors are customized per vertical.

---

**William Horton** — Solo Founder and Developer

---

**Last Updated:** March 2026 (Day 26)
**Status:** Active Development — 87% Complete — Phase 6 in progress
**Next Milestone:** Help center + documentation (Day 26)
**Launch Countdown:** 4 days