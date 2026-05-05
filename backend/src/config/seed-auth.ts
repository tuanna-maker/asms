import bcrypt from "bcryptjs";

import { prisma } from "../utils/prisma";

const SEED_PASSWORD = "Password123!";

const ROLE_SEEDS: Array<{ code: string; name: string }> = [
  { code: "admin", name: "Quản trị" },
  { code: "manager", name: "Quản lý" },
  { code: "technician", name: "Kỹ thuật viên" },
  { code: "viewer", name: "Xem" },
  { code: "sales", name: "Nhân viên bán hàng" },
];

const USER_SEEDS: Array<{ email: string; fullName: string; roleCode: string }> = [
  { email: "admin@demo.local", fullName: "Admin Demo", roleCode: "admin" },
  { email: "manager@demo.local", fullName: "Manager Demo", roleCode: "manager" },
  { email: "technician@demo.local", fullName: "Technician Demo", roleCode: "technician" },
  { email: "viewer@demo.local", fullName: "Viewer Demo", roleCode: "viewer" },
  { email: "sales@demo.local", fullName: "Sales Demo", roleCode: "sales" },
];

export async function seedAuthUsers() {
  // Seed roles
  const roleRecords = await Promise.all(
    ROLE_SEEDS.map(async (r) => {
      return prisma.role.upsert({
        where: { code: r.code },
        update: { name: r.name },
        create: { code: r.code, name: r.name },
      });
    })
  );

  // Seed users (upsert by email)
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  await Promise.all(
    USER_SEEDS.map(async (u) => {
      const role = roleRecords.find((r) => r.code === u.roleCode);
      if (!role) return;

      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          fullName: u.fullName,
          roleId: role.id,
          passwordHash,
        },
        create: {
          fullName: u.fullName,
          email: u.email,
          passwordHash,
          roleId: role.id,
        },
      });
    })
  );
}

