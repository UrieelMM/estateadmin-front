/**
 * Mismo criterio que el backend (`payment-credit-allocation.ts`): los pagos nuevos traen
 * `creditAllocation: "per_payment"` y su `creditUsed` ya es la parte de cada pago; los pagos
 * multicargo anteriores repetían el total del grupo en cada documento.
 */
export const CREDIT_ALLOCATION_PER_PAYMENT = "per_payment";

const toCents = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

/** Reparte en orden hasta el tope de cada posición; el sobrante va a la última. */
export function allocateCents(totalCents: number, capsCents: number[]): number[] {
  const total = Math.max(0, toCents(totalCents));
  if (!capsCents.length) return [];
  let remaining = total;
  const allocation = capsCents.map((cap) => {
    const portion = Math.min(remaining, Math.max(0, toCents(cap)));
    remaining -= portion;
    return portion;
  });
  allocation[allocation.length - 1] += remaining;
  return allocation;
}

export interface CreditNormalizationEntry {
  key: string;
  groupKey: string;
  order: string;
  amountPaid: unknown;
  creditUsed: unknown;
  creditAllocation?: unknown;
}

/** `creditUsed` (centavos) por pago, contando el crédito una sola vez por grupo de pago. */
export function normalizeGroupCreditUsed(
  entries: CreditNormalizationEntry[]
): Map<string, number> {
  const result = new Map<string, number>();
  const groups = new Map<string, CreditNormalizationEntry[]>();
  for (const entry of entries) {
    result.set(entry.key, Math.max(0, toCents(entry.creditUsed)));
    if (!entry.groupKey) continue;
    const members = groups.get(entry.groupKey) || [];
    members.push(entry);
    groups.set(entry.groupKey, members);
  }

  groups.forEach((members) => {
    if (members.length < 2) return;
    if (members.some((member) => member.creditAllocation === CREDIT_ALLOCATION_PER_PAYMENT)) return;
    const groupTotal = toCents(members[0].creditUsed);
    if (groupTotal <= 0) return;
    if (members.some((member) => toCents(member.creditUsed) !== groupTotal)) return;

    const ordered = [...members].sort(
      (a, b) => a.order.localeCompare(b.order) || a.key.localeCompare(b.key)
    );
    const allocation = allocateCents(
      groupTotal,
      ordered.map((member) => toCents(member.amountPaid))
    );
    ordered.forEach((member, index) => result.set(member.key, allocation[index]));
  });

  return result;
}

/**
 * Crédito de saldo a favor inicial aplicado a cargos (pesos). No es ingreso, pero sí cubre cargos,
 * así que se resta en el "Saldo" (cargos − ingresos − este monto).
 */
export const sumOpeningCreditUsed = (
  records: ReadonlyArray<{ openingCreditUsed?: number }>
): number =>
  records.reduce((sum, record) => sum + (Number(record.openingCreditUsed) || 0), 0);

/** Clave de grupo de un documento de pago: los multicargo comparten paymentGroupId y folio. */
export const paymentCreditGroupKey = (payment: {
  paymentGroupId?: unknown;
  folio?: unknown;
}): string => String(payment.paymentGroupId || payment.folio || "");
