import { generateObject } from "ai";
import { z } from "zod";
import type { Category, Transaction } from "@/lib/db/schema";

const AI_MODEL = "openai/gpt-4o-mini";
const BATCH_SIZE = 50;

const ResultSchema = z.object({
  results: z.array(
    z.object({
      transactionId: z.string(),
      category: z
        .string()
        .describe("One of the provided category names, or \"none\" if unsure"),
    })
  ),
});

async function categorizeBatch(
  batch: Pick<Transaction, "id" | "description" | "merchantName" | "amount">[],
  categoryNames: string[]
) {
  const { object } = await generateObject({
    model: AI_MODEL,
    schema: ResultSchema,
    prompt: [
      `Categorise each household bank transaction below into exactly one of these categories: ${categoryNames.join(", ")}, or "none" if none fit.`,
      "Negative amounts are money out (spending); positive amounts are money in.",
      "",
      ...batch.map(
        (t) =>
          `- id=${t.id} description="${t.description}" merchant="${t.merchantName ?? ""}" amount=${t.amount}`
      ),
    ].join("\n"),
  });

  return object.results;
}

/**
 * Categorises transactions the rules engine couldn't match, via the Vercel
 * AI Gateway. Returns a map of transactionId -> category name (only for
 * transactions the model assigned a real category to, i.e. not "none").
 */
export async function categorizeWithAI(
  transactions: Pick<Transaction, "id" | "description" | "merchantName" | "amount">[],
  categories: Category[]
): Promise<Map<string, string>> {
  if (transactions.length === 0) return new Map();

  const categoryNames = categories.map((c) => c.name);
  const assignments = new Map<string, string>();

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const results = await categorizeBatch(batch, categoryNames);
    for (const r of results) {
      if (r.category.toLowerCase() !== "none") {
        assignments.set(r.transactionId, r.category);
      }
    }
  }

  return assignments;
}
