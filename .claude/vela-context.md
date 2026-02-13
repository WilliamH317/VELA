# VELA Project Context

Deep context for AI assistants working on the VELA codebase.

## Product Domain

VELA is a knowledge management platform for knowledge workers (beachhead: musicians). Users upload documents (PDF, text, markdown), search across them, and ask AI-powered questions that return cited answers from their knowledge base.

**Mission**: Instantly connect knowledge workers with answers across scattered documents.
**Expansion path**: Musicians → Customer Support → Sales → Medical → Legal

## Brand Requirements

- Colors: ONLY Navy `#1B3D5C` and Teal `#00BCD4`
- Terminology: Use "ARCHIPELAGOS" not "clusters" when referring to document groupings
- Messaging: Nautical theme, no corporate jargon
- Loading: Wave animations, NEVER generic spinners

## Nautical Naming Convention

Every user-facing feature uses a nautical metaphor. Maintain this consistently in UI copy, error messages, and component naming.

| Feature         | Codename      | Meaning                               |
|-----------------|---------------|---------------------------------------|
| Dashboard       | HELM          | Ship's control center                 |
| Document Upload | PORT          | Ships arrive at port with cargo       |
| Full-text Search| COMPASS       | Navigation tool for finding direction |
| AI Q&A          | LIGHTHOUSE    | Guiding beacon illuminating knowledge |
| Related Docs    | CURRENTS      | Ocean flows connecting information    |
| Doc Groupings   | ARCHIPELAGOS  | Islands of related knowledge          |
| User            | CAPTAIN       | Commander of their knowledge vessel   |

Error messages use nautical metaphors (e.g., "High tide of requests", "Stormy seas encountered").

## Current Status

- Day 16 of 30 (53% complete)
- Phase: LAMINAR Algorithm (Days 16-20)
- Next: Implement Stage 1 (Self-Organization with TF-IDF + K-Means)

## 30-Day Sprint Context

Development started January 19, 2026. The project follows a phased sprint:

- **Days 1-10** (Foundation): Next.js, Convex, Clerk auth — COMPLETE
- **Days 11-15** (Core Features): Upload, search, Claude AI, LIGHTHOUSE — COMPLETE
- **Days 16-20** (LAMINAR Algorithm): Self-organizing ARCHIPELAGOS, pattern detection — IN PROGRESS
- **Days 21-30** (Launch): Stripe billing, analytics, marketing, Product Hunt — PLANNED

The `chaosMetadata` field on documents is reserved for the LAMINAR algorithm (Days 16-20) and is currently unused.

## Convex Backend Patterns

### Function Types
- **query** — Read-only, real-time subscribed via WebSocket. Use for data fetching.
- **mutation** — Transactional writes. Cannot call external APIs.
- **action** — Can call external APIs (Claude, etc.) but NOT directly read/write DB. Must use `ctx.runQuery()` / `ctx.runMutation()` to access data.
- **internalQuery/internalMutation/internalAction** — Not exposed to client. Used for background jobs (e.g., `processFile`).

### Authentication Pattern
Every public query/mutation must start with:
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

// Actions (server-side operations like AI calls)
const ask = useAction(api.ai.askQuestion);
```

### Component Organization
- `src/components/ui/` — Shadcn UI primitives (button, card, dialog, etc.). Do not modify directly.
- `src/components/` — App-level components (lighthouse-search, upload-zone, user-setup)
- `src/components/dashboard/` — Dashboard-specific components
- `src/components/shared/` — Reusable app components
- `src/components/marketing/` — Landing page components

### Styling
- Tailwind CSS 4 with VELA brand colors via CSS variables
- Primary navy: `#1B3D5C` (backgrounds, text)
- Accent teal: `#00BCD4` (interactive elements, CTAs)
- Navy-to-teal gradients for premium features (LIGHTHOUSE nav link)
- Dark mode via `next-themes` (class-based strategy)
- Shadcn UI uses "new-york" style variant

## AI Integration (LIGHTHOUSE)

Two modes in `convex/ai.ts`:
- **`askQuestion`** — Manual mode: user selects specific document IDs. Best for focused queries.
- **`generateAnswer`** — Auto mode: uses full-text search to find relevant documents automatically.

Both call Claude Sonnet 4 via `@anthropic-ai/sdk` and log results to the `queries` table for analytics.

Constraints:
- Max 20 documents per query (`MAX_DOCUMENTS`)
- Max 8000 chars per document in context (`MAX_CHARS_PER_DOC`)
- Max 1000 char queries (`MAX_QUERY_LENGTH`)
- Default 2048 max response tokens

## Known Limitations

- PDF text extraction is currently a placeholder (module resolution issue with pdf-parse in Convex runtime). Text/markdown files work fully.
- No pagination on document list queries
- No test framework configured
- `vertical` field defaults to "musician" for all uploaded documents
- The README schema example is simplified and doesn't match the actual `convex/schema.ts` — always reference the real schema file
