/** Normaliza torre para ordenar (sin prefijo "Torre", trim). */
export const normalizeTowerForSort = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .replace(/^torre\s*/i, "")
    .trim();

/** Normaliza número / departamento para ordenar. */
export const normalizeUnitForSort = (value: unknown): string =>
  String(value ?? "").trim();

export const compareNaturalStrings = (a: string, b: string): number =>
  a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });

const compareNatural = compareNaturalStrings;

/** Torre ascendente y, dentro de la misma torre, número alfanumérico (1, 2, 10, A1, B2…). */
export const compareUsersByTowerThenUnit = (
  a: { tower?: string; number?: string },
  b: { tower?: string; number?: string },
): number => {
  const towerCompare = compareNatural(
    normalizeTowerForSort(a.tower),
    normalizeTowerForSort(b.tower),
  );
  if (towerCompare !== 0) return towerCompare;
  return compareNatural(
    normalizeUnitForSort(a.number),
    normalizeUnitForSort(b.number),
  );
};

export const compareUsersByUnitOnly = (
  a: { number?: string },
  b: { number?: string },
): number =>
  compareNatural(
    normalizeUnitForSort(a.number),
    normalizeUnitForSort(b.number),
  );

export const sortUsersByTowerThenUnit = <
  T extends { tower?: string; number?: string },
>(
  users: T[],
): T[] => [...users].sort(compareUsersByTowerThenUnit);
