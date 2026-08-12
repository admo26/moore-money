import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { CategorySpendChart } from "@/components/charts/category-spend-chart";
import { CategoryTrendCard } from "@/components/charts/category-trend-card";
import { NetPositionChart } from "@/components/charts/net-position-chart";
import { RangeSelect } from "@/components/dashboard/range-select";
import { AccountsWidget } from "@/components/dashboard/accounts-widget";
import { formatMoney } from "@/lib/format";
import { db } from "@/lib/db";
import { accounts as accountsTable, type Account } from "@/lib/db/schema";
import {
  getCategorySpend,
  getCategoryTrends,
  getMonthlyCashflow,
  getNetCashTrend,
  getPeriodSummary,
} from "@/lib/reports/queries";
import { toDateParam } from "@/lib/reports/date-params";
import {
  CASHFLOW_RANGE_OPTIONS,
  NET_CASH_RANGE_OPTIONS,
  SPEND_RANGE_OPTIONS,
  TREND_RANGE_OPTIONS,
  parseRangeParam,
  rangeLabel,
} from "@/lib/reports/dashboard-ranges";

const PERIOD_DAYS = 30;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const netCashDays = parseRangeParam(params.netCashDays, NET_CASH_RANGE_OPTIONS, 182);
  const cashflowMonths = parseRangeParam(params.cashflowMonths, CASHFLOW_RANGE_OPTIONS, 6);
  const spendDays = parseRangeParam(params.spendDays, SPEND_RANGE_OPTIONS, PERIOD_DAYS);
  const trendMonths = parseRangeParam(params.trendMonths, TREND_RANGE_OPTIONS, 6);

  let error: string | null = null;
  let summary = { income: 0, expense: 0 };
  let cashflow: Awaited<ReturnType<typeof getMonthlyCashflow>> = [];
  let categorySpend: Awaited<ReturnType<typeof getCategorySpend>> = [];
  let categoryTrends: Awaited<ReturnType<typeof getCategoryTrends>> = [];
  let netCashTrend: Awaited<ReturnType<typeof getNetCashTrend>> = [];
  let accounts: Account[] = [];

  try {
    [summary, cashflow, categorySpend, categoryTrends, netCashTrend, accounts] = await Promise.all([
      getPeriodSummary(PERIOD_DAYS),
      getMonthlyCashflow(cashflowMonths),
      getCategorySpend(spendDays),
      getCategoryTrends(trendMonths),
      getNetCashTrend(netCashDays),
      db.select().from(accountsTable),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard data.";
  }

  const net = summary.income - summary.expense;
  const periodSince = new Date();
  periodSince.setDate(periodSince.getDate() - spendDays);
  const periodFrom = toDateParam(periodSince);
  const periodTo = toDateParam(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Household financial performance over the last {PERIOD_DAYS} days. &quot;Money
          in&quot; is credits to your linked accounts (e.g. loan repayments), and
          &quot;money out&quot; is debits (spending or drawdowns) — not salary income,
          since no everyday transaction account is linked yet.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load dashboard: {error}
        </div>
      ) : (
        <>
          <AccountsWidget accounts={accounts} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Money in and out — last {PERIOD_DAYS} days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="text-lg font-semibold text-positive sm:text-2xl">
                  {formatMoney(summary.income)}
                </div>
                <div className="text-base font-medium text-muted-foreground sm:text-xl">−</div>
                <div className="text-lg font-semibold text-negative sm:text-2xl">
                  {formatMoney(summary.expense)}
                </div>
                <div className="text-base font-medium text-muted-foreground sm:text-xl">=</div>
                <div
                  className={
                    net < 0
                      ? "text-lg font-semibold text-negative sm:text-2xl"
                      : "text-lg font-semibold text-positive sm:text-2xl"
                  }
                >
                  {net > 0 ? "+" : ""}
                  {formatMoney(net)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net cash — {rangeLabel(netCashDays, NET_CASH_RANGE_OPTIONS).toLowerCase()}</CardTitle>
              <CardDescription>
                Sum of every bank, loan, and credit card balance each day, from a daily
                snapshot taken on sync. Excludes KiwiSaver/managed-fund accounts — see the
                Net Worth page for those.
              </CardDescription>
              <CardAction>
                <RangeSelect paramKey="netCashDays" value={netCashDays} options={NET_CASH_RANGE_OPTIONS} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <NetPositionChart data={netCashTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cashflow — {rangeLabel(cashflowMonths, CASHFLOW_RANGE_OPTIONS).toLowerCase()}</CardTitle>
              <CardAction>
                <RangeSelect paramKey="cashflowMonths" value={cashflowMonths} options={CASHFLOW_RANGE_OPTIONS} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <CashflowChart data={cashflow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spend by category — {rangeLabel(spendDays, SPEND_RANGE_OPTIONS).toLowerCase()}</CardTitle>
              <CardAction>
                <RangeSelect paramKey="spendDays" value={spendDays} options={SPEND_RANGE_OPTIONS} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <CategorySpendChart data={categorySpend} from={periodFrom} to={periodTo} />
            </CardContent>
          </Card>

          <CategoryTrendCard series={categoryTrends} months={trendMonths} />
        </>
      )}
    </div>
  );
}
