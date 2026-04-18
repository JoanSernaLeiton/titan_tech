# Agent Routing

Use the specialist agents in `.cursor/agents/` for focused tasks:

| Agent | Use when |
|-------|----------|
| `@technical-lead` | Default entry point — task breakdown, architecture decisions, orchestration |
| `@backend` | Server Actions, Drizzle schema, Supabase RLS, API routes, migrations |
| `@frontend` | React components, shadcn/ui, Tailwind, pages, form UI |
| `@test-qa` | TDD workflow, test writing, coverage gaps, mock setup |
| `@code-reviewer` | Branch/PR review — readonly, fast model |
| `@security-researcher` | Security audit, vulnerability check, auth review — readonly |
| `@business-analyst` | Requirements discovery, BA+TL collaboration, combined plan with functional + technical task lists |

# Feature Development Workflow

**New feature** (2 conversations):
```
Conversation 1: /discover-feature <description>  →  writes .requirements/<name>.md
Conversation 2 (fresh): /build-feature @.requirements/<name>.md
```

**Bug fix:** `@test-qa` (reproduce) → `@backend`/`@frontend` (fix) → `@code-reviewer`

**Refactor:** `@technical-lead` (plan) → `@backend`/`@frontend` (implement) → `@test-qa` (verify) → `@code-reviewer`

**API endpoint only:** `/create-api-route` → `@code-reviewer`

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Environment variables

Read `.env.example` for the full list. Key vars:

| Variable | Visibility | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase > Project Settings > API |
| `DATABASE_URL` | Server only | Supabase > Project Settings > Database > Connection string (Session mode) |

- `NEXT_PUBLIC_*` vars are safe to expose to the browser — they are public by design
- Never add `NEXT_PUBLIC_` prefix to secret keys (`DATABASE_URL`, `AI_API_KEY`)
- `.env.local` is gitignored — never commit real credentials

# Migrations

Migration files in `src/shared/db/migrations/` are auto-generated. NEVER create, edit, or delete them directly.
- Edit schema: `src/shared/db/*.schema.ts` (one file per table)
- Generate migration: `pnpm db:generate`
- Apply migration: `pnpm db:migrate`
- Push schema (dev only): `pnpm db:push`
