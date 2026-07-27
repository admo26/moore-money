import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getMcpUser } from "@/lib/mcp/auth";
import { listAccounts } from "@/lib/queries/accounts";
import { listCategories } from "@/lib/queries/categories";
import { listRules } from "@/lib/queries/rules";
import { listTransactions } from "@/lib/queries/transactions";
import { categorizeTransaction, createRule, updateRule, deleteRule } from "@/lib/queries/mutations";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "list_accounts",
    { description: "List all household bank/card accounts with balances." },
    async () => textResult(await listAccounts())
  );

  server.registerTool(
    "list_categories",
    { description: "List all spending/income categories." },
    async () => textResult(await listCategories())
  );

  server.registerTool(
    "list_rules",
    { description: "List all categorisation rules, in priority order (lower first, first match wins)." },
    async () => textResult(await listRules())
  );

  server.registerTool(
    "list_transactions",
    {
      description: "List transactions, optionally filtered by account, category, date range, amount range, or free-text search over description/merchant.",
      inputSchema: {
        accountId: z.string().optional(),
        categoryId: z
          .union([z.number().int(), z.literal("uncategorised")])
          .optional()
          .describe("A category id, or \"uncategorised\" for uncategorised transactions."),
        dateFrom: z.string().optional().describe("ISO date, inclusive."),
        dateTo: z.string().optional().describe("ISO date, inclusive."),
        minAmount: z.string().optional(),
        maxAmount: z.string().optional(),
        search: z.string().optional().describe("Matches description or merchant name."),
        limit: z.number().int().positive().max(200).optional().describe("Default 50, max 200."),
      },
    },
    async (args) => textResult(await listTransactions(args))
  );

  server.registerTool(
    "categorize_transaction",
    {
      description: "Manually assign a category to a transaction. Manual assignments are never overwritten by automated categorisation.",
      inputSchema: {
        transactionId: z.string(),
        categoryId: z.number().int(),
      },
    },
    async ({ transactionId, categoryId }) => {
      const result = await categorizeTransaction(transactionId, categoryId);
      return result.ok ? textResult(result.data) : errorResult(result.error);
    }
  );

  server.registerTool(
    "create_rule",
    {
      description: "Create a categorisation rule: transactions whose description or merchant name contains `pattern` (case-insensitive) are assigned `categoryId`.",
      inputSchema: {
        pattern: z.string().min(1),
        categoryId: z.number().int(),
        priority: z.number().int().optional().describe("Lower runs first. Defaults to 0."),
      },
    },
    async ({ pattern, categoryId, priority }) => {
      const result = await createRule(pattern, categoryId, priority);
      return result.ok ? textResult(result.data) : errorResult(result.error);
    }
  );

  server.registerTool(
    "update_rule",
    {
      description: "Update an existing categorisation rule's pattern, category, and/or priority.",
      inputSchema: {
        id: z.number().int(),
        pattern: z.string().min(1).optional(),
        categoryId: z.number().int().optional(),
        priority: z.number().int().optional(),
      },
    },
    async ({ id, pattern, categoryId, priority }) => {
      const result = await updateRule(id, { pattern, categoryId, priority });
      return result.ok ? textResult(result.data) : errorResult(result.error);
    }
  );

  server.registerTool(
    "delete_rule",
    {
      description: "Delete a categorisation rule.",
      inputSchema: { id: z.number().int() },
    },
    async ({ id }) => {
      const result = await deleteRule(id);
      return result.ok ? textResult(result.data) : errorResult(result.error);
    }
  );
}, {}, { basePath: "/api" });

const authHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const user = await getMcpUser(bearerToken);
    if (!user) return undefined;
    return { token: bearerToken!, clientId: user.email, scopes: [], extra: { email: user.email } };
  },
  { required: true }
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
