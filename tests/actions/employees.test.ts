import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { listEmployees } from "@/app/(dashboard)/employees/actions";

async function seedOne(overrides: Partial<{
  name: string; department: string; country: string; jobLevel: string; amount: number;
}> = {}) {
  const { name = "Test Employee", department = "Engineering", country = "United States",
    jobLevel = "L3", amount = 5000 } = overrides;
  await prisma.employee.create({
    data: {
      name,
      email: `${name.replace(/\s/g, ".").toLowerCase()}@acme.example`,
      department,
      jobLevel,
      country,
      hireDate: new Date("2023-01-01"),
      status: "ACTIVE",
      salaryRecords: {
        create: [{ component: "BASE", amount, currency: "USD", effectiveFrom: new Date("2023-01-01"), effectiveTo: null }],
      },
    },
  });
}

describe("listEmployees", () => {
  it("paginates results", async () => {
    for (let i = 0; i < 5; i++) await seedOne({ name: `Employee ${i}` });
    const { employees, total } = await listEmployees({ page: 1, pageSize: 2 });
    expect(employees).toHaveLength(2);
    expect(total).toBe(5);
  });

  it("filters by department", async () => {
    await seedOne({ name: "Eng Person", department: "Engineering" });
    await seedOne({ name: "Sales Person", department: "Sales" });
    const { employees, total } = await listEmployees({ page: 1, pageSize: 10, department: "Sales" });
    expect(total).toBe(1);
    expect(employees[0].name).toBe("Sales Person");
  });

  it("includes current total compensation", async () => {
    await seedOne({ name: "Paid Person", amount: 7000 });
    const { employees } = await listEmployees({ page: 1, pageSize: 10 });
    expect(employees[0].currentTotal).toBe(7000);
  });
});
