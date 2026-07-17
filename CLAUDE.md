# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: read Next.js docs before coding

This project pins **Next.js 16.2.9**, a version newer than your training data, and the rule above (imported from AGENTS.md) is not boilerplate — it is load-bearing. Before implementing any routing, data fetching, caching, metadata, or config change, open the matching doc under `node_modules/next/dist/docs/01-app/` (mirrors https://nextjs.org/docs structure: `01-getting-started/`, `02-guides/`, `03-api-reference/`). APIs you remember from older Next.js (e.g. pre-App-Router patterns, old caching defaults) may no longer apply.

## Project state

This repo is a freshly bootstrapped `create-next-app` scaffold — `src/app/` only contains the default `layout.tsx`, `page.tsx`, and `globals.css` from the template. There are no API routes, lib folders, auth wiring, or database/service integrations implemented yet. Don't assume any backend architecture exists; check the current file tree before describing or extending "existing" patterns.

The dependencies in `package.json` signal the intended direction but are **not yet wired up**:
- `@supabase/supabase-js` + `@supabase/ssr` — planned auth/database (no client setup exists yet)
- `openai` — planned AI integration
- `stripe` — planned payments
- `resend` — planned transactional email
- `recharts` — planned charts/analytics UI
- `lucide-react` — icon set

When asked to build features in these areas, you are creating the integration from scratch, not modifying an existing one.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is no test runner configured in `package.json` yet.

## Architecture notes

- **App Router**, TypeScript, source lives under `src/` (not project root) — `src/app/` is the route tree.
- Path alias `@/*` maps to `./src/*` (`tsconfig.json`).
- **React Compiler is enabled** (`next.config.ts`: `reactCompiler: true`) — avoid manual `useMemo`/`useCallback` micro-optimizations; let the compiler handle memoization.
- **Tailwind CSS v4** via `@tailwindcss/postcss`, configured through `@theme inline` in `src/app/globals.css` rather than a `tailwind.config.js` file. Dark mode is handled via the `prefers-color-scheme` media query, not a class strategy.
- ESLint uses the flat config format (`eslint.config.mjs`) extending `eslint-config-next` core-web-vitals + typescript presets.
