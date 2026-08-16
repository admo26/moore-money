"use client";

import { useState, useTransition } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Key } from "react-aria-components";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import { Select, ListBox } from "@/components/ui/hero/select";
import { applyRuleRetroactively, deleteRule, updateRule } from "@/app/(app)/rules/actions";
import type { Category } from "@/lib/db/schema";

export interface RuleRowData {
  id: number;
  pattern: string;
  categoryId: number;
  categoryName: string | null;
}

export function RuleRow({
  rule,
  categories,
  startEditing,
}: {
  rule: RuleRowData;
  categories: Category[];
  startEditing: boolean;
}) {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [pattern, setPattern] = useState(rule.pattern);
  const [categoryId, setCategoryId] = useState(rule.categoryId);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateRule(rule.id, pattern, categoryId);
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setPattern(rule.pattern);
    setCategoryId(rule.categoryId);
    setIsEditing(false);
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(rule.id));
    startTransition(async () => {
      await deleteRule(formData);
    });
  }

  function handleApplyToAll() {
    startTransition(async () => {
      try {
        const count = await applyRuleRetroactively(rule.id);
        toast.success(
          count > 0
            ? `Applied to ${count} transaction${count === 1 ? "" : "s"}`
            : "No matching transactions found"
        );
      } catch {
        toast.error("Couldn't apply rule");
      }
    });
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-2">
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="h-8 w-full font-mono text-xs"
            disabled={isPending}
          />
        </td>
        <td className="px-4 py-2">
          <Select
            aria-label="Category"
            selectedKey={categoryId}
            onSelectionChange={(key: Key | null) => {
              if (key != null) setCategoryId(Number(key));
            }}
            isDisabled={isPending}
          >
            <Select.Trigger className="h-8 min-h-8 text-xs">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {categories.map((c) => (
                  <ListBox.Item key={c.id} id={c.id}>
                    {c.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </td>
        <td className="px-4 py-2 text-right">
          <Button size="sm" onPress={handleSave} isDisabled={isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onPress={handleCancel} isDisabled={isPending}>
            Cancel
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-mono text-xs">{rule.pattern}</td>
      <td className="px-4 py-2">{rule.categoryName}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            className="rounded-full"
            aria-label="Apply to all matching transactions"
            onPress={handleApplyToAll}
            isDisabled={isPending}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            className="rounded-full"
            aria-label="Edit rule"
            onPress={() => setIsEditing(true)}
            isDisabled={isPending}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            isIconOnly
            className="rounded-full"
            aria-label="Delete rule"
            onPress={handleDelete}
            isDisabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
