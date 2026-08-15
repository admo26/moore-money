import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { AccountCard } from "@/components/account-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { formatMoney } from "@/lib/format";
import { accountClass } from "@/lib/accounts/classify";

async function loadAccounts() {
  return db.select().from(accounts);
}

export default async function NetWorthPage() {
  let rows: Awaited<ReturnType<typeof loadAccounts>> = [];
  let error: string | null = null;

  try {
    rows = await loadAccounts();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load net worth.";
  }

  const assetAccounts = rows.filter((a) => accountClass(a.type) === "asset");
  const liabilityAccounts = rows.filter((a) => accountClass(a.type) === "liability");
  const sumBalance = (list: typeof rows) =>
    list.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0);
  const totalAssets = sumBalance(assetAccounts);
  const totalLiabilities = sumBalance(liabilityAccounts);
  const netWorth = totalAssets + totalLiabilities;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground">
          Everything you own (assets) minus everything you owe (liabilities), across every
          linked account.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load net worth: {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No accounts yet. Click <span className="font-medium">Sync now</span> above once
          Akahu is configured.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={
                  netWorth < 0
                    ? "text-3xl font-semibold text-negative"
                    : "text-3xl font-semibold text-positive"
                }
              >
                {formatMoney(netWorth)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatMoney(totalAssets)} in assets − {formatMoney(-totalLiabilities)} in
                liabilities
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">Assets</h2>
              <span className="text-sm font-medium text-positive">
                {formatMoney(totalAssets)}
              </span>
            </div>
            {assetAccounts.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No asset accounts linked yet (e.g. KiwiSaver, managed funds, savings).
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assetAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">Liabilities</h2>
              <span className="text-sm font-medium text-negative">
                {formatMoney(totalLiabilities)}
              </span>
            </div>
            {liabilityAccounts.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No liability accounts linked (e.g. loans, credit cards).
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liabilityAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
