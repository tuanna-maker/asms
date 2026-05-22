-- SLA thực hiện hợp đồng (giờ): quá hạn kể từ lần cập nhật cuối → tự chuyển chậm tiến độ
ALTER TABLE "contracts" ADD COLUMN "sla_hours" INTEGER;
