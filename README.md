# 🚢 VELA — Navigate Your Knowledge

**AI-Powered Knowledge Management Platform**
*Transform scattered information into instant answers using chaos theory and AI*

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat-square)](https://convex.dev/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-blue?style=flat-square)](https://anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Day%2016%2F30-success?style=flat-square)](https://github.com/yourusername/vela)

---

## 🎯 What is VELA?

VELA is an AI-powered knowledge management platform that helps knowledge workers find answers in **seconds instead of hours**. Using chaos theory principles and Claude AI, VELA transforms your scattered documents, notes, and communications into a self-organizing intelligence system.

**Stop searching. Start navigating.** ⚓

---

## ✨ Features

### 🏝️ ARCHIPELAGOS — Self-Organizing Knowledge *(NEW — Day 16)*
Documents organize themselves into knowledge clusters powered by **LAMINAR**, VELA's chaos theory algorithm:
- **Auto-Clustering**: Upload 3+ documents and VELA discovers topic groups automatically — no folders needed
- **Probabilistic Membership**: Each document gets a confidence score across all clusters (not binary assignment)
- **Bridge Detection**: Documents spanning multiple clusters are flagged as knowledge bridges
- **Coherence Scoring**: Each cluster displays internal consistency metrics
- **Pure TypeScript ML**: TF-IDF + K-Means++ + softmax confidence — zero external dependencies
- **Pipeline Performance**: 202ms for 7 documents, 835 terms

### 🔦 LIGHTHOUSE — AI-Powered Q&A *(Day 13-15)*
Ask natural language questions and get intelligent answers from your knowledge base:
- **Smart Search Mode**: AI automatically finds the 5 most relevant documents
- **Manual Selection Mode**: Choose specific documents to search
- **Source Citations**: Every answer links back to source documents
- **Performance Metrics**: Transparent token usage, response time, and document counts
- **Streaming Responses**: Real-time answer generation with Claude API

### 🧭 COMPASS — Full-Text Search *(Day 11-12)*
- Lightning-fast search across all your documents
- Instant results with content previews
- Filter by document type
- Real-time result updates via WebSocket

### 📦 PORT — Document Upload *(Day 9-10)*
- Drag-and-drop file upload supporting PDF, TXT, and Markdown
- Automatic full-text indexing with Convex search
- Server-side PDF text extraction
- Real-time synchronization across all devices

### 🔐 Secure Authentication — Clerk Integration *(Day 7-8)*
- Multi-provider sign-in (Google, GitHub, Email)
- Protected routes with middleware
- Automatic user creation on sign-up
- JWT integration with Convex for data isolation

### ⚡ Real-Time Everything — Convex Powered *(Day 7-9)*
- Live updates across browser tabs
- Multi-device synchronization
- Type-safe database queries with auto-generated types
- WebSocket subscriptions (never polling)

---

## 🧠 LAMINAR Algorithm

**LAMINAR** (Latent Association Mapping via Intelligent Natural-language Analysis and Retrieval) applies chaos theory principles to knowledge management. It's VELA's competitive moat — documents organize themselves without folders, tags, or manual categorization.

### How It Works

```
Documents → TF-IDF Vectorization → K-Means++ Clustering → Confidence Scoring → ARCHIPELAGOS
```

1. **TF-IDF Vectorization** — Converts document text into numerical vectors using sublinear term frequency (`1 + log(tf)`) and smoothed inverse document frequency (`log(N / (1 + df))`). L2 normalized for cosine similarity.
2. **K-Means++ Clustering** — Groups similar documents using smart centroid initialization. Silhouette method selects optimal K from 2 to `min(10, √N)`. Seeded PRNG ensures reproducible results.
3. **Probabilistic Confidence** — Softmax over negated distances converts cluster distances into a full probability distribution. Documents near cluster boundaries are flagged as "bridges" (ambiguity threshold: 15%).
4. **Real-Time Display** — Clusters update live via Convex WebSocket subscriptions. Expand any cluster to see member documents ranked by membership probability.

### LAMINAR Stages

| Stage | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | **ARCHIPELAGOS** | ✅ Live | Self-organizing document clusters |
| 2 | **CURRENTS** | 📋 Day 17 | Temporal pattern detection — access trajectories |
| 3 | **Cross-Document** | 📋 Day 18 | Knowledge graph edges — semantic bridges |
| 4 | **Butterfly Effect** | 📋 Day 19 | Cascade prediction — change impact analysis |
| 5 | **Fractal Wisdom** | 📋 Day 20 | Multi-scale pattern recognition |

### Pipeline Stats (First Production Run)

| Metric | Value |
|--------|-------|
| Documents Clustered | 7 |
| TF-IDF Terms Extracted | 835 |
| Clusters Discovered (K) | 2 |
| K-Means Iterations | 1 (converged) |
| Silhouette Score | 0.1531 |
| Membership Records | 14 |
| Pipeline Duration | 202ms |
| External ML Dependencies | 0 |

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16.1.3** — React framework with App Router
- **React 19** — Server and Client Components
- **TypeScript** — Strict mode, type-safe development
- **Shadcn UI** — Accessible component library (Radix UI primitives)
- **Tailwind CSS** — Utility-first styling with VELA brand colors
- **Lucide Icons** — Icon set

### Backend & Database
- **Convex** — Real-time backend-as-a-service
  - Type-safe queries, mutations, and actions
  - Full-text search with search indexes
  - File storage for documents
  - Auto-generated TypeScript types
  - WebSocket subscriptions for live updates

### AI
- **Claude Sonnet 4** (Anthropic) — AI-powered answers
  - 200K token context window
  - RAG implementation with document context
  - Streaming responses with source citations

### LAMINAR Engine
- **Pure TypeScript** — No Python, no sklearn, no external ML dependencies
  - TF-IDF vectorization with 127 stop words
  - K-Means++ with seeded PRNG (mulberry32)
  - Softmax confidence with numerical stability
  - Runs natively in Convex runtime

### Authentication
- **Clerk** — JWT integration with Convex, multi-provider support

### Deployment
- **Vercel** — Next.js hosting with edge functions
- **Convex Cloud** — Managed backend deployment

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [Anthropic](https://anthropic.com)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vela.git
cd vela
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` in the root directory:
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

4. **Start Convex** (must run first — generates TypeScript types)
```bash
npx convex dev
```

5. **Start Next.js** (in a second terminal)
```bash
npm run dev
```

6. **Open the app**
```
http://localhost:3000
```

> ⚠️ **Important:** Always start `npx convex dev` before `npm run dev`. Convex generates TypeScript types that Next.js depends on.

---

## 📂 Project Structure

```
vela/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Sign-in / sign-up (public)
│   │   ├── (dashboard)/               # Protected routes (shared layout)
│   │   │   ├── layout.tsx             # Navigation bar + footer
│   │   │   ├── dashboard/page.tsx     # HELM — main dashboard
│   │   │   ├── documents/page.tsx     # Document list
│   │   │   ├── upload/page.tsx        # PORT — file upload
│   │   │   ├── search/page.tsx        # COMPASS — full-text search
│   │   │   ├── lighthouse/page.tsx    # LIGHTHOUSE — AI Q&A
│   │   │   └── archipelagos/page.tsx  # ARCHIPELAGOS — cluster visualization
│   │   ├── (marketing)/page.tsx       # Public landing page
│   │   ├── layout.tsx                 # Root layout (providers)
│   │   ├── providers.tsx              # ClerkProvider → ConvexProvider chain
│   │   └── globals.css                # VELA brand colors
│   ├── components/
│   │   ├── ui/                        # Shadcn components
│   │   ├── lighthouse-search.tsx      # AI Q&A component
│   │   └── user-setup.tsx             # Auto user creation
│   ├── lib/utils.ts                   # Helper functions
│   └── middleware.ts                  # Clerk route protection
│
├── convex/
│   ├── schema.ts                      # Database schema (7 tables, 21 indexes)
│   ├── documents.ts                   # Document CRUD + file processing
│   ├── ai.ts                          # Claude API integration
│   ├── users.ts                       # User management
│   ├── queries.ts                     # AI query logging
│   └── laminar/                       # LAMINAR algorithm engine
│       ├── tfidf.ts                   # TF-IDF vectorization
│       ├── kmeans.ts                  # K-Means++ clustering + silhouette
│       ├── confidence.ts              # Probabilistic membership scoring
│       ├── engine.ts                  # Pipeline orchestration (Convex action)
│       └── queries.ts                 # Real-time cluster queries
│
├── CLAUDE.md                          # AI coding agent context
├── LEARNING_LOG.md                    # Development progress journal
└── package.json
```

---

## 🎨 VELA Brand Identity

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| **Deep Ocean Navy** | `#1B3D5C` | Primary backgrounds, headings, text |
| **Teal** | `#00BCD4` | Accents, interactive elements, CTAs |
| **Gradient** | Navy → Teal | LAMINAR branding, special features |

### Nautical Metaphor System

| Feature | Nautical Name | Meaning |
|---------|---------------|---------|
| Document Upload | **PORT** | Ships arrive at port with cargo |
| Search | **COMPASS** | Navigation tool for finding direction |
| AI Answers | **LIGHTHOUSE** | Guiding beacon illuminating knowledge |
| Document Clusters | **ARCHIPELAGOS** | Related knowledge islands |
| Related Docs | **CURRENTS** | Ocean flows connecting information |
| Dashboard | **HELM** | Ship's control center |
| User | **CAPTAIN** | Commander of their knowledge vessel |

### Design Principles
- Wave animations for loading states (never spinners)
- "Still waters" for empty states, "Stormy seas" for errors
- Nautical messaging throughout — no corporate jargon
- Time-focused copy — emphasize seconds saved, not features
- Mobile-first responsive design

---

## 📊 30-Day MVP Sprint Progress

```
Phase 1: FOUNDATION (Days 1-5)        ████████████████████ 100% ✅
Phase 2: INFRASTRUCTURE (Days 6-8)    ████████████████████ 100% ✅
Phase 3: CORE FEATURES (Days 9-15)    ████████████████████ 100% ✅
Phase 4: DIFFERENTIATION (Days 16-20) ████░░░░░░░░░░░░░░░░  20% 🚧
Phase 5: POLISH & BILLING (Days 21-25)                          🔒
Phase 6: LAUNCH (Days 26-30)                                    🔒
```

**Current Progress: Day 16/30 (53%)**

### What's Built
- [x] JavaScript async/await mastery (Days 1-5)
- [x] Next.js 16 + React 19 infrastructure (Day 6)
- [x] Convex real-time database + Clerk authentication (Days 7-8)
- [x] PORT — document upload with PDF extraction (Days 9-10)
- [x] COMPASS — full-text search with real-time results (Days 11-12)
- [x] LIGHTHOUSE — AI Q&A with streaming + citations (Days 13-15)
- [x] LAMINAR Stage 1 — ARCHIPELAGOS clustering (Day 16)

### What's Next
- [ ] LAMINAR Stage 2 — CURRENTS temporal patterns (Day 17)
- [ ] LAMINAR Stage 3 — Cross-document intelligence (Day 18)
- [ ] LAMINAR Stage 4 — Butterfly effect prediction (Day 19)
- [ ] LAMINAR Stage 5 — Fractal wisdom extraction (Day 20)
- [ ] UI/UX polish + accessibility (Days 21-22)
- [ ] Stripe billing integration (Days 23-24)
- [ ] Product Hunt launch (Day 30)

---

## 💰 Pricing (Planned)

| Tier | Price | Documents | Queries | LAMINAR |
|------|-------|-----------|---------|---------|
| **Free** | $0 | 10 | 20/month | — |
| **Starter** | $10/mo | 100 | Unlimited | — |
| **Pro** | $25/mo | Unlimited | Unlimited | ✅ Full access |

---

## 🔧 Database Schema

7 tables with 21 indexes:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (synced from Clerk) |
| `documents` | Uploaded documents with full-text search |
| `queries` | AI query logging for analytics |
| `clusteringRuns` | LAMINAR pipeline execution records |
| `clusters` | ARCHIPELAGOS with centroids + keywords |
| `clusterMemberships` | Probabilistic doc-to-cluster membership |
| `clusterHistory` | Cluster evolution snapshots (Day 17+) |

---

## 📈 Performance Benchmarks

| Metric | Value |
|--------|-------|
| LIGHTHOUSE Response Time | 7-9 seconds |
| COMPASS Search Results | <100ms |
| Document Upload | 1-3 seconds |
| LAMINAR Pipeline (7 docs) | 202ms |
| Page Load (First Visit) | 1-2 seconds |
| Page Load (Cached) | <500ms |

---

## 🐛 Known Issues

- Silhouette score is low (~15%) with small corpora (<10 documents) — expected, improves with more documents
- No pagination for large document lists
- LIGHTHOUSE doesn't support PDF highlighting yet
- No dark mode support yet

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| Development Started | January 19, 2026 |
| Current Day | 16 of 30 |
| Sprint Progress | 53% |
| Features Shipped | 6 major (PORT, COMPASS, LIGHTHOUSE, Documents, Auth, ARCHIPELAGOS) |
| Convex Tables | 7 |
| Convex Indexes | 21 |
| LAMINAR Algorithm Files | 5 (tfidf, kmeans, confidence, engine, queries) |
| External ML Dependencies | 0 |
| Days Until Launch | 14 |

---

## 🚢 About VELA

**Mission:** Give knowledge workers their time back by instantly connecting them with answers, wherever those answers live.

**Vision:** A world where no question goes unanswered because you can't find what you already know — where teams across every industry have instant access to collective wisdom through self-organizing intelligence that learns from how they work.

**Beachhead Market:** Musicians (creative knowledge workers with non-linear workflows)

**Expansion Path:** Customer Support → Sales → Medical → Legal → 11+ additional verticals

**Cross-Vertical Intelligence:** Each new vertical makes LAMINAR smarter for ALL verticals. Pattern transfer across domains creates an insurmountable data flywheel.

---

## 💬 Contact

**William Horton** — Solo Founder & Developer

- 📧 Email: whorton@vela.ai
- 🌐 Website: vela.ai *(Coming Day 26)*

---

## ⚓ Navigate Your Knowledge

**VELA** — Stop searching. Start navigating.

*Smooth sailing for your knowledge.* 🌊

---

**Last Updated:** February 13, 2026 (Day 16)
**Status:** Active Development — 53% Complete
**Next Milestone:** Day 17 — LAMINAR Stage 2 (CURRENTS)