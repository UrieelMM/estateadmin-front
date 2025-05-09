export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

export function formatCurrencyInventory(
  val: number | string | null | undefined
): string {
  // Si el valor es nulo, undefined o después de parsear es NaN, retornamos $0.00
  if (val === null || val === undefined) return "$0.00";

  // Si es string, eliminamos cualquier formato previo (comas, símbolos de moneda)
  let numValue =
    typeof val === "string"
      ? parseFloat(val.replace(/[$,\s]/g, ""))
      : Number(val);

  // Si después de parsear es NaN, retornamos $0.00
  if (isNaN(numValue)) return "$0.00";

  // Formateamos manualmente para asegurar que tenga comas
  const parts = numValue.toFixed(2).split(".");

  // Agregamos las comas a la parte entera cada 3 dígitos
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Retornamos con el símbolo de pesos al inicio
  return `$${parts.join(".")}`;
}

export const formatCentsToMXN = (cents: number): string => {
  const pesos = cents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
};

export const formatMXNToCents = (mxn: string): number => {
  // Remover cualquier carácter que no sea número o punto decimal
  const cleanValue = mxn.replace(/[^\d.]/g, "");

  // Convertir a número y multiplicar por 100 para obtener centavos
  const pesosValue = parseFloat(cleanValue) || 0;
  return Math.round(pesosValue * 100);
};

export const centsToPesos = (val: any): number => {
  const intVal = parseInt(val, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
};

export const formatDateToSpanish = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
};
