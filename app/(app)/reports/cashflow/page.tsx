import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportPeriodPicker } from "@/components/reports/report-period-picker";
import { getCashflowStatement } from "@/lib/reports/statements";
import { periodFromSearchParams } from "@/lib/reports/period";
import { formatDate, formatMoney } from "@/lib/format";

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NZ", {
    month: "short",
    year: "numeric",
  });
}

/** [first day of month, last day of month] as YYYY-MM-DD params. */
function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default async function CashflowPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = periodFromSearchParams(params);
  const periodHref = `/transactions?from=${period.from}&to=${period.to}`;

  let statement: Awaited<ReturnType<typeof getCashflowStatement>> | null = null;
  let error: string | null = null;

  try {
    statement = await getCashflowStatement(period.from, period.to);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load report.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cashflow statement</h1>
        <p className="text-sm text-muted-foreground">
          Opening balance, cash in/out per month, and closing balance across your bank,
          loan, and credit card accounts — KiwiSaver/managed-fund accounts are excluded
          since they don&apos;t move via day-to-day transactions.
        </p>
      </div>

      <ReportPeriodPicker defaults={period} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load report: {error}
        </div>
      ) : statement ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statement</CardTitle>
            <CardDescription>
              {formatDate(period.from)} to {formatDate(period.to)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-1.5 text-sm font-medium">
              <span>Opening balance</span>
              <span>
                {statement.openingBalance === null
                  ? "No data yet"
                  : formatMoney(statement.openingBalance)}
              </span>
            </div>

            <div className="border-t border-border pt-2">
              {statement.months.length === 0 ? (
                <div className="py-1.5 text-sm text-muted-foreground">
                  No transactions this period.
                </div>
              ) : (
                statement.months.map((month) => {
                  const range = monthRange(month.month);
                  const monthHref = `/transactions?from=${range.from}&to=${range.to}`;
                  return (
                    <div
                      key={month.month}
                      className="flex items-center justify-between rounded-md py-1.5 text-sm"
                    >
                      <Link href={monthHref} className="text-foreground hover:underline">
                        {monthLabel(month.month)}
                      </Link>
                      <div className="flex gap-6 tabular-nums">
                        <Link
                          href={`${monthHref}&minAmount=0.01`}
                          className="text-positive hover:underline"
                        >
                          +{formatMoney(month.cashIn)}
                        </Link>
                        <Link
                          href={`${monthHref}&maxAmount=-0.01`}
                          className="text-negative hover:underline"
                        >
                          −{formatMoney(month.cashOut)}
                        </Link>
                        <Link
                          href={monthHref}
                          className={
                            month.net < 0
                              ? "font-medium text-negative hover:underline"
                              : "font-medium text-positive hover:underline"
                          }
                        >
                          {month.net > 0 ? "+" : ""}
                          {formatMoney(month.net)}
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              href={periodHref}
              className="flex items-center justify-between rounded-md border-t border-border py-1.5 text-sm font-medium hover:bg-accent"
            >
              <span>Total cash movement</span>
              <span className={statement.totalNet < 0 ? "text-negative" : "text-positive"}>
                {statement.totalNet > 0 ? "+" : ""}
                {formatMoney(statement.totalNet)}
              </span>
            </Link>

            {statement.otherChanges !== null && (
              <div className="flex items-center justify-between py-1.5 text-sm text-muted-foreground">
                <span>Other balance changes (e.g. interest, fees)</span>
                <span>
                  {statement.otherChanges > 0 ? "+" : ""}
                  {formatMoney(statement.otherChanges)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Closing balance</span>
              <span>
                {statement.closingBalance === null
                  ? "No data yet"
                  : formatMoney(statement.closingBalance)}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
