"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import {
  Dialog,
  DialogBackdrop,
  DialogContainer,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/hero/dialog";
import { createCategory } from "@/app/(app)/settings/actions";

/** Matches McpTokenDialog's button-opens-modal pattern, rather than an inline form, so both "add" actions in Settings follow the same convention. */
export function AddCategoryForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setName("");
  }

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await createCategory(trimmed);
        setOpen(false);
        setName("");
      } catch {
        toast.error("Couldn't add category");
      }
    });
  }

  return (
    <Dialog isOpen={open} onOpenChange={handleOpenChange}>
      <Button size="sm">Add category</Button>
      <DialogBackdrop>
        <DialogContainer>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add category</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-category-name" className="text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <Input
                  id="new-category-name"
                  autoFocus
                  placeholder="e.g. Pets"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  disabled={isPending}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button size="sm" onPress={handleSubmit} isDisabled={isPending || !name.trim()}>
                {isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogContainer>
      </DialogBackdrop>
    </Dialog>
  );
}
