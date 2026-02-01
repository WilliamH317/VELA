# 🚢 VELA - Navigate Your Knowledge

**AI-Powered Knowledge Management Platform**  
*Transform scattered information into instant answers using chaos theory and AI*

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat-square)](https://convex.dev/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-blue?style=flat-square)](https://anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Day%2014%2F30-success?style=flat-square)](https://github.com/yourusername/vela)

---

## 🎯 What is VELA?

VELA is an AI-powered knowledge management platform that helps knowledge workers find answers in **seconds instead of hours**. Using chaos theory principles and Claude AI, VELA transforms your scattered documents, notes, and communications into a self-organizing intelligence system.

**Stop searching. Start navigating.** ⚓

---

## ✨ Features

### **🔦 LIGHTHOUSE** - AI-Powered Q&A *(NEW - Day 14)*
Ask natural language questions and get intelligent answers from your knowledge base:
- **Smart Search Mode**: AI automatically finds the 5 most relevant documents
- **Manual Selection Mode**: Choose specific documents to search
- **Source Citations**: Every answer links back to source documents
- **Performance Metrics**: Transparent token usage, response time, and document counts
- **Beautiful UI**: VELA nautical branding with gradient lighthouse icon

### **📚 Document Management** - Upload & Organize *(Day 11-12)*
- Upload PDFs, text files, and markdown documents
- Automatic full-text indexing with Convex search
- Real-time synchronization across all devices
- Document type badges and metadata display

### **🧭 COMPASS** - Full-Text Search *(Day 12)*
- Lightning-fast search across all your documents
- Instant results with content previews
- Filter by document type
- Highlight matching text

### **🔐 Secure Authentication** - Clerk Integration *(Day 8)*
- Multi-provider sign-in (Google, GitHub, Email)
- Protected routes with middleware
- Automatic user creation on sign-up
- Organization/team support ready

### **⚡ Real-Time Everything** - Convex Powered *(Day 7-9)*
- Live updates across browser tabs
- Multi-device synchronization
- Optimistic UI updates
- Type-safe database queries

---

## 🏗️ Tech Stack

### **Frontend**
- **Next.js 16.1.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Shadcn UI** - Accessible component library
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icon set

### **Backend & Database**
- **Convex** - Real-time backend-as-a-service
  - Type-safe queries and mutations
  - Full-text search with indexes
  - File storage for documents
  - Automatic type generation

### **AI & Search**
- **Claude Sonnet 4** (Anthropic) - AI-powered answers
  - Superior context handling (200K tokens)
  - Excellent citation accuracy
  - Ethical AI alignment
- **Convex Search Indexes** - Fast document retrieval

### **Authentication**
- **Clerk** - User authentication & management
  - JWT integration with Convex
  - Multi-provider support
  - Organization features

### **Deployment**
- **Vercel** - Next.js hosting with edge functions
- **Convex Cloud** - Managed backend deployment

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ installed
- npm or yarn package manager
- Convex account (free tier available)
- Clerk account (free tier available)
- Anthropic API key (Claude)

### **Installation**

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
```

4. **Initialize Convex**
```bash
npx convex dev
```

This will:
- Create your Convex deployment
- Generate database schema
- Set up indexes
- Generate TypeScript types

5. **Start the development server**

Open a **second terminal** and run:
```bash
npm run dev
```

6. **Open the app**
```
http://localhost:3000
```

**Important:** You must run **both** Convex and Next.js:
- Terminal 1: `npx convex dev` (backend)
- Terminal 2: `npm run dev` (frontend)

---

## 📂 Project Structure

```
vela/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/         # Route group (shared layout)
│   │   │   ├── layout.tsx       # Navigation + footer
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # → /dashboard
│   │   │   ├── lighthouse/
│   │   │   │   └── page.tsx     # → /lighthouse (AI Q&A)
│   │   │   ├── documents/
│   │   │   │   └── page.tsx     # → /documents
│   │   │   └── search/
│   │   │       └── page.tsx     # → /search
│   │   ├── (marketing)/         # Public routes
│   │   │   └── page.tsx         # → / (landing page)
│   │   ├── layout.tsx           # Root layout (providers)
│   │   └── globals.css          # VELA brand colors
│   ├── components/
│   │   ├── lighthouse-search.tsx # AI Q&A component (600+ lines)
│   │   ├── user-setup.tsx       # Auto user creation
│   │   └── ui/                  # Shadcn components
│   ├── lib/
│   │   └── utils.ts             # Helper functions
│   └── middleware.ts            # Clerk authentication
│
├── convex/
│   ├── schema.ts                # Database schema
│   ├── documents.ts             # Document queries/mutations
│   ├── users.ts                 # User management
│   ├── ai.ts                    # AI actions (Claude API)
│   ├── auth.config.ts           # Clerk JWT config
│   └── _generated/              # Auto-generated types
│
├── public/                      # Static assets
├── .env.local                   # Environment variables (gitignored)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind + VELA colors
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

---

## 🎨 VELA Brand Identity

### **Color Palette**
- **Deep Ocean Navy** - `#1B3D5C` (primary backgrounds, text)
- **Teal** - `#00BCD4` (accents, interactive elements, CTAs)
- **Gradient** - Navy → Teal for special features (LIGHTHOUSE)

### **Nautical Metaphor System**

| Feature | Nautical Name | Meaning |
|---------|---------------|---------|
| Document Upload | **PORT** | Ships arrive at port with cargo |
| Search | **COMPASS** | Navigation tool for finding direction |
| AI Answers | **LIGHTHOUSE** | Guiding beacon illuminating knowledge |
| Related Docs | **CURRENTS** | Ocean flows connecting information |
| Dashboard | **HELM** | Ship's control center |
| User | **CAPTAIN** | Commander of their knowledge vessel |

### **Design Principles**
- **Sophisticated but not corporate** - Professional without being stiff
- **Intelligent but not cold** - Smart and warm, not robotic
- **Wave animations** - Never generic spinners
- **Nautical messaging** - Consistent metaphors throughout
- **Time-focused copy** - Emphasize seconds saved, not features

---

## 🔧 Configuration

### **Convex Schema**

Our database schema includes:

```typescript
// convex/schema.ts
export default defineSchema({
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    contentPlain: v.string(),      // For full-text search
    userId: v.string(),              // Clerk user ID
    type: v.union(
      v.literal("pdf"),
      v.literal("text"),
      v.literal("markdown")
    ),
    fileId: v.optional(v.id("_storage")),
    metadata: v.object({
      source: v.string(),
      uploadedAt: v.number(),
      size: v.number(),
    }),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    status: v.union(
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .searchIndex("search_content", {
      searchField: "contentPlain",
      filterFields: ["userId", "type", "isPublic"],
    }),
    
  users: defineTable({
    userId: v.string(),              // Clerk user ID
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
```

### **Clerk Configuration**

Middleware protects routes:
```typescript
// src/middleware.ts
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/documents(.*)',
  '/lighthouse(.*)',
  '/search(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);
```

---

## 📊 30-Day MVP Sprint Progress

### **Phase 1: Foundation (Days 1-10)** ✅ COMPLETE
- [x] JavaScript async/await mastery
- [x] Next.js 14 infrastructure
- [x] Convex database setup
- [x] Clerk authentication
- [x] First real-time feature
- [x] Infrastructure checkpoint

### **Phase 2: Core Features (Days 11-15)** ✅ 80% COMPLETE
- [x] Document upload with file handling (Day 11)
- [x] Full-text search with indexes (Day 12)
- [x] Claude API integration (Day 13)
- [x] AI-powered Q&A - LIGHTHOUSE (Day 14)
- [ ] Polish & edge case testing (Day 15)

### **Phase 3: LAMINAR Algorithm (Days 16-20)** 📋 UPCOMING
- [ ] Self-organizing document clusters
- [ ] Temporal pattern detection
- [ ] Cross-document intelligence
- [ ] Butterfly effect predictions
- [ ] Fractal wisdom extraction

### **Phase 4: Launch Prep (Days 21-30)** 📋 PLANNED
- [ ] Stripe billing integration
- [ ] Analytics dashboard
- [ ] Marketing landing page
- [ ] Documentation & help center
- [ ] Product Hunt launch

**Current Progress: Day 14/30 (47%)**

---

## 🎯 Roadmap

### **Immediate (Days 15-20)**
- [ ] Edge case testing for LIGHTHOUSE
- [ ] Document upload progress indicators
- [ ] Copy-to-clipboard for answers
- [ ] LAMINAR Phase 1: Document clustering
- [ ] Related documents sidebar

### **Near-term (Days 21-25)**
- [ ] Billing with Stripe
- [ ] Usage analytics
- [ ] Team/organization features
- [ ] Email notifications
- [ ] Export functionality

### **Launch (Days 26-30)**
- [ ] Marketing site redesign
- [ ] Product demo video
- [ ] Documentation site
- [ ] Beta user onboarding
- [ ] Product Hunt launch 🚀

### **Post-MVP (Q1 2026)**
- [ ] Integration with Slack
- [ ] Integration with Google Drive
- [ ] Mobile apps (iOS/Android)
- [ ] Chrome extension
- [ ] API for developers

---

## 🧪 Testing

### **Manual Testing Checklist**

**LIGHTHOUSE (AI Q&A):**
- [ ] Smart Search finds relevant documents
- [ ] Manual Selection respects user choices
- [ ] Error messages display correctly
- [ ] Loading animations work smoothly
- [ ] Source citations are clickable
- [ ] Performance metrics display accurately
- [ ] Mobile layout works properly

**Document Upload:**
- [ ] File types validated (PDF, TXT, MD)
- [ ] Upload progress shown
- [ ] Success states clear
- [ ] Error handling works
- [ ] Documents appear in list immediately

**Search (COMPASS):**
- [ ] Instant search as you type
- [ ] Results highlight query terms
- [ ] Empty state messaging
- [ ] Filter by document type works

**Authentication:**
- [ ] Sign in with Google works
- [ ] Sign up flow completes
- [ ] Protected routes redirect
- [ ] User data persists

### **Performance Benchmarks**

**Current Metrics (Day 14):**
- LIGHTHOUSE Response Time: 7-9 seconds
- Search Results: <100ms
- Document Upload: 1-3 seconds
- Page Load (First Visit): 1-2 seconds
- Page Load (Cached): <500ms

---

## 🐛 Known Issues

### **In Progress**
- [ ] Document upload page not yet built (coming Day 15)
- [ ] No pagination for large document lists
- [ ] LIGHTHOUSE doesn't support PDF highlighting yet
- [ ] No keyboard shortcuts for navigation

### **Backlog**
- [ ] Need "empty trash" functionality
- [ ] Document versioning not implemented
- [ ] No collaborative features yet
- [ ] Missing dark mode support

---

## 🤝 Contributing

VELA is currently in private development (30-day MVP sprint). 

**Interested in contributing after launch?**
- 📧 Email: will@vela.ai
- 🐦 Twitter: @vela_ai
- 💼 LinkedIn: [Will's Profile]

---

## 📖 Documentation

### **For Users**
- [Getting Started Guide](./docs/getting-started.md) *(Coming Day 26)*
- [LIGHTHOUSE User Guide](./docs/lighthouse.md) *(Coming Day 15)*
- [Keyboard Shortcuts](./docs/shortcuts.md) *(Coming Day 20)*

### **For Developers**
- [Architecture Overview](./docs/architecture.md)
- [Convex Schema Guide](./docs/convex-schema.md)
- [Contributing Guidelines](./docs/contributing.md) *(Coming post-launch)*
- [API Documentation](./docs/api.md) *(Coming Q1 2026)*

---

## 📝 License

Copyright © 2026 VELA. All rights reserved.

This project is currently in private development. License will be determined at public launch.

---

## 🙏 Acknowledgments

### **Technologies**
- [Next.js](https://nextjs.org/) - React framework
- [Convex](https://convex.dev/) - Real-time backend
- [Anthropic Claude](https://anthropic.com/) - AI-powered answers
- [Clerk](https://clerk.com/) - Authentication
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Deployment

### **Inspiration**
- Chaos theory principles for self-organizing systems
- Nautical navigation metaphors for knowledge discovery
- Musicians' workflow challenges (beachhead market)

---

## 📊 Stats

- **Development Started:** January 19, 2026
- **Current Day:** 14 of 30
- **Lines of Code:** 5,000+
- **Files Created:** 50+
- **Features Shipped:** 6 major features
- **Bugs Squashed:** 50+
- **Coffee Consumed:** ☕☕☕☕☕☕☕☕☕☕☕☕☕☕ (infinite)

---

## 🚢 About VELA

**Mission:** Give knowledge workers their time back by instantly connecting them with answers, wherever those answers live.

**Vision:** A world where no question goes unanswered because you can't find what you already know.

**Core Values:**
- **Speed** - Seconds, not hours
- **Intelligence** - AI that actually helps
- **Transparency** - Show how it works
- **Beauty** - Design matters
- **Ethics** - Respect user privacy

**Beachhead Market:** Musicians (creative knowledge workers with non-linear workflows)

**Expansion Path:** Customer support → Sales → Medical → Legal → 11 additional verticals

---

## 💬 Contact

**William Horton** - Solo Founder & Developer

- 📧 Email: whorton@vela.ai
- 🌐 Website: vela.ai *(Coming Day 26)*
- 🐦 Twitter: @vela_ai *(Coming Day 25)*
- 💼 LinkedIn: [Will's Profile]

---

## ⚓ Navigate Your Knowledge

**VELA** - Stop searching. Start navigating.

*Smooth sailing for your knowledge.* 🌊

---

**Last Updated:** January 31, 2026 (Day 14)  
**Status:** Active Development - 47% Complete  
**Next Milestone:** Day 15 - LIGHTHOUSE Polish & Testing

