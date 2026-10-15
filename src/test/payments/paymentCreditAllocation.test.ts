import { describe, expect, it } from "vitest";
import {
  CREDIT_ALLOCATION_PER_PAYMENT,
  allocateCents,
  normalizeGroupCreditUsed,
  paymentCreditGroupKey,
} from "../../utils/paymentCreditAllocation";

describe("allocateCents", () => {
  it("reparte en orden hasta el tope y deja el sobrante en el último", () => {
    expect(allocateCents(70000, [50000, 50000, 50000])).toEqual([50000, 20000, 0]);
    expect(allocateCents(60000, [30000, 20000])).toEqual([30000, 30000]);
    expect(allocateCents(0, [100])).toEqual([0]);
  });
});

describe("normalizeGroupCreditUsed", () => {
  it("cuenta una sola vez el crédito repetido en grupos heredados", () => {
    const result = normalizeGroupCreditUsed([
      { key: "feb", groupKey: "g1", order: "2025-02-01", amountPaid: 50000, creditUsed: 80000 },
      { key: "ene", groupKey: "g1", order: "2025-01-01", amountPaid: 50000, creditUsed: 80000 },
    ]);
    expect(result.get("ene")).toBe(50000);
    expect(result.get("feb")).toBe(30000);
  });

  it("respeta pagos nuevos ya repartidos", () => {
    const result = normalizeGroupCreditUsed([
      { key: "a", groupKey: "g2", order: "1", amountPaid: 50000, creditUsed: 25000, creditAllocation: CREDIT_ALLOCATION_PER_PAYMENT },
      { key: "b", groupKey: "g2", order: "2", amountPaid: 50000, creditUsed: 25000, creditAllocation: CREDIT_ALLOCATION_PER_PAYMENT },
    ]);
    expect(result.get("a")).toBe(25000);
    expect(result.get("b")).toBe(25000);
  });

  it("no toca pagos únicos ni grupos con valores distintos", () => {
    const result = normalizeGroupCreditUsed([
      { key: "solo", groupKey: "g3", order: "1", amountPaid: 50000, creditUsed: 20000 },
      { key: "x", groupKey: "g4", order: "1", amountPaid: 50000, creditUsed: 10000 },
      { key: "y", groupKey: "g4", order: "2", amountPaid: 50000, creditUsed: 5000 },
    ]);
    expect(result.get("solo")).toBe(20000);
    expect(result.get("x")).toBe(10000);
    expect(result.get("y")).toBe(5000);
  });

  it("agrupa por paymentGroupId y, si falta, por folio", () => {
    expect(paymentCreditGroupKey({ paymentGroupId: "pg", folio: "EA-1" })).toBe("pg");
    expect(paymentCreditGroupKey({ folio: "EA-1" })).toBe("EA-1");
    expect(paymentCreditGroupKey({})).toBe("");
  });
});
