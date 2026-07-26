import { generateObject } from "ai";
import { z } from "zod";
import type { Category, Transaction } from "@/lib/db/schema";

// Free-tier-eligible on Vercel AI Gateway (no billing set up) — gpt-4o-mini
// and most others are gated behind paid credits. Revisit if that changes.
const AI_MODEL = "google/gemini-2.5-flash-lite";
// The free tier's limit is on request *count*, not token volume — so batch
// as many transactions as comfortably fit in one request rather than
// optimising for small requests.
const BATCH_SIZE = 150;
const CONCURRENCY = 1;
const DELAY_BETWEEN_BATCHES_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/** Thrown to signal the whole run should stop rather than retry batch by batch. */
class StopCategorizingError extends Error {}

async function categorizeBatch(
  batch: Pick<Transaction, "id" | "description" | "merchantName" | "amount">[],
  categoryNames: string[]
) {
  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      maxRetries: 1,
      maxOutputTokens: 32000,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // A rate limit is an account-level condition that won't clear up
    // mid-run — stop instead of burning through every remaining batch.
    if (/rate.?limit/i.test(message)) {
      throw new StopCategorizingError(message);
    }
    console.error("AI categorisation batch failed, skipping it", message);
    return [];
  }
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

  const batches = [];
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    batches.push(transactions.slice(i, i + BATCH_SIZE));
  }

  try {
    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const group = batches.slice(i, i + CONCURRENCY);
      const groupResults = await Promise.all(
        group.map((batch) => categorizeBatch(batch, categoryNames))
      );
      for (const results of groupResults) {
        for (const r of results) {
          if (r.category.toLowerCase() !== "none") {
            assignments.set(r.transactionId, r.category);
          }
        }
      }

      if (i + CONCURRENCY < batches.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }
  } catch (err) {
    if (err instanceof StopCategorizingError) {
      console.error("AI categorisation stopped early:", err.message);
    } else {
      throw err;
    }
  }

  return assignments;
}
