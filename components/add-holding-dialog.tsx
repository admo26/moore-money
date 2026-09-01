"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Key } from "react-aria-components";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import { Field } from "@/components/ui/field";
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
import { Select, SelectTrigger, SelectValue, SelectIndicator, SelectPopover, ListBox, ListBoxItem } from "@/components/ui/hero/select";
import { createHolding } from "@/app/(app)/net-worth/actions";

const EMPTY_FORM = { symbol: "", type: "stock", quantity: "" };

/** Matches AddCategoryForm's button-opens-modal pattern — a "+" icon trigger instead of a text button, since this sits next to the "Assets" heading rather than standing alone. */
export function AddHoldingDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!form.symbol.trim() || !form.quantity || Number(form.quantity) <= 0) return;

    startTransition(async () => {
      try {
        await createHolding(form.symbol, form.type, form.quantity);
        setOpen(false);
        setForm(EMPTY_FORM);
      } catch {
        toast.error("Couldn't add holding");
      }
    });
  }

  return (
    <Dialog isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        variant="secondary"
        isIconOnly
        className="rounded-full"
        aria-label="Add holding"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <DialogBackdrop>
        <DialogContainer>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add holding</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-3">
              <Field label="Symbol" htmlFor="new-holding-symbol">
                <Input
                  id="new-holding-symbol"
                  autoFocus
                  placeholder="e.g. TEAM, BTC"
                  value={form.symbol}
                  onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  disabled={isPending}
                />
              </Field>

              <Field label="Type" htmlFor="new-holding-type">
                <Select
                  aria-label="Type"
                  selectedKey={form.type}
                  onSelectionChange={(key: Key | null) => {
                    if (key != null) setForm((f) => ({ ...f, type: String(key) }));
                  }}
                  isDisabled={isPending}
                >
                  <SelectTrigger id="new-holding-type" className="h-9">
                    <SelectValue />
                    <SelectIndicator />
                  </SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      <ListBoxItem id="stock">Shares</ListBoxItem>
                      <ListBoxItem id="crypto">Crypto</ListBoxItem>
                    </ListBox>
                  </SelectPopover>
                </Select>
              </Field>

              <Field label="Quantity" htmlFor="new-holding-quantity">
                <Input
                  id="new-holding-quantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 10"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  disabled={isPending}
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <Button
                size="sm"
                onPress={handleSubmit}
                isDisabled={isPending || !form.symbol.trim() || !form.quantity}
              >
                {isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogContainer>
      </DialogBackdrop>
    </Dialog>
  );
}
