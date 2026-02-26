# 🚢 VELA — Navigate Your Knowledge

**AI-Powered Knowledge Management Platform**
*Transform scattered information into instant answers using chaos theory and AI*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat-square)](https://convex.dev/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-blue?style=flat-square)](https://anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Sprint-Day%2018%2F30-success?style=flat-square)](https://github.com/yourusername/vela)

---

## What is VELA?

VELA is an AI-powered knowledge management platform that helps knowledge workers find answers in **seconds instead of hours**. Upload your documents, ask natural language questions, and get cited answers — while a chaos theory algorithm quietly organizes everything behind the scenes.

No folders. No tags. No manual categorization. Documents organize themselves.

**Stop searching. Start navigating.** ⚓

---

## Features

### ARCHIPELAGOS — Self-Organizing Knowledge Clusters *(Day 16)*

Documents organize themselves into topic clusters powered by **LAMINAR**, VELA's chaos theory algorithm. Upload 3+ documents and VELA discovers groups automatically — no folders needed. Each document gets a probability distribution across all clusters (72% to cluster A, 18% to cluster B), not a binary assignment. Documents near cluster boundaries are flagged as "bridges" connecting knowledge islands.

Built entirely in pure TypeScript — TF-IDF vectorization, K-Means++ clustering, softmax confidence scoring. Zero external ML dependencies. First production run: 7 documents clustered in 202ms.

### CURRENTS — Temporal Pattern Detection *(Day 17)*

VELA silently tracks how you interact with documents — which ones you view, search for, and ask AI about — then models access trajectories. Documents are classified as rising, stable, declining, or periodic based on their access patterns. Co-occurrence tracking links documents accessed within the same session, building a behavioral signal that strengthens over time.

Integrated as a panel in the document detail view showing related documents and access trends.

### CHARTS — Knowledge Graph *(Day 18 — In Progress)*

A weighted knowledge graph connecting documents through 4 signal types: content similarity (TF-IDF cosine), behavioral co-occurrence, temporal proximity, and structural links (shared tags/clusters). Bridge documents spanning multiple clusters are detected using dual-condition verification. High-connectivity documents are classified as Knowledge Centers (attractor score ≥ 0.70) or Rising Attractors (≥ 0.50), with cascade radius pre-computed for Day 19's Butterfly Effect predictions.

### LIGHTHOUSE — AI-Powered Q&A *(Days 13–15)*

Ask natural language questions and get intelligent answers from your knowledge base. Two modes: **Smart Search** (AI automatically finds relevant documents) and **Manual Selection** (you choose specific documents). Every answer includes source citations linking back to the original document. Powered by Claude Sonnet 4 with streaming responses, token usage metrics, and retry logic with exponential backoff.

### COMPASS — Full-Text Search *(Days 11–12)*

Lightning-fast search across all documents using Convex's search indexes. Real-time results with content previews, updated live via WebSocket as documents are added or modified.

### PORT — Document Upload *(Days 9–10)*

Drag-and-drop file upload supporting PDF, TXT, and Markdown. Automatic full-text indexing, server-side PDF text extraction, duplicate detection via SHA-256 content hashing, and real-time synchronization across all devices and tabs.

### Authentication & Real-Time Sync *(Days 7–8)*

Multi-provider sign-in (Google, GitHub, Email) via Clerk with JWT integration into Convex for per-user data isolation. Protected routes enforced by middleware. Every query, mutation, and subscription is real-time via WebSocket — never polling.

---

## LAMINAR Algorithm

**LAMINAR** (Latent Association Mapping via Intelligent Natural-language Analysis and Retrieval) applies chaos theory principles to knowledge management. Documents self-organize without folders, tags, or manual categorization.

### Pipeline

```
Documents → TF-IDF Vectorization → K-Means++ Clustering → Confidence Scoring → ARCHIPELAGOS
     ↓              ↓                                                              ↓
Access Events → Temporal Patterns → Co-Occurrence Matrix → CURRENTS           Knowledge Graph
                                                                               (4-signal edges)
```

### Stages

| Stage | Day | Name | Description | Status |
|-------|-----|------|-------------|--------|
| 1 | 16 | **ARCHIPELAGOS** | TF-IDF + K-Means++ clustering with probabilistic confidence | ✅ Shipped |
| 2 | 17 | **CURRENTS** | Temporal access patterns, trajectory estimation, co-occurrence | ✅ Shipped |
| 3 | 18 | **CHARTS** | Knowledge graph with 4-signal edge fusion, bridges, attractors | 🔧 Building |
| 4 | 19 | **Butterfly Effect** | Cascade prediction — "this change affects these 3 areas" | 📋 Planned |
| 5 | 20 | **Fractal Wisdom** | Multi-scale pattern recognition across document/project/domain | 📋 Planned |

### How It Works

**Stage 1 — Clustering:** TF-IDF converts document text into numerical vectors using sublinear term frequency and smoothed IDF. K-Means++ groups similar documents with smart centroid initialization and silhouette-based K selection. Softmax over negated distances produces a full probability distribution per document — not a binary assignment.

**Stage 2 — Temporal Patterns:** Every document interaction (view, search, AI query) is logged as an access event. Rate-of-change estimation classifies documents as rising, stable, declining, or periodic. Co-occurrence tracks document pairs accessed within the same session, building a behavioral proximity signal.

**Stage 3 — Knowledge Graph:** Four signals are fused into weighted edges between documents:

| Signal | Cold-Start Weight | Source |
|--------|-------------------|--------|
| Content Similarity | 0.60 | TF-IDF cosine similarity |
| Behavioral Co-occurrence | 0.10 | Session-based co-access counts |
| Temporal Proximity | 0.10 | Upload timestamp closeness |
| Structural Links | 0.20 | Shared tags + cluster membership |

Per-signal scores are stored individually so the system can learn which signals matter most per-user over time. Bridge documents are detected via dual-condition verification (multi-cluster membership + cross-cluster edges). Attractor scores combine degree centrality (0.40), access frequency (0.30), and temporal consistency (0.30).

### Implementation

Every stage is pure TypeScript running natively in the Convex runtime — no Python, no sklearn, no external ML dependencies. All LAMINAR files live in `convex/laminar/` and follow a consistent action → internal mutation pipeline with batch inserts capped at 25 items per mutation call.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js 16, React 19, TypeScript (strict) | App Router with Server + Client Components |
| **UI** | Shadcn UI, Tailwind CSS 4, Lucide Icons | Accessible components with VELA brand palette |
| **Database** | Convex | Real-time BaaS — queries, mutations, actions, file storage, search indexes, WebSocket subscriptions |
| **Auth** | Clerk | JWT integration with Convex, multi-provider (Google, GitHub, Email) |
| **AI** | Claude Sonnet 4 (Anthropic) | RAG-based Q&A with 200K token context, streaming responses, source citations |
| **LAMINAR** | Pure TypeScript | TF-IDF, K-Means++, softmax, graph analysis — zero external ML deps |
| **Hosting** | Vercel + Convex Cloud | Edge functions, global CDN, managed backend |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [Anthropic](https://anthropic.com)

### Installation

```bash
git clone https://github.com/yourusername/vela.git
cd vela
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
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=2048
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
src/
├── app/
│   ├── (auth)/                        # Sign-in / sign-up (public)
│   ├── (dashboard)/                   # Protected routes (shared layout)
│   │   ├── layout.tsx                 # Navigation + footer
│   │   ├── dashboard/page.tsx         # HELM — main dashboard
│   │   ├── documents/page.tsx         # Document list
│   │   ├── documents/[id]/page.tsx    # Document detail + CURRENTS panel
│   │   ├── documents/new/page.tsx     # PORT — file upload
│   │   ├── search/page.tsx            # COMPASS + LIGHTHOUSE
│   │   ├── archipelagos/page.tsx      # ARCHIPELAGOS — cluster view
│   │   └── knowledge-graph/page.tsx   # CHARTS — knowledge graph (Day 18)
│   ├── (marketing)/page.tsx           # Public landing page
│   ├── providers.tsx                  # ClerkProvider → ConvexProvider chain
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # VELA brand CSS variables
├── components/
│   ├── ui/                            # Shadcn components (Radix primitives)
│   ├── user-setup.tsx                 # Auto user creation on sign-in
│   ├── document-card.tsx              # Document list item
│   ├── search-box.tsx                 # Search input component
│   └── knowledge-graph-panel.tsx      # Graph visualization (Day 18)
├── lib/
│   ├── utils.ts                       # Helpers (cn, etc.)
│   └── constants.ts                   # App-wide constants
└── middleware.ts                      # Clerk route protection

convex/
├── schema.ts                          # 14 tables, all indexes
├── documents.ts                       # PORT: upload, list, search, CRUD
├── ai.ts                              # LIGHTHOUSE: Claude API (two modes)
├── users.ts                           # User management, Clerk sync
├── queries.ts                         # AI query logging + analytics
├── migrations.ts                      # Batched data backfills
├── auth.config.ts                     # Clerk JWT config (fail-fast validation)
├── README.md                          # Backend architecture guide
└── laminar/
    ├── tfidf.ts                       # TF-IDF vectorization engine
    ├── kmeans.ts                      # K-Means++ clustering + silhouette
    ├── confidence.ts                  # Probabilistic membership (softmax)
    ├── engine.ts                      # Stage 1 pipeline orchestration
    ├── queries.ts                     # Real-time cluster queries
    ├── temporal.ts                    # Access trajectory estimation
    ├── cooccurrence.ts                # Co-occurrence matrix builder
    ├── temporalRunner.ts              # Stage 2 pipeline orchestration
    ├── graph.ts                       # Knowledge graph construction
    ├── bridges.ts                     # Bridge detection + role classification
    ├── graphRunner.ts                 # Stage 3 pipeline orchestration
    └── graphQueries.ts                # Graph data queries

CLAUDE.md                              # AI coding agent project context
.claude/vela-context.md                # Extended context + implementation history
```

---

## Database Schema

14 tables across core features and LAMINAR stages:

| Group | Table | Purpose |
|-------|-------|---------|
| **Core** | `users` | User profiles synced from Clerk |
| | `documents` | Uploaded documents with full-text search index |
| | `queries` | AI query logging for analytics |
| **LAMINAR Stage 1** | `clusteringRuns` | Pipeline execution records (status, silhouette, timing) |
| | `clusters` | ARCHIPELAGOS — name, keywords, centroid vector, coherence |
| | `clusterMemberships` | Probabilistic document → cluster mapping |
| | `clusterHistory` | Cluster evolution snapshots over time |
| **LAMINAR Stage 2** | `accessEvents` | Every document interaction (view, search, ai_query) |
| | `temporalPatterns` | Trajectory estimates (rising/stable/declining/periodic) |
| | `cooccurrences` | Document pair co-access counts |
| **LAMINAR Stage 3** | `knowledgeEdges` | Weighted edges with 4 per-signal scores |
| | `graphRuns` | Graph analysis execution records |
| | `documentMetrics` | Role classification + attractor scores |
| **LAMINAR Stage 4** | `cascadeRuns` | Cascade prediction execution records *(schema ready)* |

---

## Brand Identity

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Deep Ocean Navy** | `#1B3D5C` | Primary backgrounds, headings, body text |
| **Bright Teal** | `#00BCD4` | Accents, interactive elements, CTAs, links |
| **LAMINAR Gradient** | Navy → Teal | Progress bars, LAMINAR branding, premium features |
| **Coral Accent** | `#FF6B6B` | Error states and urgent alerts only |
| **Sunset Gold** | `#F4B860` | Premium features and achievements only |

### Nautical Metaphor System

Every feature, state, and interaction maps to a nautical concept:

| Concept | Name | Meaning |
|---------|------|---------|
| Document Upload | **PORT** | Ships arrive at port with cargo |
| Full-Text Search | **COMPASS** | Navigation tool for finding direction |
| AI Answers | **LIGHTHOUSE** | Guiding beacon illuminating knowledge |
| Document Clusters | **ARCHIPELAGOS** | Related knowledge islands |
| Related Documents | **CURRENTS** | Ocean flows connecting knowledge |
| Knowledge Graph | **CHARTS** | Mapping connections between islands |
| Dashboard | **HELM** | Ship's control center |
| User | **CAPTAIN** | Commander of their knowledge vessel |
| Loading State | **NAVIGATING** | Wave/pulse animation — never spinners |
| Empty State | **STILL WATERS** | "Ready for your first voyage" |
| Error State | **STORMY SEAS** | "Trying again..." |

### Design Principles

- Wave/pulse animations for all loading states (never circular spinners)
- Nautical messaging throughout — no corporate jargon ("optimize", "workflow", "efficiency")
- Time-focused copy — emphasize seconds saved, not features listed
- Dark mode supported via `next-themes` (class-based toggling)
- Mobile-first responsive design across all features

---

## 30-Day Sprint Progress

```
Phase 1: FOUNDATION (Days 1-5)        ████████████████████ 100% ✅
Phase 2: INFRASTRUCTURE (Days 6-8)    ████████████████████ 100% ✅
Phase 3: CORE FEATURES (Days 9-15)    ████████████████████ 100% ✅
Phase 4: DIFFERENTIATION (Days 16-20) ████████████░░░░░░░░  60% 🔧 ← NOW
Phase 5: POLISH & BILLING (Days 21-25)                          🔒
Phase 6: LAUNCH (Days 26-30)                                    🔒
```

**Current: Day 18 of 30 (60% Complete)**

### Shipped

- [x] JavaScript async/await fundamentals (Days 1–5)
- [x] Next.js 16 + React 19 + TypeScript infrastructure (Day 6)
- [x] Convex real-time database + Clerk authentication (Days 7–8)
- [x] PORT — document upload with PDF extraction (Days 9–10)
- [x] COMPASS — full-text search with real-time results (Days 11–12)
- [x] LIGHTHOUSE — AI Q&A with streaming + citations (Days 13–15)
- [x] LAMINAR Stage 1 — ARCHIPELAGOS clustering (Day 16)
- [x] LAMINAR Stage 2 — CURRENTS temporal patterns + co-occurrence (Day 17)

### In Progress

- [ ] LAMINAR Stage 3 — CHARTS knowledge graph + bridges + attractors (Day 18)

### Upcoming

- [ ] LAMINAR Stage 4 — Butterfly Effect cascade prediction (Day 19)
- [ ] LAMINAR Stage 5 — Fractal Wisdom multi-scale patterns (Day 20)
- [ ] UI/UX polish + accessibility (Days 21–22)
- [ ] Stripe billing integration (Days 23–24)
- [ ] Documentation + marketing site (Days 25–26)
- [ ] Product Hunt launch (Day 30)

---

## Pricing (Planned)

| Tier | Price | Documents | Queries | LAMINAR |
|------|-------|-----------|---------|---------|
| **Free** | $0 | 10 | 20/month | — |
| **Individual** | $15/mo | 100 | Unlimited | — |
| **Team** | $25/user/mo | Unlimited | Unlimited | ✅ Full access |

Target: $1,000–1,250 MRR at Month 3 (8–10 agency teams), scaling to $10K MRR by month 6.

---

## Performance

| Metric | Value |
|--------|-------|
| LIGHTHOUSE response | 7–9 seconds |
| COMPASS search results | < 100ms |
| Document upload | 1–3 seconds |
| LAMINAR clustering (7 docs) | 202ms |
| Page load (first visit) | 1–2 seconds |
| Page load (cached) | < 500ms |

---

## Known Limitations

- **PDF extraction**: Partially working due to `pdf-parse` module resolution in the Convex runtime. Text and Markdown files work fully.
- **No pagination**: Document list returns all documents. Needs pagination for 100+ docs.
- **No test framework**: Validation is manual integration testing — no Jest/Vitest configured.
- **LAMINAR cold-start**: With < 10 documents and no usage history, behavioral/temporal signals are near-zero. System is designed content-first (0.60 weight) with signals that grow as usage accumulates.
- **O(n²) graph scaling**: Knowledge graph edge computation is quadratic. Guarded at 200 documents; above that, partitions by cluster.

---

## About VELA

**Mission:** Give knowledge workers their time back by instantly connecting them with answers, wherever those answers live.

**Vision:** A world where no question goes unanswered because you can't find what you already know — where teams across every industry have instant access to collective wisdom through self-organizing intelligence that learns from how they work.

**Beachhead Market:** Freelance Agencies (5–25 person service firms: marketing agencies, design studios, IT consultancies, accounting firms, law practices) — teams with business budgets, measurable ROI from billable hours recovered, and individual decision makers who can adopt without procurement.

**Expansion Path:** Agencies → Customer Support → Sales → Medical → Legal → 11+ additional verticals. 90% code reuse architecture — only onboarding language, templates, and integration connectors are customized per vertical.

**Cross-Vertical Intelligence:** Each new vertical makes LAMINAR smarter for all verticals. Pattern transfer across domains creates a compounding data flywheel.

---

**William Horton** — Solo Founder & Developer

---

**Last Updated:** February 21, 2026 (Day 18)
**Status:** Active Development — 60% Complete
**Next Milestone:** Day 19 — LAMINAR Stage 4 (Butterfly Effect)