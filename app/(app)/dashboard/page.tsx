import {
  Card,
  CardActions,
  CardContent,
  CardHeaderRow,
  CardTitle,
  CardTitleBlock,
} from "@/components/ui/hero/card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { CategorySpendChart } from "@/components/charts/category-spend-chart";
import { CategoryTrendCard } from "@/components/charts/category-trend-card";
import { NetPositionChart } from "@/components/charts/net-position-chart";
import { RangeSelect } from "@/components/dashboard/range-select";
import { AccountsWidget } from "@/components/dashboard/accounts-widget";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatMoney } from "@/lib/format";
import { db } from "@/lib/db";
import { accounts as accountsTable, type Account } from "@/lib/db/schema";
import {
  getAccountSparklines,
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
  let summary = {
    income: 0,
    expense: 0,
    incomeChangePct: null as number | null,
    expenseChangePct: null as number | null,
    netChangePct: null as number | null,
  };
  let cashflow: Awaited<ReturnType<typeof getMonthlyCashflow>> = [];
  let categorySpend: Awaited<ReturnType<typeof getCategorySpend>> = [];
  let categoryTrends: Awaited<ReturnType<typeof getCategoryTrends>> = [];
  let netCashTrend: Awaited<ReturnType<typeof getNetCashTrend>> = [];
  let accounts: Account[] = [];
  let accountSparklines: Awaited<ReturnType<typeof getAccountSparklines>> = new Map();

  try {
    [summary, cashflow, categorySpend, categoryTrends, netCashTrend, accounts, accountSparklines] =
      await Promise.all([
        getPeriodSummary(PERIOD_DAYS),
        getMonthlyCashflow(cashflowMonths),
        getCategorySpend(spendDays),
        getCategoryTrends(trendMonths),
        getNetCashTrend(netCashDays),
        db.select().from(accountsTable),
        getAccountSparklines(),
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Money in"
              value={formatMoney(summary.income)}
              changePct={summary.incomeChangePct}
            />
            <StatCard
              label="Money out"
              value={formatMoney(summary.expense)}
              changePct={summary.expenseChangePct}
            />
            <StatCard
              label="Net"
              value={`${net > 0 ? "+" : ""}${formatMoney(net)}`}
              changePct={summary.netChangePct}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AccountsWidget accounts={accounts} sparklines={accountSparklines} />

            <Card>
              <CardHeaderRow>
                <CardTitleBlock>
                  <CardTitle className="text-base">Net cash</CardTitle>
                </CardTitleBlock>
                <CardActions>
                  <RangeSelect paramKey="netCashDays" value={netCashDays} options={NET_CASH_RANGE_OPTIONS} />
                </CardActions>
              </CardHeaderRow>
              <CardContent>
                <NetPositionChart data={netCashTrend} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeaderRow>
                <CardTitleBlock>
                  <CardTitle className="text-base">Cashflow</CardTitle>
                </CardTitleBlock>
                <CardActions>
                  <RangeSelect paramKey="cashflowMonths" value={cashflowMonths} options={CASHFLOW_RANGE_OPTIONS} />
                </CardActions>
              </CardHeaderRow>
              <CardContent>
                <CashflowChart data={cashflow} />
              </CardContent>
            </Card>

            <Card>
              <CardHeaderRow>
                <CardTitleBlock>
                  <CardTitle className="text-base">Spend by category</CardTitle>
                </CardTitleBlock>
                <CardActions>
                  <RangeSelect paramKey="spendDays" value={spendDays} options={SPEND_RANGE_OPTIONS} />
                </CardActions>
              </CardHeaderRow>
              <CardContent>
                <CategorySpendChart data={categorySpend} from={periodFrom} to={periodTo} />
              </CardContent>
            </Card>
          </div>

          <CategoryTrendCard series={categoryTrends} months={trendMonths} />
        </>
      )}
    </div>
  );
}
