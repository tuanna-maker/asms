import {
  getFeedbackAnalyticsByCustomerService,
  getFeedbackAnalyticsByMaterialService,
  getFeedbackAnalyticsByProductService,
} from "../src/modules/customer-feedbacks/analytics";
import { prisma } from "../src/utils/prisma";

async function main() {
  const year = String(new Date().getFullYear());
  const viewer = { userId: "admin-check", roleCode: "admin" as const };

  const filters = { year };

  const [byCustomer, byProduct, byMaterial] = await Promise.all([
    getFeedbackAnalyticsByCustomerService(filters, viewer),
    getFeedbackAnalyticsByProductService(filters, viewer),
    getFeedbackAnalyticsByMaterialService(filters, viewer),
  ]);

  console.log("year", year);
  console.log("by-customer items", byCustomer.items.length, byCustomer.items.slice(0, 3));
  console.log("by-product items", byProduct.items.length, byProduct.items.slice(0, 3));
  console.log("by-material items", byMaterial.items.length, byMaterial.items.slice(0, 3));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
