# Second Brain Project

## Stack

TanStack Start + Nitro | Supabase (PostgreSQL + RLS + Auth + Realtime) | shadcn/ui + Tailwind v4 | FullCalendar v6 | BlockNote + @blocknote/xl-ai | Zustand | Vercel AI SDK | assistant-ui | react-arborist | Sonner

## Hard Rules

- No Vite config. No separate api/ folder. All server logic in TanStack Start server functions.

- All Supabase calls use .throwOnError(). Never swallow errors silently.

- TONE: Never use "overdue", "late", "missed", "behind", "you should", "you need to", "failed", "incomplete" in any JSX, variable names, comments, or UI copy.

- Block size S/M/L = visual height only. Never a timer. Never evaluative.

- Every AI route MUST import TONE_SYSTEM_PROMPT from src/lib/aiConstants.ts. Never inline the system prompt.

- After completing each phase, save reusable patterns to C:\dev\coding_templates\ with placeholders.

- Use Zustand for client state. Use TanStack Query for server state. Never mix them.

## File Naming Conventions

- Components: PascalCase → src/components/[feature]/ComponentName.tsx

- Queries: camelCase → src/queries/featureName.ts

- Hooks: useCamelCase → src/hooks/useHookName.ts

- Server functions: camelCase → src/server/serverFnName.ts

- Types: PascalCase → src/types/TypeName.ts

- Constants: SCREAMING_SNAKE_CASE for values, camelCase for objects

## Template Saves

After each phase ticket is complete and accepted, extract reusable patterns to:

C:\dev\coding_templates\[subfolder]\template-name.ts

Strip all project-specific names. Add [PLACEHOLDER] comments everywhere a value changes per project.
