import "dotenv/config";
import { prisma } from "../src/utils/prisma";
import { advanceInstanceService, startInstanceForEntity, getInstanceForEntity } from "../src/modules/workflows/runtime";

async function main() {
  console.log("=== BẮT ĐẦU CHẠY THỬ NGHIỆM LIÊN THÔNG CÁC LUỒNG HỆ THỐNG ===");

  // 1. Tìm thông tin Admin và Quy trình bàn giao mẫu
  const admin = await prisma.user.findFirst({
    where: { email: "admin@demo.local", deletedAt: null },
    include: { role: true },
  });

  if (!admin) {
    throw new Error("Không tìm thấy tài khoản admin@demo.local. Hãy chạy npm run seed:demo trước.");
  }
  console.log(`- Đăng nhập dưới quyền: ${admin.fullName} (${admin.role.name})`);

  const workflow = await prisma.workflowDefinition.findFirst({
    where: { moduleKey: "handover", isActive: true, deletedAt: null },
    orderBy: { isSystem: "desc" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  if (!workflow) {
    throw new Error("Không tìm thấy quy trình bàn giao nào đang hoạt động.");
  }
  console.log(`- Sử dụng quy trình bàn giao: ${workflow.name} (Mã: ${workflow.code}, số bước: ${workflow.steps.length})`);

  let customerId: string | null = null;
  let contractId: string | null = null;
  let handoverId: string | null = null;
  let instanceId: string | null = null;
  let feedbackId: string | null = null;

  try {
    // 2. Tạo Khách hàng mới (CRM)
    console.log("\n[Luồng 1] Tạo Khách hàng...");
    const customer = await prisma.customer.create({
      data: {
        code: `KH_TEST_${Date.now()}`,
        name: "Tập đoàn Kiểm thử Công nghệ Viễn thông",
        contactName: "Nguyễn Văn A",
        phone: "0987654321",
        email: "contact@telecom-test.vn",
        address: "123 Đường Láng, Hà Nội",
      },
    });
    customerId = customer.id;
    console.log(`✔ Khách hàng tạo thành công: ID = ${customer.id}, Mã = ${customer.code}`);

    // 3. Tạo Hợp đồng mới (Contract)
    console.log("\n[Luồng 2] Tạo Hợp đồng...");
    const contract = await prisma.contract.create({
      data: {
        code: `HD_TEST_${Date.now()}`,
        customerId: customer.id,
        title: "Hợp đồng Cung cấp Thiết bị định tuyến lõi v1.0",
        value: 120000000.0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
        status: "active",
        progress: 0,
      },
    });
    contractId = contract.id;
    console.log(`✔ Hợp đồng tạo thành công: ID = ${contract.id}, Mã = ${contract.code}, Trạng thái = ${contract.status}`);

    // 4. Tạo Bàn giao (Handover) gắn Hợp đồng
    console.log("\n[Luồng 3] Tạo Phiếu Bàn giao thiết bị gắn Hợp đồng...");
    const handover = await prisma.handover.create({
      data: {
        code: `BG_TEST_${Date.now()}`,
        contractId: contract.id,
        customerId: customer.id,
        workflowInstanceId: null,
        status: "pending",
        startDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        handoverPlan: "Smoke test kế hoạch bàn giao chi tiết",
      },
    });
    handoverId = handover.id;
    console.log(`✔ Phiếu Bàn giao tạo thành công: ID = ${handover.id}, Mã = ${handover.code}, Trạng thái = ${handover.status}`);

    // 5. Khởi tạo Quy trình xử lý (Workflow Instance) cho Bàn giao
    console.log("\n[Luồng 4] Khởi tạo quy trình phê duyệt bàn giao...");
    const startResult = await startInstanceForEntity("handover", handover.id, admin.id);
    if (!startResult) {
      throw new Error("Không thể khởi tạo quy trình bàn giao.");
    }
    instanceId = startResult.instanceId;
    await prisma.handover.update({
      where: { id: handover.id },
      data: {
        workflowInstanceId: instanceId,
      },
    });
    console.log(`✔ Quy trình xử lý khởi chạy thành công: Instance ID = ${instanceId}`);

    // 6. Đi từng bước phê duyệt quy trình (Workflow Runtime)
    console.log("\n[Luồng 5] Tiến hành xử lý phê duyệt từng bước quy trình...");
    let currentInst = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { currentStep: true, workflow: { include: { steps: { orderBy: { order: "asc" } } } } },
    });

    while (currentInst && currentInst.status === "running" && currentInst.currentStep) {
      const step = currentInst.currentStep;
      console.log(`  -> Đang ở bước [${step.order}]: "${step.name}" (Yêu cầu vai trò: ${step.roleCode})`);

      // Nếu bước yêu cầu đính kèm tài liệu, thực hiện tạo tài liệu giả lập trước
      if (step.requireDocument) {
        console.log(`     ℹ Bước này yêu cầu đính kèm tài liệu. Đang tạo tài liệu đính kèm...`);
        await prisma.workflowInstanceDocument.create({
          data: {
            instanceId: currentInst.id,
            stepId: step.id,
            fileName: `bien_ban_buoc_${step.order}.pdf`,
            fileSize: 2048,
            mimeType: "application/pdf",
            storagePath: `/uploads/bien_ban_buoc_${step.order}.pdf`,
            uploadedById: admin.id,
          },
        });
        console.log(`     ✔ Đã đính kèm tài liệu "bien_ban_buoc_${step.order}.pdf"`);
      }

      // Tiến hành phê duyệt bước
      console.log(`     Đang duyệt bước "${step.name}"...`);
      currentInst = await advanceInstanceService({
        instanceId: currentInst.id,
        action: "approve",
        comment: `Phê duyệt tự động luồng liên thông ở bước ${step.name}`,
        actorId: admin.id,
        actorRoleCode: "admin",
      }) as any;

      console.log(`     ✔ Duyệt bước thành công.`);
    }

    console.log(`✔ Kết thúc quy trình. Trạng thái Instance = ${currentInst?.status}`);

    // 7. Xác nhận trạng thái bàn giao đổi thành "completed"
    const finalHandover = await prisma.handover.findUnique({ where: { id: handover.id } });
    console.log(`✔ Trạng thái Phiếu Bàn giao sau khi hoàn thành quy trình: ${finalHandover?.status}`);
    if (finalHandover?.status !== "completed") {
      throw new Error(`Kiểm thử thất bại: Phiếu bàn giao chưa chuyển sang trạng thái "completed" (Hiện tại: ${finalHandover?.status})`);
    }
    console.log(`✔ Xác thực nghiệp vụ bàn giao liên thông thành công!`);

    // 8. Luồng phản ánh khách hàng (Customer Feedback / CRM ticket)
    console.log("\n[Luồng 6] Khách hàng tạo phản ánh sự cố kỹ thuật (CRM Ticket)...");
    const feedback = await prisma.customerFeedback.create({
      data: {
        customerId: customer.id,
        contractId: contract.id,
        title: "Sự cố mất kết nối card WAN ngẫu nhiên",
        content: "Card WAN Gigabit trên thiết bị thỉnh thoảng bị mất tín hiệu link 1000Mbps mà không rõ nguyên nhân.",
        severity: "high",
        status: "new",
        source: "external",
        feedbackAt: new Date(),
      },
    });
    feedbackId = feedback.id;
    console.log(`✔ Phiếu phản ánh tạo thành công: ID = ${feedback.id}, Tiêu đề = "${feedback.title}", Mức độ = ${feedback.severity}`);

  } catch (error) {
    console.error("❌ Gặp lỗi trong quá trình kiểm thử liên thông:", error);
    throw error;
  } finally {
    // 9. Dọn dẹp dữ liệu để tránh làm ô nhiễm database
    console.log("\n[Dọn dẹp] Tiến hành xóa các dữ liệu kiểm thử liên thông...");
    
    if (feedbackId) {
      await prisma.customerFeedbackComment.deleteMany({ where: { feedbackId } });
      await prisma.customerFeedbackAssignment.deleteMany({ where: { feedbackId } });
      await prisma.customerFeedbackTimeline.deleteMany({ where: { feedbackId } });
      await prisma.customerFeedback.delete({ where: { id: feedbackId } });
      console.log("✔ Đã xóa Phiếu phản ánh và các bảng liên quan");
    }
    if (handoverId) {
      await prisma.handoverStepPayload.deleteMany({ where: { handoverId } });
      await prisma.handover.delete({ where: { id: handoverId } });
      console.log("✔ Đã xóa Phiếu bàn giao và payloads");
    }
    if (instanceId) {
      await prisma.workflowInstanceDocument.deleteMany({ where: { instanceId } });
      await prisma.workflowStepLog.deleteMany({ where: { instanceId } });
      await prisma.workflowInstance.delete({ where: { id: instanceId } });
      console.log("✔ Đã xóa Workflow Instance, Logs và Documents");
    }
    if (contractId) {
      await prisma.contractStepPayload.deleteMany({ where: { contractId } });
      await prisma.contractProduct.deleteMany({ where: { contractId } });
      await prisma.contract.delete({ where: { id: contractId } });
      console.log("✔ Đã xóa Hợp đồng và payloads");
    }
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } });
      console.log("✔ Đã xóa Khách hàng");
    }
    
    console.log("\n=== HOÀN THÀNH DỌN DẸP DỮ LIỆU KIỂM THỬ ===");
  }
}

main()
  .then(() => {
    console.log("\n🎉 HOÀN THÀNH: Tất cả các luồng hoạt động liên thông đã được kiểm thử trực tiếp và thành công mỹ mãn! 🎉");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
