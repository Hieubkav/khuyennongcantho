# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Turborepo and Bun.
- Apps: `apps/web` (Next.js 15, React 19). Key dirs: `src/app` (routes), `src/components` (UI + shared), `src/lib` (utils).
- Backend: `packages/backend` (Convex). Code in `packages/backend/convex`.
- Config: `turbo.json`, `bunfig.toml`, `.oxlintrc.json`.
- Env example: `apps/web/.env.example`.

## Build, Test, and Development Commands
- `bun install` — install workspace deps.
- `bun dev` — start all apps via Turborepo.
- `bun dev:web` — run only Next.js app.
- `bun dev:server` — run only Convex backend.
- `bun dev:setup` — configure Convex locally/cloud (prompts), sets URL.
- `bun build` — build all workspaces.
- `bun check` — run oxlint.
- `bun check-types` — TypeScript type checks across workspaces.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled in `apps/web/tsconfig.json`).
- Indentation: tabs.
- File names: kebab-case (e.g., `mode-toggle.tsx`, `layout.shared.tsx`).
- Exports: prefer named exports (e.g., `export { Button }`).
- React: components in `src/components`; primitives in `src/components/ui`; pages in `src/app`.
- Utilities in `src/lib`; keep pure and typed.
- Linting: use oxlint (`bun check`) before committing.

## Testing Guidelines
- No test runner is configured yet. If adding tests:
  - Place unit tests near sources or under `__tests__`.
  - Naming: `*.test.ts`/`*.test.tsx`.
  - Prefer Vitest for unit tests and Playwright for e2e.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`) and present tense.
- PRs must include:
  - Clear description and linked issues.
  - Screenshots/GIFs for UI changes (web).
  - Confirmation that `bun check` and `bun check-types` pass.
  - Notes on docs updates under `apps/web/content` if applicable.

## Security & Configuration
- Never commit secrets. Copy `apps/web/.env.example` to `.env.local` and set `NEXT_PUBLIC_CONVEX_URL` (or run `bun dev:setup`).
- Prefer workspace imports (e.g., `@/lib/utils`). Avoid deep relative paths.

## Agent Notes
- Scope: entire repo. Follow this guide for style and structure.
- Keep changes minimal, focused, and consistent with existing patterns.
