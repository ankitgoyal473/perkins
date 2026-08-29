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

  // Always-current snapshot of `searchParams`, refreshed via effect after
  // every render in which it changed (never mutated during render itself —
  // that trips this project's react-hooks/refs lint rule). The debounce
  // timer's callback fires up to 300ms after the render that scheduled it,
  // by which point other filters (Department/Country/Level, which push
  // immediately/undebounced) may have already changed the URL. Reading
  // through this ref instead of closing over `searchParams` directly means
  // `setParam` always rebuilds from the *live* query string, so a filter
  // picked while a search debounce is pending is never dropped when the
  // debounced push lands. The effect always runs (commit + passive-effect
  // flush) before the browser can deliver a subsequent user event such as
  // a Select click, so there's no window where the ref is stale for a
  // synchronous caller either.
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // The last search value *this component* has pushed (or is about to
  // push) to the URL, tracked as state (not a ref) so it can be read
  // safely during the render-phase sync check below. Lets that check tell
  // "the URL's search param changed because our own debounced push just
  // landed" (in which case `searchInput` may already be ahead — further
  // keystrokes typed during the async gap between the push and its
  // re-render — and must not be clobbered) apart from "changed for some
  // external reason, e.g. browser back/forward" (in which case
  // `searchInput` should adopt it).
  const [lastPushedSearch, setLastPushedSearch] = useState(urlSearch);

  // Keep the input in sync when the URL's search param changes from outside
  // this component's own debounced update. Adjusted during render (React's
  // recommended pattern for deriving state from a changed prop) rather than
  // in an effect, to avoid an extra render pass and the associated lint
  // warning against setState-in-effect.
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    if (urlSearch !== lastPushedSearch) {
      setSearchInput(urlSearch);
      setLastPushedSearch(urlSearch);
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
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
      setLastPushedSearch(value);
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
