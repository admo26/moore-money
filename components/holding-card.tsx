"use client";

import { useTransition } from "react";
import { Home, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/hero/card";
import { Button } from "@/components/ui/hero/button";
import { AccountLogo } from "@/components/dashboard/account-logo";
import { Money } from "@/components/ui/money";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { deleteHolding } from "@/app/(app)/net-worth/actions";
import type { Holding } from "@/lib/db/schema";

/** Trims a numeric(20,8) string's trailing zeros — "455.00000000" -> "455", "0.50000000" -> "0.5". */
function formatQuantity(quantity: string) {
  return Number(quantity).toString();
}

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isProperty ? "Property" : holding.type === "crypto" ? "Crypto" : "Shares"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {holding.symbol && (
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {holding.symbol}
              </span>
            )}
            <Button
              size="sm"
              variant="danger-soft"
              isIconOnly
              className="rounded-full"
              aria-label="Delete holding"
              onPress={handleDelete}
              isDisabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {isProperty ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Home className="h-4 w-4" />
            </div>
          ) : (
            <AccountLogo name={holding.symbol ?? ""} logoUrl={null} />
          )}
          <div>
            {isProperty ? (
              <div className="text-base font-medium">{holding.address}</div>
            ) : (
              <>
                <div className="text-base font-medium">
                  {formatQuantity(holding.quantity ?? "0")} {holding.symbol}
                </div>
                <div className="text-xs text-muted-foreground">
                  {priceNzd !== null
                    ? `${formatMoney(priceNzd)} / unit (${formatMoney(priceUsd, "USD")})`
                    : "Price unavailable"}
                </div>
              </>
            )}
          </div>
        </div>
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
    </Card>
  );
}
