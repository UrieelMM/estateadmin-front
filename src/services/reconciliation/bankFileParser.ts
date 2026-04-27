import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

export type BankFileKind = "csv" | "xlsx" | "xls" | "unknown";

export type BankFileDirection = "income" | "expenses";

export type ParsedBankRow = {
  id: string;
  rowIndex: number;
  date: Date | null;
  amount: number;
  description: string;
  reference: string;
  rawRow: Record<string, string>;
};

export type ParseWarning = {
  code: string;
  message: string;
  rowIndex?: number;
};

export type ColumnMapping = {
  date: number;
  description: number;
  reference: number;
  amount: number;
  debit: number;
  credit: number;
};

export type ParseResult = {
  fileKind: BankFileKind;
  delimiter?: string;
  headers: string[];
  rows: ParsedBankRow[];
  mapping: ColumnMapping;
  warnings: ParseWarning[];
  errors: ParseWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    totalAmount: number;
    dateRange: { from: Date | null; to: Date | null };
  };
};

const DATE_HEADER_KEYWORDS = [
  "fecha",
  "date",
  "fecha movimiento",
  "fecha operacion",
  "fecha valor",
  "fec.",
];

const DESCRIPTION_HEADER_KEYWORDS = [
  "descripcion",
  "concepto",
  "detalle",
  "movimiento",
  "description",
  "detail",
  "narrativa",
  "glosa",
];

const REFERENCE_HEADER_KEYWORDS = [
  "referencia",
  "folio",
  "ref",
  "reference",
  "numero",
  "clave",
  "tracking",
  "no. op",
];

const AMOUNT_HEADER_KEYWORDS = ["monto", "importe", "amount", "valor", "total"];

const DEBIT_HEADER_KEYWORDS = [
  "cargo",
  "debito",
  "débito",
  "retiro",
  "egreso",
  "salida",
  "debit",
];

const CREDIT_HEADER_KEYWORDS = [
  "abono",
  "credito",
  "crédito",
  "deposito",
  "depósito",
  "ingreso",
  "entrada",
  "credit",
];

export function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizeReference(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

/**
 * Detects the file kind based on extension and MIME type.
 */
export function detectBankFileKind(file: File): BankFileKind {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".xlsx")) return "xlsx";
  if (name.endsWith(".xls")) return "xls";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".txt")) return "csv";
  const type = (file.type || "").toLowerCase();
  if (type.includes("spreadsheetml")) return "xlsx";
  if (type.includes("ms-excel")) return "xls";
  if (type.includes("csv") || type.includes("text/plain")) return "csv";
  return "unknown";
}

/**
 * Auto-detect the delimiter by counting occurrences in the first few lines.
 */
function detectDelimiter(sample: string): string {
  const candidates = [",", ";", "\t", "|"];
  const lines = sample.split(/\r?\n/).filter(Boolean).slice(0, 5);
  if (lines.length === 0) return ",";
  let best = ",";
  let bestScore = -1;
  for (const candidate of candidates) {
    const counts = lines.map((line) => {
      // Simple counter ignoring quoted segments.
      let inQuotes = false;
      let count = 0;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === candidate && !inQuotes) count += 1;
      }
      return count;
    });
    if (counts.length === 0) continue;
    const avg = counts.reduce((acc, v) => acc + v, 0) / counts.length;
    if (avg < 1) continue;
    const variance =
      counts.reduce((acc, v) => acc + (v - avg) * (v - avg), 0) / counts.length;
    // Prefer the delimiter with the highest average and lowest variance.
    const score = avg - variance * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

/**
 * Parses a CSV string respecting quotes, escaped quotes and multi-line fields.
 */
export function parseCsv(csvText: string, delimiter?: string): string[][] {
  const source = csvText.replace(/^\uFEFF/, ""); // Strip BOM
  const sep = delimiter || detectDelimiter(source);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === sep) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }
    currentField += char;
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((value) => value.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

/**
 * Tries a wide range of locale-aware date formats.
 */
export function parseBankDate(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  // Excel numeric serial dates.
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Excel's epoch is 1899-12-30. This mirrors xlsx's own SSF_parse_date_code.
    const utcDays = Math.floor(raw - 25569);
    const utcMs = utcDays * 86400 * 1000;
    const parsed = new Date(utcMs);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // ISO 8601 (e.g. 2026-02-03 or 2026-02-03T12:00:00).
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  // DD/MM/YYYY or DD/MM/YY or D/M/YYYY, supporting both / and - and . separators.
  const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const rawYear = Number(dmy[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  // YYYY/MM/DD variants.
  const ymd = trimmed.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  // Textual month formats: "03 feb 2026", "3 de febrero de 2026".
  const months: Record<string, number> = {
    ene: 0,
    enero: 0,
    feb: 1,
    febrero: 1,
    mar: 2,
    marzo: 2,
    abr: 3,
    abril: 3,
    may: 4,
    mayo: 4,
    jun: 5,
    junio: 5,
    jul: 6,
    julio: 6,
    ago: 7,
    agosto: 7,
    sep: 8,
    sept: 8,
    septiembre: 8,
    oct: 9,
    octubre: 9,
    nov: 10,
    noviembre: 10,
    dic: 11,
    diciembre: 11,
    jan: 0,
    apr: 3,
    aug: 7,
    dec: 11,
  };
  const textual = normalizeText(trimmed).match(
    /^(\d{1,2})\s*(?:de)?\s*([a-z]+)\s*(?:de)?\s*(\d{2,4})$/,
  );
  if (textual) {
    const day = Number(textual[1]);
    const monthKey = textual[2];
    const rawYear = Number(textual[3]);
    const month = months[monthKey];
    if (month !== undefined && day >= 1 && day <= 31) {
      const year = rawYear < 100 ? 2000 + rawYear : rawYear;
      const parsed = new Date(year, month, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  // Final fallback: let JS try.
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Robust amount parsing supporting: "$1,234.56", "1.234,56", "(1,234.56)", "-1234.56".
 */
export function parseBankAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;

  const original = String(raw).trim();
  if (!original) return 0;

  // Accounting parentheses denote negatives.
  const isParenthesisNegative = /^\(.*\)$/.test(original);
  // Cleanup symbols, keep digits, comma, dot, dash.
  let cleaned = original.replace(/[^0-9,.\-]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized = cleaned;
  if (lastComma >= 0 && lastDot >= 0) {
    // Both present: the rightmost is the decimal separator.
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    // Only comma: heuristic – if exactly 2 digits after, decimal; otherwise thousands.
    const afterComma = cleaned.length - lastComma - 1;
    if (afterComma === 2) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return isParenthesisNegative ? -Math.abs(parsed) : parsed;
}

function headerIncludesAny(header: string, keywords: string[]): boolean {
  const normalized = normalizeText(header);
  return keywords.some((keyword) => {
    const nk = normalizeText(keyword);
    if (normalized === nk) return true;
    if (normalized.includes(nk)) return true;
    return false;
  });
}

function detectColumnMapping(headers: string[]): ColumnMapping {
  const dateIdx = headers.findIndex((h) =>
    headerIncludesAny(h, DATE_HEADER_KEYWORDS),
  );
  const descIdx = headers.findIndex((h) =>
    headerIncludesAny(h, DESCRIPTION_HEADER_KEYWORDS),
  );
  const refIdx = headers.findIndex((h) =>
    headerIncludesAny(h, REFERENCE_HEADER_KEYWORDS),
  );
  const amountIdx = headers.findIndex((h) =>
    headerIncludesAny(h, AMOUNT_HEADER_KEYWORDS),
  );
  const debitIdx = headers.findIndex((h) =>
    headerIncludesAny(h, DEBIT_HEADER_KEYWORDS),
  );
  const creditIdx = headers.findIndex((h) =>
    headerIncludesAny(h, CREDIT_HEADER_KEYWORDS),
  );
  return {
    date: dateIdx,
    description: descIdx,
    reference: refIdx,
    amount: amountIdx,
    debit: debitIdx,
    credit: creditIdx,
  };
}

function mergeAmounts(
  row: (string | number)[],
  mapping: ColumnMapping,
  direction: BankFileDirection,
): number {
  const creditRaw = mapping.credit >= 0 ? (row[mapping.credit] ?? "") : "";
  const debitRaw = mapping.debit >= 0 ? (row[mapping.debit] ?? "") : "";
  const amountRaw = mapping.amount >= 0 ? (row[mapping.amount] ?? "") : "";
  const credit = parseBankAmount(creditRaw);
  const debit = parseBankAmount(debitRaw);
  const amount = parseBankAmount(amountRaw);

  if (direction === "income") {
    // Prefer credit column, otherwise amount, otherwise invert debit (unusual).
    if (credit > 0) return credit;
    if (amount > 0) return amount;
    if (amount < 0) return 0; // Skip debits for income.
    return 0;
  }

  // Expenses: prefer debit, otherwise amount (absolute value).
  if (debit > 0) return debit;
  if (amount < 0) return Math.abs(amount);
  if (amount > 0 && mapping.credit < 0 && mapping.debit < 0) return amount;
  return 0;
}

function rowsToBankRows(
  rawRows: (string | number)[][],
  headers: string[],
  mapping: ColumnMapping,
  direction: BankFileDirection,
): { rows: ParsedBankRow[]; warnings: ParseWarning[] } {
  const warnings: ParseWarning[] = [];
  const rows: ParsedBankRow[] = [];
  const headerNormalized = headers.map((h) => String(h || "").trim());

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2; // +1 for 0-index, +1 for header line.
    const rawRow: Record<string, string> = {};
    headerNormalized.forEach((header, idx) => {
      if (!header) return;
      rawRow[header] =
        row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : "";
    });

    const dateRaw = mapping.date >= 0 ? row[mapping.date] : null;
    const description =
      mapping.description >= 0 && row[mapping.description] !== undefined
        ? String(row[mapping.description] ?? "")
        : "";
    const reference =
      mapping.reference >= 0 && row[mapping.reference] !== undefined
        ? String(row[mapping.reference] ?? "")
        : "";
    const amount = mergeAmounts(row, mapping, direction);

    if (amount <= 0) {
      warnings.push({
        code: "row.zeroAmount",
        message: `Fila ${rowIndex}: se omitió por no tener monto válido para ${
          direction === "income" ? "ingresos" : "egresos"
        }.`,
        rowIndex,
      });
      return;
    }

    const date = parseBankDate(dateRaw ?? "");
    if (!date) {
      warnings.push({
        code: "row.invalidDate",
        message: `Fila ${rowIndex}: fecha ilegible (${String(dateRaw ?? "")}), se conservó pero no podrá filtrarse por rango.`,
        rowIndex,
      });
    }

    rows.push({
      id: `bank_${uuidv4()}`,
      rowIndex,
      date,
      amount,
      description: description.trim(),
      reference: reference.trim(),
      rawRow,
    });
  });

  return { rows, warnings };
}

function assessMapping(mapping: ColumnMapping): ParseWarning[] {
  const missing: ParseWarning[] = [];
  if (mapping.date < 0) {
    missing.push({
      code: "mapping.missingDate",
      message:
        "No se encontró columna de fecha. Asegúrate de que el encabezado contenga 'Fecha' o equivalente.",
    });
  }
  if (mapping.amount < 0 && mapping.debit < 0 && mapping.credit < 0) {
    missing.push({
      code: "mapping.missingAmount",
      message:
        "No se encontró columna de monto, cargo, abono o similar. Revisa que el encabezado sea reconocible.",
    });
  }
  return missing;
}

function computeStats(rows: ParsedBankRow[]) {
  let totalAmount = 0;
  let from: Date | null = null;
  let to: Date | null = null;
  for (const row of rows) {
    totalAmount += row.amount;
    if (row.date) {
      if (!from || row.date < from) from = row.date;
      if (!to || row.date > to) to = row.date;
    }
  }
  return { totalAmount, dateRange: { from, to } };
}

/**
 * Parses an uploaded bank file (CSV, XLSX, or XLS) into a structured
 * result that can be imported into the reconciliation store.
 *
 * @param file - File provided by the user.
 * @param direction - Whether the reconciliation is for income or expenses.
 */
export async function parseBankFile(
  file: File,
  direction: BankFileDirection,
): Promise<ParseResult> {
  const kind = detectBankFileKind(file);
  if (kind === "unknown") {
    return emptyResult(kind, [
      {
        code: "file.unknown",
        message:
          "Formato de archivo no soportado. Usa CSV (.csv), Excel (.xlsx) o (.xls).",
      },
    ]);
  }

  if (kind === "csv") {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      return emptyResult(kind, [
        { code: "file.empty", message: "El archivo está vacío." },
      ]);
    }
    const headers = rows[0].map((h) => String(h || "").trim());
    const dataRows = rows.slice(1);
    return buildResultFromRows(
      kind,
      headers,
      dataRows,
      direction,
      detectDelimiter(text),
    );
  }

  // Excel (xlsx or xls)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  if (!workbook.SheetNames.length) {
    return emptyResult(kind, [
      { code: "file.empty", message: "El archivo no tiene hojas de cálculo." },
    ]);
  }

  // Choose the first non-empty sheet.
  let chosenSheet = workbook.Sheets[workbook.SheetNames[0]];
  let sheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const preview = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    if (preview.length > 1) {
      chosenSheet = sheet;
      sheetName = name;
      break;
    }
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(chosenSheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: true,
  });
  if (rows.length === 0) {
    return emptyResult(kind, [
      {
        code: "file.empty",
        message: `La hoja "${sheetName}" no contiene filas.`,
      },
    ]);
  }
  const headers = (rows[0] || []).map((h) =>
    h instanceof Date ? h.toISOString().slice(0, 10) : String(h ?? "").trim(),
  );
  const dataRows = rows.slice(1) as (string | number)[][];
  return buildResultFromRows(kind, headers, dataRows, direction);
}

function buildResultFromRows(
  kind: BankFileKind,
  headers: string[],
  dataRows: (string | number)[][],
  direction: BankFileDirection,
  delimiter?: string,
): ParseResult {
  const mapping = detectColumnMapping(headers);
  const missingMappingErrors = assessMapping(mapping);
  const { rows, warnings } = rowsToBankRows(
    dataRows,
    headers,
    mapping,
    direction,
  );
  const stats = computeStats(rows);
  return {
    fileKind: kind,
    delimiter,
    headers,
    rows,
    mapping,
    warnings,
    errors: missingMappingErrors,
    stats: {
      totalRows: dataRows.length,
      validRows: rows.length,
      skippedRows: dataRows.length - rows.length,
      totalAmount: stats.totalAmount,
      dateRange: stats.dateRange,
    },
  };
}

function emptyResult(kind: BankFileKind, errors: ParseWarning[]): ParseResult {
  return {
    fileKind: kind,
    headers: [],
    rows: [],
    mapping: {
      date: -1,
      description: -1,
      reference: -1,
      amount: -1,
      debit: -1,
      credit: -1,
    },
    warnings: [],
    errors,
    stats: {
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      totalAmount: 0,
      dateRange: { from: null, to: null },
    },
  };
}

/**
 * Re-runs the row-to-bank-row transformation using a manual column mapping
 * supplied by the user (in case the auto-detector did not pick the right columns).
 */
export function recomputeWithMapping(
  result: ParseResult,
  mapping: ColumnMapping,
  direction: BankFileDirection,
  dataRows: (string | number)[][],
): ParseResult {
  const missingMappingErrors = assessMapping(mapping);
  const { rows, warnings } = rowsToBankRows(
    dataRows,
    result.headers,
    mapping,
    direction,
  );
  const stats = computeStats(rows);
  return {
    ...result,
    mapping,
    rows,
    warnings,
    errors: missingMappingErrors,
    stats: {
      totalRows: dataRows.length,
      validRows: rows.length,
      skippedRows: dataRows.length - rows.length,
      totalAmount: stats.totalAmount,
      dateRange: stats.dateRange,
    },
  };
}
