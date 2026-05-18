import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { normalizeDatabaseUrl } from "./db-url";

// Prevent exhausting DB connections in development (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = normalizeDatabaseUrl(env.DATABASE_URL);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

