const TRANSFER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export interface TransferCandidate {
  id: string;
  accountId: string;
  amount: string;
  date: Date;
}

/**
 * Finds pairs of transactions that look like a transfer between the
 * household's own accounts: equal and opposite amounts, different accounts,
 * within a few days of each other (clearing dates can differ slightly
 * between the sending and receiving account).
 *
 * Returns the ids of every transaction that's part of a matched pair.
 */
export function findTransferTransactionIds(candidates: TransferCandidate[]): Set<string> {
  const groups = new Map<string, TransferCandidate[]>();
  for (const candidate of candidates) {
    const key = Math.abs(Number(candidate.amount)).toFixed(2);
    const group = groups.get(key);
    if (group) {
      group.push(candidate);
    } else {
      groups.set(key, [candidate]);
    }
  }

  const matched = new Set<string>();

  for (const group of groups.values()) {
    const positives = group.filter((c) => Number(c.amount) > 0);
    const negatives = group.filter((c) => Number(c.amount) < 0);
    const usedNegativeIds = new Set<string>();

    for (const pos of positives) {
      let best: TransferCandidate | null = null;
      let bestDiff = Infinity;

      for (const neg of negatives) {
        if (usedNegativeIds.has(neg.id) || neg.accountId === pos.accountId) continue;
        const diff = Math.abs(pos.date.getTime() - neg.date.getTime());
        if (diff <= TRANSFER_WINDOW_MS && diff < bestDiff) {
          best = neg;
          bestDiff = diff;
        }
      }

      if (best) {
        matched.add(pos.id);
        matched.add(best.id);
        usedNegativeIds.add(best.id);
      }
    }
  }

  return matched;
}
