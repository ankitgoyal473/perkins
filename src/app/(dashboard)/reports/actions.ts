"use server";

import { prisma } from "@/lib/prisma";

export type GroupPayStat = {
  group: string;
  headcount: number;
  avgTotal: number;
  medianTotal: number;
};

export type CountryPayStat = GroupPayStat & { totalCost: number };

export type CompTrendPoint = {
  year: number;
  avgAmount: number;
  recordCount: number;
};

// Current-state views: aggregate each employee's active (effectiveTo IS
// NULL) component amounts into a total, then group that per-employee total
// by department/country/level. Matches how the employee directory computes
// "current total comp" (src/lib/salary.ts), just aggregated across people.
export async function payByDepartment(): Promise<GroupPayStat[]> {
  return prisma.$queryRaw<GroupPayStat[]>`
    SELECT e.department AS "group",
           COUNT(*)::int AS "headcount",
           AVG(t.total)::float8 AS "avgTotal",
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.total)::float8 AS "medianTotal"
    FROM (
      SELECT sr."employeeId" AS id, SUM(sr.amount) AS total
      FROM "SalaryRecord" sr
      WHERE sr."effectiveTo" IS NULL
      GROUP BY sr."employeeId"
    ) t
    JOIN "Employee" e ON e.id = t.id
    GROUP BY e.department
    ORDER BY e.department
  `;
}

export async function payByCountry(): Promise<CountryPayStat[]> {
  return prisma.$queryRaw<CountryPayStat[]>`
    SELECT e.country AS "group",
           COUNT(*)::int AS "headcount",
           AVG(t.total)::float8 AS "avgTotal",
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.total)::float8 AS "medianTotal",
           SUM(t.total)::float8 AS "totalCost"
    FROM (
      SELECT sr."employeeId" AS id, SUM(sr.amount) AS total
      FROM "SalaryRecord" sr
      WHERE sr."effectiveTo" IS NULL
      GROUP BY sr."employeeId"
    ) t
    JOIN "Employee" e ON e.id = t.id
    GROUP BY e.country
    ORDER BY e.country
  `;
}

export async function payByLevel(): Promise<GroupPayStat[]> {
  return prisma.$queryRaw<GroupPayStat[]>`
    SELECT e."jobLevel" AS "group",
           COUNT(*)::int AS "headcount",
           AVG(t.total)::float8 AS "avgTotal",
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.total)::float8 AS "medianTotal"
    FROM (
      SELECT sr."employeeId" AS id, SUM(sr.amount) AS total
      FROM "SalaryRecord" sr
      WHERE sr."effectiveTo" IS NULL
      GROUP BY sr."employeeId"
    ) t
    JOIN "Employee" e ON e.id = t.id
    GROUP BY e."jobLevel"
    ORDER BY e."jobLevel"
  `;
}

// Trend-over-time view: unfiltered (every SalaryRecord, not just active
// ones) so past and current pay both contribute to the trend line.
export async function compTrend(): Promise<CompTrendPoint[]> {
  return prisma.$queryRaw<CompTrendPoint[]>`
    SELECT EXTRACT(YEAR FROM sr."effectiveFrom")::int AS year,
           AVG(sr.amount)::float8 AS "avgAmount",
           COUNT(*)::int AS "recordCount"
    FROM "SalaryRecord" sr
    GROUP BY year
    ORDER BY year
  `;
}
