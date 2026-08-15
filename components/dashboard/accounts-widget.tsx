import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { AccountLogo } from "@/components/dashboard/account-logo";
import { Sparkline } from "@/components/charts/sparkline";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Account } from "@/lib/db/schema";
import type { AccountSparkline } from "@/lib/reports/queries";

export function AccountsWidget({
  accounts,
  sparklines,
}: {
  accounts: Account[];
  sparklines: Map<string, AccountSparkline>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Accounts
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {accounts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((account) => {
              const balance = Number(account.currentBalance ?? 0);
              const changePct = sparklines.get(account.id)?.changePct ?? null;
              const points = sparklines.get(account.id)?.points ?? [];
              const positive = (changePct ?? 0) >= 0;

              return (
                <div key={account.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <AccountLogo name={account.connectionName} logoUrl={account.logo} />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{account.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {account.connectionName}
                    </div>
                  </div>

                  <Sparkline
                    data={points.map((p) => ({ value: p.balance }))}
                    positive={positive}
                  />

                  <div className="shrink-0 text-right">
                    <div
                      className={
                        balance < 0
                          ? "text-sm font-semibold text-negative"
                          : "text-sm font-semibold"
                      }
                    >
                      {formatMoney(account.currentBalance, account.currency)}
                    </div>
                    {changePct !== null && (
                      <div
                        className={
                          positive
                            ? "text-xs font-medium text-positive"
                            : "text-xs font-medium text-negative"
                        }
                      >
                        {positive ? "↑" : "↓"} {formatPercent(changePct)}
                      </div>
                    )}
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
