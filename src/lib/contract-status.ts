import type { AttributeRow } from "@/lib/attribute-settings-config";

export const CONTRACT_STATUS_REFERENCE_ROWS: AttributeRow[] = [
  {
    id: "draft",
    name: "Nháp",
    createdAt: "—",
    createdBy: "—",
    status: "active",
  },
  {
    id: "active",
    name: "Đang thực hiện",
    createdAt: "—",
    createdBy: "—",
    status: "active",
  },
  {
    id: "completed",
    name: "Hoàn thành",
    createdAt: "—",
    createdBy: "—",
    status: "active",
  },
  {
    id: "late",
    name: "Chậm tiến độ",
    createdAt: "—",
    createdBy: "—",
    status: "active",
  },
  {
    id: "liquidated",
    name: "Đã thanh lý",
    createdAt: "—",
    createdBy: "—",
    status: "active",
  },
];

export const CONTRACT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  CONTRACT_STATUS_REFERENCE_ROWS.map((row) => [row.id, row.name]),
);
