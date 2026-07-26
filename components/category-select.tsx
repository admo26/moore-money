"use client";

import { useState, useTransition } from "react";
import { setTransactionCategory } from "@/app/(app)/transactions/actions";
import type { Category } from "@/lib/db/schema";

export function CategorySelect({
  transactionId,
  categoryId,
  categories,
}: {
  transactionId: string;
  categoryId: number | null;
  categories: Category[];
}) {
  const [value, setValue] = useState(categoryId ? String(categoryId) : "");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    startTransition(async () => {
      await setTransactionCategory(transactionId, newValue ? Number(newValue) : null);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <option value="">Uncategorised</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
