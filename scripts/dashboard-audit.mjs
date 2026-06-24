/**
 * Kiểm tra dashboard: API summary vs list, bộ lọc, tab UC-DASH.
 * Chạy: node scripts/dashboard-audit.mjs
 */
import { appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";
const LOG_PATH = resolve(__dirname, "..", "debug-5e2296.log");

function log(entry) {
  appendFileSync(LOG_PATH, JSON.stringify({ sessionId: "5e2296", timestamp: Date.now(), runId: "dashboard-audit", ...entry }) + "\n");
}

async function api(method, path, { token, query, body } = {}) {
  const url = new URL(`${BASE}${path}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function login() {
  const res = await api("POST", "/auth/login", { body: { email: "admin@demo.local", password: "Password123!" } });
  if (res.status !== 200) throw new Error("Login failed");
  return res.json.data.token;
}

function listItems(json) {
  const d = json?.data;
  if (Array.isArray(d)) return d;
  if (d?.items) return d.items;
  return [];
}

function inYear2026(iso) {
  if (!iso) return false;
  const y = new Date(iso).getFullYear();
  return y === 2026;
}

const issues = [];

function issue(id, msg, data) {
  issues.push({ id, msg, data });
  log({ hypothesisId: id, message: msg, data, location: "dashboard-audit.mjs" });
}

async function main() {
  const token = await login();
  log({ hypothesisId: "H0", message: "login ok", data: {} });

  const [summaryRes, reportsRes, badgesRes, contractsRes, handoversRes, trainingsRes, productsRes, warrantiesRes, materialsRes, customersRes] =
    await Promise.all([
      api("GET", "/reports/dashboard-summary", { token, query: { year: "2026" } }),
      api("GET", "/reports", { token, query: { year: "2026" } }),
      api("GET", "/reports/badges", { token }),
      api("GET", "/contracts", { token }),
      api("GET", "/handovers", { token }),
      api("GET", "/training-courses", { token }),
      api("GET", "/products", { token }),
      api("GET", "/warranties", { token }),
      api("GET", "/materials", { token }),
      api("GET", "/customers", { token }),
    ]);

  const endpoints = [
    ["dashboard-summary", summaryRes],
    ["reports", reportsRes],
    ["badges", badgesRes],
    ["contracts", contractsRes],
    ["handovers", handoversRes],
    ["training-courses", trainingsRes],
    ["products", productsRes],
    ["warranties", warrantiesRes],
    ["materials", materialsRes],
    ["customers", customersRes],
  ];

  for (const [name, res] of endpoints) {
    if (res.status !== 200 || !res.json?.success) {
      issue("H1", `API ${name} fail`, { status: res.status, message: res.json?.message });
    }
  }

  const summary = summaryRes.json?.data;
  const reports = reportsRes.json?.data;
  const contracts = listItems(contractsRes.json);
  const handovers = listItems(handoversRes.json);
  const trainings = listItems(trainingsRes.json);
  const products = listItems(productsRes.json);
  const warranties = listItems(warrantiesRes.json);

  log({
    hypothesisId: "H2",
    message: "raw counts",
    data: {
      summaryContracts: summary?.contractProgress?.total,
      summaryHandovers: summary?.handoverProgress?.total,
      summaryTrainings: summary?.trainingProgress?.totalBatches,
      summaryWarranties: summary?.complaintProgress?.total,
      summaryProducts: summary?.productProgress,
      listContracts: contracts.length,
      listHandovers: handovers.length,
      listTrainings: trainings.length,
      listWarranties: warranties.length,
      listProducts: products.length,
      reportsContracts: reports?.contracts?.total,
      trendMonths: reports?.trends?.monthly?.length,
    },
  });

  // H3: summary filtered by year vs client-filtered list (mirrors useDashboardData)
  function clientFilter(items, { dateField, customerField }, filters) {
    const range = (() => {
      if (filters.from || filters.to) {
        const start = filters.from ? new Date(filters.from + "T00:00:00.000Z") : new Date("1970-01-01T00:00:00.000Z");
        const end = filters.to ? new Date(filters.to + "T23:59:59.999Z") : new Date();
        return { start, end };
      }
      if (!filters.year) return null;
      const y = Number(filters.year);
      return { start: new Date(`${y}-01-01T00:00:00.000Z`), end: new Date(`${y}-12-31T23:59:59.999Z`) };
    })();
    return items.filter((row) => {
      const iso = row[dateField];
      if (range) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime()) || d < range.start || d > range.end) return false;
      }
      if (filters.customerId) {
        const cid = typeof customerField === "function" ? customerField(row) : row[customerField];
        if (cid !== filters.customerId) return false;
      }
      return true;
    });
  }

  const filters2026 = { year: "2026" };
  const contractsFiltered = clientFilter(contracts, {
    dateField: "startDate",
    customerField: (c) => c.customer?.id ?? c.customerId ?? null,
  }, filters2026);
  const handoversFiltered = clientFilter(handovers, { dateField: "startDate", customerField: "customerId" }, filters2026);
  const trainingsFiltered = clientFilter(trainings, {
    dateField: "startDate",
    customerField: (t) => t.customer?.id ?? t.customerId ?? null,
  }, filters2026);
  const warrantiesFiltered = clientFilter(warranties, {
    dateField: "createdAt",
    customerField: (w) => w.customer?.id ?? null,
  }, filters2026);

  if (summary?.contractProgress?.total !== contractsFiltered.length) {
    issue("H3", "Summary contract count ≠ client-filtered list 2026", {
      summary: summary?.contractProgress?.total,
      listFiltered: contractsFiltered.length,
      listAll: contracts.length,
    });
  }
  if (summary?.handoverProgress?.total !== handoversFiltered.length) {
    issue("H3", "Summary handover count ≠ client-filtered list 2026", {
      summary: summary?.handoverProgress?.total,
      listFiltered: handoversFiltered.length,
      listAll: handovers.length,
    });
  }
  if (summary?.trainingProgress?.totalBatches !== trainingsFiltered.length) {
    issue("H3", "Summary training count ≠ client-filtered list 2026", {
      summary: summary?.trainingProgress?.totalBatches,
      listFiltered: trainingsFiltered.length,
      listAll: trainings.length,
    });
  }
  if (summary?.complaintProgress?.total !== warrantiesFiltered.length) {
    issue("H3", "Summary warranty count ≠ client-filtered list 2026", {
      summary: summary?.complaintProgress?.total,
      listFiltered: warrantiesFiltered.length,
      listAll: warranties.length,
    });
  }

  log({
    hypothesisId: "H3-fix",
    message: "client-filtered list counts",
    data: {
      contractsFiltered: contractsFiltered.length,
      handoversFiltered: handoversFiltered.length,
      trainingsFiltered: trainingsFiltered.length,
      warrantiesFiltered: warrantiesFiltered.length,
    },
  });

  // legacy raw year filter check removed — replaced by clientFilter above
  const contracts2026 = contractsFiltered;
  const handovers2026 = handoversFiltered;
  const trainings2026 = trainingsFiltered;
  const warranties2026 = warrantiesFiltered;

  // skip duplicate H3 blocks below by replacing old checks - need to remove old H3 code

  // H4: reports total vs summary
  if (reports?.contracts?.total !== summary?.contractProgress?.total) {
    issue("H4", "reports.contracts.total ≠ dashboard-summary contractProgress.total", {
      reports: reports?.contracts?.total,
      summary: summary?.contractProgress?.total,
    });
  }

  // H5: product progress sum consistency
  const pp = summary?.productProgress;
  if (pp) {
    const productTotal =
      (pp.quantity?.producing ?? 0) +
      (pp.quantity?.produced ?? 0) +
      (pp.inspection?.submitted ?? 0) +
      (pp.inspection?.inspecting ?? 0) +
      (pp.inspection?.passed ?? 0) +
      (pp.decisionApproved ?? 0) +
      (pp.equipped ?? 0) +
      (pp.equipDecided ?? 0);
    if (productTotal !== products.length) {
      issue("H5", "Product progress sum ≠ product list count (products not date-filtered)", {
        productTotal,
        listProducts: products.length,
      });
    }
  }

  // H6: customer filter
  const firstCustomer = listItems(customersRes.json)[0];
  if (firstCustomer?.id) {
    const filtered = await api("GET", "/reports/dashboard-summary", {
      token,
      query: { year: "2026", customerId: firstCustomer.id },
    });
    const ft = filtered.json?.data?.contractProgress?.total;
    const custContracts = contracts2026.filter((c) => c.customer?.id === firstCustomer.id || c.customerId === firstCustomer.id);
    if (ft !== custContracts.length) {
      issue("H6", "Customer filter mismatch", {
        customerId: firstCustomer.id,
        summaryFiltered: ft,
        listFiltered: custContracts.length,
      });
    } else {
      log({ hypothesisId: "H6", message: "customer filter ok", data: { customerId: firstCustomer.id, count: ft } });
    }
  }

  // H7: quarter filter Q1
  const q1 = await api("GET", "/reports/dashboard-summary", { token, query: { year: "2026", from: "2026-01-01", to: "2026-03-31" } });
  const q1Contracts = contracts.filter((c) => {
    const d = new Date(c.startDate);
    return d >= new Date("2026-01-01") && d <= new Date("2026-03-31T23:59:59");
  });
  if (q1.json?.data?.contractProgress?.total !== q1Contracts.length) {
    issue("H7", "Q1 filter mismatch", {
      summary: q1.json?.data?.contractProgress?.total,
      listFiltered: q1Contracts.length,
    });
  }

  // H8: feedback progress present
  if (!summary?.feedbackProgress || typeof summary.feedbackProgress.total !== "number") {
    issue("H8", "feedbackProgress missing from dashboard-summary", {});
  }

  // H9: pakd structure
  if (!summary?.pakd?.materials?.items || !summary?.pakd?.research) {
    issue("H9", "pakd structure incomplete", { pakd: summary?.pakd });
  }

  // H10: badges
  const badges = badgesRes.json?.data;
  if (!badges || typeof badges.overdueContracts !== "number") {
    issue("H10", "badges API incomplete", { badges });
  }

  const result = {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    snapshot: {
      year: 2026,
      contractProgress: summary?.contractProgress,
      handoverProgress: summary?.handoverProgress,
      trainingProgress: summary?.trainingProgress,
      complaintProgress: summary?.complaintProgress,
      feedbackProgress: summary?.feedbackProgress,
      customerCare: { totalCustomers: summary?.customerCare?.totalCustomers, breakdown: summary?.customerCare?.customerBreakdown?.length },
      pakd: { materials: summary?.pakd?.materials?.total, research: summary?.pakd?.research?.total },
      badges,
      trendMonths: reports?.trends?.monthly?.length ?? 0,
      listVsSummary: {
        contracts: { summary: summary?.contractProgress?.total, listAll: contracts.length, list2026: contracts2026.length },
        handovers: { summary: summary?.handoverProgress?.total, listAll: handovers.length, list2026: handovers2026.length },
        trainings: { summary: summary?.trainingProgress?.totalBatches, listAll: trainings.length, list2026: trainings2026.length },
        warranties: { summary: summary?.complaintProgress?.total, listAll: warranties.length, list2026: warranties2026.length },
        products: { progressSum: pp ? "see H5" : null, listAll: products.length },
      },
    },
  };

  console.log(JSON.stringify(result, null, 2));
  log({ hypothesisId: "RESULT", message: "audit complete", data: { ok: result.ok, issueCount: issues.length } });
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  log({ hypothesisId: "ERR", message: String(e), data: {} });
  process.exit(2);
});
