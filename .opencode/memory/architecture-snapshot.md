# Architecture Snapshot

> Auto-updated after each feature. Agents MUST read this before exploring the codebase.

## Installed shadcn/ui Components

button, card, input, label, spinner

_Add new components here after `shadcn add <component>`_

## DB Schema

| Table | Columns |
|-------|---------|
| `profiles` | id (uuid PK), email (text unique), createdAt, updatedAt |
| `todos` | id (uuid PK), userId (uuid), title (text), completed (bool), createdAt |

_Add new tables here after `pnpm db:generate && pnpm db:migrate`_

## Existing Features

| Feature | Path | Description |
|---------|------|-------------|
| auth | `src/features/auth/` | Login/logout, cookie-based sessions via Supabase |
| todos | `src/features/todos/` | CRUD todos with Supabase RLS |

_Add new features here after implementation_

## Canonical Pattern References

Read these files to understand the project's proven patterns before writing new code:

| Pattern | File |
|---------|------|
| Server Action | `src/features/todos/actions/todos.action.ts` |
| Query (repository) | `src/features/todos/queries/todos.queries.ts` |
| Client component | `src/features/todos/components/todo-list.tsx` |
| Action test | `src/features/todos/__tests__/todos.action.test.ts` |
| Component test | `src/features/todos/__tests__/todo-list.test.tsx` |
| Supabase mock chain | `src/shared/test-utils/supabase-mock.ts` |

## Key Rules (summary)

- Runtime queries: Supabase client only — Drizzle is schema/migrations only
- All mutations: Server Actions returning `ActionResult` from `@/shared/lib/action-result`
- Auth check first in every Server Action: `supabase.auth.getUser()`
- Toast feedback required for every mutation (success + error) via `sonner`
- RLS must be enabled on every table before a feature is considered complete
- UI text: Spanish | Code-level text: English (test descriptions, variable names)
- Coverage threshold: 95% statements/functions/lines, 90% branches — use `/* v8 ignore next */` for genuinely unreachable defensive branches

## Shared Utilities

Reuse these before writing new helpers:

| Utility | Location | Purpose |
|---------|----------|---------|
| `formFieldText(formData, key)` | `src/shared/lib/form-utils.ts` | Safe `FormData` text extraction — avoids `no-base-to-string` lint error |
| `firstZodIssueMessage(error)` | `src/shared/lib/zod-utils.ts` | Extract first Zod validation error message |
| `readUploadFileBuffer(file)` | `src/shared/lib/upload-utils.ts` | Read a `File`/`Blob` upload to `ArrayBuffer` safely |

## Strict Rules Reference

Read this before writing any code. These are the rules that most often cause post-hoc fix cycles.

### TypeScript Compiler (`tsconfig.json`)

`"strict": true` plus additional flags:

| Flag | What it enforces | How to comply |
|------|-----------------|---------------|
| `noUncheckedIndexedAccess` | `arr[i]` / `obj[key]` return `T \| undefined` | Guard: `const val = arr[0]; if (val) { ... }` |
| `exactOptionalPropertyTypes` | Cannot assign `undefined` to optional props | Omit the key entirely; never write `{ prop: undefined }` |
| `noImplicitOverride` | Subclass overrides need `override` keyword | `override render() {}` |
| `noFallthroughCasesInSwitch` | Every `case` needs `break`/`return`/`throw` | Add `break` to every case |
| `noImplicitReturns` | Every code path must return | Add explicit `return` in all branches |
| `noUnusedLocals` / `noUnusedParameters` | No unused vars/params | Prefix unused params with `_` |
| `useUnknownInCatchVariables` | `catch (e)` → `e` is `unknown` | Narrow: `if (e instanceof Error)` before `.message` |

### ESLint — Rules That Most Often Trip AI Agents

Preset: `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked`. Runs with `--max-warnings 0` (warnings = errors).

**Unsafe-any family (all "error"):**
- `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`, `no-unsafe-argument`
- Never let `any` flow through. Cast `JSON.parse()` results. Type all mock returns explicitly.

**Promise handling:**
- `no-floating-promises`: Every Promise must be `await`ed, returned, or `void`-prefixed
- `no-misused-promises`: Async functions in React event handlers need a `void` wrapper: `onClick={() => void handleSubmit()}`
- `require-await`: `async` functions must contain `await`; remove `async` if not needed
- `return-await`: Must use `return await` inside `try/catch`

**Type safety:**
- `no-explicit-any`: Use `unknown` and narrow; never use `any`
- `no-non-null-assertion`: Cannot use `!` postfix; narrow with conditionals
- `no-base-to-string`: Objects without `toString()` cannot appear in template literals or string concatenation — use `formFieldText()` for `FormData` values
- `restrict-template-expressions`: Template literals only accept `string | number | boolean`
- `no-unnecessary-condition`: Don't check conditions that are always truthy/falsy per types
- `unbound-method`: Don't detach methods from objects; bind or use arrow functions
- `only-throw-error`: Only throw `Error` instances, never strings or plain objects
- `use-unknown-in-catch-callback-variable`: `.catch(err => ...)` — `err` must be `unknown`

**Imports & style:**
- `consistent-type-imports`: Use `import type { X }` for type-only imports
- `import-x/order`: Imports grouped (builtin → external → internal → parent → sibling → index), alphabetized, blank lines between groups
- `no-inferrable-types`: Don't annotate types TS can infer (`const count: number = 0` → `const count = 0`)
- `prefer-optional-chain`: Use `?.` instead of `&&` chains
- `prefer-nullish-coalescing`: Use `??` instead of `||` for nullable defaults
- `consistent-type-definitions`: Prefer `interface` over `type` for object shapes
- `array-type`: Use `T[]` not `Array<T>`

**React-specific:**
- `react-hooks/rules-of-hooks`: Hooks only at top level of components/custom hooks
- `react-hooks/exhaustive-deps`: All reactive values must be in hook dependency arrays

**Console:**
- `no-console`: warn — but `--max-warnings 0` makes it an error. Only allowed in `**/error.tsx`.

**Test files (`.test.ts`, `.test.tsx`):**
- `vitest/expect-expect`: Every test must have an assertion
- `vitest/no-identical-title`: Test titles must be unique
- `vitest/no-conditional-expect`: No `expect()` inside conditionals

### File-specific exceptions
- `**/error.tsx`: `no-console` disabled (Next.js error boundaries)
- `src/shared/lib/supabase/server.ts`, `middleware.ts`: `no-deprecated` disabled (Supabase SSR)
