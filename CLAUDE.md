@AGENTS.md
@.claude/rules/general.mdc
@.claude/rules/architecture.mdc
@.claude/rules/coding-standards.mdc

# Context-Specific Rules

Read these rules when working on related files:
- Data fetching (components, queries, hooks, actions): `.claude/rules/data-fetching.mdc`
- Security (actions, API routes, auth, config): `.claude/rules/security.mdc`
- Components (UI, shadcn/ui, Tailwind): `.claude/rules/components.mdc`
- Forms: `.claude/rules/forms.mdc`
- Migrations: `.claude/rules/migrations.mdc`
- Next.js specifics: `.claude/rules/nextjs.mdc`
- Supabase (Drizzle, RLS, repository pattern): `.claude/rules/supabase.mdc`
- Testing: `.claude/rules/testing.mdc`

## Project goal

Build a unified solar monitoring platform for **Techos Rentables** that:
- Consolidates data from multi-brand solar installations (Growatt, Huawei FusionSolar, DeyeCloud) into a single view
- Detects device faults in **< 5 minutes**
- Eliminates **130+ hrs/month** of manual reporting work across 200+ client projects

## Middleware API

All provider data flows through the event middleware — never call provider APIs directly.

```
Base URL:   https://techos.thetribu.dev
Auth:       Authorization: tk_<team-api-key>   (header on every request)
Pattern:    https://techos.thetribu.dev/<provider>/<provider-path>
```

| Provider | Slug | Methods |
|---|---|---|
| DeyeCloud | `deye` | GET, POST |
| Huawei FusionSolar | `huawei` | GET, POST |
| Growatt | `growatt` | GET only |

The middleware handles all provider token renewal. A `401` means a missing or wrong team API key. A `502`/`503` is a transient provider issue — retry with exponential backoff.

**Store the API key in an env var (`API_KEY` or `TINKU_API_KEY`) — never hardcode it.**

### Quick smoke test

```bash
# Verify API key works
curl -H "Authorization: tk_TU_API_KEY" \
  "https://techos.thetribu.dev/growatt/v1/plant/list"

curl -X POST \
  -H "Authorization: tk_TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "https://techos.thetribu.dev/huawei/thirdData/getStationList"

curl -X POST \
  -H "Authorization: tk_TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 10}' \
  "https://techos.thetribu.dev/deye/v1.0/device/list"
```

## Agent Workflow

This project uses specialist agents in `.claude/agents/`. Follow the technical-lead workflow:

- **New feature**: `/discover-feature` (Conversation 1) → `/build-feature` (Conversation 2, fresh)
- **Bug fix**: reproduce with failing test (`test-qa`) → fix (`backend`/`frontend`) → review (`code-reviewer`)
- **Refactor**: plan (`technical-lead`) → implement (`backend`/`frontend`) → verify (`test-qa`) → review (`code-reviewer`)

### Recommended: 2-Conversation Workflow for New Features

Split new feature work across two conversations to avoid context exhaustion:

**Conversation 1 — Requirements** (Agent mode)
```
/discover-feature <description>  →  discovery questions  →  writes .requirements/<name>.md
```

**Conversation 2 — Build** (Agent mode, fresh conversation)
```
/build-feature @.requirements/<name>.md  →  planning → TDD pipeline → review → memory sync
```

The `/build-feature` skill reads the requirements file directly and runs the full pipeline — tech-lead planning, TDD implementation (backend + frontend in parallel), review gate, and memory sync. This keeps each conversation well under 60% context usage.

## Hackathon constraints

- **Always runnable**: the project must start with a single command from hour 1. If it breaks, fix it before adding features.
- **Vertical slices**: every team member should be able to demo a working feature end-to-end.
- **30-minute rule**: if a blocker doesn't resolve in 30 min, mock it or change approach.
- **Pitch**: 5 minutes exactly — practice with a timer.

## Evaluation criteria (6 pillars, 90 pts total)

See `docs/resources/rubrica_participantes.md` for full scoring. Key pillars:
1. Problem understanding & resolution impact
2. Innovation & creativity
3. UX/UI experience
4. Technical viability
5. Business scalability
6. Presentation (5-min pitch, strict cutoff)

## File Naming

- Server Actions: `name.action.ts` with `"use server"` at top
- React hooks: `use-name.ts`
- Components: PascalCase `.tsx`
- Tests: colocated in `__tests__/`, named `name.test.ts`

## MCP Memory Service

This project uses [mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) for persistent semantic memory across sessions.
Config is shared via `.cursor/mcp.json` (symlinked to `.mcp.json`).

If not installed automatically during scaffolding, install via `pipx` (works on macOS, Linux, Windows):

```bash
# macOS
brew install pipx && pipx ensurepath
pipx install mcp-memory-service

# Linux / Windows
pip install pipx
pipx install mcp-memory-service
```

> **macOS note:** If you see `SQLite extension loading not supported`, pipx picked Apple's Python.
> Fix: `pipx install mcp-memory-service --python $(brew --prefix python@3.12)/bin/python3.12`

### Memory Skill

Use `/memory` to sync and query project knowledge:

- `/memory sync` — Parse `architecture-snapshot.md` and store each entry in MCP memory (run after scaffolding; `/build-feature` runs this automatically at the end of each feature)
- `/memory recall "query"` — Semantic search across stored memories (avoids reading the full snapshot)
- `/memory update` — Merge `status:pending-snapshot` memories back into the snapshot file

### How Agents Use Memory

All agents (`technical-lead`, `frontend`, `backend`, `business-analyst`, `test-qa`) load context via targeted `search_memory` calls instead of reading the full snapshot. Each agent queries only the domains it needs, saving tokens. If the memory service is unavailable, agents fall back to reading `.cursor/memory/architecture-snapshot.md` directly.

## Key reference docs

- `docs/problem/problema.md` — canonical problem statement
- `docs/problem/contexto_operacional.md` — current operational flows and KPIs
- `docs/resources/technical_guide.md` — full middleware API guide with curl/JS/Python examples
- `docs/resources/rubrica_participantes.md` — scoring rubric

## Maintenance Notes
