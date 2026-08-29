import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic PRNG (mulberry32) so seeded data is reproducible across runs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260829);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

const COUNTRIES: { country: string; currency: string; baseMultiplier: number }[] = [
  { country: "United States", currency: "USD", baseMultiplier: 1.0 },
  { country: "United Kingdom", currency: "GBP", baseMultiplier: 0.85 },
  { country: "Germany", currency: "EUR", baseMultiplier: 0.9 },
  { country: "India", currency: "INR", baseMultiplier: 0.3 },
  { country: "Canada", currency: "CAD", baseMultiplier: 0.95 },
  { country: "Australia", currency: "AUD", baseMultiplier: 1.0 },
];

const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "People",
  "Operations",
  "Customer Success",
  "Legal",
];

const LEVELS: { level: string; baseSalary: number }[] = [
  { level: "L1", baseSalary: 45000 },
  { level: "L2", baseSalary: 60000 },
  { level: "L3", baseSalary: 80000 },
  { level: "L4", baseSalary: 105000 },
  { level: "L5", baseSalary: 135000 },
  { level: "L6", baseSalary: 170000 },
];

const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Priya", "Wei", "Carlos", "Fatima", "Noah",
  "Olivia", "Liam", "Emma", "Ravi", "Sofia", "Lucas", "Mia", "Anika",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Patel", "Garcia", "Müller", "Chen", "Khan",
  "Kowalski", "Silva", "Nguyen", "Brown", "Kumar", "Rossi", "Dubois",
];

async function main() {
  console.log("Seeding HR manager account...");
  const passwordHash = await bcrypt.hash("perkins-demo-2026", 10);
  await prisma.user.upsert({
    where: { email: "hr@perkins.app" },
    update: {},
    create: { email: "hr@perkins.app", passwordHash },
  });

  console.log("Seeding 10,000 employees...");
  const BATCH_SIZE = 500;
  let created = 0;

  for (let batchStart = 0; batchStart < 10000; batchStart += BATCH_SIZE) {
    const batch = [];
    for (let i = batchStart; i < batchStart + BATCH_SIZE; i++) {
      const location = pick(COUNTRIES);
      const level = pick(LEVELS);
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const hireYear = randInt(2018, 2025);
      const hireDate = new Date(hireYear, randInt(0, 11), randInt(1, 28));
      const baseAmount = Math.round(level.baseSalary * location.baseMultiplier);

      batch.push({
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}@acme.example`,
        department: pick(DEPARTMENTS),
        jobLevel: level.level,
        country: location.country,
        hireDate,
        status: "ACTIVE",
        salaryRecords: buildSalaryHistory(baseAmount, location.currency, hireDate),
      });
    }

    await prisma.$transaction(
      batch.map((emp) =>
        prisma.employee.create({
          data: {
            name: emp.name,
            email: emp.email,
            department: emp.department,
            jobLevel: emp.jobLevel,
            country: emp.country,
            hireDate: emp.hireDate,
            status: emp.status,
            salaryRecords: { create: emp.salaryRecords },
          },
        })
      )
    );

    created += batch.length;
    console.log(`  ${created}/10000`);
  }

  console.log("Done.");
}

function buildSalaryHistory(baseAmount: number, currency: string, hireDate: Date) {
  const raiseCount = randInt(0, 2);
  const records: {
    component: string;
    amount: number;
    currency: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  }[] = [];

  let currentAmount = baseAmount;
  let periodStart = hireDate;

  for (let r = 0; r < raiseCount; r++) {
    const raiseDate = new Date(periodStart);
    raiseDate.setFullYear(raiseDate.getFullYear() + 1);
    if (raiseDate >= new Date()) break;

    records.push({
      component: "BASE",
      amount: currentAmount,
      currency,
      effectiveFrom: periodStart,
      effectiveTo: raiseDate,
    });
    currentAmount = Math.round(currentAmount * (1 + rand() * 0.15));
    periodStart = raiseDate;
  }

  records.push({
    component: "BASE",
    amount: currentAmount,
    currency,
    effectiveFrom: periodStart,
    effectiveTo: null,
  });

  if (rand() < 0.4) {
    records.push({
      component: "BONUS",
      amount: Math.round(currentAmount * 0.1),
      currency,
      effectiveFrom: periodStart,
      effectiveTo: null,
    });
  }

  return records;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
