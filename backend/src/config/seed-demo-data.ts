import { ContractStatus, Prisma, TaskPriority, TaskStatus, TaskType } from "@prisma/client";

import { prisma } from "../utils/prisma";

/** Ngày cố định UTC trưa để tránh lệch TZ */
function utc(y: number, m: number, day: number) {
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

const money = (v: string | number) => new Prisma.Decimal(v);

export async function seedDemoBusinessData() {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@demo.local", deletedAt: null },
  });
  const manager = await prisma.user.findFirst({
    where: { email: "manager@demo.local", deletedAt: null },
  });
  const technician = await prisma.user.findFirst({
    where: { email: "technician@demo.local", deletedAt: null },
  });
  const sales = await prisma.user.findFirst({
    where: { email: "sales@demo.local", deletedAt: null },
  });

  if (!admin || !manager) {
    throw new Error("Chạy trước: npm run bootstrap:auth (thiếu admin@demo.local hoặc manager@demo.local).");
  }

  const techId = technician?.id ?? manager.id;
  const salesId = sales?.id ?? manager.id;
  const crmActorTech = technician?.id ?? manager.id;

  // ── Khách hàng ─────────────────────────────────────────────
  const customerSpecs = [
    {
      code: "QK-01",
      name: "Bộ Tư lệnh Quân khu 1",
      contactName: "Thượng tá Nguyễn Văn An",
      phone: "024.3855.7123",
      email: "vp.qk1@military.demo",
      address: "Phố Hoàng Diệu, Ba Đình, Hà Nội",
    },
    {
      code: "QK-03",
      name: "Bộ Tư lệnh Quân khu 3",
      contactName: "Trung tá Phạm Minh Tuấn",
      phone: "0236.3822.441",
      email: "lienlac.qk3@military.demo",
      address: "Đường Nguyễn Văn Linh, TP Đà Nẵng",
    },
    {
      code: "QK-05",
      name: "Bộ Tư lệnh Quân khu 5",
      contactName: "Đại tá Lê Hoàng Nam",
      phone: "0274.3874.090",
      email: "qk5.admin@military.demo",
      address: "TP Pleiku, Gia Lai",
    },
    {
      code: "QK-07",
      name: "Bộ Tư lệnh Quân khu 7",
      contactName: "Thượng tá Trần Đức Hải",
      phone: "028.3829.4411",
      email: "qk7.kythuat@military.demo",
      address: "TP Hồ Chí Minh",
    },
    {
      code: "QK-09",
      name: "Bộ Tư lệnh Quân khu 9",
      contactName: "Trung tá Võ Quốc Thắng",
      phone: "0293.3924.818",
      email: "qk9.hcdt@military.demo",
      address: "TP Cần Thơ",
    },
    {
      code: "BTL-ZZZ",
      name: "Bộ Tư lệnh Thông tin — Tác chiến điện tử",
      contactName: "Đại tá Hoàng Tuấn Kiệt",
      phone: "024.3934.5522",
      email: "btc.btlzzz@military.demo",
      address: "Hà Nội",
    },
    {
      code: "PK-KHQS",
      name: "Học viện Kỹ thuật Quân sự",
      contactName: "PGS.TS Mai Thu Hương",
      phone: "024.3852.0194",
      email: "phongdaotao.hvktqs@military.demo",
      address: "Xuân Thủy, Cầu Giấy, Hà Nội",
    },
  ] as const;

  const customers: { id: string; code: string }[] = [];
  for (const c of customerSpecs) {
    const row = await prisma.customer.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        contactName: c.contactName,
        phone: c.phone,
        email: c.email,
        address: c.address,
      },
      create: {
        code: c.code,
        name: c.name,
        contactName: c.contactName,
        phone: c.phone,
        email: c.email,
        address: c.address,
      },
    });
    customers.push({ id: row.id, code: row.code });
  }

  const cid = (code: string) => {
    const found = customers.find((x) => x.code === code);
    if (!found) throw new Error(`Customer not found: ${code}`);
    return found.id;
  };
  const customerIds = customers.map((c) => c.id);

  await prisma.contact.deleteMany({ where: { customerId: { in: customerIds } } });

  const contactRows: Prisma.ContactCreateManyInput[] = [
    { customerId: cid("QK-01"), fullName: "Thượng tá Nguyễn Văn An", title: "Phó TP Kỹ thuật", phone: "0912345001", email: "nv.an@qk1.demo", isPrimary: true },
    { customerId: cid("QK-01"), fullName: "Đại úy Phạm Khánh Ly", title: "Trợ lý kế hoạch", phone: "0912345002", email: "pk.ly@qk1.demo", isPrimary: false },
    { customerId: cid("QK-03"), fullName: "Trung tá Phạm Minh Tuấn", title: "Trưởng phòng TT-TT", phone: "0912345003", email: "pm.tuan@qk3.demo", isPrimary: true },
    { customerId: cid("QK-05"), fullName: "Đại tá Lê Hoàng Nam", title: "Phó cục Kỹ thuất", phone: "0912345004", email: "lh.nam@qk5.demo", isPrimary: true },
    { customerId: cid("QK-07"), fullName: "Thượng tá Trần Đức Hải", title: "TP Nghiệm thu", phone: "0912345005", email: "td.hai@qk7.demo", isPrimary: true },
    { customerId: cid("QK-09"), fullName: "Trung tá Võ Quốc Thắng", title: "Quản lý dự án", phone: "0912345006", email: "vq.thang@qk9.demo", isPrimary: true },
    { customerId: cid("BTL-ZZZ"), fullName: "Đại tá Hoàng Tuấn Kiệt", title: "Cục trưởng", phone: "0912345007", email: "ht.kiet@btl.demo", isPrimary: true },
    { customerId: cid("PK-KHQS"), fullName: "PGS.TS Mai Thu Hương", title: "Trưởng khoa Viễn thông", phone: "0912345008", email: "mt.huong@hv.demo", isPrimary: true },
  ];
  await prisma.contact.createMany({ data: contactRows });

  await prisma.crmActivity.deleteMany({ where: { customerId: { in: customerIds } } });

  const crmSeed: Array<{
    cust: string;
    type: "call" | "email" | "meeting" | "note";
    title: string;
    status: "scheduled" | "done";
    activityAt: Date;
    createdById: string | null;
  }> = [
    { cust: "QK-01", type: "meeting", title: "Họp đánh giá tiến độ triển khai TB TT-TT QK1", status: "done", activityAt: utc(2026, 2, 5), createdById: manager.id },
    { cust: "QK-03", type: "call", title: "Trao đổi phụ lục điều chỉnh khối lượng linh kiện", status: "done", activityAt: utc(2026, 2, 10), createdById: salesId },
    { cust: "QK-07", type: "email", title: "Gửi báo cáo nghiệm thu đợt 1 — phần phần mềm SOC", status: "done", activityAt: utc(2026, 2, 14), createdById: manager.id },
    { cust: "BTL-ZZZ", type: "meeting", title: "Workshop kiến trúc liên thông chỉ huy — kịch bản 2026", status: "scheduled", activityAt: utc(2026, 4, 2), createdById: admin.id },
    { cust: "QK-05", type: "note", title: "Ghi nhận yêu cầu mở rộng cổng VPN đơn vị cơ sở", status: "done", activityAt: utc(2026, 1, 28), createdById: crmActorTech },
    { cust: "QK-09", type: "call", title: "Thống nhất lịch huấn luyện vận hành trạm VSAT QK9", status: "done", activityAt: utc(2026, 3, 1), createdById: salesId },
    { cust: "PK-KHQS", type: "email", title: "Đề xuất thử nghiệm firmware máy thu FM-DSP phiên bản 2.4", status: "done", activityAt: utc(2026, 3, 8), createdById: manager.id },
    { cust: "QK-01", type: "call", title: "Kiểm tra SLA xử lý ticket bảo hành cụm RF", status: "scheduled", activityAt: utc(2026, 4, 10), createdById: techId },
    { cust: "QK-03", type: "meeting", title: "Đánh giá ATTT sau pentest đợt Tết", status: "done", activityAt: utc(2026, 2, 22), createdById: manager.id },
    { cust: "QK-07", type: "note", title: "Chốt danh mục vật tư dự phòng cho đài chỉ huy lưu động", status: "done", activityAt: utc(2026, 3, 15), createdById: techId },
    { cust: "QK-05", type: "email", title: "Chứng thực chứng chỉ huấn luyện cho CBM đơn vị mới", status: "done", activityAt: utc(2026, 3, 20), createdById: salesId },
    { cust: "BTL-ZZZ", type: "call", title: "Phối hợp kiểm tra tích hợp cổng API báo cáo chiến dịch", status: "done", activityAt: utc(2026, 3, 25), createdById: manager.id },
  ];

  await prisma.crmActivity.createMany({
    data: crmSeed.map((r) => ({
      customerId: cid(r.cust),
      type: r.type,
      title: r.title,
      status: r.status,
      activityAt: r.activityAt,
      createdById: r.createdById,
    })),
  });

  // ── Vật tư ───────────────────────────────────────────────────
  const materialSpecs = [
    { code: "VT-HDD-SSD-001", name: "Ổ cứng SSD NVMe 512GB — định danh", type: "identified" as const, serial: "SSD-QP26-A741", quantity: 120, available: 84, unit: "cái", warehouse: "Kho chính", description: "Dự phòng cụm chỉ huy di động" },
    { code: "VT-RAM-DDR5", name: "RAM DDR5 ECC 32GB", type: "consumable" as const, serial: null, quantity: 240, available: 156, unit: "cái", warehouse: "Kho chính", description: "Tiêu hao cho máy chủ SOC" },
    { code: "VT-CBL-RF58", name: "Cáp đồng trục RF LMR-400", type: "consumable" as const, serial: null, quantity: 3200, available: 2150, unit: "mét", warehouse: "Kho phụ", description: "Lắp đặt anten đài vô tuyến" },
    { code: "VT-FIL-KU-BPF", name: "Bộ lọc dải Ku-band — định danh", type: "identified" as const, serial: "BPF-KU-90821", quantity: 36, available: 22, unit: "bộ", warehouse: "Kho chính", description: "Trạm VSAT chiến trường" },
    { code: "VT-UPS-6KVA", name: "UPS online 6kVA rack 19\"", type: "identified" as const, serial: "UPS-6K-77341", quantity: 48, available: 31, unit: "bộ", warehouse: "Kho chính", description: "Nguồn dự phòng TB TT-TT" },
    { code: "VT-LNB-KU", name: "LNB Ku-band PLL — tiêu hao", type: "consumable" as const, serial: null, quantity: 180, available: 92, unit: "cái", warehouse: "Kho phụ", description: "Thay thế định kỳ VSAT" },
    { code: "VT-FW-HUB-R2", name: "Card cổng WAN Gigabit — định danh", type: "identified" as const, serial: "WAN-G16-99201", quantity: 90, available: 54, unit: "cái", warehouse: "Kho chính", description: "Router biên mạng đơn vị" },
    { code: "VT-PWR-DC48", name: "Nguồn DC 48V/60A rack", type: "consumable" as const, serial: null, quantity: 65, available: 38, unit: "bộ", warehouse: "Kho phụ", description: "Chuyển đổi nguồn trạm gốc" },
    { code: "VT-KVM-LCD17", name: "Tủ KVM LCD 17\" 16 cổng", type: "identified" as const, serial: "KVM-LCD-55602", quantity: 28, available: 14, unit: "bộ", warehouse: "Kho chính", description: "Phòng điều khiển" },
    { code: "VT-ACC-HAZ", name: "Kit phụ kiện chống ẩm — tiêu hao", type: "consumable" as const, serial: null, quantity: 400, available: 275, unit: "bộ", warehouse: "Kho phụ", description: "Đóng gói vận chuyển miền Trung" },
  ];

  const materials: { id: string; code: string }[] = [];
  for (const m of materialSpecs) {
    const row = await prisma.material.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        type: m.type,
        serial: m.serial,
        quantity: m.quantity,
        available: m.available,
        unit: m.unit,
        warehouse: m.warehouse,
        description: m.description,
      },
      create: {
        code: m.code,
        name: m.name,
        type: m.type,
        serial: m.serial,
        quantity: m.quantity,
        available: m.available,
        unit: m.unit,
        warehouse: m.warehouse,
        description: m.description,
      },
    });
    materials.push({ id: row.id, code: row.code });
  }

  const mid = (code: string) => {
    const found = materials.find((x) => x.code === code);
    if (!found) throw new Error(`Material not found: ${code}`);
    return found.id;
  };

  // ── Sản phẩm (+ liên kết vật tư mẫu) ──────────────────────────
  const productSpecs = [
    { code: "VTĐ-RF300/QP", name: "Máy thu phát vô tuyến cố định R-300QP", category: "Vô tuyến", status: "producing" as const, manufacturer: "Nhà máy Z181", unit: "bộ", yearReleased: 2025, totalProduced: 148, cust: "QK-01" as string | undefined },
    { code: "MK-CYPHER-X2", name: "Thiết bị mã hóa đầu cuối — Chế độ X2", category: "Mã hóa", status: "equipped" as const, manufacturer: "Viện Hóa học QP", unit: "bộ", yearReleased: 2024, totalProduced: 62, cust: "BTL-ZZZ" },
    { code: "TS-ELINT-M7", name: "Thiết bị trinh sát điện tử hàng không M7", category: "Trinh sát", status: "developing" as const, manufacturer: "Tổng cục CNQP", unit: "bộ", yearReleased: 2026, totalProduced: 12, cust: "QK-07" },
    { code: "RD-GCI-450", name: "Đài radar giám sát GCI tần UHF", category: "Ra đa", status: "producing" as const, manufacturer: "Nhà máy A32", unit: "hệ", yearReleased: 2025, totalProduced: 24, cust: "QK-03" },
    { code: "CH-SOC-T800", name: "Phần cứng chỉ huy SOC độ tin cậy cao", category: "Chỉ huy", status: "producing" as const, manufacturer: "Tập đoàn Viettel QP", unit: "rack", yearReleased: 2026, totalProduced: 36, cust: "QK-05" },
    { code: "VS-MOB-KIT", name: "Bộ VSAT di động Khối Ku — đơn vị lữ hành", category: "Vệ tinh", status: "equipped" as const, manufacturer: "VNPT QP", unit: "bộ", yearReleased: 2025, totalProduced: 88, cust: "QK-09" },
    { code: "REL-RPT-LITE", name: "Đài chuyển tiếp sóng ngắn Lite-R40", category: "Chuyển tiếp", status: "stopped" as const, manufacturer: "Nhà máy Z117", unit: "bộ", yearReleased: 2019, totalProduced: 410, cust: "PK-KHQS" },
    { code: "FO-BK-1200", name: "Thiết bị truyền dẫn quang 1.2T — dải đơn", category: "Truyền dẫn", status: "developing" as const, manufacturer: "FPT QP Lab", unit: "bộ", yearReleased: 2026, totalProduced: 4, cust: undefined },
  ];

  const materialCodesForProduct = (category: string) =>
    category === "Vô tuyến"
      ? ["VT-CBL-RF58", "VT-RAM-DDR5", "VT-HDD-SSD-001"]
      : category === "Vệ tinh"
        ? ["VT-FIL-KU-BPF", "VT-LNB-KU", "VT-UPS-6KVA"]
        : ["VT-FW-HUB-R2", "VT-RAM-DDR5", "VT-PWR-DC48"];

  for (const p of productSpecs) {
    const mcodes = materialCodesForProduct(p.category);
    const matSet = { set: mcodes.map((c) => ({ id: mid(c) })) };
    const matConnect = { connect: mcodes.map((c) => ({ id: mid(c) })) };
    await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        category: p.category,
        description: `Sản phẩm đặt hàng đặc thù — ${p.category}.`,
        status: p.status,
        version: "v2.1",
        manufacturer: p.manufacturer,
        unit: p.unit,
        yearReleased: p.yearReleased,
        totalProduced: p.totalProduced,
        customerId: p.cust ? cid(p.cust) : null,
        materials: matSet,
      },
      create: {
        code: p.code,
        name: p.name,
        category: p.category,
        description: `Sản phẩm đặt hàng đặc thù — ${p.category}.`,
        status: p.status,
        version: "v2.1",
        manufacturer: p.manufacturer,
        unit: p.unit,
        yearReleased: p.yearReleased,
        totalProduced: p.totalProduced,
        customerId: p.cust ? cid(p.cust) : null,
        materials: matConnect,
      },
    });
  }

  const prodVTD = await prisma.product.findUnique({ where: { code: "VTĐ-RF300/QP" } });
  const prodVSAT = await prisma.product.findUnique({ where: { code: "VS-MOB-KIT" } });

  // ── Hợp đồng ─────────────────────────────────────────────────
  type Cs = {
    code: string;
    cust: string;
    title: string;
    value: Prisma.Decimal;
    products: number;
    start: Date;
    end: Date;
    warrantyEnd?: Date;
    status: ContractStatus;
    progress: number;
  };

  const contractSpecs: Cs[] = [
    { code: "HD-2026-014", cust: "QK-01", title: "Cung cấp lô máy thu phát R-300QP và huấn luyện vận hành", value: money("28500000000"), products: 42, start: utc(2026, 1, 10), end: utc(2026, 11, 30), warrantyEnd: utc(2028, 11, 30), status: "active", progress: 62 },
    { code: "HD-2026-022", cust: "QK-03", title: "Nâng cấp đài radar GCI — miền Trung", value: money("45200000000"), products: 8, start: utc(2026, 2, 1), end: utc(2027, 3, 31), warrantyEnd: utc(2029, 3, 31), status: "active", progress: 38 },
    { code: "HD-2026-031", cust: "QK-07", title: "Triển khai SOC chỉ huy — Giai đoạn 2", value: money("67800000000"), products: 12, start: utc(2026, 2, 18), end: utc(2027, 8, 15), warrantyEnd: utc(2029, 8, 15), status: "late", progress: 41 },
    { code: "HD-2026-008", cust: "QK-05", title: "Mở rộng backbone quang đơn vị cơ sở QK5", value: money("19200000000"), products: 96, start: utc(2026, 1, 5), end: utc(2026, 9, 30), warrantyEnd: utc(2028, 9, 30), status: "active", progress: 74 },
    { code: "HD-2026-045", cust: "QK-09", title: "VSAT di động Khối Ku — đợt 2 QK9", value: money("22600000000"), products: 28, start: utc(2026, 3, 3), end: utc(2026, 12, 15), warrantyEnd: utc(2028, 12, 15), status: "active", progress: 55 },
    { code: "HD-2026-051", cust: "BTL-ZZZ", title: "Liên thông cổng chỉ huy điện tử — ATTT", value: money("89100000000"), products: 6, start: utc(2026, 3, 12), end: utc(2028, 1, 31), warrantyEnd: utc(2030, 1, 31), status: "draft", progress: 12 },
    { code: "HD-2025-118", cust: "QK-01", title: "Bảo trì định kỳ cụm máy chủ và KVM — QK1", value: money("4200000000"), products: 0, start: utc(2025, 10, 1), end: utc(2026, 9, 30), warrantyEnd: utc(2027, 9, 30), status: "completed", progress: 100 },
    { code: "HD-2025-096", cust: "PK-KHQS", title: "Thử nghiệm firmware DSP — máy thu FM", value: money("3100000000"), products: 0, start: utc(2025, 8, 15), end: utc(2026, 6, 30), warrantyEnd: utc(2027, 6, 30), status: "active", progress: 67 },
    { code: "HD-2026-019", cust: "QK-03", title: "Sửa chữa cụm UPS và nguồn DC đơn vị TT-TT", value: money("5800000000"), products: 14, start: utc(2026, 2, 25), end: utc(2026, 7, 31), warrantyEnd: utc(2028, 7, 31), status: "active", progress: 48 },
    { code: "HD-2026-027", cust: "QK-07", title: "Quét ATTT và khắc phục phát hiện pentest Q4", value: money("9500000000"), products: 0, start: utc(2026, 3, 8), end: utc(2026, 5, 30), warrantyEnd: utc(2027, 5, 30), status: "completed", progress: 100 },
    { code: "HD-2026-033", cust: "BTL-ZZZ", title: "Mã hóa đầu cuối — đợt bổ sung đơn vị mới", value: money("41200000000"), products: 24, start: utc(2026, 3, 20), end: utc(2027, 6, 30), warrantyEnd: utc(2029, 6, 30), status: "active", progress: 29 },
    { code: "HD-2026-040", cust: "QK-05", title: "Kiểm định TB TT-TT sau triển khai địa bàn Tây Nguyên", value: money("7600000000"), products: 0, start: utc(2026, 4, 1), end: utc(2026, 8, 31), warrantyEnd: utc(2028, 8, 31), status: "liquidated", progress: 100 },
    { code: "HD-2026-055", cust: "PK-KHQS", title: "Đặt hàng đài chuyển tiếp Lite-R40 — phục vụ đào tạo", value: money("11800000000"), products: 35, start: utc(2026, 4, 15), end: utc(2027, 4, 30), warrantyEnd: utc(2029, 4, 30), status: "active", progress: 22 },
    { code: "HD-2026-060", cust: "QK-09", title: "Thuê kênh VSAT thử nghiệm kết nối MQĐ", value: money("4900000000"), products: 0, start: utc(2026, 5, 1), end: utc(2026, 12, 31), warrantyEnd: utc(2028, 12, 31), status: "draft", progress: 8 },
  ];

  const buildTerms = (c: Cs) => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return [
      `1. Phạm vi cung cấp: Cung cấp ${c.products} sản phẩm/dịch vụ cùng lắp đặt, vận hành thử và bàn giao theo tiêu chuẩn kỹ thuật đã thống nhất.`,
      `2. Giá trị & thanh toán: Tổng giá trị hợp đồng ${c.value.toString()} VND. Thanh toán theo 3 đợt: 30% tạm ứng, 60% sau bàn giao, 10% sau nghiệm thu.`,
      `3. Tiến độ thực hiện: Bắt đầu ${fmt(c.start)}, hoàn thành chậm nhất ${fmt(c.end)}. Phạt chậm tiến độ 0,1%/ngày trên giá trị hợp đồng.`,
      `4. Bảo hành & hỗ trợ: Bảo hành đến ${c.warrantyEnd ? fmt(c.warrantyEnd) : "(theo thoả thuận riêng)"}. Hỗ trợ kỹ thuật 24/7 trong thời gian bảo hành.`,
      `5. Điều khoản chấm dứt: Hai bên có quyền chấm dứt nếu bên còn lại vi phạm nghiêm trọng và không khắc phục trong vòng 30 ngày kể từ khi nhận thông báo.`,
    ].join("\n\n");
  };

  const contracts: { id: string; code: string }[] = [];
  for (const c of contractSpecs) {
    const terms = buildTerms(c);
    const row = await prisma.contract.upsert({
      where: { code: c.code },
      update: {
        customerId: cid(c.cust),
        title: c.title,
        value: c.value,
        products: c.products,
        startDate: c.start,
        endDate: c.end,
        warrantyEnd: c.warrantyEnd ?? null,
        status: c.status,
        progress: c.progress,
        terms,
        createdById: admin.id,
      },
      create: {
        code: c.code,
        customerId: cid(c.cust),
        title: c.title,
        value: c.value,
        products: c.products,
        startDate: c.start,
        endDate: c.end,
        warrantyEnd: c.warrantyEnd ?? null,
        status: c.status,
        progress: c.progress,
        terms,
        createdById: admin.id,
      },
    });
    contracts.push({ id: row.id, code: row.code });
  }

  const hd = (code: string) => {
    const found = contracts.find((x) => x.code === code);
    if (!found) throw new Error(`Contract not found: ${code}`);
    return found.id;
  };

  await prisma.product.update({
    where: { code: "VTĐ-RF300/QP" },
    data: { contractId: hd("HD-2026-014"), customerId: cid("QK-01") },
  });
  await prisma.product.update({
    where: { code: "VS-MOB-KIT" },
    data: { contractId: hd("HD-2026-045"), customerId: cid("QK-09") },
  });

  // ── Bàn giao ─────────────────────────────────────────────────
  const handoverSpecs = [
    { code: "BG-2026-011", hdCode: "HD-2026-014", cust: "QK-01", products: 42, step: 4, status: "active" as const, start: utc(2026, 2, 1), due: utc(2026, 10, 15), completed: null as Date | null },
    { code: "BG-2026-018", hdCode: "HD-2026-022", cust: "QK-03", products: 8, step: 3, status: "late" as const, start: utc(2026, 2, 20), due: utc(2026, 3, 30), completed: null },
    { code: "BG-2026-024", hdCode: "HD-2026-008", cust: "QK-05", products: 96, step: 5, status: "completed" as const, start: utc(2026, 1, 12), due: utc(2026, 6, 1), completed: utc(2026, 5, 28) },
    { code: "BG-2026-029", hdCode: "HD-2026-045", cust: "QK-09", products: 28, step: 2, status: "pending" as const, start: utc(2026, 4, 1), due: utc(2026, 11, 20), completed: null },
    { code: "BG-2026-036", hdCode: "HD-2026-031", cust: "QK-07", products: 12, step: 3, status: "active" as const, start: utc(2026, 3, 10), due: utc(2027, 2, 1), completed: null },
    { code: "BG-2026-042", hdCode: "HD-2026-055", cust: "PK-KHQS", products: 35, step: 1, status: "pending" as const, start: utc(2026, 5, 5), due: utc(2027, 3, 15), completed: null },
    { code: "BG-2025-087", hdCode: "HD-2025-118", cust: "QK-01", products: 0, step: 5, status: "completed" as const, start: utc(2025, 11, 1), due: utc(2026, 3, 31), completed: utc(2026, 3, 15) },
    { code: "BG-2026-048", hdCode: "HD-2026-033", cust: "BTL-ZZZ", products: 24, step: 2, status: "active" as const, start: utc(2026, 4, 10), due: utc(2027, 1, 15), completed: null },
  ];

  for (const h of handoverSpecs) {
    await prisma.handover.upsert({
      where: { code: h.code },
      update: {
        contractId: hd(h.hdCode),
        customerId: cid(h.cust),
        products: h.products,
        currentStep: h.step,
        status: h.status,
        startDate: h.start,
        dueDate: h.due,
        completedAt: h.completed,
        createdById: manager.id,
      },
      create: {
        code: h.code,
        contractId: hd(h.hdCode),
        customerId: cid(h.cust),
        products: h.products,
        currentStep: h.step,
        status: h.status,
        startDate: h.start,
        dueDate: h.due,
        completedAt: h.completed,
        createdById: manager.id,
      },
    });
  }

  // ── Bảo hành ─────────────────────────────────────────────────
  const warrantySpecs = [
    { code: "BH-2026-101", hdCode: "HD-2026-014", cust: "QK-01", prodId: prodVTD?.id, issue: "Nhiễu sóng phụ anten cố định — đơn vị cơ sở A", type: "warranty" as const, priority: "high" as const, status: "processing" as const, step: 2 },
    { code: "BH-2026-102", hdCode: "HD-2026-045", cust: "QK-09", prodId: prodVSAT?.id, issue: "Mất khóa PLL — VSAT di động lữ hành QK9", type: "repair" as const, priority: "urgent" as const, status: "open" as const, step: 1 },
    { code: "BH-2026-103", hdCode: "HD-2026-019", cust: "QK-03", prodId: null, issue: "Cụm UPS báo lỗi bypass — không chuyển nguồn DC48", type: "maintenance" as const, priority: "medium" as const, status: "processing" as const, step: 3 },
    { code: "BH-2026-104", hdCode: null, cust: "QK-07", prodId: null, issue: "Yêu cầu kiểm tra phần mềm SOC sau nâng cấp patch ATTT", type: "warranty" as const, priority: "low" as const, status: "open" as const, step: 1 },
    { code: "BH-2026-105", hdCode: "HD-2026-022", cust: "QK-03", prodId: null, issue: "Hiệu chỉnh lại ngưỡng phát hiện — radar GCI", type: "warranty" as const, priority: "medium" as const, status: "completed" as const, step: 5 },
    { code: "BH-2026-106", hdCode: "HD-2026-031", cust: "QK-07", prodId: null, issue: "Thay module WAN-G16 sau sự cố sét đánh gần trạm", type: "repair" as const, priority: "high" as const, status: "processing" as const, step: 2 },
    { code: "BH-2026-107", hdCode: "HD-2026-051", cust: "BTL-ZZZ", prodId: null, issue: "Ticket tích hợp API báo cáo — timeout khi tải lớn", type: "warranty" as const, priority: "high" as const, status: "open" as const, step: 1 },
    { code: "BH-2026-108", hdCode: "HD-2025-096", cust: "PK-KHQS", prodId: null, issue: "Firmware FM-DSP — đo IMD vượt ngưỡng ở dải MF", type: "warranty" as const, priority: "medium" as const, status: "processing" as const, step: 3 },
    { code: "BH-2025-881", hdCode: "HD-2025-118", cust: "QK-01", prodId: null, issue: "Lỗi do thi công — đã đóng và quyết toán", type: "warranty" as const, priority: "low" as const, status: "cancelled" as const, step: 1 },
    { code: "BH-2026-109", hdCode: "HD-2026-008", cust: "QK-05", prodId: null, issue: "Cáp quang OTDR suy hao biên cao — tuyến Kon Tum", type: "repair" as const, priority: "urgent" as const, status: "open" as const, step: 1 },
    { code: "BH-2026-110", hdCode: "HD-2026-033", cust: "BTL-ZZZ", prodId: null, issue: "Máy mã hóa X2 — không đồng bộ khóa phiên làm việc", type: "warranty" as const, priority: "high" as const, status: "processing" as const, step: 2 },
    { code: "BH-2026-111", hdCode: "HD-2026-055", cust: "PK-KHQS", prodId: null, issue: "Yêu cầu xuất xưởng lô đào tạo — kiểm tra serial RF", type: "maintenance" as const, priority: "low" as const, status: "completed" as const, step: 4 },
    { code: "BH-2026-112", hdCode: null, cust: "QK-09", prodId: prodVSAT?.id, issue: "Kiểm tra định kỳ VSAT sau mùa mưa — không có HĐ cụ thể", type: "maintenance" as const, priority: "medium" as const, status: "open" as const, step: 1 },
    { code: "BH-2026-113", hdCode: "HD-2026-027", cust: "QK-07", prodId: null, issue: "Pentest — tái kiểm chứng sau khắc phục", type: "warranty" as const, priority: "medium" as const, status: "completed" as const, step: 5 },
  ];

  for (const w of warrantySpecs) {
    await prisma.warranty.upsert({
      where: { code: w.code },
      update: {
        contractId: w.hdCode ? hd(w.hdCode) : null,
        customerId: cid(w.cust),
        productId: w.prodId ?? null,
        assigneeId: techId,
        issue: w.issue,
        source: "Cổng tiếp nhận — VP Kỹ thuật",
        type: w.type,
        priority: w.priority,
        status: w.status,
        workflowStep: w.step,
        slaHours: w.priority === "urgent" ? 8 : w.priority === "high" ? 24 : 72,
      },
      create: {
        code: w.code,
        contractId: w.hdCode ? hd(w.hdCode) : null,
        customerId: cid(w.cust),
        productId: w.prodId ?? null,
        assigneeId: techId,
        issue: w.issue,
        source: "Cổng tiếp nhận — VP Kỹ thuật",
        type: w.type,
        priority: w.priority,
        status: w.status,
        workflowStep: w.step,
        slaHours: w.priority === "urgent" ? 8 : w.priority === "high" ? 24 : 72,
      },
    });
  }

  // ── Phiếu điều chuyển vật tư ─────────────────────────────────
  const transferSpecs = [
    { code: "DC-2026-011", midCode: "VT-RAM-DDR5", qty: 24, dest: "HD-2026-031 — SOC QK7", type: "contract" as const, status: "completed" as const },
    { code: "DC-2026-012", midCode: "VT-CBL-RF58", qty: 450, dest: "HD-2026-014 — Triển khai QK1", type: "contract" as const, status: "processing" as const },
    { code: "DC-2026-013", midCode: "VT-FIL-KU-BPF", qty: 4, dest: "BH-2026-102 — xử lý VSAT QK9", type: "warranty" as const, status: "pending" as const },
    { code: "DC-2026-014", midCode: "VT-UPS-6KVA", qty: 2, dest: "HD-2026-019 — UPS QK3", type: "contract" as const, status: "processing" as const },
    { code: "DC-2026-015", midCode: "VT-LNB-KU", qty: 12, dest: "HL-2026-05 — huấn luyện VSAT", type: "repair" as const, status: "pending" as const },
    { code: "DC-2026-016", midCode: "VT-FW-HUB-R2", qty: 6, dest: "HD-2026-033 — Mã hóa BTL-ZZZ", type: "contract" as const, status: "completed" as const },
    { code: "DC-2026-017", midCode: "VT-HDD-SSD-001", qty: 18, dest: "HD-2026-014 — Kho QK1", type: "contract" as const, status: "completed" as const },
    { code: "DC-2026-018", midCode: "VT-PWR-DC48", qty: 5, dest: "BH-2026-103 — Bảo trì QK3", type: "warranty" as const, status: "processing" as const },
    { code: "DC-2026-019", midCode: "VT-KVM-LCD17", qty: 3, dest: "PK-KHQS — Phòng lab", type: "contract" as const, status: "pending" as const },
    { code: "DC-2026-020", midCode: "VT-ACC-HAZ", qty: 60, dest: "QK-05 — Miền Trung", type: "repair" as const, status: "completed" as const },
  ];

  for (const t of transferSpecs) {
    const mRow = await prisma.material.findUnique({ where: { code: t.midCode } });
    if (!mRow) continue;
    await prisma.materialTransfer.upsert({
      where: { code: t.code },
      update: {
        materialId: mRow.id,
        quantity: t.qty,
        fromWarehouse: mRow.warehouse,
        destination: t.dest,
        type: t.type,
        status: t.status,
        transferDate: utc(2026, 3, 18),
      },
      create: {
        code: t.code,
        materialId: mRow.id,
        quantity: t.qty,
        fromWarehouse: mRow.warehouse,
        destination: t.dest,
        type: t.type,
        status: t.status,
        transferDate: utc(2026, 3, 18),
      },
    });
  }

  // ── Đề tài NC + công việc ───────────────────────────────────
  const projectSpecs = [
    { code: "DT-QP-2026-07", name: "Nghiên cứu chống nhiễu RF co-site cho đài chỉ huy lưu động", dept: "Viện KHQS", fund: "Ngân sách Nhà nước", start: utc(2025, 9, 1), end: utc(2027, 8, 31), status: "active" as const, progress: 44, budget: money("52000000000"), spent: money("21400000000") },
    { code: "DT-QP-2026-11", name: "Thử nghiệm thuật toán ML phát hiện tín hiệu lạ trên SOC", dept: "HVKTQS", fund: "Đề án đột phá", start: utc(2026, 1, 15), end: utc(2028, 12, 31), status: "planning" as const, progress: 18, budget: money("18000000000"), spent: money("1200000000") },
    { code: "DT-QP-2025-03", name: "Vật liệu composite cho vỏ anten Ku di động", dept: "Viện Vật liệu QP", fund: "Hợp tác DN", start: utc(2024, 6, 1), end: utc(2026, 5, 31), status: "completed" as const, progress: 100, budget: money("9800000000"), spent: money("9650000000") },
    { code: "DT-QP-2026-19", name: "Tăng cường ATTT cho thiết bị mạng biên đơn vị", dept: "Cục ATTT — BTL ZZZ", fund: "Chương trình MQĐ", start: utc(2026, 2, 1), end: utc(2027, 6, 30), status: "active" as const, progress: 33, budget: money("24000000000"), spent: money("7800000000") },
    { code: "DT-QP-2026-22", name: "Tối ưu hóa tiêu thụ năng lượng trạm VSAT hỗn hợp", dept: "TT R&D Viettel QP", fund: "Đồng đầu tư", start: utc(2026, 4, 1), end: utc(2027, 12, 31), status: "suspended" as const, progress: 12, budget: money("15600000000"), spent: money("2100000000") },
  ];

  const projects: { id: string; code: string }[] = [];
  for (const p of projectSpecs) {
    const row = await prisma.researchProject.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        department: p.dept,
        fundingSource: p.fund,
        startDate: p.start,
        endDate: p.end,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        budgetSpent: p.spent,
        description:
          "Đề tài thuộc chương trình KH-CN-QP; báo cáo định kỳ gửi Cục Khoa học Quân sự — bản nhập liệu minh họa hệ thống.",
        managerId: manager.id,
      },
      create: {
        code: p.code,
        name: p.name,
        department: p.dept,
        fundingSource: p.fund,
        startDate: p.start,
        endDate: p.end,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        budgetSpent: p.spent,
        description:
          "Đề tài thuộc chương trình KH-CN-QP; báo cáo định kỳ gửi Cục Khoa học Quân sự — bản nhập liệu minh họa hệ thống.",
        managerId: manager.id,
      },
    });
    projects.push({ id: row.id, code: row.code });
  }

  const pid = (code: string) => {
    const found = projects.find((x) => x.code === code);
    if (!found) throw new Error(`Project not found: ${code}`);
    return found.id;
  };

  const taskSeed: Array<{
    code: string;
    proj: string;
    title: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    progress: number;
    start: Date;
    deadline: Date;
  }> = [
    { code: "CV-2026-501", proj: "DT-QP-2026-07", title: "Đo và mô hình hóa phổ nhiễu đồng kênh", type: "research", priority: "high", status: "in_progress", progress: 55, start: utc(2026, 1, 10), deadline: utc(2026, 5, 30) },
    { code: "CV-2026-502", proj: "DT-QP-2026-07", title: "Viết báo cáo giữa kỳ — giải pháp lọc thích nghi", type: "report", priority: "medium", status: "todo", progress: 0, start: utc(2026, 4, 1), deadline: utc(2026, 7, 15) },
    { code: "CV-2026-503", proj: "DT-QP-2026-07", title: "Khảo sát hiện trường đơn vị thử nghiệm QK7", type: "fieldwork", priority: "urgent", status: "delayed", progress: 35, start: utc(2026, 2, 5), deadline: utc(2026, 3, 30) },
    { code: "CV-2026-511", proj: "DT-QP-2026-11", title: "Chuẩn bị bộ dữ liệu huấn luyện SOC (anonymized)", type: "admin", priority: "medium", status: "in_progress", progress: 40, start: utc(2026, 2, 1), deadline: utc(2026, 6, 30) },
    { code: "CV-2026-512", proj: "DT-QP-2026-11", title: "Xét duyệt kiến trúc pipeline ML Edge", type: "review", priority: "high", status: "review", progress: 70, start: utc(2026, 3, 1), deadline: utc(2026, 4, 20) },
    { code: "CV-2025-903", proj: "DT-QP-2025-03", title: "Nghiệm thu độ bền composite vòng 3", type: "fieldwork", priority: "low", status: "completed", progress: 100, start: utc(2025, 11, 1), deadline: utc(2026, 1, 15) },
    { code: "CV-2026-521", proj: "DT-QP-2026-19", title: "Rà soát hardening checklist thiết bị biên", type: "review", priority: "high", status: "in_progress", progress: 48, start: utc(2026, 2, 20), deadline: utc(2026, 5, 10) },
    { code: "CV-2026-522", proj: "DT-QP-2026-19", title: "Triển khai thử nghiệm SIEM correlation rules", type: "research", priority: "medium", status: "todo", progress: 0, start: utc(2026, 5, 1), deadline: utc(2026, 8, 30) },
    { code: "CV-2026-531", proj: "DT-QP-2026-22", title: "Đo profile công suất LNB standby", type: "research", priority: "medium", status: "todo", progress: 5, start: utc(2026, 4, 10), deadline: utc(2026, 7, 31) },
    { code: "CV-2026-601", proj: "DT-QP-2026-07", title: "Hành chính: đối soát chi phí đi công tác đợt 1", type: "admin", priority: "low", status: "completed", progress: 100, start: utc(2026, 2, 1), deadline: utc(2026, 2, 28) },
    { code: "CV-2026-602", proj: "DT-QP-2026-11", title: "Báo cáo tổng kết pilot ML — nháp", type: "report", priority: "medium", status: "in_progress", progress: 22, start: utc(2026, 3, 20), deadline: utc(2026, 9, 1) },
    { code: "CV-2026-603", proj: "DT-QP-2026-19", title: "Kiểm tra patch firmware switch biên đợt T2", type: "fieldwork", priority: "urgent", status: "in_progress", progress: 60, start: utc(2026, 3, 25), deadline: utc(2026, 4, 15) },
  ];

  for (const tk of taskSeed) {
    await prisma.task.upsert({
      where: { code: tk.code },
      update: {
        projectId: pid(tk.proj),
        assigneeId: techId,
        title: tk.title,
        description: `Nhiệm vụ gắn đề tài ${tk.proj}.`,
        priority: tk.priority,
        status: tk.status,
        type: tk.type,
        progress: tk.progress,
        startDate: tk.start,
        deadline: tk.deadline,
      },
      create: {
        code: tk.code,
        projectId: pid(tk.proj),
        assigneeId: techId,
        title: tk.title,
        description: `Nhiệm vụ gắn đề tài ${tk.proj}.`,
        priority: tk.priority,
        status: tk.status,
        type: tk.type,
        progress: tk.progress,
        startDate: tk.start,
        deadline: tk.deadline,
      },
    });
  }

  // Task không gắn đề tài (vận hành chung)
  await prisma.task.upsert({
    where: { code: "CV-2026-700" },
    update: {
      projectId: null,
      assigneeId: manager.id,
      title: "Rà soát hồ sơ nghiệm thu đợt 1 — các HĐ đang thực hiện",
      type: "admin",
      priority: "medium",
      status: "in_progress",
      progress: 40,
      startDate: utc(2026, 3, 1),
      deadline: utc(2026, 4, 30),
    },
    create: {
      code: "CV-2026-700",
      projectId: null,
      assigneeId: manager.id,
      title: "Rà soát hồ sơ nghiệm thu đợt 1 — các HĐ đang thực hiện",
      description: "Công việc vận hành — không gắn đề tài.",
      type: "admin",
      priority: "medium",
      status: "in_progress",
      progress: 40,
      startDate: utc(2026, 3, 1),
      deadline: utc(2026, 4, 30),
    },
  });

  // ── Huấn luyện ───────────────────────────────────────────────
  const courseSpecs = [
    { code: "HL-2026-03", hdCode: "HD-2026-014", cust: "QK-01", title: "Vận hành — bảo dưỡng máy thu phát R-300QP", type: "internal" as const, status: "ongoing" as const, start: utc(2026, 3, 10), end: utc(2026, 3, 21), participants: 28, location: "Trường huấn QK1 — Vĩnh Phúc" },
    { code: "HL-2026-05", hdCode: "HD-2026-045", cust: "QK-09", title: "VSAT Ku di động — lắp ráp và chỉnh pha anten", type: "external" as const, status: "planned" as const, start: utc(2026, 5, 5), end: utc(2026, 5, 14), participants: 22, location: "Trạm huấn QK9 — Cần Thơ" },
    { code: "HL-2026-08", hdCode: "HD-2026-031", cust: "QK-07", title: "SOC chỉ huy — phân tích log và phản ứng sự cố", type: "online" as const, status: "planned" as const, start: utc(2026, 6, 2), end: utc(2026, 6, 13), participants: 36, location: "MS Teams — nội bộ" },
    { code: "HL-2026-01", hdCode: "HD-2026-022", cust: "QK-03", title: "Radar GCI — quy trình hiệu chỉnh và bàn giao", type: "internal" as const, status: "completed" as const, start: utc(2026, 1, 15), end: utc(2026, 1, 24), participants: 18, location: "QK3 — Đà Nẵng" },
    { code: "HL-2026-12", hdCode: null, cust: "BTL-ZZZ", title: "ATTT thiết bị mạng biên — chuẩn nội bộ 2026", type: "internal" as const, status: "ongoing" as const, start: utc(2026, 4, 8), end: utc(2026, 4, 19), participants: 42, location: "Hà Nội" },
    { code: "HL-2026-15", hdCode: "HD-2026-055", cust: "PK-KHQS", title: "Đài chuyển tiếp Lite-R40 — thực hành lab", type: "internal" as const, status: "planned" as const, start: utc(2026, 7, 1), end: utc(2026, 7, 12), participants: 30, location: "HVKTQS — CS1" },
  ];

  const courseIds: string[] = [];
  for (const c of courseSpecs) {
    const row = await prisma.trainingCourse.upsert({
      where: { code: c.code },
      update: {
        contractId: c.hdCode ? hd(c.hdCode) : null,
        customerId: cid(c.cust),
        instructorId: manager.id,
        title: c.title,
        type: c.type,
        startDate: c.start,
        endDate: c.end,
        participants: c.participants,
        status: c.status,
        location: c.location,
        description: "Chương trình chuẩn theo quyết định giao nhiệm vụ và phê duyệt kế hoạch huấn luyện năm.",
      },
      create: {
        code: c.code,
        contractId: c.hdCode ? hd(c.hdCode) : null,
        customerId: cid(c.cust),
        instructorId: manager.id,
        title: c.title,
        type: c.type,
        startDate: c.start,
        endDate: c.end,
        participants: c.participants,
        status: c.status,
        location: c.location,
        description: "Chương trình chuẩn theo quyết định giao nhiệm vụ và phê duyệt kế hoạch huấn luyện năm.",
      },
    });
    courseIds.push(row.id);
  }

  await prisma.trainee.deleteMany({ where: { trainingCourseId: { in: courseIds } } });
  await prisma.scheduleSession.deleteMany({ where: { trainingCourseId: { in: courseIds } } });

  const hl03 = await prisma.trainingCourse.findUnique({ where: { code: "HL-2026-03" } });
  const hl05 = await prisma.trainingCourse.findUnique({ where: { code: "HL-2026-05" } });
  const hl01 = await prisma.trainingCourse.findUnique({ where: { code: "HL-2026-01" } });

  if (hl03) {
    await prisma.trainee.createMany({
      data: [
        { trainingCourseId: hl03.id, fullName: "Thượng úy Hoàng Gia Bảo", unit: "TT TT-TT QK1", rank: "Thượng úy", attendance: "present", score: money("8.6") },
        { trainingCourseId: hl03.id, fullName: "Đại úy Đặng Minh Khôi", unit: "Đoàn 673", rank: "Đại úy", attendance: "present", score: money("9.1") },
        { trainingCourseId: hl03.id, fullName: "Trung úy Lý Thuỳ Linh", unit: "Ban CHQS", rank: "Trung úy", attendance: "pending", score: null },
      ],
    });
    await prisma.scheduleSession.createMany({
      data: [
        { trainingCourseId: hl03.id, date: utc(2026, 3, 10), startTime: "08:00", endTime: "11:30", topic: "Kiến trúc máy và kiểm tra công suất", location: hl03.location ?? "", status: "done" },
        { trainingCourseId: hl03.id, date: utc(2026, 3, 11), startTime: "08:00", endTime: "11:30", topic: "Thực hành đồng bộ khối HF/UHF", location: hl03.location ?? "", status: "planned" },
      ],
    });
  }

  if (hl05) {
    await prisma.trainee.createMany({
      data: [
        { trainingCourseId: hl05.id, fullName: "Trung tá Ngô Hải Đăng", unit: "PK CNTT QK9", rank: "Trung tá", attendance: "pending", score: null },
        { trainingCourseId: hl05.id, fullName: "Đại úy Trịnh Lan Anh", unit: "Đài Vô tuyến 275", rank: "Đại úy", attendance: "pending", score: null },
      ],
    });
  }

  if (hl01) {
    await prisma.trainee.createMany({
      data: [
        { trainingCourseId: hl01.id, fullName: "Thượng tá Bùi Quốc Việt", unit: "PK KT QK3", rank: "Thượng tá", attendance: "present", score: money("9.4") },
      ],
    });
    await prisma.scheduleSession.createMany({
      data: [
        { trainingCourseId: hl01.id, date: utc(2026, 1, 16), startTime: "07:30", endTime: "12:00", topic: "Hiệu chỉnh beam và calibration", location: hl01.location ?? "", status: "done" },
      ],
    });
  }

  // ── Tài liệu ─────────────────────────────────────────────────
  const docSpecs: Array<Omit<Prisma.DocumentCreateInput, "category" | "fileType"> & {
    code: string;
    category: Prisma.DocumentCreateInput["category"];
    fileType: Prisma.DocumentCreateInput["fileType"];
    contractCode?: string;
    cust?: string;
    productCode?: string;
    projectCode?: string;
    courseCode?: string;
  }> = [
    { code: "TL-HD-2026-014", name: "Phụ lục kỹ thuật — R-300QP (Rev.B)", category: "technical", fileType: "pdf", fileSize: "4.2 MB", tags: ["HĐ", "kỹ thuật"], contractCode: "HD-2026-014", cust: "QK-01", description: "Bản vẽ lắp đặt và checklist hiện trường." },
    { code: "TL-HD-2026-031", name: "Tài liệu nghiệm thu SOC — giai đoạn 2", category: "report", fileType: "pdf", fileSize: "12.8 MB", tags: ["nghiệm thu", "SOC"], contractCode: "HD-2026-031", cust: "QK-07", description: "Biên bản đợt 1 + phụ lục ATTT." },
    { code: "TL-SP-RF300", name: "Hướng dẫn vận hành — Máy thu phát R-300QP", category: "technical", fileType: "pdf", fileSize: "8.1 MB", tags: ["SP", "vận hành"], productCode: "VTĐ-RF300/QP", cust: "QK-01", description: "HDSD bản nội bộ 2026." },
    { code: "TL-DT-2026-07", name: "Báo cáo tiến độ Q1 — đề tài chống nhiễu RF", category: "report", fileType: "doc", fileSize: "2.4 MB", tags: ["NC", "RF"], projectCode: "DT-QP-2026-07", description: "Nháp báo cáo giữa kỳ." },
    { code: "TL-HL-2026-03", name: "Chương trình huấn luyện + danh sách học viên", category: "training", fileType: "pdf", fileSize: "1.1 MB", tags: ["huấn luyện"], courseCode: "HL-2026-03", cust: "QK-01", description: "Kế hoạch chi tiết 10 ngày." },
    { code: "TL-CHINH-SACH-VL", name: "Quy trình quản lý vật tư định danh — VB nội bộ", category: "policy", fileType: "pdf", fileSize: "980 KB", tags: ["vật tư", "policy"], description: "Áp dụng cho kho QP demo." },
    { code: "TL-HD-2026-045", name: "Biên bản bàn giao lô VSAT đợt 2", category: "contract", fileType: "pdf", fileSize: "3.6 MB", tags: ["bàn giao", "VSAT"], contractCode: "HD-2026-045", cust: "QK-09", description: "Serial và ảnh hiện trường." },
    { code: "TL-WTY-RUNBOOK", name: "Runbook xử lý ticket bảo hành RF — ban giám đốc KT", category: "technical", fileType: "pdf", fileSize: "760 KB", tags: ["BH", "RF"], description: "Phiên bản 2026.03." },
    { code: "TL-VSAT-KIT", name: "Sơ đồ lắp ráp VS-MOB-KIT — Rev.A", category: "technical", fileType: "pdf", fileSize: "5.0 MB", tags: ["VSAT", "lắp ráp"], productCode: "VS-MOB-KIT", cust: "QK-09", description: "Chi tiết anten và phụ kiện." },
    { code: "TL-DAO-TAO-QK5", name: "Kế hoạch huấn luyện quý II — TB TT-TT QK5", category: "training", fileType: "doc", fileSize: "620 KB", tags: ["đào tạo"], cust: "QK-05", description: "Lịch và học viên dự kiến." },
    { code: "TL-PENTEST-2026", name: "Tóm tắt phát hiện pentest — SOC QK7", category: "report", fileType: "pdf", fileSize: "6.7 MB", tags: ["ATTT", "pentest"], contractCode: "HD-2026-027", cust: "QK-07", description: "Phiên bản rút gọn cho lãnh đạo." },
    { code: "TL-HO-SO-CHUNG", name: "Mẫu biểu — phiếu điều chuyển vật tư", category: "other", fileType: "xls", fileSize: "240 KB", tags: ["vật tư", "form"], description: "Excel mẫu nội bộ." },
    { code: "TL-BTL-ZZZ-NĐ", name: "Tài liệu liên thông API chỉ huy — nháp kiến trúc", category: "technical", fileType: "pdf", fileSize: "9.3 MB", tags: ["API", "chỉ huy"], contractCode: "HD-2026-051", cust: "BTL-ZZZ", description: "Sequence diagram và SLA đề xuất." },
    { code: "TL-KHO-ANH", name: "Ảnh kiểm kê kho Q1 — Kho chính", category: "other", fileType: "img", fileSize: "18 MB", tags: ["kho", "ảnh"], description: "Album ảnh demo (placeholder)." },
    { code: "TL-HVKTQS-HOP-TAC", name: "Biên bản họp phối hợp HVKTQS — đề tài ML SOC", category: "report", fileType: "doc", fileSize: "410 KB", tags: ["họp", "HVKTQS"], projectCode: "DT-QP-2026-11", description: "Nội dung action items." },
  ];

  for (const dSpec of docSpecs) {
    const contractId = dSpec.contractCode ? hd(dSpec.contractCode) : undefined;
    const customerIdDoc = dSpec.cust ? cid(dSpec.cust) : undefined;
    const productIdDoc = dSpec.productCode ? (await prisma.product.findUnique({ where: { code: dSpec.productCode } }))?.id : undefined;
    const projectIdDoc = dSpec.projectCode ? pid(dSpec.projectCode) : undefined;
    const trainingCourseIdDoc = dSpec.courseCode ? (await prisma.trainingCourse.findUnique({ where: { code: dSpec.courseCode } }))?.id : undefined;

    await prisma.document.upsert({
      where: { code: dSpec.code },
      update: {
        ownerId: admin.id,
        customerId: customerIdDoc ?? null,
        contractId: contractId ?? null,
        productId: productIdDoc ?? null,
        projectId: projectIdDoc ?? null,
        trainingCourseId: trainingCourseIdDoc ?? null,
        name: dSpec.name,
        category: dSpec.category,
        fileType: dSpec.fileType,
        fileSize: dSpec.fileSize ?? null,
        fileUrl: `https://docs.internal.qp/files/${encodeURIComponent(dSpec.code)}`,
        tags: dSpec.tags ?? [],
        description: dSpec.description ?? null,
      },
      create: {
        code: dSpec.code,
        ownerId: admin.id,
        customerId: customerIdDoc ?? null,
        contractId: contractId ?? null,
        productId: productIdDoc ?? null,
        projectId: projectIdDoc ?? null,
        trainingCourseId: trainingCourseIdDoc ?? null,
        name: dSpec.name,
        category: dSpec.category,
        fileType: dSpec.fileType,
        fileSize: dSpec.fileSize ?? null,
        fileUrl: `https://docs.internal.qp/files/${encodeURIComponent(dSpec.code)}`,
        tags: dSpec.tags ?? [],
        description: dSpec.description ?? null,
      },
    });
  }

  // ── Đồng bộ counters khách hàng ─────────────────────────────
  for (const c of customers) {
    const total = await prisma.contract.count({ where: { customerId: c.id, deletedAt: null } });
    const active = await prisma.contract.count({
      where: { customerId: c.id, deletedAt: null, status: { in: ["active", "draft"] } },
    });
    await prisma.customer.update({
      where: { id: c.id },
      data: { contractsCount: total, activeContracts: active },
    });
  }

  // ── Thông báo mặc định cho admin ────────────────────────────
  const prefKeys = [
    "contract_expiry",
    "contract_execution_sla",
    "new_ticket",
    "feedback_new",
    "task_late",
    "material_low",
    "warranty_expiry",
    "training_upcoming",
    "repair_scheduled",
    "customer_anniversary",
  ] as const;
  for (const key of prefKeys) {
    await prisma.userNotificationPreference.upsert({
      where: { userId_key: { userId: admin.id, key } },
      update: {},
      create: { userId: admin.id, key, enabled: true },
    });
  }
}
