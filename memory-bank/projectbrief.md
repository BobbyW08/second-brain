# Project Brief — Second Brain

## Purpose

Invite-only personal productivity app for a single primary user. Combines tasks, calendar, rich-text pages, tables, and AI assistance in one place. Not a multi-tenant SaaS — access is gated by admin-issued invite tokens.

## Stack Summary

TanStack Start + Nitro | Supabase (PostgreSQL + RLS + Auth + Realtime) | shadcn/ui + Tailwind v4 | FullCalendar v6 | BlockNote + @blocknote/xl-ai | Zustand | Vercel AI SDK | assistant-ui | react-arborist | Sonner

## Core Tone Rule

**Never use:** "overdue", "late", "missed", "behind", "you should", "you need to", "failed", "incomplete"

This applies to: JSX copy, variable names, comments, toast messages, AI responses, empty states, and all UI text. Language must be supportive, forward-focused, and non-judgmental at all times.

## What This App Does

1. **Priority Bucket** — Three-column task board (Urgent / Important / Someday). Tasks have S/M/L block sizes (visual height only, never a timer).
2. **Calendar** — FullCalendar 3-day view with Morning/Afternoon/Evening zones. Tasks drag from bucket to calendar. Google Calendar sync.
3. **Pages** — Rich text editor (BlockNote) with folder tree, autosave, and inline linking.
4. **Journal** — Auto-dated daily entries with AI-generated prompts.
5. **Tables** — Dynamic column-type tables (text, checkbox, select, date, number, url) with row detail pages.
6. **AI** — Chat sidebar, writing toolbar in editor, scheduling suggestions, journal prompts. All use TONE_SYSTEM_PROMPT from src/lib/aiConstants.ts.

## Build Environment

- Claude Code (terminal): planning, ticket review, memory bank updates
- Cline + Qwen3-235B (VS Code): actual file creation and editing
- Project folder: C:\dev\second_brain
- Templates folder: C:\dev\coding_templates
