"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { toDateParam } from "@/lib/reports/date-params";
import type { MonthlyCashflow } from "@/lib/reports/queries";

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NZ", {
    month: "short",
  });
}

/** [first day of month, first day of next month) as YYYY-MM-DD params. */
function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 0); // last day of the month
  return { from: toDateParam(from), to: toDateParam(to) };
}

function CashflowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-foreground">{monthLabel(label ?? "")}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{formatMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: { data: MonthlyCashflow[] }) {
  const router = useRouter();

  function handleClick(entry: MonthlyCashflow) {
    const { from, to } = monthRange(entry.month);
    router.push(`/transactions?from=${from}&to=${to}`);
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
          axisLine={{ stroke: "var(--chart-grid)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => new Intl.NumberFormat("en-NZ").format(v)}
        />
        <Tooltip content={<CashflowTooltip />} cursor={{ fill: "var(--chart-cursor)" }} />
        <Legend
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
        <Bar
          dataKey="income"
          name="Money in"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          cursor="pointer"
          onClick={(entry: unknown) =>
            handleClick((entry as { payload: MonthlyCashflow }).payload)
          }
        />
        <Bar
          dataKey="expense"
          name="Money out"
          fill="var(--negative)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          cursor="pointer"
          onClick={(entry: unknown) =>
            handleClick((entry as { payload: MonthlyCashflow }).payload)
          }
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
