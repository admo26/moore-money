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
        <td className="px-4 py-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-56"
            disabled={isPending}
          />
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
      <td className="px-4 py-2">{category.name}</td>
      <td className="px-4 py-2 text-right">
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
