"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTransactionCategory } from "@/app/(app)/transactions/actions";
import { createRuleFromValues } from "@/app/(app)/rules/actions";
import type { Category } from "@/lib/db/schema";

export function CategorySelect({
  transactionId,
  categoryId,
  categories,
  pattern,
}: {
  transactionId: string;
  categoryId: number | null;
  categories: Category[];
  /** Merchant/description text used as the suggested rule pattern. */
  pattern: string;
}) {
  const [value, setValue] = useState(categoryId ? String(categoryId) : "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    startTransition(async () => {
      const newCategoryId = newValue ? Number(newValue) : null;
      await setTransactionCategory(transactionId, newCategoryId);

      const trimmedPattern = pattern.trim();
      const category = newCategoryId
        ? categories.find((c) => c.id === newCategoryId)
        : undefined;

      if (category && trimmedPattern) {
        toast(`Categorised as ${category.name}`, {
          description: `Create a rule so future "${trimmedPattern}" transactions match automatically?`,
          action: {
            label: "Create rule",
            onClick: () => {
              createRuleFromValues(trimmedPattern, category.id)
                .then((ruleId) => {
                  toast.success("Rule created", {
                    action: {
                      label: "Edit rule",
                      onClick: () => router.push(`/rules?edit=${ruleId}`),
                    },
                  });
                })
                .catch(() => toast.error("Couldn't create rule"));
            },
          },
        });
      }
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
