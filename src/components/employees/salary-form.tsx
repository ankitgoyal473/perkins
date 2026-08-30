"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordSalaryChange } from "@/app/(dashboard)/employees/[id]/actions";

const COMPONENTS = ["BASE", "BONUS", "ALLOWANCE"];

export function SalaryForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [component, setComponent] = useState("BASE");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setPending(true);
    try {
      await recordSalaryChange({
        employeeId,
        component,
        amount: parsedAmount,
        currency,
        effectiveFrom: new Date(),
      });
      setAmount("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Select value={component} onValueChange={(v) => v && setComponent(v)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPONENTS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32"
        required
      />
      <Input
        placeholder="Currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        className="w-20"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Record change"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
