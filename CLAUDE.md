# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VELA is an AI-powered knowledge management platform built as a 30-day MVP sprint. It helps knowledge workers find answers across scattered documents using AI (Claude Sonnet 4). The project uses a nautical naming convention: HELM (dashboard), PORT (upload), COMPASS (search), LIGHTHOUSE (AI Q&A).

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Backend**: Convex (real-time BaaS with WebSocket sync)
- **Auth**: Clerk (JWT-based, integrated with Convex)
- **AI**: Anthropic Claude Sonnet 4 via `@anthropic-ai/sdk`
- **Styling**: Tailwind CSS 4 + Shadcn UI (new-york style, lucide-react icons)
- **File Processing**: pdf-parse for PDF text extraction

## Development Commands

```bash
# Both must run simultaneously during development
npm run dev          # Next.js dev server (port 3000)
npx convex dev       # Convex backend (syncs schema, generates types)

npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
```

There is no test runner configured. Convex auto-generates types into `convex/_generated/` — never edit those files.

## Architecture

### Provider Chain (src/app/providers.tsx)

```
ClerkProvider → ConvexProviderWithClerk → ThemeProvider → UserSetup → children
```

`UserSetup` auto-creates/updates the Convex user record on sign-in using Clerk identity data.

### Route Groups (Next.js App Router)

- `(auth)/` — Sign-in/sign-up pages (public)
- `(dashboard)/` — All protected routes share a layout with nav, footer, mobile menu
- `(marketing)/` — Public landing page

Protected routes are enforced in `src/middleware.ts` via Clerk's `createRouteMatcher`.

### Convex Backend (convex/)

Three tables: `users`, `documents`, `queries`. Schema is in `convex/schema.ts`.

- **convex/documents.ts** — Document CRUD, file upload/processing, full-text search. Documents go through `processing → ready → error` status flow.
- **convex/ai.ts** — LIGHTHOUSE actions that call Claude API. Two modes: `askQuestion` (user selects docs) and `generateAnswer` (auto-search via full-text index).
- **convex/users.ts** — User management, Clerk ID lookups.
- **convex/queries.ts** — AI query logging for analytics.

Convex functions use `ctx.auth.getUserIdentity()` for auth. All document queries filter by `userId` (from `identity.subject`) for data isolation.

### Frontend Data Patterns

```typescript
// Real-time query (auto-updates via WebSocket)
const docs = useQuery(api.documents.list);

// Skip query when not authenticated
const docs = useQuery(api.documents.list, isAuthenticated ? {} : "skip");

// Mutations
const createDoc = useMutation(api.documents.create);

// Actions (server-side, for AI calls)
const askQuestion = useAction(api.ai.askQuestion);
```

## Anti-Patterns (Do NOT)
- Convex actions that use `internal.*` from the same file MUST have
  explicit return type annotations on the handler to avoid TS7022
  circular inference. Example: `handler: async (ctx): Promise<MyType> =>`

### Path Aliases

- `@/*` → `./src/*`
- `convex/*` → `./convex/*`

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL
- `CONVEX_DEPLOYMENT` — Convex deployment identifier
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- `CLERK_SECRET_KEY` — Clerk backend key
- `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer for Convex auth
- `ANTHROPIC_API_KEY` — Claude API key (used in Convex actions)
- `ANTHROPIC_MODEL` — Model name (default: `claude-sonnet-4-20250514`)
- `ANTHROPIC_MAX_TOKENS` — Max response tokens (default: 2048)

## Key Implementation Details

- Documents support types: pdf, text, markdown, slack, google-doc, notion, confluence
- PDF text extraction happens server-side in Convex actions using `pdf-parse`
- Duplicate detection uses SHA-256 content hashing (`by_user_and_hash` index)
- Full-text search uses Convex's `searchIndex` on `contentPlain` field
- AI responses are capped at `MAX_CHARS_PER_DOC = 8000` chars per document context
- Brand colors use CSS variables: primary navy `#1B3D5C`, accent teal `#00BCD4`
- Dark mode via `next-themes` with class-based toggling
