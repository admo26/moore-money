import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/db/schema";

export function AccountsWidget({ accounts }: { accounts: Account[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((account) => {
              const balance = Number(account.currentBalance ?? 0);
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{account.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {account.connectionName}
                    </div>
                  </div>
                  <div
                    className={
                      balance < 0
                        ? "shrink-0 text-sm font-semibold text-negative"
                        : "shrink-0 text-sm font-semibold"
                    }
                  >
                    {formatMoney(account.currentBalance, account.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
