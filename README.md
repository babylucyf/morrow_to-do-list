# Morrow — Universal To-Do List

A responsive task workspace built with Next.js, React, TypeScript, and Tailwind-compatible global CSS. It keeps the attention on the task while providing an Apple-inspired visual system: restrained surfaces, rounded controls, generous spacing, and strong typography.

## Features

- Fast manual or natural-language task capture (`Finish portfolio Friday at 3pm #career p1`)
- Task details, priorities, due dates/times, tags, notes, links, nested subtasks, and completion
- Search, smart lists, filters, sorting, list and native drag-and-drop Kanban views
- Local browser persistence by default; optional Supabase persistence
- Keyboard-friendly controls, visible focus states, responsive mobile navigation, and meaningful empty/error/loading states

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` before delivery.

## Storage and configuration

Without configuration, tasks are saved only in the current browser under `morrow-tasks-v1`. This is intentional for a private, credential-free prototype; it does not synchronize devices.

To use Supabase, create a project, apply `supabase/migrations/001_initial_schema.sql`, copy `.env.example` to `.env.local`, and set `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The REST adapter will then be selected automatically. Add authenticated ownership and Row Level Security before exposing Supabase data publicly.

`OPENAI_API_KEY` is reserved for a future server-only enhancement. The current `/api/ai/parse-task` route is deterministic and validates a structured task draft, so the app remains usable without any AI credential.

## Deploy to Vercel

1. Push the repository without `.env.local`.
2. Import it into Vercel and configure the same public Supabase values if Supabase is enabled.
3. Deploy, then smoke-test task creation, editing, board movement, refresh persistence, mobile layout, and error/empty states.

## Known limitations

The default local-storage mode is device-local. Supabase is deliberately unauthenticated for the assignment schema, so it should not be used for private multi-user production data until Supabase Auth and RLS are added. Task parsing handles common explicit tags, priorities, weekdays, today/tomorrow, and 12-hour times rather than arbitrary language.
