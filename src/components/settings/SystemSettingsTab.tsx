import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useSystemSettings,
  useUpdateSystemSettings,
  type SystemSettingItem,
} from "@/hooks/use-system-settings-api";

const GROUP_LABEL: Record<SystemSettingItem["group"], string> = {
  warranty: "Bảo hành",
  material: "Vật tư",
  contract: "Hợp đồng",
  notification: "Thông báo",
  training: "Đào tạo & HL",
};

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "in_app", label: "Trong ứng dụng" },
];

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string") return r;
  }
  if (e instanceof Error) return e.message;
  return "Có lỗi xảy ra";
}

type Props = { enabled: boolean; canWrite: boolean };

export function SystemSettingsTab({ enabled, canWrite }: Props) {
  const { data: settings = [], isLoading, isError, error } = useSystemSettings(enabled);
  const update = useUpdateSystemSettings();

  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft(Object.fromEntries(settings.map((s) => [s.key, s.value])));
  }, [settings]);

  const groups = useMemo(() => {
    const g: Record<SystemSettingItem["group"], SystemSettingItem[]> = {
      warranty: [],
      material: [],
      contract: [],
      notification: [],
      training: [],
    };
    settings.forEach((s) => {
      const bucket = g[s.group];
      if (bucket) bucket.push(s);
    });
    return g;
  }, [settings]);

  const dirty = useMemo(() => {
    return settings.some((s) => JSON.stringify(s.value) !== JSON.stringify(draft[s.key]));
  }, [settings, draft]);

  const submit = async () => {
    try {
      const items = settings
        .filter((s) => JSON.stringify(s.value) !== JSON.stringify(draft[s.key]))
        .map((s) => ({ key: s.key, value: draft[s.key] }));
      if (!items.length) return;
      await update.mutateAsync(items);
      toast.success("Đã lưu cấu hình hệ thống");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground">Đăng nhập để xem cấu hình hệ thống.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground">Đang tải cấu hình…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được cấu hình hệ thống."}
        </p>
      </div>
    );
  }

  const renderInput = (s: SystemSettingItem) => {
    const value = draft[s.key];
    if (s.input === "number" || s.input === "hour") {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            disabled={!canWrite}
            min={s.min}
            max={s.max}
            value={typeof value === "number" ? value : Number(value ?? 0)}
            onChange={(e) => setDraft((d) => ({ ...d, [s.key]: Number(e.target.value) }))}
            className="w-32"
          />
          {s.unit ? <span className="text-sm text-muted-foreground">{s.unit}</span> : null}
        </div>
      );
    }
    if (s.input === "channels") {
      const arr = Array.isArray(value) ? (value as string[]) : ["in_app"];
      return (
        <div className="space-y-2">
          {CHANNEL_OPTIONS.map((opt) => {
            const checked = arr.includes(opt.value);
            return (
              <div key={opt.value} className="flex items-center justify-between rounded bg-secondary/30 px-3 py-2">
                <span className="text-sm">{opt.label}</span>
                <Switch
                  disabled={!canWrite}
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = v
                      ? Array.from(new Set([...arr, opt.value]))
                      : arr.filter((x) => x !== opt.value);
                    setDraft((d) => ({ ...d, [s.key]: next }));
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {(Object.keys(groups) as Array<SystemSettingItem["group"]>).map((g) => (
        <div key={g} className="rounded-xl bg-card border border-border/50 shadow-sm">
          <div className="border-b border-border/50 px-4 py-3">
            <h3 className="font-semibold text-card-foreground">{GROUP_LABEL[g]}</h3>
          </div>
          <div className="divide-y divide-border/50">
            {groups[g].map((s) => (
              <div key={s.key} className="grid gap-2 p-4 md:grid-cols-[2fr_1fr] md:items-center">
                <div>
                  <Label className="text-sm font-medium">{s.label}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </div>
                <div>{renderInput(s)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button onClick={() => void submit()} disabled={!canWrite || !dirty || update.isPending}>
          {update.isPending ? "Đang lưu…" : "Lưu cấu hình"}
        </Button>
      </div>
    </div>
  );
}
