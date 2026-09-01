import { db } from "@/lib/db";
import { accounts, holdings } from "@/lib/db/schema";
import { AccountCard } from "@/components/account-card";
import { HoldingCard } from "@/components/holding-card";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Money } from "@/components/ui/money";
import { formatMoney } from "@/lib/format";
import { accountClass } from "@/lib/accounts/classify";
import { getHoldingPrices, getUsdToNzdRate } from "@/lib/holdings/prices";

async function loadData() {
  const [accountRows, holdingRows] = await Promise.all([
    db.select().from(accounts),
    db.select().from(holdings),
  ]);
  return { accountRows, holdingRows };
}

export default async function NetWorthPage() {
  let accountRows: Awaited<ReturnType<typeof loadData>>["accountRows"] = [];
  let holdingRows: Awaited<ReturnType<typeof loadData>>["holdingRows"] = [];
  let error: string | null = null;

  try {
    const data = await loadData();
    accountRows = data.accountRows;
    holdingRows = data.holdingRows;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load net worth.";
  }

  const assetAccounts = accountRows.filter((a) => accountClass(a.type) === "asset");
  const liabilityAccounts = accountRows.filter((a) => accountClass(a.type) === "liability");
  const sumBalance = (list: typeof accountRows) =>
    list.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0);

  const [prices, fxRate] = holdingRows.length
    ? await Promise.all([getHoldingPrices(holdingRows), getUsdToNzdRate().catch(() => null)])
    : [new Map(), null];

  const holdingsWithValue = holdingRows.map((holding) => {
    const point = prices.get(holding.symbol) ?? null;
    const priceUsd = point?.price ?? null;
    const valueNzd =
      priceUsd !== null && fxRate ? Number(holding.quantity) * priceUsd * fxRate.price : null;
    return { holding, priceUsd, fetchedAt: point?.fetchedAt ?? null, valueNzd };
  });

  const totalHoldingsValue = holdingsWithValue.reduce((sum, h) => sum + (h.valueNzd ?? 0), 0);
  const totalAssets = sumBalance(assetAccounts) + totalHoldingsValue;
  const totalLiabilities = sumBalance(liabilityAccounts);
  const netWorth = totalAssets + totalLiabilities;
  const isEmpty = accountRows.length === 0 && holdingRows.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Net Worth"
        description="Everything you own (assets) minus everything you owe (liabilities), across every linked account and holding."
      />

      {error ? (
        <ErrorBanner>Couldn&apos;t load net worth: {error}</ErrorBanner>
      ) : isEmpty ? (
        <EmptyState>
          No accounts yet. Click <span className="font-medium">Sync now</span> above once
          Akahu is configured.
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Money value={netWorth} className="block text-3xl font-semibold" />
              <div className="mt-1 text-xs text-muted-foreground">
                {formatMoney(totalAssets)} in assets − {formatMoney(-totalLiabilities)} in
                liabilities
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">Assets</h2>
                <AddHoldingDialog />
              </div>
              <span className="text-sm font-medium text-positive">
                {formatMoney(totalAssets)}
              </span>
            </div>
            {assetAccounts.length === 0 && holdingRows.length === 0 ? (
              <EmptyState>No asset accounts linked yet (e.g. KiwiSaver, managed funds, savings).</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assetAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
                {holdingsWithValue.map(({ holding, priceUsd, fetchedAt }) => (
                  <HoldingCard
                    key={holding.id}
                    holding={holding}
                    priceUsd={priceUsd}
                    usdToNzd={fxRate?.price ?? null}
                    priceFetchedAt={fetchedAt}
                  />
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
              <EmptyState>No liability accounts linked (e.g. loans, credit cards).</EmptyState>
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
