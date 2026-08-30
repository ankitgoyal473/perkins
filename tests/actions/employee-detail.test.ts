import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getEmployeeDetail,
  recordSalaryChange,
} from "@/app/(dashboard)/employees/[id]/actions";

describe("getEmployeeDetail", () => {
  it("returns employee with grouped salary history", async () => {
    const employee = await prisma.employee.create({
      data: {
        name: "History Test",
        email: "history.test@acme.example",
        department: "Engineering",
        jobLevel: "L3",
        country: "United States",
        hireDate: new Date("2022-01-01"),
        status: "ACTIVE",
        salaryRecords: {
          create: [
            { component: "BASE", amount: 80000, currency: "USD", effectiveFrom: new Date("2022-01-01"), effectiveTo: new Date("2023-01-01") },
            { component: "BASE", amount: 90000, currency: "USD", effectiveFrom: new Date("2023-01-01"), effectiveTo: null },
          ],
        },
      },
    });

    const detail = await getEmployeeDetail(employee.id);
    expect(detail?.name).toBe("History Test");
    expect(detail?.salaryHistory.BASE).toHaveLength(2);
  });

  it("returns null for unknown id", async () => {
    const detail = await getEmployeeDetail("nonexistent");
    expect(detail).toBeNull();
  });
});

describe("recordSalaryChange", () => {
  it("closes the prior active record and inserts the new one", async () => {
    const employee = await prisma.employee.create({
      data: {
        name: "Raise Test",
        email: "raise.test@acme.example",
        department: "Engineering",
        jobLevel: "L2",
        country: "United States",
        hireDate: new Date("2023-01-01"),
        status: "ACTIVE",
        salaryRecords: {
          create: [{ component: "BASE", amount: 60000, currency: "USD", effectiveFrom: new Date("2023-01-01"), effectiveTo: null }],
        },
      },
    });

    const raiseDate = new Date("2024-06-01");
    await recordSalaryChange({
      employeeId: employee.id,
      component: "BASE",
      amount: 70000,
      currency: "USD",
      effectiveFrom: raiseDate,
    });

    const detail = await getEmployeeDetail(employee.id);
    const baseRecords = detail!.salaryHistory.BASE;
    expect(baseRecords).toHaveLength(2);

    const closed = baseRecords.find((r) => r.amount === 60000)!;
    expect(closed.effectiveTo?.toISOString()).toBe(raiseDate.toISOString());

    const active = baseRecords.find((r) => r.effectiveTo === null)!;
    expect(active.amount).toBe(70000);
  });

  it("does not affect other components' active records", async () => {
    const employee = await prisma.employee.create({
      data: {
        name: "Bonus Test",
        email: "bonus.test@acme.example",
        department: "Sales",
        jobLevel: "L2",
        country: "United States",
        hireDate: new Date("2023-01-01"),
        status: "ACTIVE",
        salaryRecords: {
          create: [
            { component: "BASE", amount: 60000, currency: "USD", effectiveFrom: new Date("2023-01-01"), effectiveTo: null },
            { component: "BONUS", amount: 5000, currency: "USD", effectiveFrom: new Date("2023-01-01"), effectiveTo: null },
          ],
        },
      },
    });

    await recordSalaryChange({
      employeeId: employee.id,
      component: "BASE",
      amount: 65000,
      currency: "USD",
      effectiveFrom: new Date("2024-01-01"),
    });

    const detail = await getEmployeeDetail(employee.id);
    expect(detail!.salaryHistory.BONUS).toHaveLength(1);
    expect(detail!.salaryHistory.BONUS[0].effectiveTo).toBeNull();
  });
});
