"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/lib/db/schema";

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
  const hasAdvancedDefaults = Boolean(
    defaults.from || defaults.to || defaults.minAmount || defaults.maxAmount
  );
  const [showMore, setShowMore] = useState(hasAdvancedDefaults);

  return (
    <form
      method="GET"
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="q"
            name="q"
            placeholder="Description or merchant"
            defaultValue={defaults.q ?? ""}
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

        <Button type="submit" size="sm">
          Filter
        </Button>
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
          <Input id="from" type="date" name="from" defaultValue={defaults.from ?? ""} className="w-40" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input id="to" type="date" name="to" defaultValue={defaults.to ?? ""} className="w-40" />
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
            defaultValue={defaults.minAmount ?? ""}
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
            defaultValue={defaults.maxAmount ?? ""}
            className="w-32"
          />
        </div>
      </div>
    </form>
  );
}
