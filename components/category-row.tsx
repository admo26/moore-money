"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import { cn } from "@/lib/utils";
import { deleteCategory, setCategoryFavourite, updateCategory } from "@/app/(app)/settings/actions";

export interface CategoryRowData {
  id: number;
  name: string;
  isFavourite: boolean;
}

export function CategoryRow({ category }: { category: CategoryRowData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [isFavourite, setIsFavourite] = useState(category.isFavourite);
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

  function handleToggleFavourite() {
    const next = !isFavourite;
    setIsFavourite(next);
    startTransition(async () => {
      try {
        await setCategoryFavourite(category.id, next);
      } catch {
        setIsFavourite(!next);
        toast.error("Couldn't update favourite");
      }
    });
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

  const favouriteButton = (
    <button
      type="button"
      onClick={handleToggleFavourite}
      disabled={isPending}
      aria-label={isFavourite ? "Unstar category" : "Star category"}
      title={isFavourite ? "Unstar category" : "Star category"}
      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <Star className={cn("h-4 w-4", isFavourite && "fill-current text-primary")} />
    </button>
  );

  if (isEditing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {favouriteButton}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-56"
              disabled={isPending}
            />
          </div>
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
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          {favouriteButton}
          {category.name}
        </div>
      </td>
      <td className="px-4 py-2 text-right">
        <Button size="sm" variant="ghost" onPress={() => setIsEditing(true)} isDisabled={isPending}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onPress={handleDelete} isDisabled={isPending}>
          Delete
        </Button>
      </td>
    </tr>
  );
}
