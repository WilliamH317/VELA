# VELA - Navigate Your Knowledge

AI-powered knowledge management platform that helps teams find answers instantly from scattered documents and conversations.

**Tagline:** "Navigate Your Knowledge"  
**Mission:** Give knowledge workers their time back  
**Value:** Save 8 hours per week through instant AI-powered search

---

## 🚢 Tech Stack

- **Frontend:** Next.js 14 (App Router) with TypeScript
- **UI:** Shadcn + Tailwind CSS  
- **Database:** Convex (real-time, serverless)
- **Auth:** Clerk (multi-provider, JWT)
- **AI:** Claude API (coming Day 13)
- **Hosting:** Vercel (coming Day 26)

---

## 📊 Development Status

**Current Day:** 11 of 30  
**Progress:** 40%  
**Phase:** Core Features (Days 11-15)

---

## ✅ Completed Features

### Infrastructure (Days 1-10)
- ✅ Next.js 14 with TypeScript and App Router
- ✅ Shadcn UI components with VELA brand colors
- ✅ Convex database with real-time subscriptions
- ✅ Clerk authentication with JWT integration
- ✅ Protected routes with middleware
- ✅ Automatic user creation on sign-up
- ✅ Dark mode support
- ✅ Mobile-responsive design
- ✅ Git repository with clean commit history

### Document Management (Day 11)
- ✅ File upload with drag & drop
- ✅ Support for PDF, TXT, MD (up to 10MB)
- ✅ Background text extraction
- ✅ Real-time status badges (Processing, Ready, Error)
- ✅ Content preview on document cards
- ✅ Document metadata tracking
- ✅ Beautiful PORT-branded upload UI
- ✅ "What Happens Next" user guidance
- ✅ Instant processing for text files
- ✅ Duplicate detection via content hashing

---

## 🚧 In Progress / Upcoming

### Days 12-15: Core Features
- [ ] Full-text search (Day 12)
  - COMPASS-branded search bar
  - Instant results as you type
  - Content highlighting
  - Filter by document type
  
- [ ] Claude API integration (Day 13)
  - Environment setup
  - Basic Q&A flow
  - Error handling
  
- [ ] AI-powered Q&A (Days 14-15)
  - LIGHTHOUSE-branded interface
  - Streaming responses
  - Source citations
  - Confidence scoring

### Days 16-20: LAMINAR Algorithm
- [ ] Stage 1: Self-organization (clustering)
- [ ] Stage 2: Temporal pattern detection
- [ ] Stage 3: Cross-document intelligence
- [ ] Stage 4: Butterfly effect prediction
- [ ] Stage 5: Fractal wisdom extraction

### Days 21-25: Polish & Billing
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Stripe integration
- [ ] Analytics dashboard
- [ ] Beta user onboarding

### Days 26-30: Launch Prep
- [ ] Marketing landing page
- [ ] Documentation
- [ ] Product Hunt materials
- [ ] Public launch
- [ ] First customers! 🎉

---

## 🎨 Brand Identity

**Colors:**
- **Deep Ocean Navy** (#1B3D5C) - Primary
- **Teal** (#00BCD4) - Interactive elements

**Nautical Metaphor System:**
- **PORT** - Document upload
- **COMPASS** - Search feature
- **LIGHTHOUSE** - AI answers
- **HELM** - User dashboard
- **CURRENTS** - Related documents
- **ARCHIPELAGOS** - Document clusters

**Voice:** The Knowledgeable Captain - confident guide who respects autonomy

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development servers (run in separate terminals)
npm run dev        # Next.js (localhost:3000)
npx convex dev     # Convex backend

# Open http://localhost:3000
```

---

## 📁 Project Structure

```
vela/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/[[...sign-in]]/
│   │   └── sign-up/[[...sign-up]]/
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/
│   │   └── documents/
│   │       ├── page.tsx          # Document list ✅
│   │       └── new/
│   │           └── page.tsx      # Upload page ✅
│   ├── (marketing)/              # Public pages
│   │   └── page.tsx              # Landing page ✅
│   ├── layout.tsx                # Root layout ✅
│   └── globals.css               # VELA colors ✅
│
├── components/
│   ├── ui/                       # Shadcn components
│   └── upload-zone.tsx           # Upload component ✅
│
├── convex/
│   ├── _generated/               # Auto-generated types
│   ├── schema.ts                 # Database schema ✅
│   ├── documents.ts              # Document queries/mutations ✅
│   ├── users.ts                  # User management ✅
│   └── auth.config.ts            # Clerk JWT config ✅
│
├── lib/
│   └── utils.ts                  # Utility functions
│
└── middleware.ts                 # Route protection ✅
```

---

## 🔐 Environment Variables

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://[your-deployment].convex.cloud
CONVEX_DEPLOYMENT=prod:[your-name]

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://[your-app].clerk.accounts.dev

# Claude API (coming Day 13)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🧪 Testing

### Current Test Coverage
- ✅ Authentication flow
- ✅ Document upload (text files)
- ✅ Real-time status updates
- ✅ Mobile responsive design
- ✅ Error handling
- ✅ Edge cases (file validation, size limits)

### Manual Testing Checklist
- [x] Desktop upload (drag & drop)
- [x] Desktop upload (click to browse)
- [x] Mobile upload
- [x] Multiple file uploads
- [x] Real-time badge updates
- [x] Content preview display
- [x] Navigation flow

---

## 📈 Key Metrics (Planned)

- **Upload Time:** <2 seconds for text files
- **Search Time:** <500ms for results
- **AI Response:** <5 seconds for answers
- **Uptime:** 99.9% target
- **Real-time Sync:** <100ms latency

---

## 🎯 Success Criteria

### MVP Launch (Day 30)
- [ ] Users can upload documents
- [ ] Users can search documents
- [ ] Users can ask AI questions
- [ ] Real-time updates work
- [ ] Mobile-friendly
- [ ] Nautical branding consistent
- [ ] Error handling complete
- [ ] 5 beta users signed up

### Post-MVP (Months 2-3)
- [ ] LAMINAR algorithm live
- [ ] 100+ active users
- [ ] First paid subscribers
- [ ] Chaos theory patterns validated
- [ ] Multi-vertical expansion started

---

## 📚 Documentation

- `/docs/VELA-30-Day-MVP-Sprint-v6_0.md` - Complete sprint plan
- `/docs/VELA-Complete-Strategic-Analysis-v3_0-CONSOLIDATED.md` - Strategy
- `/docs/VELA-Knowledge-Navigator-UPDATED.md` - Quick reference
- `/LEARNING_LOG-Day_XX.txt` - Daily learning logs

---

## 🤝 Contributing

Currently in MVP development phase (single developer). Feedback and suggestions welcome!

---

## 📝 License

Proprietary - All rights reserved

---

## 🎊 Recent Updates

### Day 11 (January 28, 2026)
- ✅ Complete file upload system
- ✅ Real-time processing with status badges
- ✅ Beautiful PORT-branded UI
- ✅ Mobile responsive design
- ✅ Text file extraction working
- ✅ Content preview on documents
- ✅ Duplicate detection
- ✅ ~1,200 lines of production code

### Day 10 (January 26, 2026)
- ✅ Infrastructure checkpoint passed
- ✅ Project knowledge consolidated (38 → 18 files)
- ✅ VELA Knowledge Navigator created
- ✅ All systems tested and ready

### Day 9 (January 25, 2026)
- ✅ First real-time feature (document list)
- ✅ Multi-tab synchronization verified
- ✅ Add/delete documents working

### Day 8 (January 24, 2026)
- ✅ Clerk authentication integrated
- ✅ Protected routes with middleware
- ✅ Automatic user creation

### Day 7 (January 23, 2026)
- ✅ Convex database configured
- ✅ Multi-vertical schema designed
- ✅ Search indexes created

### Day 6 (January 22, 2026)
- ✅ Next.js 14 setup complete
- ✅ Shadcn UI configured
- ✅ VELA brand colors implemented
- ✅ Landing page created

---

## 🚢 About VELA

VELA is an AI-powered knowledge management platform built on chaos theory principles. Instead of forcing knowledge into rigid folders, VELA uses the LAMINAR algorithm to let information self-organize based on how teams actually work.

**Target Market:** Musicians (beachhead) → Customer Support → Sales → Medical → Legal

**Unique Value:**
- Self-organizing knowledge (no manual categorization)
- Chaos theory pattern recognition
- Cross-vertical learning (competitive moat)
- Real-time collaboration
- 8 hours saved per week per user

**Founding Story:** Built by Will, transitioning from 14 years in logistics at FedEx Ground while completing BS in Software Engineering. Combining domain expertise in knowledge management with technical skills and chaos theory insights.

---

**Last Updated:** January 28, 2026 (Day 11)  
**Status:** 🟢 Active Development  
**Next Milestone:** Full-text search (Day 12)

---

⛵ **Smooth sailing ahead!** 🚢