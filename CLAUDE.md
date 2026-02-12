# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev               # Start dev server (Next.js + Turbopack)
npm run build             # Production build
npm run lint              # ESLint checks

# Database – PostgreSQL (Prisma)
npm run db:migrate        # Run migrations (local)
npm run db:push           # Push schema changes (local, --accept-data-loss)
npm run db:seed           # Seed PostgreSQL
npm run db:generate       # Regenerate Prisma client
npm run db:studio         # Open Prisma Studio

# Database – Neo4j
npm run neo4j:seed        # Seed Neo4j with sample data
npm run neo4j:clear       # Clear all Neo4j data

# Local infrastructure
npm run docker:up         # Start PostgreSQL + Neo4j containers
npm run docker:down       # Stop containers
npm run docker:reset      # Full local DB reset

# Full reset (staging)
npm run db:reset          # Clear Neo4j + reset PostgreSQL + reseed
```

No test runner is configured (no `npm run test` script). Jest is installed but not wired up.

## Architecture Overview

Dance-Chives is a street dance event archive. The core data model: **Events** contain **Sections** (e.g., prelims, top 16), which contain **Videos** (battles, freestyles, etc.). Users can be tagged in videos and request ownership of event pages.

### Dual-Database Strategy

**Neo4j** is the **source of truth** for all relational data. **PostgreSQL** (Prisma) holds **denormalized read models** for fast filtering and card rendering. Always write Neo4j first; PostgreSQL is derived from it.

Write order is critical:
1. Write to Neo4j → get `event_id`
2. Write to PostgreSQL using that `event_id`
3. If Neo4j fails → abort. If PostgreSQL fails → it can be rebuilt.

**Neo4j** uses type-specific labels to avoid conflicts (e.g., `BattleEvent`, `BattleSection`, `BattleVideo`). Label translation logic lives in `src/db/queries/event.ts` (lines 48–190).

**PostgreSQL** key tables:
- `EventCard` – denormalized event data with GIN-indexed `styles[]` array
- `EventDate` – UTC instants + local calendar dates
- `SectionCard` – denormalized section data
- `UserCard` – denormalized user profile data

All query files are in `src/db/queries/`.

### LLM Pipeline (Video Categorization)

When ingesting a YouTube playlist, three sequential LLM calls process the videos:
1. **Groq** (`llama-3.3-70b-versatile`, temp 0.01) – categorize videos into sections
2. **Cohere** (`command-r7b-12-2024`, temp 0) – organize battle sections into bracket rounds (Prelims, Top 16, etc.)
3. **Cohere** – sanitize video titles to "Dancer A vs Dancer B" format

Both models are configured for JSON-only responses. Each step validates and auto-fixes missing videos and duplicates. See `src/lib/llm.ts` (orchestrator) and `src/lib/llm-utils.ts` (prompts and types).

Battle sections must have `hasBrackets: true` with videos nested inside `brackets[]`, never in `videos[]` directly.

### Authentication

NextAuth v5 (JWT strategy) with Google OAuth and magic link email login. JWT is extended with `authLevel` (0–4), `username`, and `displayName` fetched from Neo4j. Auth config is in `src/auth.ts`.

Auth levels:
- 0: Base User
- 1: Creator (can submit events)
- 2: Moderator
- 3: Admin
- 4: Super Admin (access to LLM features)

### Key Source Locations

| Concern | Location |
|---|---|
| Dance styles whitelist (22 styles) | `src/lib/utils/dance-styles.ts` |
| LLM pipeline | `src/lib/llm.ts`, `src/lib/llm-utils.ts` |
| Neo4j driver init | `src/db/driver.ts` |
| Neo4j event queries + label translation | `src/db/queries/event.ts` |
| PostgreSQL event card queries | `src/db/queries/event-cards.ts` |
| Prisma client singleton | `src/lib/prisma.ts` |
| Autofill (metadata extraction) API | `src/app/api/events/autofill/route.ts` |
| PostgreSQL schema | `prisma/schema.prisma` |
| Neo4j seed patterns (Cypher reference) | `scripts/seed-neo4j.ts` |
| Server actions | `src/lib/server_actions/` |

### Routing

Uses Next.js App Router. Pages are under `src/app/`. All non-API routes are co-located with their page components. API routes live in `src/app/api/`.

The root layout (`src/app/layout.tsx`) wraps everything in: `SessionProvider` → `SubmissionOverlayProvider` → `SidebarProvider` → `PageLoadingProvider`.

### Environment Variables

```
DATABASE_URL                  # PostgreSQL
NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD
GROQ_API_KEY
COHERE_API_KEY
YOUTUBE_API_KEY
PERPLEXITY_API_KEY
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
RESEND_API_KEY
CLOUDFLARE_R2_PUBLIC_URL
NEXTAUTH_SECRET
APP_ENV                       # staging | production | development
```

### Dance Styles

Exactly 22 valid styles (case-sensitive). Always validate against the whitelist in `src/lib/utils/dance-styles.ts`. Never hardcode the list elsewhere.
