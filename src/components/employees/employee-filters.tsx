"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "People", "Operations", "Customer Success", "Legal"];
const COUNTRIES = ["United States", "United Kingdom", "Germany", "India", "Canada", "Australia"];
const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"];

const SEARCH_DEBOUNCE_MS = 300;

export function EmployeeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  // Local, immediately-responsive copy of the search text. The URL (and thus
  // the server query) is only updated after the user pauses typing, so we
  // don't push a router navigation — and hit the DB — on every keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL's search param changes from outside
  // this component's own debounced update (e.g. browser back/forward).
  // Adjusted during render (React's recommended pattern for deriving state
  // from a changed prop) rather than in an effect, to avoid an extra
  // render pass and the associated lint warning against setState-in-effect.
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchInput(urlSearch);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("search", value);
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search by name"
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
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
