---
name: discover-feature
description: Run the two-role requirements discovery process for a new feature. The Business Analyst asks structured questions, then collaborates with the Technical Lead to assess complexity and produce a complete plan with functional and technical task lists. Writes the plan to .requirements/<feature-name>-<timestamp>.md. Use this in Conversation 1, then start a new conversation and run /build-feature. Triggers: 'new feature', 'define requirements', 'discover feature', 'I want to build'. NOT for: already-defined features (use /build-feature directly).
compatibility: opencode
---

# Discover Feature Skill

> **Invoke as:** `/discover-feature <feature-description>`
> After this skill completes, **start a new conversation** before running `/build-feature`.

## IMPORTANT: Token Budget

This conversation is for requirements and planning only. Do NOT start implementation here. When done, start a fresh conversation to keep the implementation context clean.

---

## Process

### Step 1 — BA: Load Existing Features via MCP Memory

1. Read `package.json` to get the project name (`<project-name>`)
2. Call `search_memory` with `tags: ["project:<project-name>", "domain:features"]` — understand existing features and relationships
3. **Fallback**: if memory service is unavailable, read `.opencode/memory/architecture-snapshot.md` → "Existing Features" section

### Step 2 — BA: Discovery Questions

Ask ALL of the following before writing anything. Cover at minimum questions 1–3 + any relevant ones from 4–8.

1. **Problem & audience** — "What problem does this solve? Who experiences it?"
2. **User flows** — "Walk me through the happy path. What happens on error?"
3. **Edge cases & constraints** — "What are the limits? What should NOT happen?"
4. **Field constraints** — "What are the length limits, allowed formats, required vs optional fields?"
5. **Volume & scale** — "How many records are expected? Do you need search or pagination?"
6. **File/upload specifics** — (if applicable) "What file types and size limits are allowed?"
7. **Privacy & access** — "Who can see this data? Is it per-user or shared?"
8. **Relationship to existing features** — (informed by MCP memory) "Does this link to `<existing feature>`?"
9. **Confirm understanding** — Restate what you heard and ask for approval before writing

If the user says "just do it" without answering, document all assumptions explicitly in an `## Assumptions` section.

Only after the user confirms your understanding should you proceed to Step 3.

### Step 3 — BA: Draft Functional Spec

Write a draft functional spec (not yet the final plan):

```markdown
### User Story
As a [user type], I want [goal] so that [reason].

### Acceptance Criteria
- [ ] AC1: When [user does X], they see [Y]
- [ ] AC2: When [error condition], user sees [message/state]
- [ ] AC3: [Edge case]: [expected outcome]

### Functional Test Cases
- [ ] TC1 (AC1): User does X → sees Y (happy path)
- [ ] TC2 (AC2): User triggers error → sees error message
- [ ] TC3 (AC3): Edge case behavior visible to user
```

### Step 4 — Tech Lead: Codebase Complexity Assessment

Hand the draft spec to `@technical-lead` with this request:
> "Here is the draft functional spec for [feature]. Please: (1) read the relevant codebase areas, (2) save your findings to MCP memory, (3) report: complexity assessment, affected files, risks not in the spec, recommended technical task breakdown grouped for parallel execution."

The Tech Lead will:
1. Read relevant source files (actions, queries, schema, components)
2. Store findings in MCP memory with appropriate tags
3. Return a complexity report with a technical task breakdown

### Step 5 — BA + Tech Lead: Produce Combined Plan

Merge the functional spec (BA) and technical breakdown (Tech Lead) into the final plan:

```markdown
## Feature: [Feature Name]
**Timestamp**: [ISO timestamp — e.g. 2026-04-11T14:30:00Z]

---

### Context
[One paragraph: what problem this solves, who benefits, key constraints]

---

### User Story
As a [user type], I want [goal] so that [reason].

### Acceptance Criteria
- [ ] AC1: When [user does X], they see [Y]
- [ ] AC2: When [error condition], user sees [message/state]
- [ ] AC3: [Edge case]: [expected outcome]

### Functional Test Cases
- [ ] TC1 (AC1): User does X → sees Y (happy path)
- [ ] TC2 (AC2): User triggers error → sees error message
- [ ] TC3 (AC3): Edge case behavior visible to user

---

### Functional Task List (BA-owned)
Ordered by user value. Each task is independently testable.

- [ ] FT1: [Functional capability — user-visible description]
- [ ] FT2: [Functional capability]
- [ ] FT3: [Edge case or constraint handling]

---

### Technical Task List (Tech Lead-owned)
Derived from functional tasks. Scoped per agent. Parallel groups marked.

**Group A — Backend (runs in parallel with Group B)**
- [ ] TT1: [Schema/migration/RLS task]
- [ ] TT2: [Server Action/query task]

**Group B — Frontend (runs in parallel with Group A)**
- [ ] TT3: [Component/page task]
- [ ] TT4: [Form/hook task]

**Group C — Sequential gates (after A + B complete)**
- [ ] TT5: Test RED phase — @test-qa writes failing tests
- [ ] TT6: Test GREEN phase — @backend + @frontend in parallel
- [ ] TT7: Review gate — @code-reviewer + @security-researcher in parallel

---

### Technical Notes (from Tech Lead)
[Complexity, affected files with paths, patterns to reuse, risks]

---

### Assumptions
[If user skipped any discovery questions, list assumptions here]
```

**Rules:**
- Acceptance criteria use plain functional language — no code, no implementation details
- Test cases describe what the **user sees**, not system internals
- Every acceptance criterion maps to at least one test case
- No mention of database tables, API calls, or file paths in the functional section
- Technical tasks are grouped for parallel execution where possible
- Write requirements in the user's language; IDs (`AC1`, `FT1`, `TT1`) and technical terms stay in English

### Step 6 — Write Plan to File

Save the combined plan to `.requirements/<feature-name>-<timestamp>.md`.

Use the feature name in kebab-case and ISO timestamp (e.g., `user-notifications-2026-04-11T1430.md`).

### Step 7 — Store in MCP Memory

```
store_memory({
  content: "Requirement: <feature-name> — <one-line summary of what the feature does and key acceptance criteria>",
  metadata: {
    type: "architecture",
    tags: ["project:<project-name>", "domain:features", "category:requirement", "feature:<feature-name>", "status:pending-snapshot"]
  }
})
```

### Step 8 — Hand Off

Tell the user:

> Requirements and technical plan written to `.requirements/<feature-name>-<timestamp>.md`.
>
> **Next step**: Start a new conversation and run:
> ```
> /build-feature @.requirements/<feature-name>-<timestamp>.md
> ```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| User says "just do it" without answering | Wants to skip discovery | Document all assumptions in `## Assumptions` |
| MCP memory unavailable | Service not running | Fall back to reading `.opencode/memory/architecture-snapshot.md` |
| Feature overlaps with existing one | Missed relationship check in Step 1 | Re-query MCP with `domain:features`, clarify scope with user |
| Tech Lead finds major technical blocker | Spec doesn't account for constraint | Update acceptance criteria before finalizing plan |

---

## Guardrails
- BA always asks questions before writing — never assume requirements
- Tech Lead always saves codebase findings to MCP memory
- Do NOT start any implementation in this conversation
- Document all assumptions explicitly if the user skips questions
- Hand off to `/build-feature` in a fresh conversation — never chain them in the same conversation
