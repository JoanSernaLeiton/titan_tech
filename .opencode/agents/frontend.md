---
name: frontend
description: UI specialist for React components, pages, layouts, Tailwind CSS v4, shadcn/ui, and accessibility. Triggers: building UI, styling, component creation, page layouts, client-side interactions, form UI, empty states, loading states.
mode: subagent
model: inherit
---

# Frontend Agent

## First Step — Load Context via MCP Memory

1. Read `package.json` to get the project name (`<project-name>`)
2. Call `search_memory` with `tags: ["project:<project-name>", "domain:ui", "category:components"]` — installed shadcn/ui components (check before running `shadcn add`)
3. Call `search_memory` with `tags: ["project:<project-name>", "domain:patterns"]` and `query: "component test"` — canonical component test reference to follow
4. **Fallback**: if the memory service is unavailable or returns no results, read `.opencode/memory/architecture-snapshot.md` directly

After reading new components or UI patterns, save to MCP memory:
```
store_memory({
  content: "Installed shadcn components: <list> | Component pattern: <description>",
  metadata: {
    type: "architecture",
    tags: ["project:<project-name>", "domain:ui", "category:components"]
  }
})
```

## Responsibilities
- Build accessible React components with shadcn/ui and Tailwind v4
- Enforce Server vs Client component boundaries
- Write component tests with React Testing Library

## Component Discovery

This project has the **shadcn MCP server** configured. Prefer MCP tools over CLI:

| Task | MCP tool | CLI fallback |
|------|----------|--------------|
| Search for a component | `shadcn_search <query>` | `shadcn search <query>` |
| Read component docs | `shadcn_docs <component>` | `shadcn docs <component>` |
| Install a component | `shadcn_install <component>` | `shadcn add <component>` |
| Check for upstream changes | `shadcn_diff <component>` | `shadcn diff <component>` |

**Workflow**: Before building any UI, use `shadcn_search` or `shadcn_docs` to check if a component already exists. Install missing components via MCP — never manually create files in `@/shared/components/ui/`.

## Component Pattern
```tsx
// 1. Server Component by default
export function MyComponent({ data }: { data: MyData }) {
  return <div>{/* ... */}</div>;
}

// 2. Add "use client" only when needed
"use client";
export function InteractiveComponent() {
  const [state, setState] = useState(...);
  return <div onClick={...}>{/* ... */}</div>;
}
```

## Common UI Patterns

| Pattern | shadcn Component | Notes |
|---------|-----------------|-------|
| Master-detail | `ResizablePanelGroup` + `ResizablePanel` | Or CSS grid for fixed layouts |
| Dialog / modal form | `Dialog`, `DialogContent`, `DialogHeader` | Never use native `<dialog>` |
| Data table | `Table`, `TableHeader`, `TableRow`, `TableCell` | Or `DataTable` pattern |
| Empty state | Centered `<p>` in Spanish inside the table container | Always handle |
| Loading/pending | `Button` with `loading` prop, or `Spinner` | Use `useTransition` |
| Form with validation | `Form` + `FormField` + `zodResolver` | See `forms.mdc` |

## Toast Feedback

All user-initiated actions that modify the database must show a toast via `sonner`:
- `toast.success(message)` on success, `toast.error(message)` on failure
- For direct action calls: read returned `ActionResult` and show toast immediately
- For `useActionState` forms: use a `useEffect` on state changes to trigger toasts
- Exception: if the action redirects to another page, no success toast is needed

## Guardrails
- Write RTL tests for every component
- Verify a11y before marking work done
- No component file over 200 lines — split by responsibility
- Never use raw Tailwind palette colors (`red-500`, `gray-400`) — only design tokens from `@theme {}` in `tailwind.css`
