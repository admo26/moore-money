import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { AccountCard } from "@/components/account-card";

async function loadAccounts() {
  try {
    return { accounts: await db.select().from(accounts), error: null };
  } catch (err) {
    return {
      accounts: [],
      error: err instanceof Error ? err.message : "Failed to load accounts.",
    };
  }
}

export default async function AccountsPage() {
  const { accounts: rows, error } = await loadAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Balances across your connected ANZ and Amex accounts.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load accounts: {error}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No accounts yet. Click <span className="font-medium">Sync now</span> above
          once Akahu and Supabase are configured.
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
