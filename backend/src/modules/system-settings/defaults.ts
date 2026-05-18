export type SystemSettingKey =
  | "warranty_sla_default_hours"
  | "material_low_threshold_percent"
  | "contract_expiry_remind_days"
  | "task_late_grace_hours"
  | "notification_channels"
  | "notification_daily_run_hour"
  | "warranty_expiry_remind_days"
  | "training_upcoming_remind_days"
  | "repair_scheduled_remind_days"
  | "contract_value_high_threshold"
  | "contract_remind_days_high"
  | "contract_remind_days_low";

export type SystemSettingDef = {
  key: SystemSettingKey;
  group: "warranty" | "material" | "contract" | "notification" | "training";
  label: string;
  description: string;
  /** JSON-serialisable default value */
  defaultValue: number | string[] | boolean;
  /** UI input type */
  input: "number" | "channels" | "hour";
  unit?: string;
  min?: number;
  max?: number;
};

export const SYSTEM_SETTING_DEFS: SystemSettingDef[] = [
  {
    key: "warranty_sla_default_hours",
    group: "warranty",
    label: "SLA mặc định (giờ)",
    description: "Số giờ tối đa kể từ khi tiếp nhận phiếu bảo hành đến khi cần xử lý xong nếu phiếu không tự nhập SLA.",
    defaultValue: 48,
    input: "number",
    unit: "giờ",
    min: 1,
    max: 720,
  },
  {
    key: "material_low_threshold_percent",
    group: "material",
    label: "Ngưỡng cảnh báo tồn kho (%)",
    description: "Khi tồn kho khả dụng / số lượng tổng dưới ngưỡng này, hệ thống coi là sắp hết.",
    defaultValue: 10,
    input: "number",
    unit: "%",
    min: 0,
    max: 100,
  },
  {
    key: "contract_expiry_remind_days",
    group: "contract",
    label: "Nhắc hợp đồng sắp hết hạn (ngày)",
    description: "Cron sẽ tạo thông báo cho hợp đồng còn lại số ngày này tới ngày hết hạn.",
    defaultValue: 30,
    input: "number",
    unit: "ngày",
    min: 1,
    max: 365,
  },
  {
    key: "task_late_grace_hours",
    group: "notification",
    label: "Thời gian ân hạn nhiệm vụ trễ (giờ)",
    description: "Sau số giờ này kể từ deadline, nhiệm vụ chưa hoàn thành sẽ phát thông báo «chậm tiến độ».",
    defaultValue: 24,
    input: "number",
    unit: "giờ",
    min: 0,
    max: 240,
  },
  {
    key: "notification_daily_run_hour",
    group: "notification",
    label: "Giờ chạy lịch nhắc hàng ngày",
    description: "Giờ trong ngày (0-23, giờ máy chủ) cron tạo thông báo định kỳ.",
    defaultValue: 8,
    input: "hour",
    min: 0,
    max: 23,
  },
  {
    key: "notification_channels",
    group: "notification",
    label: "Kênh gửi thông báo",
    description: "Hiện tại chỉ hỗ trợ in_app. Email/SMS sẽ bổ sung sau.",
    defaultValue: ["in_app"],
    input: "channels",
  },

  // -------- Nhắc lịch nâng cao (Phase 2) --------
  {
    key: "warranty_expiry_remind_days",
    group: "warranty",
    label: "Nhắc bảo hành sắp hết hạn (ngày)",
    description: "Cron sẽ tạo thông báo cho hợp đồng có warrantyEnd còn lại số ngày này.",
    defaultValue: 14,
    input: "number",
    unit: "ngày",
    min: 1,
    max: 365,
  },
  {
    key: "training_upcoming_remind_days",
    group: "training",
    label: "Nhắc khoá đào tạo sắp tới (ngày)",
    description: "Cron sẽ nhắc khi khoá đào tạo trạng thái planned bắt đầu trong số ngày này.",
    defaultValue: 7,
    input: "number",
    unit: "ngày",
    min: 1,
    max: 90,
  },
  {
    key: "repair_scheduled_remind_days",
    group: "warranty",
    label: "Nhắc phiếu bảo hành sắp đến hạn (ngày)",
    description: "Nhắc trước số ngày khi phiếu bảo hành sắp đến hạn SLA.",
    defaultValue: 1,
    input: "number",
    unit: "ngày",
    min: 0,
    max: 30,
  },
  {
    key: "contract_value_high_threshold",
    group: "contract",
    label: "Ngưỡng hợp đồng giá trị cao (VND)",
    description: "Hợp đồng có giá trị ≥ ngưỡng này sẽ dùng số ngày nhắc lịch cao hơn.",
    defaultValue: 500_000_000,
    input: "number",
    unit: "VND",
    min: 0,
  },
  {
    key: "contract_remind_days_high",
    group: "contract",
    label: "Số ngày nhắc trước (HĐ giá trị cao)",
    description: "Áp dụng cho hợp đồng có giá trị ≥ ngưỡng cao.",
    defaultValue: 90,
    input: "number",
    unit: "ngày",
    min: 1,
    max: 365,
  },
  {
    key: "contract_remind_days_low",
    group: "contract",
    label: "Số ngày nhắc trước (HĐ giá trị thường)",
    description: "Áp dụng cho hợp đồng có giá trị < ngưỡng cao.",
    defaultValue: 14,
    input: "number",
    unit: "ngày",
    min: 1,
    max: 365,
  },
];

export const SYSTEM_SETTING_DEF_BY_KEY = new Map(
  SYSTEM_SETTING_DEFS.map((def) => [def.key, def] as const),
);
