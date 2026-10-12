import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Xác thực và phân tích cú pháp DATABASE_URL với cơ chế Fail-Fast bảo vệ hệ thống.
 * Loại bỏ hoàn toàn cơ chế tự đoán môi trường dựa theo cổng hay cờ ngầm.
 */
export function getValidatedDatabaseUrl(overrideUrl?: string, overrideAppEnv?: string): string {
  const dbUrl = (overrideUrl ?? process.env.DATABASE_URL)?.trim();

  // 1. Kiểm tra bắt buộc: DATABASE_URL không được để trống
  if (!dbUrl) {
    throw new Error(
      "[CONFIG_ERROR] DATABASE_URL is missing. Each environment must explicitly supply a valid DATABASE_URL in process.env."
    );
  }

  // 2. Kiểm tra định dạng URI hợp lệ
  try {
    const parsed = new URL(dbUrl);
    if (!parsed.protocol.startsWith("postgres")) {
      throw new Error(`Protocol '${parsed.protocol}' is invalid. Must start with postgresql: or postgres:`);
    }
  } catch (err: any) {
    throw new Error(`[CONFIG_ERROR] Invalid DATABASE_URL format: ${err.message}`);
  }

  // 3. Cơ chế Fail-Fast: Ngăn tuyệt đối môi trường Production kết nối nhầm database test
  const appEnv = overrideAppEnv ?? process.env.APP_ENV;
  const isStrictProduction =
    appEnv === "production" ||
    (process.env.NODE_ENV === "production" && process.env.STRICT_PROD === "true");

  if (isStrictProduction) {
    const urlLower = dbUrl.toLowerCase();
    if (urlLower.includes("sentrang_test") || urlLower.includes("_test")) {
      throw new Error(
        `[FAIL_FAST_SAFETY] Production environment detected with a test database connection string ('${dbUrl}'). Server initialization aborted to prevent data contamination.`
      );
    }
  }

  // 4. Cơ chế Fail-Fast môi trường Demo: Bắt buộc kết nối database test, cấm tuyệt đối database chính
  if (appEnv === "demo" || process.env.IS_DEMO === "true") {
    const urlLower = dbUrl.toLowerCase();
    if (!urlLower.includes("sentrang_test") && !urlLower.includes("_test")) {
      throw new Error(
        `[FAIL_FAST_SAFETY] Demo environment detected with main/production database connection string ('${dbUrl}'). Demo is strictly restricted to test databases to protect live data.`
      );
    }
  }

  return dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Khởi tạo PrismaClient theo cơ chế lazy: chỉ xác thực DATABASE_URL và mở pool kết nối
 * ở lần truy vấn đầu tiên. Nhờ vậy bước "Collecting page data" của `next build`
 * (vốn import mọi route module) không bị lỗi khi môi trường build không có DATABASE_URL.
 */
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = getValidatedDatabaseUrl();

  const isCloud =
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("localhost");

  const sslConfig = isCloud
    ? {
        rejectUnauthorized: true,
        ca: process.env.DATABASE_SSL_CERT || undefined,
      }
    : undefined;

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 5 : 10,
      connectionTimeoutMillis: 10000,
      ssl: sslConfig,
    });
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
