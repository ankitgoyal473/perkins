import { beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
});
