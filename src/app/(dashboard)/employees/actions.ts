"use server";

import { prisma } from "@/lib/prisma";
import { currentTotalComp } from "@/lib/salary";

export type EmployeeListItem = {
  id: string;
  name: string;
  email: string;
  department: string;
  country: string;
  jobLevel: string;
  currentTotal: number;
};

export async function listEmployees(params: {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  country?: string;
  jobLevel?: string;
}): Promise<{ employees: EmployeeListItem[]; total: number }> {
  const { page, pageSize, search, department, country, jobLevel } = params;

  const where = {
    ...(department ? { department } : {}),
    ...(country ? { country } : {}),
    ...(jobLevel ? { jobLevel } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      include: { salaryRecords: { where: { effectiveTo: null } } },
    }),
    prisma.employee.count({ where }),
  ]);

  const employees = rows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    country: e.country,
    jobLevel: e.jobLevel,
    currentTotal: currentTotalComp(
      e.salaryRecords.map((r) => ({ ...r, amount: Number(r.amount) }))
    ),
  }));

  return { employees, total };
}
