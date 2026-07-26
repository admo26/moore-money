import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { CategorySpendChart } from "@/components/charts/category-spend-chart";
import { formatMoney } from "@/lib/format";
import { getCategorySpend, getMonthlyCashflow, getPeriodSummary } from "@/lib/reports/queries";

const PERIOD_DAYS = 30;

export default async function DashboardPage() {
  let error: string | null = null;
  let summary = { income: 0, expense: 0 };
  let cashflow: Awaited<ReturnType<typeof getMonthlyCashflow>> = [];
  let categorySpend: Awaited<ReturnType<typeof getCategorySpend>> = [];

  try {
    [summary, cashflow, categorySpend] = await Promise.all([
      getPeriodSummary(PERIOD_DAYS),
      getMonthlyCashflow(6),
      getCategorySpend(PERIOD_DAYS),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard data.";
  }

  const net = summary.income - summary.expense;

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Money in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-positive">
                  {formatMoney(summary.income)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Money out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-negative">
                  {formatMoney(summary.expense)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={
                    net < 0
                      ? "text-2xl font-semibold text-negative"
                      : "text-2xl font-semibold text-positive"
                  }
                >
                  {net > 0 ? "+" : ""}
                  {formatMoney(net)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cashflow — last 6 months</CardTitle>
            </CardHeader>
            <CardContent>
              <CashflowChart data={cashflow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spend by category — last {PERIOD_DAYS} days</CardTitle>
            </CardHeader>
            <CardContent>
              <CategorySpendChart data={categorySpend} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
