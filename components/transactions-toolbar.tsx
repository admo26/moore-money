"use client";

import { useEffect, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/hero/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/hero/popover";
import { Select, ListBox } from "@/components/ui/hero/select";
import { TransactionsSort } from "@/components/transactions-sort";
import type { Account, Category } from "@/lib/db/schema";

const DEBOUNCE_MS = 450;

export function TransactionsToolbar({
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
    sortBy: string;
    sortDir: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);

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

  const activeFilterCount = [
    defaults.accountId,
    defaults.categoryId,
    defaults.from,
    defaults.to,
    defaults.minAmount,
    defaults.maxAmount,
  ].filter(Boolean).length;

  return (
    <form ref={formRef} method="GET" className="flex flex-wrap items-center gap-3">
      {/* Carried through on every submit so sort isn't lost when a filter changes. */}
      <input type="hidden" name="sortBy" value={defaults.sortBy} />
      <input type="hidden" name="sortDir" value={defaults.sortDir} />

      <Popover>
        <PopoverTrigger className="inline-flex! h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent>
          <div className="w-72 space-y-3 p-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="accountId" className="text-xs font-medium text-muted-foreground">
                Account
              </label>
              <Select
                name="accountId"
                defaultSelectedKey={defaults.accountId ?? ""}
                onSelectionChange={() => submitNow()}
              >
                <Select.Trigger id="accountId" className="h-9 w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="">All accounts</ListBox.Item>
                    {accounts.map((a) => (
                      <ListBox.Item key={a.id} id={a.id}>
                        {a.connectionName} — {a.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="categoryId" className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Select
                name="categoryId"
                defaultSelectedKey={defaults.categoryId ?? ""}
                onSelectionChange={() => submitNow()}
              >
                <Select.Trigger id="categoryId" className="h-9 w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="">All categories</ListBox.Item>
                    <ListBox.Item id="uncategorised">Uncategorised</ListBox.Item>
                    {categories.map((c) => (
                      <ListBox.Item key={c.id} id={c.id}>
                        {c.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <a
                href="/transactions"
                className="inline-block text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </a>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <TransactionsSort sortBy={defaults.sortBy} sortDir={defaults.sortDir} />

      <div className="relative ml-auto">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="q"
          name="q"
          placeholder="Search description or merchant"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-64 rounded-full pl-9!"
        />
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
