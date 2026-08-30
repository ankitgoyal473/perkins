import { tool } from "ai";
import { z } from "zod";
import {
  payByDepartment,
  payByCountry,
  payByLevel,
  compTrend,
} from "@/app/(dashboard)/reports/actions";

// The fixed, safe query surface the AI is allowed to call — it never gets
// raw SQL or an arbitrary Prisma query, only these already-built, already
// tested aggregate functions (the same ones the Reports page renders).
export const REPORT_TOOLS = {
  payByDepartment: tool({
    description:
      "Average and median current total pay, and headcount, grouped by department.",
    inputSchema: z.object({}),
    execute: payByDepartment,
  }),
  payByCountry: tool({
    description:
      "Average and median current total pay, headcount, and total headcount cost, grouped by country.",
    inputSchema: z.object({}),
    execute: payByCountry,
  }),
  payByLevel: tool({
    description:
      "Average and median current total pay, and headcount, grouped by job level.",
    inputSchema: z.object({}),
    execute: payByLevel,
  }),
  compTrend: tool({
    description:
      "Average salary component amount and record count, grouped by the year it took effect. Includes historical (superseded) records, not just current pay.",
    inputSchema: z.object({}),
    execute: compTrend,
  }),
};
