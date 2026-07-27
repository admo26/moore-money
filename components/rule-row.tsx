"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            disabled={isPending}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2 text-right">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
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
        <Button size="sm" variant="ghost" onClick={handleApplyToAll} disabled={isPending}>
          Apply to all
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} disabled={isPending}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDelete} disabled={isPending}>
          Delete
        </Button>
      </td>
    </tr>
  );
}
