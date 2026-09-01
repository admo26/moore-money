"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hero/card";
import { Money } from "@/components/ui/money";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/db/schema";

export function AccountCard({ account }: { account: Account }) {
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {account.connectionName}
            </CardTitle>
            <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {account.type}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-base font-medium">{account.name}</div>
          <Money
            value={account.currentBalance}
            currency={account.currency}
            color="negative"
            className="mt-1 block text-2xl font-semibold"
          />
          {account.availableBalance && (
            <div className="mt-1 text-xs text-muted-foreground">
              {formatMoney(account.availableBalance, account.currency)} available
            </div>
          )}
          <div className="mt-3 text-xs text-muted-foreground">
            Updated {formatDate(account.lastRefreshed)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
