import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/hero/card";
import { ReportPeriodPicker } from "@/components/reports/report-period-picker";
import { PageHeader } from "@/components/ui/page-header";
import { getIncomeExpenseReport, type StatementRow } from "@/lib/reports/statements";
import { periodFromSearchParams } from "@/lib/reports/period";
import { formatDate, formatMoney } from "@/lib/format";

function StatementRows({
  rows,
  from,
  to,
}: {
  rows: StatementRow[];
  from: string;
  to: string;
}) {
  return (
    <>
      {rows.map((row) => (
        <Link
          key={row.categoryFilter}
          href={`/transactions?categoryId=${row.categoryFilter}&from=${from}&to=${to}`}
          className="flex items-center justify-between rounded-md py-1.5 text-sm hover:bg-accent"
        >
          <span>{row.name}</span>
          <span>{formatMoney(row.amount)}</span>
        </Link>
      ))}
    </>
  );
}

export default async function IncomeExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = periodFromSearchParams(params);
  const periodHref = `/transactions?from=${period.from}&to=${period.to}`;

  let report: Awaited<ReturnType<typeof getIncomeExpenseReport>> | null = null;
  let error: string | null = null;

  try {
    report = await getIncomeExpenseReport(period.from, period.to);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load report.";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income & Expense"
        description={
          <>
            Net amount per category for the chosen period. Transfers and Investments are
            excluded — they&apos;re money moving between your own accounts, not income or
            spending. &quot;Income&quot; here means credits to your linked accounts (e.g. loan
            repayments), not salary, since no everyday transaction account is linked yet.
          </>
        }
      />

      <ReportPeriodPicker defaults={period} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load report: {error}
        </div>
      ) : report ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statement</CardTitle>
            <CardDescription>
              {formatDate(period.from)} to {formatDate(period.to)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">Income</div>
              {report.income.length === 0 ? (
                <div className="py-1.5 text-sm text-muted-foreground">No income this period.</div>
              ) : (
                <StatementRows rows={report.income} from={period.from} to={period.to} />
              )}
              <Link
                href={periodHref}
                className="mt-1 flex items-center justify-between rounded-md border-t border-border py-1.5 text-sm font-medium hover:bg-accent"
              >
                <span>Total income</span>
                <span className="text-positive">{formatMoney(report.totalIncome)}</span>
              </Link>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">Expenses</div>
              {report.expenses.length === 0 ? (
                <div className="py-1.5 text-sm text-muted-foreground">No expenses this period.</div>
              ) : (
                <StatementRows rows={report.expenses} from={period.from} to={period.to} />
              )}
              <Link
                href={periodHref}
                className="mt-1 flex items-center justify-between rounded-md border-t border-border py-1.5 text-sm font-medium hover:bg-accent"
              >
                <span>Total expenses</span>
                <span className="text-negative">{formatMoney(report.totalExpenses)}</span>
              </Link>
            </div>

            <Link
              href={periodHref}
              className="flex items-center justify-between rounded-md border-t border-border pt-3 text-base font-semibold hover:bg-accent"
            >
              <span>Net</span>
              <span className={report.net < 0 ? "text-negative" : "text-positive"}>
                {report.net > 0 ? "+" : ""}
                {formatMoney(report.net)}
              </span>
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
