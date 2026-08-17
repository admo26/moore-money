"use client";

import { useEffect, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";
import type { Selection } from "react-aria-components";
import { Input } from "@/components/ui/hero/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/hero/popover";
import { ListBox } from "@/components/ui/hero/select";
import { Field } from "@/components/ui/field";
import { TransactionsSort } from "@/components/transactions-sort";
import type { Account, Category } from "@/lib/db/schema";

const DEBOUNCE_MS = 450;

function toIds(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function TransactionsToolbar({
  accounts,
  categories,
  defaults,
}: {
  accounts: Account[];
  categories: Category[];
  defaults: {
    accountIds?: string;
    categoryIds?: string;
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
  const [from, setFrom] = useState(defaults.from ?? "");
  const [to, setTo] = useState(defaults.to ?? "");
  const [minAmount, setMinAmount] = useState(defaults.minAmount ?? "");
  const [maxAmount, setMaxAmount] = useState(defaults.maxAmount ?? "");
  const [accountIds, setAccountIds] = useState<string[]>(toIds(defaults.accountIds));
  const [categoryIds, setCategoryIds] = useState<string[]>(toIds(defaults.categoryIds));

  // Debounce free-typed fields so we don't reload on every keystroke; submit
  // immediately for single-action controls (selects, dates, checklists) via onChange.
  useDebouncedSubmit(formRef, q, defaults.q ?? "");
  useDebouncedSubmit(formRef, minAmount, defaults.minAmount ?? "");
  useDebouncedSubmit(formRef, maxAmount, defaults.maxAmount ?? "");
  useSubmitOnChange(formRef, accountIds.join(","), defaults.accountIds ?? "");
  useSubmitOnChange(formRef, categoryIds.join(","), defaults.categoryIds ?? "");
  useSubmitOnChange(formRef, from, defaults.from ?? "");
  useSubmitOnChange(formRef, to, defaults.to ?? "");

  function handleAccountChange(keys: Selection) {
    if (keys === "all") return;
    setAccountIds([...keys].map(String));
  }

  function handleCategoryChange(keys: Selection) {
    if (keys === "all") return;
    setCategoryIds([...keys].map(String));
  }

  const activeFilterCount = [
    accountIds.length > 0,
    categoryIds.length > 0,
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
      <input type="hidden" name="accountIds" value={accountIds.join(",")} />
      <input type="hidden" name="categoryIds" value={categoryIds.join(",")} />
      {/*
       * HeroUI's Popover renders its content in a portal attached to
       * document.body — the From/To/Min/Max inputs below live inside
       * PopoverContent, so despite being JSX children of this <form>,
       * they are NOT DOM descendants of it and are silently excluded from
       * native form submission (confirmed: their name="..." attributes on
       * their own never made it into the query string). Same fix as
       * accountIds/categoryIds above: mirror the value into a hidden input
       * that lives directly in the form.
       */}
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="minAmount" value={minAmount} />
      <input type="hidden" name="maxAmount" value={maxAmount} />

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
            <Field label={<>Account {accountIds.length > 0 && `(${accountIds.length})`}</>}>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                <ListBox
                  aria-label="Filter by account"
                  selectionMode="multiple"
                  selectedKeys={new Set(accountIds)}
                  onSelectionChange={handleAccountChange}
                >
                  {accounts.map((a) => (
                    <ListBox.Item key={a.id} id={a.id}>
                      <ListBox.Item.Indicator />
                      {a.connectionName} — {a.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </div>
            </Field>

            <Field label={<>Category {categoryIds.length > 0 && `(${categoryIds.length})`}</>}>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                <ListBox
                  aria-label="Filter by category"
                  selectionMode="multiple"
                  selectedKeys={new Set(categoryIds)}
                  onSelectionChange={handleCategoryChange}
                >
                  <ListBox.Item id="uncategorised">
                    <ListBox.Item.Indicator />
                    Uncategorised
                  </ListBox.Item>
                  {categories.map((c) => (
                    <ListBox.Item key={c.id} id={String(c.id)}>
                      <ListBox.Item.Indicator />
                      {c.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="From" htmlFor="from">
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="To" htmlFor="to">
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Min amount" htmlFor="minAmount">
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  placeholder="-100.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </Field>
              <Field label="Max amount" htmlFor="maxAmount">
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </Field>
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
          placeholder="Search description, merchant, or amount"
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

/** Like useDebouncedSubmit but instant — for discrete picks (checklists) where there's no keystroke to debounce, unlike free-typed fields. */
function useSubmitOnChange(
  formRef: React.RefObject<HTMLFormElement | null>,
  value: string,
  initialValue: string
) {
  useEffect(() => {
    if (value === initialValue) return;
    formRef.current?.requestSubmit();
    // Only re-run when the field's own value changes — initialValue/formRef are stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
