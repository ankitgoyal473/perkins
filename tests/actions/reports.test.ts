import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  payByDepartment,
  payByCountry,
  payByLevel,
  compTrend,
} from "@/app/(dashboard)/reports/actions";

async function seedEmployee(overrides: Partial<{
  name: string;
  department: string;
  country: string;
  jobLevel: string;
  activeAmount: number;
  pastAmount: number;
  hireYear: number;
}> = {}) {
  const {
    name = "Test Employee",
    department = "Engineering",
    country = "United States",
    jobLevel = "L3",
    activeAmount = 5000,
    pastAmount,
    hireYear = 2023,
  } = overrides;

  const salaryRecords = [
    ...(pastAmount !== undefined
      ? [{
          component: "BASE",
          amount: pastAmount,
          currency: "USD",
          effectiveFrom: new Date(`${hireYear}-01-01`),
          effectiveTo: new Date(`${hireYear + 1}-01-01`),
        }]
      : []),
    {
      component: "BASE",
      amount: activeAmount,
      currency: "USD",
      effectiveFrom: new Date(`${pastAmount !== undefined ? hireYear + 1 : hireYear}-01-01`),
      effectiveTo: null,
    },
  ];

  await prisma.employee.create({
    data: {
      name,
      email: `${name.replace(/\s/g, ".").toLowerCase()}@acme.example`,
      department,
      jobLevel,
      country,
      hireDate: new Date(`${hireYear}-01-01`),
      status: "ACTIVE",
      salaryRecords: { create: salaryRecords },
    },
  });
}

describe("payByDepartment", () => {
  it("averages current total comp per employee, grouped by department", async () => {
    await seedEmployee({ name: "Eng One", department: "Engineering", activeAmount: 4000 });
    await seedEmployee({ name: "Eng Two", department: "Engineering", activeAmount: 6000 });
    await seedEmployee({ name: "Sales One", department: "Sales", activeAmount: 3000 });

    const rows = await payByDepartment();
    const eng = rows.find((r) => r.group === "Engineering")!;
    const sales = rows.find((r) => r.group === "Sales")!;

    expect(eng.headcount).toBe(2);
    expect(eng.avgTotal).toBe(5000);
    expect(eng.medianTotal).toBe(5000);
    expect(sales.headcount).toBe(1);
    expect(sales.avgTotal).toBe(3000);
  });

  it("ignores superseded (non-active) salary records", async () => {
    await seedEmployee({ name: "Raised Person", department: "Engineering", pastAmount: 4000, activeAmount: 5000 });

    const rows = await payByDepartment();
    const eng = rows.find((r) => r.group === "Engineering")!;
    expect(eng.avgTotal).toBe(5000);
  });
});

describe("payByCountry", () => {
  it("includes headcount cost as the sum of current totals", async () => {
    await seedEmployee({ name: "A", country: "United States", activeAmount: 4000 });
    await seedEmployee({ name: "B", country: "United States", activeAmount: 6000 });

    const rows = await payByCountry();
    const us = rows.find((r) => r.group === "United States")!;
    expect(us.totalCost).toBe(10000);
    expect(us.avgTotal).toBe(5000);
  });
});

describe("payByLevel", () => {
  it("groups by job level", async () => {
    await seedEmployee({ name: "L3 Person", jobLevel: "L3", activeAmount: 5000 });
    await seedEmployee({ name: "L5 Person", jobLevel: "L5", activeAmount: 9000 });

    const rows = await payByLevel();
    expect(rows.find((r) => r.group === "L3")?.avgTotal).toBe(5000);
    expect(rows.find((r) => r.group === "L5")?.avgTotal).toBe(9000);
  });
});

describe("compTrend", () => {
  it("includes superseded records, grouped by effective-from year", async () => {
    await seedEmployee({ name: "Trend Person", hireYear: 2022, pastAmount: 4000, activeAmount: 5000 });

    const rows = await compTrend();
    const y2022 = rows.find((r) => r.year === 2022);
    const y2023 = rows.find((r) => r.year === 2023);
    expect(y2022?.avgAmount).toBe(4000);
    expect(y2023?.avgAmount).toBe(5000);
  });
});
