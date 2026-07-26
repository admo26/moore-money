import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/db/schema";

export function AccountCard({ account }: { account: Account }) {
  const balance = Number(account.currentBalance ?? 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {account.connectionName}
          </CardTitle>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {account.type}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-base font-medium">{account.name}</div>
        <div
          className={
            balance < 0
              ? "mt-1 text-2xl font-semibold text-negative"
              : "mt-1 text-2xl font-semibold"
          }
        >
          {formatMoney(account.currentBalance, account.currency)}
        </div>
        {account.availableBalance && (
          <div className="mt-1 text-xs text-muted-foreground">
            {formatMoney(account.availableBalance, account.currency)} available
          </div>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          Updated {formatDate(account.lastRefreshed)}
        </div>
      </CardContent>
    </Card>
  );
}
