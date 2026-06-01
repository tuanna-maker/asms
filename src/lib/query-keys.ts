export const qk = {
  auth: {
    me: ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    detail: (id: string) => ["customers", id] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    list: (customerId?: string) => ["contacts", "list", customerId ?? "all"] as const,
    detail: (id: string) => ["contacts", id] as const,
  },
  crmActivities: {
    all: ["crm-activities"] as const,
    list: (customerId?: string) => ["crm-activities", "list", customerId ?? "all"] as const,
    detail: (id: string) => ["crm-activities", id] as const,
  },
  customerFeedbacks: {
    all: ["customer-feedbacks"] as const,
    list: (key: string) => ["customer-feedbacks", "list", key] as const,
    detail: (id: string) => ["customer-feedbacks", id] as const,
    analyticsByCustomer: (key: string) => ["customer-feedbacks", "analytics", "by-customer", key] as const,
    analyticsByProduct: (key: string) => ["customer-feedbacks", "analytics", "by-product", key] as const,
    analyticsByMaterial: (key: string) => ["customer-feedbacks", "analytics", "by-material", key] as const,
    analyticsCustomerDetail: (customerId: string, key: string) =>
      ["customer-feedbacks", "analytics", "customer-detail", customerId, key] as const,
  },
  contracts: {
    all: ["contracts"] as const,
    detail: (id: string) => ["contracts", id] as const,
  },
  handovers: {
    all: ["handovers"] as const,
    detail: (id: string) => ["handovers", id] as const,
  },
  warranties: {
    all: ["warranties"] as const,
    detail: (id: string) => ["warranties", id] as const,
  },
  materials: {
    all: ["materials"] as const,
    detail: (id: string) => ["materials", id] as const,
    transfers: ["materials", "transfers"] as const,
  },
  contractClauses: {
    all: ["contract-clauses"] as const,
    list: (scope: "active" | "all") => ["contract-clauses", scope] as const,
    usage: (id: string) => ["contract-clauses", "usage", id] as const,
    groups: (scope: "active" | "all") => ["contract-clause-groups", scope] as const,
  },
  definitions: {
    all: ["definitions"] as const,
    list: (category: string, scope: "active" | "all") => ["definitions", category, scope] as const,
    usage: (id: string) => ["definitions", "usage", id] as const,
  },
  products: {
    all: ["products"] as const,
    detail: (id: string) => ["products", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    detail: (id: string) => ["tasks", id] as const,
  },
  documents: {
    all: ["documents"] as const,
    detail: (id: string) => ["documents", id] as const,
  },
  reports: {
    byYear: (year: string) => ["reports", year] as const,
    dashboardSummary: (year?: string, from?: string, to?: string, customerId?: string) =>
      ["reports", "dashboard-summary", year, from, to, customerId] as const,
    main: (year?: string, from?: string, to?: string, customerId?: string) =>
      ["reports", "main", year, from, to, customerId] as const,
    productLine: (year?: string, from?: string, to?: string) =>
      ["reports", "product-line", year, from, to] as const,
    feedbackCustomer: (year?: string, from?: string, to?: string) =>
      ["reports", "feedback-customer", year, from, to] as const,
    feedbackProductLine: (year?: string, from?: string, to?: string) =>
      ["reports", "feedback-product-line", year, from, to] as const,
    materialDefects: (year?: string, from?: string, to?: string, limit?: number) =>
      ["reports", "material-defects", year, from, to, limit] as const,
  },
  training: {
    all: ["training-courses"] as const,
    detail: (id: string) => ["training-course", id] as const,
  },
  researchProjects: {
    all: ["research-projects"] as const,
    detail: (id: string) => ["research-projects", id] as const,
  },
  notificationPrefs: ["notification-preferences"] as const,
  anniversarySubscriptions: {
    all: ["anniversary-subscriptions"] as const,
    list: (idsKey: string) => ["anniversary-subscriptions", "list", idsKey] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (scope: "all" | "unread") => ["notifications", scope] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  roles: {
    all: ["roles"] as const,
    detail: (id: string) => ["roles", id] as const,
  },
  rolePermissions: {
    all: ["role-permissions"] as const,
  },
  auditLogs: {
    list: (key: string) => ["audit-logs", key] as const,
  },
  systemSettings: ["system-settings"] as const,
  sessions: ["auth", "sessions"] as const,
  workflows: {
    all: ["workflows"] as const,
    list: (moduleKey?: string) => ["workflows", "list", moduleKey ?? "all"] as const,
    detail: (id: string) => ["workflows", "detail", id] as const,
  },
};
