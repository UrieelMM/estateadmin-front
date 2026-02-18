export interface CategoryLike {
  id?: string;
  name?: string;
  description?: string;
  parentId?: string;
  normalizedName?: string;
}

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const MULTI_SPACE_REGEX = /\s+/g;
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

const sanitizeText = (value: string, maxLength: number): string =>
  value
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(MULTI_SPACE_REGEX, " ")
    .trim()
    .slice(0, maxLength);

export const sanitizeCategoryName = (value: string): string =>
  sanitizeText(value || "", 80);

export const sanitizeCategoryDescription = (value?: string): string =>
  sanitizeText(value || "", 240);

export const normalizeCategoryName = (value: string): string =>
  sanitizeCategoryName(value)
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase();

export const hasDuplicateCategoryName = (
  categories: CategoryLike[],
  normalizedName: string,
  excludedId?: string
): boolean =>
  categories.some((category) => {
    if (excludedId && category.id === excludedId) {
      return false;
    }
    const currentNormalized =
      category.normalizedName || normalizeCategoryName(category.name || "");
    return currentNormalized === normalizedName;
  });
