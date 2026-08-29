# Perkins — Design Spec

Date: 2026-08-29
Status: Approved

See [`docs/requirements.md`](../../requirements.md) for goal, scope,
and deliberate exclusions with reasoning. This document covers the
technical design.

## Architecture

A single Next.js (App Router) application, deployed to Vercel, serving
both the UI and the backend (server actions / route handlers). No
separate API server — the whole app is one deploy target, which keeps
"fully functional deployed software" simple to satisfy without
juggling multiple hosts.

Database: Postgres via Neon (Vercel Marketplace integration). SQLite,
as suggested by the assessment brief, doesn't persist on Vercel's
serverless filesystem — each invocation gets a fresh, ephemeral
filesystem, so writes would vanish between requests. Postgres is still
the "relational database" the brief asks for, just one that survives
serverless deployment.

Since this environment's Next.js has documented breaking changes from
training-data knowledge (per `AGENTS.md`), the implementation plan
must read `node_modules/next/dist/docs/` after scaffolding and before
writing routing/data-fetching code.

## Data Model (Prisma)

```
Employee
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  department    String
  jobLevel      String
  country       String
  hireDate      DateTime
  status        String   // "ACTIVE" | "TERMINATED"
  salaryRecords SalaryRecord[]

  @@index([department])
  @@index([country])
  @@index([jobLevel])

SalaryRecord
  id            String   @id @default(cuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id])
  component     String   // "BASE" | "BONUS" | "ALLOWANCE"
  amount        Decimal
  currency      String   // ISO 4217, e.g. "USD"
  effectiveFrom DateTime
  effectiveTo   DateTime? // null = currently active
  createdAt     DateTime @default(now())

  @@index([employeeId, effectiveTo])

User
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
```

Salary changes never mutate a `SalaryRecord` — recording a raise
closes the prior record (`effectiveTo = now`) and inserts a new one.
An employee's current total compensation is the sum of `amount` across
their components where `effectiveTo IS NULL`. This gives history for
free and keeps every past value queryable without a separate audit
log.

## Features

**Employee directory** — server-side paginated + filtered (department,
country, level) query against the indexed columns above; the UI never
loads all 10,000 rows at once.

**Employee detail** — profile plus a timeline of `SalaryRecord`s
(current + historical), grouped by component.

**Add/edit salary** — a server action that, in one transaction, sets
`effectiveTo` on the component being replaced (if any) and inserts the
new record.

**Reports** — a small set of server-computed aggregate queries (SQL
`GROUP BY` on department/country/level, filtered to `effectiveTo IS
NULL` for current-state views, unfiltered for trend-over-time views).
Rendered as tables/charts, no client-side aggregation of raw rows.

**AI Q&A** — the HR manager types a question in plain English. The
server sends the question to the OpenAI API along with a fixed set of
described query templates (e.g. `avgSalaryByCountry`, `headcountCost
ByCountry`, `medianSalaryByDepartment`) using function/tool calling.
The model selects a template and parameters; the server executes the
matching pre-defined Prisma query (never raw SQL from the model) and
returns the result, which is then summarized back to the user in
natural language. This bounds the model to a known-safe query surface
instead of letting it generate arbitrary SQL.

Key handling: `OPENAI_API_KEY` is a server-only Vercel env var, set by
the user at deploy time. It's never sent to the client, and calls only
happen from server-side route handlers.

## Auth

NextAuth (credentials provider). A single HR-manager account is
created by the seed script. Middleware protects all routes except the
login page.

## Seeding

`prisma/seed.ts` generates 10,000 employees using a seeded RNG
(reproducible runs) across ~6 countries (each with its own currency),
a handful of departments and job levels, and 1–3 `SalaryRecord`s per
employee (an initial hire salary, plus occasional raises with earlier
records closed out). Runs via `npx prisma db seed`.

## Testing (Vitest)

- Salary aggregation/calculation logic (pure functions) — unit tested
  directly.
- AI query-template selection — tested by mocking the OpenAI call and
  asserting the correct template + params get chosen and executed;
  never hits the live API in tests.
- Core server actions/route handlers (create employee, add salary
  record, list/filter) — tested against a test database.

Tests must be fast and deterministic — no live network calls (OpenAI
or otherwise) in the suite.

## Deployment

Vercel project linked to the GitHub repo, Neon Postgres attached via
the Vercel Marketplace, `OPENAI_API_KEY` set as a production env var
by the user. `prisma migrate deploy` + `prisma db seed` run once
against the deployed database after first deploy.
