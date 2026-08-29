"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "People", "Operations", "Customer Success", "Legal"];
const COUNTRIES = ["United States", "United Kingdom", "Germany", "India", "Canada", "Australia"];
const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"];

export function EmployeeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search by name"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => setParam("search", e.target.value)}
        className="w-64"
      />
      <Select
        key={`department-${searchParams.get("department") ?? "ALL"}`}
        defaultValue={searchParams.get("department") ?? "ALL"}
        onValueChange={(v) => setParam("department", v)}
      >
        <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All departments</SelectItem>
          {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select
        key={`country-${searchParams.get("country") ?? "ALL"}`}
        defaultValue={searchParams.get("country") ?? "ALL"}
        onValueChange={(v) => setParam("country", v)}
      >
        <SelectTrigger className="w-44"><SelectValue placeholder="Country" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All countries</SelectItem>
          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select
        key={`jobLevel-${searchParams.get("jobLevel") ?? "ALL"}`}
        defaultValue={searchParams.get("jobLevel") ?? "ALL"}
        onValueChange={(v) => setParam("jobLevel", v)}
      >
        <SelectTrigger className="w-32"><SelectValue placeholder="Level" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All levels</SelectItem>
          {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
