import { prisma } from "../utils/prisma";

/** 3 điều khoản mẫu + 1 nhóm gom cả ba (theo yêu cầu triển khai). */
const CLAUSES: Array<{ code: string; title: string; content: string; sortOrder: number }> = [
  {
    code: "scope",
    title: "Phạm vi công việc",
    sortOrder: 0,
    content:
      "1. Phạm vi: Bên B thực hiện các hạng mục theo phụ lục đính kèm. Mọi phát sinh ngoài phạm vi phải được Bên A xác nhận bằng văn bản.",
  },
  {
    code: "payment",
    title: "Thanh toán",
    sortOrder: 1,
    content:
      "2. Thanh toán: Bên A thanh toán theo tiến độ đã thống nhất. Quá hạn 15 ngày, Bên B có quyền tạm dừng thực hiện cho đến khi nhận đủ thanh toán.",
  },
  {
    code: "warranty",
    title: "Bảo hành",
    sortOrder: 2,
    content:
      "3. Bảo hành: Thời hạn bảo hành theo thỏa thuận trên hợp đồng. Bên B bảo hành lỗi do nhà sản xuất hoặc lỗi lắp đặt trong phạm vi trách nhiệm.",
  },
];

const GROUPS: Array<{ code: string; label: string; sortOrder: number; clauseCodes: string[] }> = [
  {
    code: "standard",
    label: "Bộ điều khoản chuẩn",
    sortOrder: 0,
    clauseCodes: ["scope", "payment", "warranty"],
  },
];

export async function seedContractClauses() {
  const clauseIdByCode = new Map<string, string>();

  for (const seed of CLAUSES) {
    const row = await prisma.contractClause.upsert({
      where: { code: seed.code },
      create: {
        code: seed.code,
        title: seed.title,
        content: seed.content,
        sortOrder: seed.sortOrder,
        isSystem: true,
        isActive: true,
      },
      update: {
        title: seed.title,
        content: seed.content,
        sortOrder: seed.sortOrder,
        isActive: true,
        deletedAt: null,
      },
    });
    clauseIdByCode.set(seed.code, row.id);
  }

  for (const g of GROUPS) {
    const group = await prisma.contractClauseGroup.upsert({
      where: { code: g.code },
      create: {
        code: g.code,
        label: g.label,
        sortOrder: g.sortOrder,
        isSystem: true,
        isActive: true,
      },
      update: {
        label: g.label,
        sortOrder: g.sortOrder,
        isActive: true,
        deletedAt: null,
      },
    });

    await prisma.contractClauseGroupMember.deleteMany({ where: { groupId: group.id } });
    const clauseIds = g.clauseCodes.map((code) => clauseIdByCode.get(code)).filter(Boolean) as string[];
    if (clauseIds.length > 0) {
      await prisma.contractClauseGroupMember.createMany({
        data: clauseIds.map((clauseId, index) => ({
          groupId: group.id,
          clauseId,
          sortOrder: index,
        })),
      });
    }
  }
}
