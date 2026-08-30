"use server";

import { prisma } from "@/lib/prisma";
import { groupByComponent, type SalaryComponent } from "@/lib/salary";

export type EmployeeDetail = {
  id: string;
  name: string;
  email: string;
  department: string;
  country: string;
  jobLevel: string;
  hireDate: Date;
  salaryHistory: Record<string, SalaryComponent[]>;
};

export async function getEmployeeDetail(
  id: string
): Promise<EmployeeDetail | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { salaryRecords: { orderBy: { effectiveFrom: "asc" } } },
  });
  if (!employee) return null;

  const records: SalaryComponent[] = employee.salaryRecords.map((r) => ({
    component: r.component,
    amount: Number(r.amount),
    currency: r.currency,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
  }));

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    country: employee.country,
    jobLevel: employee.jobLevel,
    hireDate: employee.hireDate,
    salaryHistory: groupByComponent(records),
  };
}

export async function recordSalaryChange(input: {
  employeeId: string;
  component: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.salaryRecord.updateMany({
      where: {
        employeeId: input.employeeId,
        component: input.component,
        effectiveTo: null,
      },
      data: { effectiveTo: input.effectiveFrom },
    });

    await tx.salaryRecord.create({
      data: {
        employeeId: input.employeeId,
        component: input.component,
        amount: input.amount,
        currency: input.currency,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: null,
      },
    });
  });
}
