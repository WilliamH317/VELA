# VELA — Navigate Your Knowledge

**AI-Powered Knowledge Management Platform**
*Transform scattered information into instant answers using chaos theory and AI*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat-square)](https://convex.dev/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-blue?style=flat-square)](https://anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Sprint-Day%2021%2F30-success?style=flat-square)](https://github.com/WilliamH317/VELA)

---

## What is VELA?

VELA is an AI-powered knowledge management platform that helps knowledge workers find answers in **seconds instead of hours**. Upload your documents, ask natural language questions, and get cited answers — while a chaos theory algorithm quietly organizes everything behind the scenes.

No folders. No tags. No manual categorization. Documents organize themselves.

**Stop searching. Start navigating.** ⚓

---

## Features

### ARCHIPELAGOS — Self-Organizing Knowledge Clusters

Documents organize themselves into topic clusters powered by **LAMINAR**, VELA's chaos theory algorithm. Upload 3+ documents and VELA discovers groups automatically — no folders needed. Each document gets a probability distribution across all clusters (72% to cluster A, 18% to cluster B), not a binary assignment. Documents near cluster boundaries are flagged as bridges connecting knowledge islands.

Built entirely in pure TypeScript — TF-IDF vectorization, K-Means++ clustering, softmax confidence scoring. Zero external ML dependencies. First production run: 7 documents clustered in 202ms, silhouette 0.1531.

### CURRENTS — Temporal Pattern Detection

VELA silently tracks how you interact with documents — which ones you view, search for, and ask AI about — then models access trajectories. Documents are classified as rising, stable, declining, or periodic based on access patterns. Co-occurrence tracking links documents accessed within the same session, building a behavioral signal that strengthens over time.

### CHARTS — Knowledge Graph

A weighted knowledge graph connecting documents through 4 signal types: content similarity (TF-IDF cosine, weight 0.60), structural links (0.20), temporal proximity (0.10), and behavioral co-occurrence (0.10). Bridge documents spanning multiple clusters are detected via dual-condition verification. High-connectivity documents are classified as Knowledge Centers (attractor score >= 0.70) or Rising Attractors (>= 0.50). Verified: 21 edges, 4/4 signals active, 11/11 tests pass.

### CASCADE — Butterfly Effect Prediction

When a document changes, VELA predicts which other documents may be affected. BFS traversal of the knowledge graph with exponential decay: `impact = current_impact x edge_weight x 0.8^depth`. Minimum threshold 0.30, maximum depth 3. Impact scores decrease monotonically; cycles are prevented by a visited set. Inline cascade preview warns when editing a highly-connected document.

### Fractal Wisdom — Multi-Scale Pattern Recognition

Cross-document pattern recognition at micro, meso, and macro scales. Extracts transferable insights across documents — identifying recurring approaches, common structures, and cross-project patterns. Renders as wisdom cards on the /wisdom page.

### LIGHTHOUSE — AI-Powered Q&A

Ask natural language questions and get intelligent answers from your knowledge base. Two modes: **Smart Search** (AI automatically finds relevant documents) and **Manual Selection** (you choose specific documents). Every answer includes source citations. Powered by claude-sonnet-4-20250514 with streaming responses. Access event logging is fire-and-forget — never blocks the streaming response.

### COMPASS — Full-Text Search

Lightning-fast search across all documents using Convex's search indexes. Real-time results via WebSocket as documents are added or modified.

### PORT — Document Upload

Drag-and-drop file upload supporting PDF, TXT, and Markdown. Automatic full-text indexing, server-side PDF text extraction, duplicate detection via SHA-256 content hashing, and real-time synchronization. On upload, LAMINAR automatically re-clusters if 3+ documents exist — no manual trigger needed.

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
Stage 1: ARCHIPELAGOS  -- TF-IDF vectorization + K-Means++ clustering + softmax confidence
    |
    v
Stage 2: CURRENTS      -- Temporal trajectory estimation + session co-occurrence tracking
    |
    v
Stage 3: CHARTS        -- 4-signal edge fusion + bridge detection + attractor classification
    |
    v
Stage 4: CASCADE       -- BFS butterfly effect prediction with exponential decay
    |
    v
Stage 5: Fractal Wisdom -- Multi-scale cross-document pattern recognition
```

Document uploads auto-trigger the pipeline via `ctx.scheduler.runAfter(0, ...)` — reactive,
non-blocking.

### Stage Status

| Stage | Name | Description | Verified Metrics |
|---|---|---|---|
| 1 | ARCHIPELAGOS | TF-IDF + K-Means++ with probabilistic confidence | 7 docs, 202ms, silhouette 0.1531 |
| 2 | CURRENTS | Temporal access patterns + co-occurrence | cooccurrences + temporalPatterns deployed |
| 3 | CHARTS | 4-signal edge fusion, bridges, attractors | 21 edges, 4/4 signals, 11/11 tests |
| 4 | CASCADE | BFS cascade prediction, decay=0.8 | cascadeRuns + cascadeImpacts verified |
| 5 | Fractal Wisdom | Multi-scale pattern recognition | Wisdom cards rendering |

### Knowledge Graph Signal Weights

| Signal | Cold-Start Weight | Source |
|---|---|---|
| Content Similarity | 0.60 | TF-IDF cosine similarity |
| Structural Links | 0.20 | Shared tags + cluster membership |
| Temporal Proximity | 0.10 | `0.7 x exp(-timeDiffHours / 8)` |
| Behavioral Co-occurrence | 0.10 | Session-based co-access counts |

### Architecture

Every stage is pure TypeScript in the Convex runtime — no Python, no sklearn, no external ML dependencies. All LAMINAR files live in `convex/laminar/` and follow a strict boundary system (SC2 Architecture Refactor, Day 20):

- **SoC boundary:** 7 pure computation files have zero Convex imports
- **Bounded context:** All document reads route through `internal.documents.getForLaminar` — never direct `ctx.db.query("documents")`
- **Reactive trigger:** Document uploads auto-enqueue LAMINAR via `ctx.scheduler.runAfter(0, ...)`
- **Non-blocking signals:** Access event logging never blocks AI streaming responses
- **Composable pipeline:** `LaminarStage` interface + `runPipeline` orchestrator in `pipeline.ts`

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript strict | App Router, Server + Client Components |
| UI | Shadcn UI, Tailwind CSS 4, Lucide Icons | Accessible components, VELA brand palette |
| Database | Convex | Real-time BaaS — queries, mutations, actions, file storage, search, WebSocket |
| Auth | Clerk | JWT + Convex integration, multi-provider (Google, GitHub, Email) |
| AI | claude-sonnet-4-20250514 (Anthropic) | RAG-based Q&A, 200K token context, streaming, citations |
| LAMINAR | Pure TypeScript (12 files) | TF-IDF, K-Means++, softmax, BFS graph traversal — zero ML deps |
| Hosting | Vercel + Convex Cloud | Edge functions, global CDN, managed backend |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [Anthropic](https://anthropic.com)
- For billing (Day 23+): [Stripe](https://stripe.com)

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

# Stripe (add when billing is configured)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_INDIVIDUAL=price_...
STRIPE_PRICE_TEAM=price_...
```

### Running Locally

Start Convex first — it generates TypeScript types that Next.js depends on:

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
vela/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx    public
│   │   └── sign-up/[[...sign-up]]/page.tsx    public
│   ├── (dashboard)/
│   │   ├── layout.tsx                          navigation + footer
│   │   ├── dashboard/page.tsx                  HELM — main dashboard
│   │   ├── documents/page.tsx                  document list
│   │   ├── documents/[id]/page.tsx             document detail + CURRENTS panel
│   │   ├── documents/new/page.tsx              PORT — file upload
│   │   ├── search/page.tsx                     COMPASS + LIGHTHOUSE
│   │   ├── archipelagos/page.tsx               LAMINAR Stage 1 — cluster view
│   │   ├── connections/page.tsx                LAMINAR Stage 3 — knowledge graph
│   │   ├── cascade/page.tsx                    LAMINAR Stage 4 — butterfly effect
│   │   └── wisdom/page.tsx                     LAMINAR Stage 5 — fractal wisdom
│   ├── (marketing)/page.tsx                    public landing page
│   ├── api/
│   │   ├── stripe/checkout/route.ts            Stripe checkout session (Day 23)
│   │   └── webhooks/stripe/route.ts            Stripe webhook handler (Day 23)
│   ├── layout.tsx                              root layout
│   └── globals.css                             VELA brand CSS variables
│
├── components/
│   ├── ui/                                     Shadcn components (Radix primitives)
│   ├── user-setup.tsx                          auto user creation on sign-in
│   ├── document-card.tsx                       document list item
│   ├── search-box.tsx                          search input
│   ├── cascade-preview.tsx                     inline cascade warning on document edit
│   ├── loading-wave.tsx                        reusable wave loading component
│   └── laminar-summary-widget.tsx              LAMINAR preview card for HELM
│
├── convex/
│   ├── schema.ts                               all tables + indexes
│   ├── documents.ts                            PORT: upload, list, search, CRUD
│   │                                           + getForLaminar bridge (Knowledge Domain boundary)
│   ├── ai.ts                                   LIGHTHOUSE: Claude API (two modes, non-blocking)
│   ├── users.ts                                user management + onboarding + billing fields
│   ├── queries.ts                              AI query logging + analytics
│   ├── auth.config.ts                          Clerk JWT config
│   └── laminar/
│       ├── tfidf.ts          Pure TS -- TF-IDF vectorization (+ buildTFIDFFromSignals)
│       ├── kmeans.ts         Pure TS -- K-Means++ clustering + silhouette
│       ├── confidence.ts     Pure TS -- probabilistic membership (softmax)
│       ├── temporal.ts       Pure TS -- access trajectory estimation
│       ├── cooccurrence.ts   Pure TS -- co-occurrence matrix builder
│       ├── pipeline.ts       Pure TS -- LaminarStage interface + runPipeline orchestrator
│       ├── processors.ts     Pure TS -- IProcessable: MarkdownProcessor, PdfProcessor, PlaintextProcessor
│       ├── engine.ts         Convex -- Stage 1 pipeline orchestration
│       ├── graph.ts          Convex -- knowledge graph edge fusion
│       ├── runner.ts         Convex -- reactive pipeline entry point
│       ├── cascade.ts        Convex -- Stage 4 BFS butterfly effect
│       └── fractal.ts        Convex -- Stage 5 multi-scale patterns
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

11 Convex tables across core features and LAMINAR stages. All field names below are verified against the deployed schema.

| Group | Table | Key Fields |
|---|---|---|
| Core | `users` | `clerkId`, `email`, `subscriptionTier`, `onboardingComplete` |
| | `documents` | `userId`, `contentPlain`, `status`, `type` |
| | `queries` | AI query logging for analytics |
| LAMINAR Stage 1 | `clusteringRuns` | `userId`, `status`, `startedAt`, `silhouetteScore` |
| | `clusters` | `userId`, `runId`, `name`, `topKeywords`, `centroid` |
| | `clusterMemberships` | `documentId`, `clusterId`, `probability`, `isPrimary`, `isAmbiguous` |
| LAMINAR Stage 2 | `accessEvents` | `documentId`, `userId`, `action`, `timestamp` |
| | `temporalPatterns` | `userId`, `documentId`, `accessRate`, `rateOfChange`, `trend` |
| | `cooccurrences` | `userId`, `documentA`, `documentB`, `count`, `strength` |
| LAMINAR Stage 3-4 | `knowledgeEdges` | `userId`, `sourceDocId`, `targetDocId`, `weight`, `signals`, `isBridge` |
| | `cascadeRuns` | `userId`, `sourceDocId`, `impactedCount`, `decay`, `threshold` |
| | `cascadeImpacts` | `runId`, `documentId`, `impactScore`, `depth`, `path` |

**Schema note:** Field names diverged from documentation during Day 18 development. The canonical truth is always the deployed `convex/schema.ts`. Key corrections: `probability` (not `membershipScore`), `name` (not `label`), `topKeywords` (not `topTerms`), `startedAt` (not `createdAt`), `knowledgeEdges` (not `edges`).

---

## Brand Identity

### Colors

| Color | Hex | Usage |
|---|---|---|
| Deep Ocean Navy | `#1B3D5C` | Primary backgrounds, headings, body text |
| Bright Teal | `#00BCD4` | Accents, interactive elements, CTAs, links |
| LAMINAR Gradient | Navy to Teal | Progress bars, LAMINAR branding, premium features |
| Coral Accent | `#FF6B6B` | Error states and urgent alerts only |
| Sunset Gold | `#F4B860` | Premium features and achievements only |

**Never use:** Generic blue (`#0000FF`, Tailwind `blue-*`), generic cyan (`cyan-*`), circular spinners (`animate-spin`).

### Nautical Metaphor System

| Feature | Nautical Name | Meaning |
|---|---|---|
| Document Upload | PORT | Cargo arrives at port |
| Full-Text Search | COMPASS | Navigation tool |
| AI Answers | LIGHTHOUSE | Guiding beacon |
| Document Clusters | ARCHIPELAGOS | Knowledge islands |
| Temporal Patterns | CURRENTS | Ocean flows |
| Knowledge Graph | CHARTS | Mapping connections |
| Butterfly Effect | CASCADE | Ripple effect |
| Dashboard | HELM | Ship's control center |
| Onboarding | MAIDEN VOYAGE | First journey |
| Loading State | NAVIGATING | Wave/pulse animation |
| Empty State | STILL WATERS | "Ready for your first voyage" |
| Error State | STORMY SEAS | "Trying again..." |

### Design Principles

- Wave/pulse animations for all loading states — never circular spinners
- Nautical copy throughout — no "workflow," "optimize," "efficiency," "synergy"
- Time-focused messaging — seconds saved, not features listed
- Mobile-first responsive design across all features

---

## Sprint Progress

```
Phase 1: FOUNDATION (Days 1-5)        100% COMPLETE
Phase 2: INFRASTRUCTURE (Days 6-8)    100% COMPLETE
Phase 3: CORE FEATURES (Days 9-15)    100% COMPLETE
Phase 4: DIFFERENTIATION (Days 16-20) 100% COMPLETE
Phase 5: POLISH & BILLING (Days 21-25)  20% ACTIVE  <- NOW
Phase 6: LAUNCH (Days 26-30)            0%  LOCKED
```

**Day 21 of 30 — 67% Complete**

### Complete

- [x] JavaScript async/await fundamentals (Days 1-5)
- [x] Next.js 16 + React 19 + TypeScript infrastructure (Day 6)
- [x] Convex real-time database + Clerk authentication (Days 7-8)
- [x] PORT — document upload with PDF extraction (Days 9-10)
- [x] COMPASS — full-text search with real-time results (Days 11-12)
- [x] LIGHTHOUSE — AI Q&A with streaming + citations, dual-mode (Days 13-15)
- [x] LAMINAR Stage 1 — ARCHIPELAGOS clustering, 7 docs in 202ms (Day 16)
- [x] LAMINAR Stage 2 — CURRENTS temporal patterns + co-occurrence (Day 17)
- [x] LAMINAR Stage 3 — CHARTS knowledge graph, 21 edges (Day 18)
- [x] LAMINAR Stage 4 — CASCADE butterfly effect prediction (Day 19)
- [x] LAMINAR Stage 5 — Fractal Wisdom multi-scale patterns (Day 20)
- [x] SC2 Architecture Refactor — reactive pipeline, bounded context, composable stages (Day 20)

### Active (Phase 5)

- [ ] HELM dashboard redesign with LAMINAR integration (Day 21)
- [ ] WCAG 2.1 AA accessibility + Lighthouse 90+ (Day 22)
- [ ] Stripe billing — 3-tier checkout, webhooks, feature gating (Day 23)
- [ ] MAIDEN VOYAGE onboarding flow + sample agency documents (Day 24)
- [ ] Error boundaries + rate limiting + full regression test (Day 25)

### Upcoming (Phase 6)

- [ ] Help center and documentation (Day 26)
- [ ] High-converting landing page + demo video (Day 27)
- [ ] Beta testing with 5-8 agency founders (Day 28)
- [ ] Critical bug fixes + launch assets (Day 29)
- [ ] Product Hunt + LinkedIn agency outreach (Day 30)

---

## Pricing

| Tier | Price | Documents | Queries | LAMINAR |
|---|---|---|---|---|
| Free | $0/month | 10 | 20/month | None |
| Individual | $15/month | 100 | Unlimited | ARCHIPELAGOS (Stage 1) |
| Team | $25/user/month | Unlimited | Unlimited | All 5 stages + team workspace |

Feature gating is enforced at the Convex mutation layer — not just the UI. Stripe billing integration ships Day 23.

---

## Performance

| Metric | Value |
|---|---|
| LIGHTHOUSE response | 7-9 seconds |
| COMPASS search | < 100ms |
| Document upload | 1-3 seconds |
| LAMINAR clustering (7 docs) | 202ms |
| Knowledge graph build (21 edges) | < 500ms |
| Page load (first visit) | 1-2 seconds |
| Page load (cached) | < 500ms |

---

## Known Limitations

- **PDF extraction:** Status under verification — `pdf-parse` had module resolution issues in the Convex runtime during Phase 3; may have been resolved. Text and Markdown files work fully.
- **No pagination:** Document list returns all documents. Needs pagination for 100+ docs (Month 2 roadmap).
- **No test framework:** Validation is manual integration testing — no Jest or Vitest configured.
- **LAMINAR cold-start:** With fewer than 3 documents, clustering is skipped. With fewer than 10 documents and no usage history, behavioral and temporal signals are near-zero. Content similarity (0.60 weight) dominates appropriately at cold-start.
- **O(n^2) graph scaling:** Knowledge graph edge computation is quadratic. Guarded at 200 documents; above that, partitions by cluster.
- **processors.ts not yet active in hot path:** `IProcessable` and `buildTFIDFFromSignals` are deployed infrastructure but `runner.ts` still uses the original `contentPlain` path. Activation deferred to Month 2 after usage data validates the improvement.

---

## About VELA

**Mission:** Give knowledge workers their time back by instantly connecting them with answers, wherever those answers live.

**Beachhead Market:** Freelance agencies (5-25 person service firms — marketing agencies, design studios, IT consultancies) with business budgets, measurable ROI from billable hours recovered, and individual decision makers who adopt without procurement.

**Expansion Path:** Freelance Agencies (M0-6) → Customer Support (M3-9) → Sales (M9-15) → Legal/Medical (M15+). 90% code reuse — only onboarding language, example templates, and integration connectors are customized per vertical.

---

**William Horton** — Solo Founder and Developer

---

**Last Updated:** March 2026 (Day 21)
**Status:** Active Development — 67% Complete — Phase 5 Starting
**Next Milestone:** Stripe billing live (Day 23)
**Launch Countdown:** 9 days