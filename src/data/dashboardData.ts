// Dashboard data generator based on filters
// Simulates realistic data variations per year/quarter/customer

type Filters = {
  year: string;
  quarter: string;
  customer: string;
};

type DashboardData = {
  stats: { totalProducts: number; activeContracts: number; pendingComplaints: number; completedThisMonth: number };
  product: { total: number; producing: number; inspecting: number; equipped: number };
  contract: { total: number; active: number; completed: number; onTime: number; late: number };
  handover: { total: number; active: number; completed: number; onTime: number; late: number };
  training: { total: number; active: number; completed: number; onTime: number; late: number };
  complaint: { total: number; warranty: number; repair: number; processing: number; done: number; onTime: number; late: number };
  pakd: { name: string; total: number; remaining: number }[];
  customerProducts: { name: string; products: number }[];
  customerRevenue: { name: string; revenue: number }[];
  trend: { month: string; sanXuat: number; hopDong: number; banGiao: number; huanLuyen: number }[];
};

type BaseData = Omit<DashboardData, 'customerProducts' | 'customerRevenue' | 'trend'>;

// Base data per year
const yearData: Record<string, BaseData> = {
  "2024": {
    stats: { totalProducts: 1248, activeContracts: 56, pendingComplaints: 24, completedThisMonth: 89 },
    product: { total: 1248, producing: 385, inspecting: 218, equipped: 645 },
    contract: { total: 142, active: 56, completed: 86, onTime: 72, late: 14 },
    handover: { total: 118, active: 38, completed: 80, onTime: 68, late: 12 },
    training: { total: 96, active: 28, completed: 68, onTime: 58, late: 10 },
    complaint: { total: 156, warranty: 98, repair: 58, processing: 24, done: 132, onTime: 108, late: 24 },
    pakd: [
      { name: "PAKD-2024-001 (QK1)", total: 12500, remaining: 4200 },
      { name: "PAKD-2024-002 (QK3)", total: 9800, remaining: 2850 },
      { name: "PAKD-2024-003 (BTL TTTM)", total: 18500, remaining: 8600 },
      { name: "PAKD-2024-004 (QK7)", total: 7200, remaining: 1580 },
      { name: "PAKD-2024-005 (QK5)", total: 8500, remaining: 4100 },
      { name: "PAKD-2024-006 (QK9)", total: 5800, remaining: 1950 },
    ],
  },
  "2023": {
    stats: { totalProducts: 892, activeContracts: 12, pendingComplaints: 8, completedThisMonth: 95 },
    product: { total: 892, producing: 45, inspecting: 68, equipped: 779 },
    contract: { total: 128, active: 12, completed: 116, onTime: 98, late: 18 },
    handover: { total: 105, active: 8, completed: 97, onTime: 82, late: 15 },
    training: { total: 78, active: 6, completed: 72, onTime: 62, late: 10 },
    complaint: { total: 124, warranty: 78, repair: 46, processing: 8, done: 116, onTime: 96, late: 20 },
    pakd: [
      { name: "PAKD-2023-001 (QK1)", total: 10500, remaining: 420 },
      { name: "PAKD-2023-002 (QK3)", total: 7800, remaining: 280 },
      { name: "PAKD-2023-003 (BTL TTTM)", total: 15200, remaining: 950 },
      { name: "PAKD-2023-004 (QK7)", total: 6200, remaining: 150 },
    ],
  },
  "2022": {
    stats: { totalProducts: 645, activeContracts: 0, pendingComplaints: 3, completedThisMonth: 0 },
    product: { total: 645, producing: 0, inspecting: 15, equipped: 630 },
    contract: { total: 98, active: 0, completed: 98, onTime: 82, late: 16 },
    handover: { total: 85, active: 0, completed: 85, onTime: 72, late: 13 },
    training: { total: 62, active: 0, completed: 62, onTime: 54, late: 8 },
    complaint: { total: 88, warranty: 55, repair: 33, processing: 3, done: 85, onTime: 72, late: 13 },
    pakd: [
      { name: "PAKD-2022-001 (QK1)", total: 8500, remaining: 0 },
      { name: "PAKD-2022-002 (QK3)", total: 5800, remaining: 0 },
      { name: "PAKD-2022-003 (BTL TTTM)", total: 12400, remaining: 0 },
    ],
  },
};

// Quarter multipliers (simulate proportional data)
const quarterMultipliers: Record<string, number> = {
  all: 1,
  q1: 0.22,
  q2: 0.28,
  q3: 0.3,
  q4: 0.2,
};

// Customer multipliers
const customerMultipliers: Record<string, number> = {
  all: 1,
  qk1: 0.18,
  qk3: 0.22,
  qk5: 0.15,
  qk7: 0.2,
  qk9: 0.1,
  tttm: 0.15,
};

function applyMultiplier(value: number, multiplier: number): number {
  if (multiplier === 1) return value;
  return Math.max(0, Math.round(value * multiplier));
}

function scaleData(base: BaseData, qMul: number, cMul: number, filters: Filters): DashboardData {
  const m = qMul * cMul;
  const s = (v: number) => applyMultiplier(v, m);

  const product = {
    producing: s(base.product.producing),
    inspecting: s(base.product.inspecting),
    equipped: s(base.product.equipped),
    total: 0,
  };
  product.total = product.producing + product.inspecting + product.equipped;

  const contract = {
    active: s(base.contract.active),
    completed: s(base.contract.completed),
    onTime: s(base.contract.onTime),
    late: s(base.contract.late),
    total: 0,
  };
  contract.total = contract.active + contract.completed;

  const handover = {
    active: s(base.handover.active),
    completed: s(base.handover.completed),
    onTime: s(base.handover.onTime),
    late: s(base.handover.late),
    total: 0,
  };
  handover.total = handover.active + handover.completed;

  const training = {
    active: s(base.training.active),
    completed: s(base.training.completed),
    onTime: s(base.training.onTime),
    late: s(base.training.late),
    total: 0,
  };
  training.total = training.active + training.completed;

  const complaint = {
    warranty: s(base.complaint.warranty),
    repair: s(base.complaint.repair),
    processing: s(base.complaint.processing),
    done: s(base.complaint.done),
    onTime: s(base.complaint.onTime),
    late: s(base.complaint.late),
    total: 0,
  };
  complaint.total = complaint.warranty + complaint.repair;

  // PAKD: filter by customer if needed, scale remaining
  const pakd = (cMul === 1 ? base.pakd : base.pakd.slice(0, Math.max(1, Math.round(base.pakd.length * cMul)))).map((p) => ({
    ...p,
    remaining: applyMultiplier(p.remaining, qMul),
  }));

  // Customer breakdown data
  const customerBaseProducts: Record<string, { name: string; pMul: number; rMul: number }> = {
    qk1: { name: "Quân khu 1", pMul: 0.18, rMul: 0.16 },
    qk3: { name: "Quân khu 3", pMul: 0.22, rMul: 0.24 },
    qk5: { name: "Quân khu 5", pMul: 0.15, rMul: 0.14 },
    qk7: { name: "Quân khu 7", pMul: 0.2, rMul: 0.22 },
    qk9: { name: "Quân khu 9", pMul: 0.1, rMul: 0.09 },
    tttm: { name: "Bộ TL TTTM", pMul: 0.15, rMul: 0.15 },
  };

  const baseRevenue: Record<string, number> = { "2024": 128500, "2023": 86400, "2022": 52800 };
  const totalRev = applyMultiplier(baseRevenue[base === yearData["2024"] ? "2024" : base === yearData["2023"] ? "2023" : "2022"] || 35000, qMul);

  let customerProducts: { name: string; products: number }[];
  let customerRevenue: { name: string; revenue: number }[];

  if (cMul === 1) {
    customerProducts = Object.values(customerBaseProducts).map((c) => ({
      name: c.name,
      products: applyMultiplier(product.total, c.pMul),
    }));
    customerRevenue = Object.values(customerBaseProducts).map((c) => ({
      name: c.name,
      revenue: applyMultiplier(totalRev, c.rMul),
    }));
  } else {
    // Single customer selected
    const sel = Object.entries(customerBaseProducts).find(([k]) => k === filters.customer);
    const label = sel ? sel[1].name : "Khách hàng";
    customerProducts = [{ name: label, products: product.total }];
    customerRevenue = [{ name: label, revenue: totalRev }];
  }

  // Monthly trend data
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const trendBase: Record<string, number[][]> = {
    "2024": [
      [35, 78, 125, 198, 285, 398, 520, 665, 812, 968, 1120, 1248],   // sanXuat
      [8, 18, 32, 48, 65, 85, 102, 118, 128, 135, 140, 142],          // hopDong
      [6, 15, 28, 42, 58, 72, 85, 96, 105, 112, 116, 118],            // banGiao
      [4, 10, 20, 32, 45, 58, 68, 78, 86, 92, 95, 96],                // huanLuyen
    ],
    "2023": [
      [28, 72, 135, 215, 320, 445, 558, 665, 752, 825, 868, 892],
      [10, 24, 42, 58, 72, 88, 98, 108, 118, 124, 127, 128],
      [8, 20, 35, 48, 62, 75, 85, 92, 98, 102, 104, 105],
      [5, 12, 22, 32, 42, 52, 60, 66, 72, 75, 77, 78],
    ],
    "2022": [
      [22, 58, 108, 168, 245, 328, 405, 478, 535, 585, 625, 645],
      [8, 18, 30, 42, 55, 68, 78, 86, 92, 96, 97, 98],
      [6, 14, 25, 36, 48, 58, 68, 75, 80, 83, 84, 85],
      [4, 9, 16, 24, 32, 40, 48, 54, 58, 61, 62, 62],
    ],
  };
  const yearKey = base === yearData["2024"] ? "2024" : base === yearData["2023"] ? "2023" : "2022";
  const tb = trendBase[yearKey] || trendBase["2024"];

  // Filter months by quarter
  let monthIndices = months.map((_, i) => i);
  if (filters.quarter === "q1") monthIndices = [0, 1, 2];
  else if (filters.quarter === "q2") monthIndices = [3, 4, 5];
  else if (filters.quarter === "q3") monthIndices = [6, 7, 8];
  else if (filters.quarter === "q4") monthIndices = [9, 10, 11];

  const trend = monthIndices.map((i) => ({
    month: months[i],
    sanXuat: applyMultiplier(tb[0][i], cMul),
    hopDong: applyMultiplier(tb[1][i], cMul),
    banGiao: applyMultiplier(tb[2][i], cMul),
    huanLuyen: applyMultiplier(tb[3][i], cMul),
  }));

  return {
    stats: {
      totalProducts: product.total,
      activeContracts: contract.active,
      pendingComplaints: complaint.processing,
      completedThisMonth: s(base.stats.completedThisMonth),
    },
    product,
    contract,
    handover,
    training,
    complaint,
    pakd,
    customerProducts,
    customerRevenue,
    trend,
  };
}

export function getDashboardData(filters: Filters): DashboardData {
  const base = yearData[filters.year] || yearData["2024"];
  const qMul = quarterMultipliers[filters.quarter] || 1;
  const cMul = customerMultipliers[filters.customer] || 1;
  return scaleData(base, qMul, cMul, filters);
}

export type { DashboardData, Filters };
