import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/db/schema";

export interface TransactionRow extends Transaction {
  accountName: string | null;
  connectionName: string | null;
}

export function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No transactions match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((tx) => {
            const amount = Number(tx.amount);
            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(tx.date)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{tx.merchantName ?? tx.description}</div>
                  {tx.merchantName && (
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {tx.connectionName} — {tx.accountName}
                </TableCell>
                <TableCell
                  className={
                    amount < 0
                      ? "text-right font-medium text-negative"
                      : "text-right font-medium text-positive"
                  }
                >
                  {amount > 0 ? "+" : ""}
                  {formatMoney(tx.amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
