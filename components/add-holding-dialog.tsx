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

const EMPTY_FORM = { symbol: "", type: "stock", quantity: "", address: "", manualValue: "" };

function isValid(form: typeof EMPTY_FORM) {
  if (form.type === "property") {
    return Boolean(form.address.trim() && form.manualValue && Number(form.manualValue) > 0);
  }
  return Boolean(form.symbol.trim() && form.quantity && Number(form.quantity) > 0);
}

/** Matches AddCategoryForm's button-opens-modal pattern — a "+" icon trigger instead of a text button, since this sits next to the "Assets" heading rather than standing alone. */
export function AddHoldingDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const isProperty = form.type === "property";

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!isValid(form)) return;

    startTransition(async () => {
      try {
        await createHolding(
          isProperty
            ? { type: "property", address: form.address, manualValue: form.manualValue }
            : { type: form.type, symbol: form.symbol, quantity: form.quantity }
        );
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
              <Field label="Type" htmlFor="new-holding-type">
                <Select
                  aria-label="Type"
                  selectedKey={form.type}
                  onSelectionChange={(key: Key | null) => {
                    if (key != null) setForm({ ...EMPTY_FORM, type: String(key) });
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
                      <ListBoxItem id="property">Property</ListBoxItem>
                    </ListBox>
                  </SelectPopover>
                </Select>
              </Field>

              {isProperty ? (
                <>
                  <Field label="Address" htmlFor="new-holding-address">
                    <Input
                      id="new-holding-address"
                      autoFocus
                      placeholder="e.g. 12 Example Street, Auckland"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      disabled={isPending}
                    />
                  </Field>

                  <Field label="Value (NZD)" htmlFor="new-holding-value">
                    <Input
                      id="new-holding-value"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 950000"
                      value={form.manualValue}
                      onChange={(e) => setForm((f) => ({ ...f, manualValue: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      disabled={isPending}
                    />
                  </Field>
                </>
              ) : (
                <>
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
                </>
              )}
            </DialogBody>

            <DialogFooter>
              <Button size="sm" onPress={handleSubmit} isDisabled={isPending || !isValid(form)}>
                {isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogContainer>
      </DialogBackdrop>
    </Dialog>
  );
}
