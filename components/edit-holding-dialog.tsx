"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { updateHolding } from "@/app/(app)/net-worth/actions";
import type { Holding } from "@/lib/db/schema";

function fieldsFor(holding: Holding) {
  return {
    symbol: holding.symbol ?? "",
    quantity: holding.quantity ?? "",
    address: holding.address ?? "",
    manualValue: holding.manualValue ?? "",
  };
}

/**
 * No visible trigger of its own — opened via the kebab menu's "Edit" item,
 * which is why this only needs isOpen/onOpenChange (react-aria's ModalOverlay
 * reads open state from context regardless of whether a trigger was clicked).
 */
export function EditHoldingDialog({
  holding,
  isOpen,
  onOpenChange,
}: {
  holding: Holding;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isProperty = holding.type === "property";
  const [form, setForm] = useState(fieldsFor(holding));
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) setForm(fieldsFor(holding));
  }

  function isValid() {
    return isProperty
      ? Boolean(form.address?.trim() && form.manualValue && Number(form.manualValue) > 0)
      : Boolean(form.symbol?.trim() && form.quantity && Number(form.quantity) > 0);
  }

  function handleSubmit() {
    if (!isValid()) return;

    startTransition(async () => {
      try {
        await updateHolding(holding.id, form);
        onOpenChange(false);
      } catch {
        toast.error("Couldn't update holding");
      }
    });
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <DialogBackdrop>
        <DialogContainer>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit holding</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-3">
              {isProperty ? (
                <>
                  <Field label="Address" htmlFor="edit-holding-address">
                    <Input
                      id="edit-holding-address"
                      autoFocus
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      disabled={isPending}
                    />
                  </Field>

                  <Field label="Value (NZD)" htmlFor="edit-holding-value">
                    <Input
                      id="edit-holding-value"
                      type="number"
                      step="any"
                      min="0"
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
                  <Field label="Symbol" htmlFor="edit-holding-symbol">
                    <Input
                      id="edit-holding-symbol"
                      autoFocus
                      value={form.symbol}
                      onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      disabled={isPending}
                    />
                  </Field>

                  <Field label="Quantity" htmlFor="edit-holding-quantity">
                    <Input
                      id="edit-holding-quantity"
                      type="number"
                      step="any"
                      min="0"
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
              <Button size="sm" onPress={handleSubmit} isDisabled={isPending || !isValid()}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogContainer>
      </DialogBackdrop>
    </Dialog>
  );
}
