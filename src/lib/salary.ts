export type SalaryComponent = {
  component: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export function currentTotalComp(records: SalaryComponent[]): number {
  return records
    .filter((r) => r.effectiveTo === null)
    .reduce((sum, r) => sum + r.amount, 0);
}

export function groupByComponent(
  records: SalaryComponent[]
): Record<string, SalaryComponent[]> {
  return records.reduce<Record<string, SalaryComponent[]>>((acc, r) => {
    (acc[r.component] ??= []).push(r);
    return acc;
  }, {});
}
