import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contract: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    handover: {
      findMany: vi.fn(),
    },
    trainingCourse: {
      findMany: vi.fn(),
    },
    warranty: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../backend/src/utils/prisma", () => ({
  prisma: prismaMock,
}));

import { getReportsService } from "../../backend/src/modules/reports/service";

describe("reports service", () => {
  it("aggregates monthly trend, customer breakdown and summary delta", async () => {
    prismaMock.contract.findMany.mockResolvedValue([
      { status: "active", startDate: new Date("2026-01-10"), value: 1000, customer: { name: "QK1", code: "QK1" } },
      { status: "completed", startDate: new Date("2026-02-10"), value: 2000, customer: { name: "QK1", code: "QK1" } },
      { status: "late", startDate: new Date("2026-02-12"), value: 500, customer: { name: "QK3", code: "QK3" } },
    ]);
    prismaMock.handover.findMany.mockResolvedValue([
      { status: "active", startDate: new Date("2026-01-15") },
    ]);
    prismaMock.trainingCourse.findMany.mockResolvedValue([{ status: "planned" }]);
    prismaMock.warranty.findMany.mockResolvedValue([
      { status: "processing", type: "warranty", createdAt: new Date("2026-01-16") },
      { status: "completed", type: "repair", createdAt: new Date("2026-02-16") },
    ]);
    prismaMock.task.findMany.mockResolvedValue([
      {
        status: "completed",
        deadline: new Date("2026-01-20"),
        completedAt: new Date("2026-01-19"),
        assignee: { role: { code: "technician" } },
      },
      {
        status: "completed",
        deadline: new Date("2026-01-20"),
        completedAt: new Date("2026-01-22"),
        assignee: { role: { code: "technician" } },
      },
    ]);
    prismaMock.customer.count.mockResolvedValue(2);
    prismaMock.contract.aggregate
      .mockResolvedValueOnce({ _sum: { products: 12 } })
      .mockResolvedValueOnce({ _sum: { products: 8 } });
    prismaMock.contract.count.mockResolvedValue(2);
    prismaMock.warranty.count.mockResolvedValue(4);
    prismaMock.product.findMany.mockResolvedValue([]);

    const data = await getReportsService({ year: "2026" });

    expect(data.trends.monthly[0]).toMatchObject({ month: "T1", contracts: 1, complaints: 1, handovers: 1 });
    expect(data.trends.monthly[1]).toMatchObject({ month: "T2", contracts: 2, complaints: 1, handovers: 0 });
    expect(data.customer_breakdown[0]).toMatchObject({ name: "QK1", contracts: 2, value: 3000 });
    expect(data.unit_performance[0]).toMatchObject({ unit: "Đơn vị Kỹ thuật", tasks: 2, completed: 2, onTime: 1 });
    expect(data.summary_delta).toMatchObject({
      contractsPct: 50,
      deliveredPct: 50,
      warrantiesPct: -50,
    });
  });

  it("handles edge cases for unit performance and zero previous baseline", async () => {
    prismaMock.contract.findMany.mockResolvedValue([
      { status: "active", startDate: new Date("2026-03-10"), value: 100, customer: null },
    ]);
    prismaMock.handover.findMany.mockResolvedValue([]);
    prismaMock.trainingCourse.findMany.mockResolvedValue([]);
    prismaMock.warranty.findMany.mockResolvedValue([
      { status: "open", type: "maintenance", createdAt: new Date("2026-03-12") },
    ]);
    prismaMock.task.findMany.mockResolvedValue([
      {
        status: "completed",
        deadline: null,
        completedAt: new Date("2026-03-15"),
        assignee: null,
      },
      {
        status: "todo",
        deadline: null,
        completedAt: null,
        assignee: { role: null },
      },
    ]);
    prismaMock.customer.count.mockResolvedValue(1);
    prismaMock.contract.aggregate
      .mockResolvedValueOnce({ _sum: { products: 5 } })
      .mockResolvedValueOnce({ _sum: { products: 0 } });
    prismaMock.contract.count.mockResolvedValue(0);
    prismaMock.warranty.count.mockResolvedValue(0);
    prismaMock.product.findMany.mockResolvedValue([]);

    const data = await getReportsService({ year: "2026" });

    expect(data.customer_breakdown[0]).toMatchObject({ name: "Không xác định", contracts: 1, value: 100 });
    expect(data.unit_performance[0]).toMatchObject({
      unit: "Đơn vị chưa gán",
      tasks: 2,
      completed: 1,
      onTime: 0,
    });
    expect(data.summary_delta).toMatchObject({
      contractsPct: 100,
      deliveredPct: 100,
      warrantiesPct: 100,
    });
  });
});
