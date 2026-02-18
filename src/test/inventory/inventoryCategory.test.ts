import { describe, expect, it } from "vitest";
import {
  hasDuplicateCategoryName,
  normalizeCategoryName,
  sanitizeCategoryDescription,
  sanitizeCategoryName,
} from "../../utils/inventoryCategory";

describe("inventoryCategory utils", () => {
  it("sanitiza nombre y descripción colapsando espacios", () => {
    expect(sanitizeCategoryName("   Herramientas   eléctricas  ")).toBe(
      "Herramientas eléctricas"
    );
    expect(
      sanitizeCategoryDescription("  Descripción \n   con   espacios  ")
    ).toBe("Descripción con espacios");
  });

  it("normaliza el nombre para comparación sin acentos y case-insensitive", () => {
    expect(normalizeCategoryName("  Eléctrica  ")).toBe("electrica");
    expect(normalizeCategoryName("ELECTRICA")).toBe("electrica");
  });

  it("detecta duplicados considerando normalización", () => {
    const categories = [
      { id: "1", name: "Categoría General", normalizedName: "categoria general" },
      { id: "2", name: "Limpieza" },
    ];

    expect(hasDuplicateCategoryName(categories, "categoria general")).toBe(true);
    expect(hasDuplicateCategoryName(categories, "limpieza")).toBe(true);
    expect(hasDuplicateCategoryName(categories, "limpieza", "2")).toBe(false);
  });
});
