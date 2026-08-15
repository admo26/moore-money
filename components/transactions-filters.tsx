"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/hero/input";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/lib/db/schema";

const DEBOUNCE_MS = 450;

export function TransactionsFilters({
  accounts,
  categories,
  defaults,
}: {
  accounts: Account[];
  categories: Category[];
  defaults: {
    accountId?: string;
    categoryId?: string;
    q?: string;
    from?: string;
    to?: string;
    minAmount?: string;
    maxAmount?: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasAdvancedDefaults = Boolean(
    defaults.from || defaults.to || defaults.minAmount || defaults.maxAmount
  );
  const [showMore, setShowMore] = useState(hasAdvancedDefaults);

  const [q, setQ] = useState(defaults.q ?? "");
  const [minAmount, setMinAmount] = useState(defaults.minAmount ?? "");
  const [maxAmount, setMaxAmount] = useState(defaults.maxAmount ?? "");

  // Debounce free-typed fields so we don't reload on every keystroke; submit
  // immediately for single-action controls (selects, dates) via onChange.
  useDebouncedSubmit(formRef, q, defaults.q ?? "");
  useDebouncedSubmit(formRef, minAmount, defaults.minAmount ?? "");
  useDebouncedSubmit(formRef, maxAmount, defaults.maxAmount ?? "");

  function submitNow() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} method="GET" className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="q"
            name="q"
            placeholder="Description or merchant"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-56"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="accountId" className="text-xs font-medium text-muted-foreground">
            Account
          </label>
          <select
            id="accountId"
            name="accountId"
            defaultValue={defaults.accountId ?? ""}
            onChange={submitNow}
            className="h-9 w-48 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.connectionName} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={defaults.categoryId ?? ""}
            onChange={submitNow}
            className="h-9 w-48 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">All categories</option>
            <option value="uncategorised">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {(defaults.q ||
          defaults.accountId ||
          defaults.categoryId ||
          defaults.from ||
          defaults.to ||
          defaults.minAmount ||
          defaults.maxAmount) && (
          <a
            href="/transactions"
            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Clear
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {showMore ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" /> Hide date & amount filters
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" /> More filters (date, amount)
          </>
        )}
      </button>

      {/* Kept in the DOM (not unmounted) so toggling visibility never drops an
          already-applied date/amount filter from the next submit. */}
      <div className={cn("flex flex-wrap items-end gap-3", !showMore && "hidden")}>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            id="from"
            type="date"
            name="from"
            defaultValue={defaults.from ?? ""}
            onChange={submitNow}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            id="to"
            type="date"
            name="to"
            defaultValue={defaults.to ?? ""}
            onChange={submitNow}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="minAmount" className="text-xs font-medium text-muted-foreground">
            Min amount
          </label>
          <Input
            id="minAmount"
            type="number"
            step="0.01"
            name="minAmount"
            placeholder="-100.00"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-32"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="maxAmount" className="text-xs font-medium text-muted-foreground">
            Max amount
          </label>
          <Input
            id="maxAmount"
            type="number"
            step="0.01"
            name="maxAmount"
            placeholder="100.00"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-32"
          />
        </div>
      </div>
    </form>
  );
}

function useDebouncedSubmit(
  formRef: React.RefObject<HTMLFormElement | null>,
  value: string,
  initialValue: string
) {
  useEffect(() => {
    if (value === initialValue) return;
    const timeout = setTimeout(() => formRef.current?.requestSubmit(), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // Only re-run when the field's own value changes — initialValue/formRef are stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
