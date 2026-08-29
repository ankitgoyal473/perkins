import { describe, it, expect } from "vitest";
import { currentTotalComp, groupByComponent, type SalaryComponent } from "@/lib/salary";

const record = (overrides: Partial<SalaryComponent>): SalaryComponent => ({
  component: "BASE",
  amount: 1000,
  currency: "USD",
  effectiveFrom: new Date("2024-01-01"),
  effectiveTo: null,
  ...overrides,
});

describe("currentTotalComp", () => {
  it("sums only currently-active components", () => {
    const records = [
      record({ component: "BASE", amount: 5000, effectiveTo: null }),
      record({ component: "BONUS", amount: 500, effectiveTo: null }),
      record({ component: "BASE", amount: 4000, effectiveTo: new Date("2024-06-01") }),
    ];
    expect(currentTotalComp(records)).toBe(5500);
  });

  it("returns 0 for no active records", () => {
    const records = [record({ effectiveTo: new Date("2024-06-01") })];
    expect(currentTotalComp(records)).toBe(0);
  });
});

describe("groupByComponent", () => {
  it("groups records by component type", () => {
    const records = [
      record({ component: "BASE", amount: 5000 }),
      record({ component: "BASE", amount: 4000, effectiveTo: new Date("2024-06-01") }),
      record({ component: "BONUS", amount: 500 }),
    ];
    const grouped = groupByComponent(records);
    expect(grouped.BASE).toHaveLength(2);
    expect(grouped.BONUS).toHaveLength(1);
  });
});
