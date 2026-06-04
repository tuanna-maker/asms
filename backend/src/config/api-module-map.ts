export type CrudAction = "read" | "create" | "update" | "delete";

/** Map prefix API (mount path) → moduleKey phân quyền. */
export const API_MODULE_MAP: Record<string, string> = {
  contracts: "hop-dong",
  "contract-clauses": "hop-dong.dieu-khoan",
  handovers: "ban-giao",
  warranties: "bao-hanh",
  products: "san-pham",
  materials: "vat-tu",
  customers: "khach-hang",
  contacts: "khach-hang.lien-he",
  "crm-activities": "khach-hang.hoat-dong",
  "customer-anniversaries": "khach-hang.loyalty",
  "anniversary-subscriptions": "khach-hang.loyalty",
  "customer-feedbacks": "phan-anh",
  "feedback-execution-units": "phan-anh",
  reports: "bao-cao",
  "research-projects": "de-tai",
  tasks: "cong-viec",
  training: "dao-tao",
  documents: "tai-lieu",
  "workflow-documents": "tai-lieu",
  workflows: "quy-trinh",
  definitions: "cai-dat.thuoc-tinh",
  users: "cai-dat.nguoi-dung",
  roles: "cai-dat.vai-tro",
  "role-permissions": "cai-dat.phan-quyen",
  "system-settings": "cai-dat.he-thong",
  "audit-logs": "cai-dat.nhat-ky",
  "notification-preferences": "cai-dat.thong-bao",
};

export function httpMethodToCrudAction(method: string): CrudAction {
  switch (method.toUpperCase()) {
    case "GET":
    case "HEAD":
    case "OPTIONS":
      return "read";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "read";
  }
}
