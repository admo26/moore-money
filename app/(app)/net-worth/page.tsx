import { db } from "@/lib/db";
import { accounts, holdings } from "@/lib/db/schema";
import { AccountCard } from "@/components/account-card";
import { HoldingCard } from "@/components/holding-card";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CountUpMoney } from "@/components/ui/count-up-money";
import { StaggerGrid } from "@/components/ui/motion/stagger-grid";
import { formatMoney } from "@/lib/format";
import { accountClass, isRetirementAccount } from "@/lib/accounts/classify";
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

  const nonRetirementAssetAccounts = accountRows.filter(
    (a) => accountClass(a.type) === "asset" && !isRetirementAccount(a.type)
  );
  const retirementAccounts = accountRows.filter(
    (a) => accountClass(a.type) === "asset" && isRetirementAccount(a.type)
  );
  const liabilityAccounts = accountRows.filter((a) => accountClass(a.type) === "liability");
  const sumBalance = (list: typeof accountRows) =>
    list.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0);

  const pricedHoldings = holdingRows
    .filter((h) => h.type !== "property" && h.symbol)
    .map((h) => ({ symbol: h.symbol as string, type: h.type }));

  const [prices, fxRate] = pricedHoldings.length
    ? await Promise.all([getHoldingPrices(pricedHoldings), getUsdToNzdRate().catch(() => null)])
    : [new Map(), null];

  const holdingsWithValue = holdingRows.map((holding) => {
    if (holding.type === "property") {
      const valueNzd = holding.manualValue !== null ? Number(holding.manualValue) : null;
      return { holding, priceUsd: null, fetchedAt: holding.updatedAt, valueNzd };
    }

    const point = holding.symbol ? prices.get(holding.symbol) ?? null : null;
    const priceUsd = point?.price ?? null;
    const valueNzd =
      priceUsd !== null && fxRate ? Number(holding.quantity) * priceUsd * fxRate.price : null;
    return { holding, priceUsd, fetchedAt: point?.fetchedAt ?? null, valueNzd };
  });

  const totalHoldingsValue = holdingsWithValue.reduce((sum, h) => sum + (h.valueNzd ?? 0), 0);
  const totalAssets = sumBalance(nonRetirementAssetAccounts) + totalHoldingsValue;
  const totalRetirement = sumBalance(retirementAccounts);
  const totalLiabilities = sumBalance(liabilityAccounts);
  const netWorth = totalAssets + totalLiabilities;
  const isEmpty = accountRows.length === 0 && holdingRows.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Net Worth"
        description="Everything you own (assets) minus everything you owe (liabilities), across every linked account and holding. KiwiSaver is tracked separately since it's locked away until retirement."
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
              <div className="flex items-baseline gap-2">
                <CountUpMoney value={netWorth} className="block text-3xl font-semibold" />
                {totalRetirement > 0 && (
                  <span className="text-sm text-muted-foreground">(exc. KiwiSaver)</span>
                )}
              </div>
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
            {nonRetirementAssetAccounts.length === 0 && holdingRows.length === 0 ? (
              <EmptyState>No asset accounts linked yet (e.g. managed funds, savings).</EmptyState>
            ) : (
              <StaggerGrid className="gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nonRetirementAssetAccounts.map((account) => (
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
              </StaggerGrid>
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
              <StaggerGrid className="gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liabilityAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </StaggerGrid>
            )}
          </div>

          {retirementAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-medium">Retirement</h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatMoney(totalRetirement)}
                </span>
              </div>
              <StaggerGrid className="gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {retirementAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </StaggerGrid>
            </div>
          )}
        </>
      )}
    </div>
  );
}
