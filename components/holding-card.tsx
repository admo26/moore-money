"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/hero/card";
import { Button } from "@/components/ui/hero/button";
import { AccountLogo } from "@/components/dashboard/account-logo";
import { Money } from "@/components/ui/money";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { deleteHolding } from "@/app/(app)/net-worth/actions";
import type { Holding } from "@/lib/db/schema";

export function HoldingCard({
  holding,
  price,
  priceFetchedAt,
}: {
  holding: Holding;
  price: number | null;
  priceFetchedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();
  const value = price !== null ? Number(holding.quantity) * price : null;

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
            {holding.type === "crypto" ? "Crypto" : "Stock"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {holding.symbol}
            </span>
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
          <AccountLogo name={holding.symbol} logoUrl={null} />
          <div>
            <div className="text-base font-medium">
              {holding.quantity} {holding.symbol}
            </div>
            <div className="text-xs text-muted-foreground">
              {price !== null ? `${formatMoney(price, "USD")} / unit` : "Price unavailable"}
            </div>
          </div>
        </div>
        <Money value={value} currency="USD" color="negative" className="mt-2 block text-2xl font-semibold" />
        <div className="mt-3 text-xs text-muted-foreground">
          {priceFetchedAt ? `Updated ${formatRelativeTime(priceFetchedAt)}` : "Not yet priced"}
        </div>
      </CardContent>
    </Card>
  );
}
