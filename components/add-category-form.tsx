"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import { createCategory } from "@/app/(app)/settings/actions";

export function AddCategoryForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await createCategory(trimmed);
        setName("");
        inputRef.current?.focus();
      } catch {
        toast.error("Couldn't add category");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="new-category-name" className="text-xs font-medium text-muted-foreground">
          New category
        </label>
        <Input
          id="new-category-name"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pets"
          className="w-56"
          disabled={isPending}
        />
      </div>
      <Button type="submit" size="sm" isDisabled={isPending || !name.trim()}>
        Add category
      </Button>
    </form>
  );
}
