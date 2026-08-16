import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategorySelect } from "@/components/category-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/format";
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
    return <EmptyState>No transactions match these filters.</EmptyState>;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Mobile: stacked rows with amount and category always visible, no horizontal scroll. */}
      <div className="divide-y divide-border md:hidden">
        {rows.map((tx) => {
          return (
            <div key={tx.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium break-words">
                    {tx.merchantName ?? tx.description}
                  </div>
                  {tx.merchantName && (
                    <div className="text-xs text-muted-foreground break-words">
                      {tx.description}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDate(tx.date)} · {formatAccountLabel(tx.connectionName, tx.accountName)}
                  </div>
                </div>
                <Money value={tx.amount} showSign className="whitespace-nowrap font-medium" />
              </div>
              <CategorySelect
                transactionId={tx.id}
                categoryId={tx.categoryId}
                categories={categories}
                pattern={tx.merchantName ?? tx.description}
              />
            </div>
          );
        })}
      </div>

      {/* Desktop: full table. */}
      <div className="hidden overflow-x-auto md:block">
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
                      pattern={tx.merchantName ?? tx.description}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Money value={tx.amount} showSign className="font-medium" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
