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
  definitions: {
    all: ["definitions"] as const,
    list: (category: string, scope: "active" | "all") => ["definitions", category, scope] as const,
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
};
