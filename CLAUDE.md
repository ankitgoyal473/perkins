# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Perkins: a single Next.js (App Router) app that is both the backend and
the frontend for HR salary management — a directory, per-employee salary
history, aggregate reports, and natural-language Q&A over pay data, for
an org with 10,000 employees across multiple countries. See
[`docs/requirements.md`](docs/requirements.md) (scope, and what's
deliberately excluded) and
[`docs/superpowers/specs/2026-08-29-perkins-design.md`](docs/superpowers/specs/2026-08-29-perkins-design.md)
(architecture, data model, rationale) before making design-level
changes — they're the source of truth this codebase was built from.

## Commands

```bash
npm run dev              # dev server
npm run build             # production build
npm run lint               # eslint
npm run test                # vitest run — needs a real Postgres at .env.test's DATABASE_URL (see below)
npx vitest run tests/lib/salary.test.ts        # single test file
npx vitest run -t "sums only currently-active" # single test by name

npx prisma migrate dev --name <name>   # create + apply a migration (dev DB)
npx prisma migrate deploy               # apply existing migrations (test/prod DB, no new migration)
npx prisma db seed                        # run prisma/seed.ts (10,000 employees + HR user)
```

Tests hit a real Postgres database (no mocked ORM) — `tests/setup.ts`
truncates `SalaryRecord`/`Employee`/`User` before every test via a global
`beforeEach`. Before running `npm run test`, a Postgres instance must be
reachable at `.env.test`'s `DATABASE_URL`; the quickest way locally:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=perkins_test postgres:16
cp .env.test.example .env.test
npx prisma migrate deploy   # against .env.test's DB
```

`.env` (local dev) and `.env.test` are both gitignored; copy from
`.env.example` / `.env.test.example`. `AUTH_SECRET`/`AUTH_URL` (not the
NextAuth v4 `NEXTAUTH_*` names) are what this project's NextAuth v5 setup
reads.

## Architecture

- **One app, no separate API server.** Server Actions (`actions.ts` files
  colocated with each route) and route handlers under `src/app/api/` are
  the backend; there is no separate Express/Fastify layer.
- **Auth:** NextAuth (Credentials provider) in `src/lib/auth.ts`, single
  HR-manager account, session-protected via `src/proxy.ts` (see gotcha
  below). Seeded credentials: `hr@perkins.app` / `perkins-demo-2026`.
- **Data model** (`prisma/schema.prisma`): `Employee` → many
  `SalaryRecord`. **Salary records are append-only — never update
  `amount` on an existing row.** A raise closes the prior record
  (`effectiveTo = now`) and inserts a new one in the same transaction;
  `effectiveTo IS NULL` means "currently active." This is how salary
  history and "current total comp" both derive from one table — see
  `src/lib/salary.ts` (`currentTotalComp`, `groupByComponent`) for the
  pure functions that consume it.
- **Route structure:** `src/app/(dashboard)/` is the authenticated app
  shell (employees directory, employee detail, reports, AI Q&A each get
  their own subfolder with a colocated `actions.ts`); `src/app/login/`
  and `src/app/api/auth/` are the unauthenticated auth surface.
- **AI Q&A:** the model is never given raw SQL access — it selects from a
  small, fixed set of named query templates (`src/lib/ai/templates.ts`,
  once built) via tool calling, and the server executes the matching
  Prisma query. Keep that boundary when extending it.
- **Directory/list queries must stay server-side paginated/filtered**
  (Prisma `skip`/`take` + `where`, never fetch-all-then-slice) — the
  directory is expected to hold 10,000+ rows.

## This environment's toolchain has real breaking changes vs. training data

Not just Next.js (per `AGENTS.md` above) — this has bitten multiple
packages during this build. Treat "latest" or remembered APIs as
unverified until checked against what's actually installed:

- **Next.js 16** deprecated `middleware.ts` — it's `src/proxy.ts` here
  (same signature/matcher, see `node_modules/next/dist/docs/`). Don't
  recreate a `middleware.ts`.
- **Prisma is pinned to `6.19.3`** in `package.json` — the real npm
  `latest` is an unreleased `8.0.0-rc`, and stable `7.x` removed
  `datasource.url` support that this schema relies on. Don't let
  `npm install`/`npm update` bump `prisma`/`@prisma/client` off this pin
  without re-verifying schema compatibility first.
- **shadcn/ui here is the `base-nova` style on `@base-ui/react`**, not
  classic Radix-based shadcn. Concretely: there is no `form.tsx`
  (`field.tsx` is the equivalent primitive); `Select` is stricter about
  an already-mounted instance's `defaultValue` changing than Radix is —
  if you add a new `Select` whose `defaultValue` can change after mount
  (e.g. another URL-driven filter), key it on its own resolved value
  (see `src/components/employees/employee-filters.tsx`) rather than
  assuming Radix semantics.
- **NextAuth is `next-auth@beta` (v5/Auth.js)** — reads `AUTH_SECRET`/
  `AUTH_URL` by convention, not the v4 `NEXTAUTH_*` names.

When in doubt about any package's actual API in this repo, check
`node_modules/<package>/` directly rather than trusting memory.
