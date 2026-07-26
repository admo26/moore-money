import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategorySelect } from "@/components/category-select";
import { formatDate, formatMoney } from "@/lib/format";
import type { Category, Transaction } from "@/lib/db/schema";

export interface TransactionRow extends Transaction {
  accountName: string | null;
  connectionName: string | null;
}

/** Avoids showing e.g. "American Express — American Express Airpoints Card". */
function formatAccountLabel(connectionName: string | null, accountName: string | null) {
  if (!connectionName) return accountName ?? "";
  if (!accountName) return connectionName;
  if (accountName.toLowerCase().startsWith(connectionName.toLowerCase())) {
    return accountName;
  }
  return `${connectionName} — ${accountName}`;
}

export function TransactionsTable({
  rows,
  categories,
}: {
  rows: TransactionRow[];
  categories: Category[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No transactions match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
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
                <TableCell className="max-w-[280px] whitespace-normal break-words">
                  <div className="font-medium">{tx.merchantName ?? tx.description}</div>
                  {tx.merchantName && (
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                  )}
                </TableCell>
                <TableCell className="max-w-[160px] whitespace-normal break-words text-muted-foreground">
                  {formatAccountLabel(tx.connectionName, tx.accountName)}
                </TableCell>
                <TableCell>
                  <CategorySelect
                    transactionId={tx.id}
                    categoryId={tx.categoryId}
                    categories={categories}
                  />
                </TableCell>
                <TableCell
                  className={
                    amount < 0
                      ? "whitespace-nowrap text-right font-medium text-negative"
                      : "whitespace-nowrap text-right font-medium text-positive"
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
