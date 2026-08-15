import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/hero/card";

const REPORTS = [
  {
    href: "/reports/income-expense",
    title: "Income & Expense",
    description:
      "What came in and what went out, by category, for a chosen period — a personal profit & loss.",
  },
  {
    href: "/reports/cashflow",
    title: "Cashflow statement",
    description:
      "Opening balance, cash in/out per month, and closing balance across your bank, loan, and credit card accounts.",
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Financial statements for a chosen period.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
