import { prisma } from "../utils/prisma";

const SEEDS: Array<{ category: string; code: string; label: string; sortOrder: number }> = [
  { category: "warehouse", code: "Kho chính", label: "Kho chính", sortOrder: 0 },
  { category: "warehouse", code: "Kho phụ", label: "Kho phụ", sortOrder: 10 },
  { category: "material_unit", code: "bộ", label: "Bộ", sortOrder: 0 },
  { category: "material_unit", code: "cái", label: "Cái", sortOrder: 10 },
  { category: "material_unit", code: "mét", label: "Mét", sortOrder: 20 },
  { category: "material_unit", code: "kg", label: "Kilogram", sortOrder: 30 },
];

export async function seedDataDefinitions() {
  for (const s of SEEDS) {
    const exists = await prisma.dataDefinition.findFirst({
      where: { category: s.category, code: s.code, deletedAt: null },
    });
    if (exists) continue;
    await prisma.dataDefinition.create({
      data: {
        category: s.category,
        code: s.code,
        label: s.label,
        sortOrder: s.sortOrder,
      },
    });
  }
}
