# Perkins — Requirements Document

## Goal

Give an HR manager at a 10,000-employee, multi-country organization a
single web tool to manage salary data and answer questions about how
the org pays people — replacing the current spreadsheet-based process.

## User

HR Manager (single role, single tenant). Not building for employees,
finance, or multi-org use.

## Scope & Features

- **Employee directory** — searchable, filterable (department,
  country, level), paginated list that stays fast at 10,000 rows.
- **Employee salary record** — current compensation broken into
  components (base, bonus, allowance), each with currency and country.
- **Salary history** — every change to a component is a new
  effective-dated record, not an overwrite, so raises and past pay are
  always visible.
- **Add / edit salary** — HR manager can record a new salary component
  or a raise; past records are never mutated, only superseded.
- **Reports** — aggregate views: average/median pay by department,
  country, and level; headcount cost by country; comp trends over
  time.
- **AI Q&A** — a natural-language question box ("what's our average
  salary in Germany?") that answers from the live salary data, so the
  HR manager doesn't need to know the underlying report to ask the
  question.
- **Auth** — single HR-manager login; the tool isn't usable
  unauthenticated.
- **Seed data** — 10,000 employees with realistic department/
  country/level distribution and salary history, for demoing at
  realistic scale.

## Deliberately Out of Scope

- **Tax/deduction calculations** — real payroll tax logic differs by
  country and is a compliance-heavy specialty on its own; modeling it
  correctly would dwarf the rest of this project without changing the
  core problem (managing and understanding salary data).
- **Approval workflows** (propose → approve a raise) — adds a second
  role and a state machine; the stated persona is a single HR manager
  who needs to record and understand pay, not route it through sign-off.
- **Employee self-service** (employees viewing their own pay) —
  different persona, different auth/permission model; out of scope for
  "the HR manager manages salary data."
- **Payroll disbursement / bank integration** — this is a system of
  record for salary data, not a payment execution system.
- **Org chart / reporting-line management** — not needed to answer
  "how does the org pay people"; would require a whole separate data
  model (manager relationships) for no benefit to the stated goal.
- **Multi-tenant / role-based permissions beyond one HR-manager
  account** — the persona is singular; building a permission system
  for hypothetical future roles would be speculative scope.

Each exclusion above is a real HR system capability that was left out
on purpose because it serves a different problem than the one stated:
managing salary records and making them queryable, not running payroll
or workflow.
