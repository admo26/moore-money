import type {
  AkahuAccount,
  AkahuListResponse,
  AkahuMeResponse,
  AkahuTransaction,
} from "./types";

const AKAHU_BASE_URL = "https://api.akahu.io/v1";

/**
 * Thin typed client for the Akahu "personal app" API. Auth is a single
 * shared token pair (one Akahu profile, connected to our household's
 * accounts) supplied via env vars — see .env.example.
 */
function getCredentials() {
  const appToken = process.env.AKAHU_APP_TOKEN;
  const userToken = process.env.AKAHU_USER_TOKEN;

  if (!appToken || !userToken) {
    throw new Error(
      "AKAHU_APP_TOKEN and AKAHU_USER_TOKEN must be set. See .env.example."
    );
  }

  return { appToken, userToken };
}

async function akahuFetch<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
  const { appToken, userToken } = getCredentials();

  const url = new URL(`${AKAHU_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      "X-Akahu-Id": appToken,
    },
    // Akahu data changes at most daily for personal apps; never cache
    // sync-critical reads at the fetch layer.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Akahu ${path} failed: ${res.status} ${res.statusText} ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Health check — confirms the token pair is valid. */
export async function getMe(): Promise<AkahuMeResponse> {
  return akahuFetch<AkahuMeResponse>("/me");
}

/**
 * Asks Akahu to refresh every connected account from the bank. This is
 * async on Akahu's side — it doesn't block until the refresh finishes, it
 * just kicks it off. Personal apps throttle manual refreshes to roughly
 * once per hour, so a 429 here is expected if triggered too often; callers
 * should treat that as "already fresh enough" rather than a real failure.
 */
export async function refreshAll(): Promise<void> {
  const { appToken, userToken } = getCredentials();

  const res = await fetch(`${AKAHU_BASE_URL}/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "X-Akahu-Id": appToken,
    },
  });

  if (!res.ok && res.status !== 429) {
    const body = await res.text().catch(() => "");
    throw new Error(`Akahu /refresh failed: ${res.status} ${res.statusText} ${body}`);
  }
}

/** All connected accounts (ANZ, Amex, etc). */
export async function getAccounts(): Promise<AkahuAccount[]> {
  const res = await akahuFetch<AkahuListResponse<AkahuAccount>>("/accounts");
  return res.items;
}

/**
 * All transactions across connected accounts in `(start, end]`, following
 * cursor pagination to completion. `start` is exclusive and `end` is
 * inclusive per the Akahu API.
 */
export async function getTransactions(opts: {
  start?: Date;
  end?: Date;
}): Promise<AkahuTransaction[]> {
  const transactions: AkahuTransaction[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {};
    if (opts.start) params.start = opts.start.toISOString();
    if (opts.end) params.end = opts.end.toISOString();
    if (cursor) params.cursor = cursor;

    const res = await akahuFetch<AkahuListResponse<AkahuTransaction>>(
      "/transactions",
      params
    );
    transactions.push(...res.items);
    cursor = res.cursor?.next ?? undefined;
  } while (cursor);

  return transactions;
}
