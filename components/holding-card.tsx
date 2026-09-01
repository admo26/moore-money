"use client";

import { useState, useTransition } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/hero/card";
import { Button } from "@/components/ui/hero/button";
import { MenuTrigger, MenuPopover, Menu, MenuItem } from "@/components/ui/hero/menu";
import { Money } from "@/components/ui/money";
import { EditHoldingDialog } from "@/components/edit-holding-dialog";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { deleteHolding } from "@/app/(app)/net-worth/actions";
import type { Holding } from "@/lib/db/schema";

/** Trims a numeric(20,8) string's trailing zeros — "455.00000000" -> "455", "0.50000000" -> "0.5". */
function formatQuantity(quantity: string) {
  return Number(quantity).toString();
}

const TYPE_LABEL: Record<string, string> = {
  stock: "Shares",
  crypto: "Crypto",
  property: "Property",
};

export function HoldingCard({
  holding,
  priceUsd,
  usdToNzd,
  priceFetchedAt,
}: {
  holding: Holding;
  priceUsd: number | null;
  usdToNzd: number | null;
  priceFetchedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const isProperty = holding.type === "property";
  const valueUsd = !isProperty && priceUsd !== null ? Number(holding.quantity) * priceUsd : null;
  const valueNzd = isProperty
    ? holding.manualValue !== null
      ? Number(holding.manualValue)
      : null
    : valueUsd !== null && usdToNzd !== null
      ? valueUsd * usdToNzd
      : null;
  const priceNzd = priceUsd !== null && usdToNzd !== null ? priceUsd * usdToNzd : null;
  const title = isProperty ? holding.address : holding.symbol;

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(holding.id));
    startTransition(async () => {
      await deleteHolding(formData);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="truncate text-base font-medium">{title}</CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium uppercase text-secondary-foreground">
              {TYPE_LABEL[holding.type] ?? holding.type}
            </span>
            <MenuTrigger>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                className="rounded-full"
                aria-label="Holding actions"
                isDisabled={isPending}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
              <MenuPopover>
                <Menu
                  onAction={(key) => {
                    if (key === "edit") setEditOpen(true);
                    if (key === "delete") handleDelete();
                  }}
                >
                  <MenuItem id="edit">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </MenuItem>
                  <MenuItem id="delete" variant="danger">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </MenuItem>
                </Menu>
              </MenuPopover>
            </MenuTrigger>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isProperty && (
          <div className="text-xs text-muted-foreground">
            {formatQuantity(holding.quantity ?? "0")} units
            {priceNzd !== null && ` · ${formatMoney(priceNzd)} / unit (${formatMoney(priceUsd, "USD")})`}
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <Money value={valueNzd} color="negative" className="text-2xl font-semibold" />
          {valueUsd !== null && (
            <span className="text-sm text-muted-foreground">({formatMoney(valueUsd, "USD")})</span>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {priceFetchedAt ? `Updated ${formatRelativeTime(priceFetchedAt)}` : "Not yet priced"}
        </div>
      </CardContent>

      <EditHoldingDialog holding={holding} isOpen={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
}
