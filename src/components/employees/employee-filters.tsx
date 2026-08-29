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

  // The single synchronous source of truth `setParam` reads from *and*
  // writes to. Every `setParam` call — whether from a Select's immediate
  // `onValueChange` or from the debounced search callback firing up to
  // 300ms later — rebuilds the next URL on top of whatever this ref
  // currently holds, then immediately (synchronously, before `router.push`
  // is even called) overwrites it with the result. Because JS is
  // single-threaded, two `setParam` invocations never overlap: whichever
  // one's triggering event/timer fires *second* always observes the
  // *first* one's completed write to this ref — regardless of how long
  // the first call's own `router.push` navigation subsequently takes to
  // resolve over the network. That's what makes the merge race-free for
  // ANY relative timing between the debounce and a concurrent Select
  // navigation, not just empirically fast ones.
  //
  // Round 2 used a ref synced from `searchParams` via `useEffect`, and the
  // re-review found that ref goes stale for as long as a concurrent
  // navigation's async RSC round-trip is in flight, because `searchParams`
  // (React state) only advances once that round-trip resolves and the
  // component re-renders. Reading `window.location.search` directly at
  // call time does NOT fix this in this codebase: verified directly
  // against the running dev server (patched `history.pushState` to log
  // call times, then clicked a Select and polled `location.search`) that
  // Next 16.3.3's client router calls `history.pushState` only once the
  // navigated-to route's data has resolved — from inside the same commit
  // that updates `useSearchParams()` — not synchronously when
  // `router.push()` is invoked. `location.search` sat unchanged for ~56ms
  // after the click returned before `pushState` finally fired. So
  // `window.location.search` lags an in-flight navigation by exactly the
  // same, unbounded (network-latency-dependent) amount `searchParams`
  // does; it is not a structural fix here. This ref sidesteps the problem
  // entirely by never reading the URL/router for the merge at all — it's
  // self-contained, synchronously-updated JS state, so it can't be stale
  // relative to a concurrent navigation no matter how long that
  // navigation's fetch takes.
  const paramsRef = useRef(new URLSearchParams(searchParams.toString()));

  // Best-effort reconciliation for *external* URL changes this component
  // didn't itself initiate — browser back/forward being the main case —
  // so a subsequent filter click builds on top of the right base instead
  // of resurrecting a filter the user just navigated away from. This is
  // deliberately NOT tied to `searchParams` changing (which would also
  // fire when one of our *own* debounced/immediate pushes finally lands,
  // and could then race a newer synchronous `setParam` write exactly the
  // way round 2's effect did). `popstate` fires only for actual history
  // traversal — never for our own `router.push()` calls, since
  // `pushState`/`replaceState` never trigger `popstate` — and by the time
  // it fires, `window.location.search` already synchronously reflects the
  // traversed-to URL (no async gap here: this is the one case where
  // reading `window.location` is safe, because we're not racing a
  // concurrent in-flight navigation, we're reading the outcome of one the
  // browser already completed). This reconciliation is intentionally out
  // of scope for the race-freedom argument above, which needs no help
  // from the URL or any effect/event listener at all.
  useEffect(() => {
    function handlePopState() {
      paramsRef.current = new URLSearchParams(window.location.search);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    const params = new URLSearchParams(paramsRef.current.toString());
    if (value === "ALL" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    // Write-before-push: this is what makes the merge race-free (see the
    // comment on `paramsRef` above) — the next `setParam` call to run,
    // whenever that is, sees this write regardless of how long the
    // `router.push` below takes to resolve.
    paramsRef.current = params;
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
