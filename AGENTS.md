# AGENTS.md — Universal To-Do List

## Project architecture

Next.js App Router renders the shell and API route. Interactive task UI lives in `components/tasks`; domain types, parsing, validation, queries, and storage adapters live in `lib/tasks`. `LocalTaskRepository` is the default persistence layer. `SupabaseTaskRepository` is selected only when both public Supabase variables exist. Database schema lives in `supabase/migrations`.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start local development
- `npm run typecheck` — run TypeScript validation
- `npm run lint` — run lint checks
- `npm run test` — run unit/component tests
- `npm run build` — verify production build

## Coding and naming conventions

- Use TypeScript with strict types; never use `any` for task data.
- Use PascalCase for React components and files, camelCase for functions/variables, and kebab-case only for URL paths and SQL names.
- Keep presentation in components and business rules in `lib/tasks`.
- Reuse the `Task`, `TaskDraft`, and `TaskRepository` interfaces; do not duplicate task shapes.
- Prefer native browser and React APIs before adding a dependency. Keep client components limited to interactive boundaries.

## Project structure rules

- Put reusable task UI in `components/tasks`; do not create page-sized monoliths for new features.
- Put persistence, validation, parsing, and filters in `lib/tasks` with focused modules.
- Keep migrations append-only. Do not edit deployed migrations; add a new numbered migration.
- Use CSS custom properties in `app/globals.css` for visual tokens. Maintain the white/mist, restrained, no-heavy-shadow design direction.

## Testing and validation

- Add tests for all new pure task helpers and all regressions.
- Test critical task flows: create, edit, complete/reopen, delete, parser review, filter/search, persistence, and Kanban status updates.
- Before a handoff, run typecheck, lint, tests, and production build. Manually verify desktop and mobile layouts, keyboard focus, empty/loading/error states, and refresh persistence.
- Validate untrusted input: task title, status, priority, date/time, tags, parent links, URLs, and any AI response before saving.

## Development preferences and security

- Keep the app usable without Supabase or AI credentials. AI failure must never prevent manual entry.
- Do not expose server-only secrets, commit `.env*` files, or trust client user identifiers.
- Supabase production use requires authenticated ownership and RLS; browser storage is the safe default for the single-user prototype.

## Definition of done

The requested flow works end-to-end, data persists through the selected adapter, responsive and accessible states work, checks pass, no secret is committed, and relevant documentation is updated.

## Lessons discovered

- Browser storage makes the assignment immediately runnable, but it is not sync or account storage.
- A Supabase REST adapter needs explicit relational writes for tags and links; keep it behind the repository interface.
- Native drag and drop is sufficient for the MVP Kanban and avoids a large interaction dependency.
