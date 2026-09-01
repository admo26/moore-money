import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdingPriceSnapshots } from "@/lib/db/schema";

/** How long a cached price is trusted before a fresh fetch is made. */
const PRICE_TTL_MS = 15 * 60 * 1000;

async function fetchStockPrice(symbol: string): Promise<number> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY is not set.");

  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Finnhub request failed (${res.status})`);

  const data = (await res.json()) as { c?: number };
  if (!data.c) throw new Error(`No price returned for ${symbol}`);
  return data.c;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
};

async function fetchCryptoPrice(symbol: string): Promise<number> {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) throw new Error(`Unknown crypto symbol ${symbol} — add it to COINGECKO_IDS.`);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
  );
  if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`);

  const data = (await res.json()) as Record<string, { usd?: number }>;
  const price = data[id]?.usd;
  if (!price) throw new Error(`No price returned for ${symbol}`);
  return price;
}

async function fetchUsdToNzdRate(): Promise<number> {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=NZD");
  if (!res.ok) throw new Error(`Frankfurter request failed (${res.status})`);

  const data = (await res.json()) as { rates?: { NZD?: number } };
  if (!data.rates?.NZD) throw new Error("No USD/NZD rate returned");
  return data.rates.NZD;
}

/** A synthetic "symbol" so the FX rate rides the same cache table/TTL as holding prices. */
const USD_NZD_SYMBOL = "USDNZD";

async function fetchLivePrice(symbol: string, type: string): Promise<number> {
  if (type === "fx") return fetchUsdToNzdRate();
  return type === "crypto" ? fetchCryptoPrice(symbol) : fetchStockPrice(symbol);
}

export interface PricePoint {
  price: number;
  fetchedAt: Date;
}

/** Cached USD→NZD rate, so holdings (priced in USD) can be summed into the NZD net-worth total. */
export async function getUsdToNzdRate(): Promise<PricePoint> {
  return getHoldingPrice(USD_NZD_SYMBOL, "fx");
}

/**
 * Latest price for a symbol, serving a cached snapshot when it's fresh
 * enough and only hitting the market-data API when it isn't.
 */
export async function getHoldingPrice(symbol: string, type: string): Promise<PricePoint> {
  const [latest] = await db
    .select()
    .from(holdingPriceSnapshots)
    .where(eq(holdingPriceSnapshots.symbol, symbol))
    .orderBy(desc(holdingPriceSnapshots.fetchedAt))
    .limit(1);

  if (latest && Date.now() - latest.fetchedAt.getTime() < PRICE_TTL_MS) {
    return { price: Number(latest.price), fetchedAt: latest.fetchedAt };
  }

  const price = await fetchLivePrice(symbol, type);
  const [inserted] = await db
    .insert(holdingPriceSnapshots)
    .values({ symbol, price: price.toString() })
    .returning({ fetchedAt: holdingPriceSnapshots.fetchedAt });
  return { price, fetchedAt: inserted.fetchedAt };
}

/** Resolves prices for a set of distinct symbols, one fetch/cache-hit per symbol. */
export async function getHoldingPrices(
  holdings: { symbol: string; type: string }[]
): Promise<Map<string, PricePoint>> {
  const distinct = new Map(holdings.map((h) => [h.symbol, h.type]));
  const prices = new Map<string, PricePoint>();

  await Promise.all(
    Array.from(distinct.entries()).map(async ([symbol, type]) => {
      try {
        prices.set(symbol, await getHoldingPrice(symbol, type));
      } catch (err) {
        console.error(`Failed to price ${symbol}`, err);
      }
    })
  );

  return prices;
}
