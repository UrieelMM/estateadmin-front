/**
 * Utilidades compartidas para los componentes de noticias y guías
 */

import moment from "moment";

/**
 * Formatea una fecha utilizando moment
 * @param date Fecha de Firestore
 * @returns Fecha formateada
 */
export const formatDate = (date: any): string => {
  if (!date) return "";

  try {
    return moment(date.toDate()).format("LL");
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "";
  }
};

/**
 * Genera un slug a partir de un texto
 * @param text Texto para generar slug
 * @returns Slug generado
 */
export const generateSlug = (text: string): string => {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

/**
 * Trunca un texto a una longitud determinada
 * @param text Texto a truncar
 * @param length Longitud máxima
 * @returns Texto truncado
 */
export const truncateText = (text: string, length: number): string => {
  if (!text) return "";
  if (text.length <= length) return text;

  return text.slice(0, length) + "...";
};

/**
 * Extrae categorías únicas de una lista de guías
 * @param items Lista de guías
 * @returns Array de categorías únicas
 */
export const extractUniqueCategories = (items: any[]): string[] => {
  const categories = new Set<string>();

  items.forEach((item) => {
    item.categories?.forEach((category: string) => {
      categories.add(category);
    });
  });

  return Array.from(categories);
};
