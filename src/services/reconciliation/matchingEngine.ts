import { normalizeText, normalizeReference } from "./bankFileParser";

export type ReconciliationStatus =
  | "pending"
  | "matched"
  | "manual_match"
  | "ignored";

export type MatchableBank = {
  id: string;
  date: Date | null;
  amount: number;
  description: string;
  reference: string;
  status: ReconciliationStatus;
};

export type MatchableInternal = {
  id: string;
  amount: number;
  date: Date | null;
  reference: string;
  referenceText: string;
};

export type MatchOptions = {
  /**
   * Maximum absolute difference (in currency units) allowed between the
   * bank movement and the internal movement for them to match.
   */
  amountTolerance: number;
  /**
   * Maximum absolute difference (in calendar days) allowed between bank
   * and internal dates. When the internal record has no date, dates are
   * ignored.
   */
  dateToleranceDays: number;
  /**
   * When true, the engine will only match when normalized references are
   * equal. When false, references contribute to the confidence score but
   * are not strictly required.
   */
  requireReferenceMatch: boolean;
  /**
   * Optional inclusive date range used to filter both bank and internal
   * movements before searching for matches.
   */
  dateFrom?: string;
  dateTo?: string;
};

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  amountTolerance: 0.01,
  dateToleranceDays: 5,
  requireReferenceMatch: false,
};

function daysDiff(a: Date | null, b: Date | null): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

export function inDateRange(
  date: Date | null,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!date) return false;
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

/**
 * Scores and picks the best internal movement for each bank movement.
 * Both collections must be pre-filtered for the desired status/range if
 * that is desired; the engine only applies `dateFrom`/`dateTo` here.
 *
 * Returns a new array of bank movements with the match resolved.
 */
export function runAutoMatchEngine<
  TBank extends MatchableBank & {
    matchedId?: string;
    confidence?: number;
  },
  TInternal extends MatchableInternal,
>(
  bankMovements: TBank[],
  internalMovements: TInternal[],
  options: MatchOptions
): TBank[] {
  const used = new Set<string>();
  return bankMovements.map((bankItem) => {
    if (bankItem.status === "ignored") return bankItem;
    if (!inDateRange(bankItem.date, options.dateFrom, options.dateTo)) {
      return bankItem;
    }

    const bankRefNorm = normalizeReference(
      bankItem.reference || bankItem.description || ""
    );
    const bankHaystack = normalizeText(
      `${bankItem.description} ${bankItem.reference}`
    );

    let best: { candidate: TInternal; score: number } | null = null;

    for (const candidate of internalMovements) {
      if (used.has(candidate.id)) continue;
      if (!inDateRange(candidate.date, options.dateFrom, options.dateTo))
        continue;

      // 1) Amount must be within tolerance (hard block).
      const amountGap = Math.abs(candidate.amount - bankItem.amount);
      if (amountGap > options.amountTolerance) continue;

      // 2) Reference comparison.
      const candidateRefNorm = normalizeReference(candidate.reference || "");
      const candidateTextNorm = normalizeText(candidate.referenceText || "");
      const exactRefMatch =
        bankRefNorm.length > 0 &&
        candidateRefNorm.length > 0 &&
        candidateRefNorm === bankRefNorm;
      const fuzzyRefMatch =
        candidateTextNorm.length > 0 && bankHaystack.includes(candidateTextNorm);

      if (options.requireReferenceMatch && !exactRefMatch) continue;

      // 3) Date tolerance (soft block when dates exist).
      const dateGap = daysDiff(candidate.date, bankItem.date);
      if (
        Number.isFinite(dateGap) &&
        dateGap > options.dateToleranceDays &&
        !exactRefMatch
      ) {
        continue;
      }

      // 4) Score: prefer exact reference, then smaller date gap, then fuzzy ref.
      let score = 0;
      if (exactRefMatch) score += 1.5;
      else if (fuzzyRefMatch) score += 0.35;
      if (Number.isFinite(dateGap)) {
        score += Math.max(
          0,
          1 - dateGap / Math.max(options.dateToleranceDays, 1)
        );
      }

      if (!best || score > best.score) {
        best = { candidate, score };
      }
    }

    if (!best) {
      return {
        ...bankItem,
        status: "pending",
        matchedId: undefined,
        confidence: undefined,
      };
    }

    used.add(best.candidate.id);
    return {
      ...bankItem,
      status: "matched",
      matchedId: best.candidate.id,
      confidence: Number(best.score.toFixed(2)),
    };
  });
}
