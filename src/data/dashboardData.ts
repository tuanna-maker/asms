/** Dashboard aggregate types aligned with GET /api/v1/reports/dashboard-summary */

export type ProductProgress = {
  quantity: { producing: number; produced: number };
  inspection: { submitted: number; inspecting: number; passed: number };
  decisionApproved: number;
  equipped: number;
  equipDecided: number;
};

export type ProgressSummary = {
  total: number;
  active: number;
  completedOnTime: number;
  completedLate: number;
};

export type ComplaintProgress = {
  total: number;
  warranty: number;
  repair: number;
  processing: number;
  completedOnTime: number;
  completedLate: number;
};

export type TrainingProgress = {
  totalBatches: number;
  active: number;
  completedOnTime: number;
  completedLate: number;
};

export type CustomerCareBreakdown = {
  id: string;
  name: string;
  revenue: number;
  expense: number;
  productsDelivered: number;
  complaints: { processing: number; onTime: number; late: number };
};

export type UpcomingAnniversary = {
  customerId: string;
  customerName: string;
  type: string;
  label: string;
  occursAt: string;
  daysUntil: number;
};

export type PakdItem = {
  name: string;
  warehouse: string;
  total: number;
  remaining: number;
  expiresAt: string | null;
};

export type PakdResearchItem = {
  id: string;
  code: string;
  name: string;
  budget: number;
  remaining: number;
  expiresAt: string;
};

export type PakdSection = {
  total: number;
  valid: number;
  expired: number;
  items: PakdItem[];
};

export type PakdResearchSection = {
  total: number;
  valid: number;
  expired: number;
  items: PakdResearchItem[];
};

export type PakdSummary = {
  materials: PakdSection;
  research: PakdResearchSection;
  /** @deprecated dùng materials — giữ tương thích */
  total: number;
  valid: number;
  expired: number;
  items: PakdItem[];
};

export type DashboardData = {
  productProgress: ProductProgress;
  contractProgress: ProgressSummary;
  complaintProgress: ComplaintProgress;
  handoverProgress: ProgressSummary;
  trainingProgress: TrainingProgress;
  customerCare: {
    totalCustomers: number;
    customerBreakdown: CustomerCareBreakdown[];
    upcomingAnniversaries: UpcomingAnniversary[];
  };
  pakd: PakdSummary;
  /** KPI cards */
  stats: {
    totalProducts: number;
    activeContracts: number;
    pendingComplaints: number;
    completedThisMonth: number;
  };
  /** Flattened for legacy widgets/charts */
  product: {
    total: number;
    producing: number;
    inspecting: number;
    equipped: number;
  };
  contract: {
    total: number;
    active: number;
    completed: number;
    onTime: number;
    late: number;
  };
  handover: {
    total: number;
    active: number;
    completed: number;
    onTime: number;
    late: number;
  };
  training: {
    total: number;
    active: number;
    completed: number;
    onTime: number;
    late: number;
  };
  complaint: {
    total: number;
    warranty: number;
    repair: number;
    processing: number;
    done: number;
    onTime: number;
    late: number;
  };
  customerProducts: { name: string; products: number }[];
  customerRevenue: { name: string; revenue: number }[];
  trend: {
    month: string;
    sanXuat: number;
    hopDong: number;
    banGiao: number;
    huanLuyen: number;
  }[];
};

export const emptyDashboardData: DashboardData = {
  productProgress: {
    quantity: { producing: 0, produced: 0 },
    inspection: { submitted: 0, inspecting: 0, passed: 0 },
    decisionApproved: 0,
    equipped: 0,
    equipDecided: 0,
  },
  contractProgress: { total: 0, active: 0, completedOnTime: 0, completedLate: 0 },
  complaintProgress: {
    total: 0,
    warranty: 0,
    repair: 0,
    processing: 0,
    completedOnTime: 0,
    completedLate: 0,
  },
  handoverProgress: { total: 0, active: 0, completedOnTime: 0, completedLate: 0 },
  trainingProgress: { totalBatches: 0, active: 0, completedOnTime: 0, completedLate: 0 },
  customerCare: { totalCustomers: 0, customerBreakdown: [], upcomingAnniversaries: [] },
  pakd: {
    materials: { total: 0, valid: 0, expired: 0, items: [] },
    research: { total: 0, valid: 0, expired: 0, items: [] },
    total: 0,
    valid: 0,
    expired: 0,
    items: [],
  },
  stats: { totalProducts: 0, activeContracts: 0, pendingComplaints: 0, completedThisMonth: 0 },
  product: { total: 0, producing: 0, inspecting: 0, equipped: 0 },
  contract: { total: 0, active: 0, completed: 0, onTime: 0, late: 0 },
  handover: { total: 0, active: 0, completed: 0, onTime: 0, late: 0 },
  training: { total: 0, active: 0, completed: 0, onTime: 0, late: 0 },
  complaint: { total: 0, warranty: 0, repair: 0, processing: 0, done: 0, onTime: 0, late: 0 },
  customerProducts: [],
  customerRevenue: [],
  trend: [],
};
