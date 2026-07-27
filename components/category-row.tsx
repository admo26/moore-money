"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteCategory, updateCategory } from "@/app/(app)/settings/actions";

export interface CategoryRowData {
  id: number;
  name: string;
}

export function CategoryRow({ category }: { category: CategoryRowData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateCategory(category.id, name);
        setIsEditing(false);
      } catch {
        toast.error("Couldn't rename category");
      }
    });
  }

  function handleCancel() {
    setName(category.name);
    setIsEditing(false);
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Delete "${category.name}"? Rules using it will be deleted, and transactions using it will become uncategorised.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
      } catch {
        toast.error("Couldn't delete category");
      }
    });
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td className="px-3 py-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 w-56"
            disabled={isPending}
          />
        </td>
        <td className="px-3 py-1 text-right">
          <div className="flex justify-end gap-1">
            <Button size="xs" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
            <Button size="xs" variant="ghost" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-1 text-sm">{category.name}</td>
      <td className="px-3 py-1 text-right">
        <div className="flex justify-end gap-1">
          <Button size="xs" variant="ghost" onClick={() => setIsEditing(true)} disabled={isPending}>
            Edit
          </Button>
          <Button size="xs" variant="ghost" onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
