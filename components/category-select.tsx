"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { toast } from "sonner";
import { Select, ListBox } from "@/components/ui/hero/select";
import { setTransactionCategory } from "@/app/(app)/transactions/actions";
import { applyRuleRetroactively, createRuleFromValues } from "@/app/(app)/rules/actions";
import type { Category } from "@/lib/db/schema";

/** Sentinel key for "no category" — matches the ?categoryId=uncategorised convention used elsewhere in this app. */
const UNCATEGORISED = "uncategorised";

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
  const [value, setValue] = useState(categoryId ? String(categoryId) : UNCATEGORISED);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSelectionChange(key: Key | null) {
    if (key == null) return;
    const newValue = String(key);
    setValue(newValue);
    startTransition(async () => {
      const newCategoryId = newValue === UNCATEGORISED ? null : Number(newValue);
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
                    description: "Apply it to matching transactions you've already synced?",
                    action: {
                      label: "Apply to all",
                      onClick: () => {
                        applyRuleRetroactively(ruleId)
                          .then((count) =>
                            toast.success(
                              count > 0
                                ? `Applied to ${count} transaction${count === 1 ? "" : "s"}`
                                : "No matching transactions found"
                            )
                          )
                          .catch(() => toast.error("Couldn't apply rule"));
                      },
                    },
                    cancel: {
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
    <Select
      aria-label="Category"
      selectedKey={value}
      onSelectionChange={handleSelectionChange}
      isDisabled={isPending}
    >
      <Select.Trigger className="h-8 min-h-8 text-xs">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={UNCATEGORISED}>Uncategorised</ListBox.Item>
          {categories.map((c) => (
            <ListBox.Item key={c.id} id={String(c.id)}>
              {c.name}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
