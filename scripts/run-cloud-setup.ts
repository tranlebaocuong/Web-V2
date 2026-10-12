import fs from "fs";
import path from "path";
import readline from "readline";
import { execFileSync } from "child_process";
import { Pool } from "pg";
import { SUPABASE_CA_BUNDLE } from "../src/lib/supabase-ca";

/**
 * Hàm che giấu thông tin xác thực (Credentials Masking)
 * Tuyệt đối không bao giờ in mật khẩu hay token ra màn hình hoặc log.
 */
function maskUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const maskedUser = parsed.username ? parsed.username : "";
    const maskedAuth = maskedUser ? `${maskedUser}:***@` : "";
    return `${parsed.protocol}//${maskedAuth}${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return "[MALFORMED_URL]";
  }
}

function promptText(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function validateCloudConnection(urlString: string, label: string): { host: string; dbName: string } {
  if (!urlString || urlString.trim() === "") {
    throw new Error(`[FAIL_FAST_ABORT] Biến môi trường '${label}' bị trống.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString.trim());
  } catch (err: any) {
    throw new Error(`[FAIL_FAST_ABORT] '${label}' không đúng định dạng URL: ${err.message}`);
  }

  if (!parsed.protocol.startsWith("postgres")) {
    throw new Error(`[FAIL_FAST_ABORT] '${label}' giao thức không hợp lệ. Bắt buộc là postgresql: hoặc postgres:`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const dbName = parsed.pathname.replace(/^\//, "").toLowerCase();

  // 1. Kiểm tra chặn Host cục bộ (Localhost / Loopback protection)
  const forbiddenHosts = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
  if (forbiddenHosts.includes(hostname) || hostname.endsWith(".local") || hostname.startsWith("192.168.")) {
    throw new Error(
      `[FAIL_FAST_SAFETY] Hostname '${hostname}' trong '${label}' trỏ tới máy cục bộ/nội bộ! ` +
      `Script này chỉ được phép kết nối tới Cloud Production (Supabase/Neon). Thao tác bị hủy ngay lập tức để bảo vệ database máy Bạn.`
    );
  }

  // 2. Kiểm tra chặn Database Test
  if (dbName.includes("sentrang_test") || dbName.includes("_test")) {
    throw new Error(
      `[FAIL_FAST_SAFETY] Tên cơ sở dữ liệu '${dbName}' trong '${label}' chứa từ khóa test! ` +
      `Tuyệt đối không được phép sử dụng database thử nghiệm cho quy trình Cloud Production.`
    );
  }

  // 3. Kiểm tra kết nối tới cơ sở dữ liệu sentrang nội bộ
  if (dbName === "sentrang" && (hostname.includes("127.0.0.1") || hostname.includes("localhost"))) {
    throw new Error(
      `[FAIL_FAST_SAFETY] Phát hiện kết nối tới database sentrang cục bộ thay vì Cloud Production.`
    );
  }

  return { host: hostname, dbName };
}

function parseDotenvString(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      result[key] = val;
    }
  }
  return result;
}

export async function runCloudSetup() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — QUY TRÌNH THIẾT LẬP DATABASE CLOUD AN TOÀN   ");
  console.log("   (Kiểm tra Fail-Fast nghiêm ngặt — Không in Secrets ra Log)     ");
  console.log("==================================================================\n");

  // 1. Xác định tệp cấu hình tường minh
  let envFilePath = "";
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env-file" && args[i + 1]) {
      envFilePath = args[i + 1].trim();
      break;
    }
  }

  if (!envFilePath) {
    envFilePath = await promptText("• Nhập đường dẫn tệp cấu hình chứa chuỗi kết nối Cloud (ví dụ .env.production.local): ");
  }

  if (!envFilePath) {
    console.error("❌ Lỗi: Chưa cung cấp đường dẫn tệp cấu hình.");
    process.exit(1);
  }

  const resolvedEnvPath = path.resolve(process.cwd(), envFilePath);
  if (!fs.existsSync(resolvedEnvPath)) {
    console.error(`❌ Lỗi: Không tìm thấy tệp cấu hình tại: ${resolvedEnvPath}`);
    process.exit(1);
  }

  console.log(`• Đang đọc cấu hình từ: ${path.basename(resolvedEnvPath)} (Tải bộ nhớ riêng, không ghi ra đĩa)...`);
  const rawContent = fs.readFileSync(resolvedEnvPath, "utf-8");
  const parsedEnv = parseDotenvString(rawContent);

  const databaseUrl = parsedEnv["DATABASE_URL"] || "";
  const directUrl = parsedEnv["DIRECT_URL"] || databaseUrl;
  const appEnv = parsedEnv["APP_ENV"] || "production";

  // 2. Kiểm tra tính hợp lệ & Fail-Fast
  console.log("• Đang thực hiện kiểm tra an toàn Pre-flight Fail-Fast...");
  const dbCheck = validateCloudConnection(databaseUrl, "DATABASE_URL");
  const directCheck = validateCloudConnection(directUrl, "DIRECT_URL");

  console.log("\n--- THÔNG TIN MỤC TIÊU CLOUD (ĐÃ ẨN THÔNG TIN BẢO MẬT) ---");
  console.log(`  • Máy chủ Cloud (Pooled):  ${dbCheck.host}`);
  console.log(`  • Tên Cơ sở dữ liệu:        ${dbCheck.dbName}`);
  console.log(`  • Chuỗi Pooled (Masked):   ${maskUrl(databaseUrl)}`);
  console.log(`  • Chuỗi Direct (Masked):   ${maskUrl(directUrl)}`);
  console.log(`  • Môi trường khai báo:     ${appEnv}`);
  console.log("----------------------------------------------------------\n");

  // 3. Yêu cầu xác nhận từ người vận hành
  const confirm = await promptText("⚠️  Xác nhận nạp cấu trúc bảng và 156 bài học Draft vào Database Cloud trên? (yes/no): ");
  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("❌ Thao tác đã bị hủy bỏ bởi người dùng.");
    process.exit(0);
  }

  // 4. Thiết lập môi trường chạy an toàn cho tiến trình con
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
    APP_ENV: "production",
    NODE_ENV: "production",
    SUPABASE_URL: parsedEnv["SUPABASE_URL"] || process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: parsedEnv["SUPABASE_SERVICE_ROLE_KEY"] || process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: parsedEnv["SUPABASE_STORAGE_BUCKET"] || "sentrang-media",
  };

  // 5. Chạy Prisma Migrate Deploy
  console.log("\n[1/3] Đang áp dụng Migration schema lên Cloud Database...");
  try {
    execFileSync("pnpm", ["prisma", "migrate", "deploy"], {
      env: childEnv,
      stdio: "inherit",
      cwd: process.cwd(),
      shell: process.platform === "win32",
    });
    console.log("✓ Migration bảng và chỉ mục tìm kiếm thành công.");
  } catch (err: any) {
    console.error("❌ Lỗi khi chạy migration:", err.message);
    process.exit(1);
  }

  // 6. Nạp Master Data V1.2 qua prisma/seed.ts
  console.log("\n[2/3] Đang nạp Master Data V1.2 (156 bài học Draft)...");
  try {
    execFileSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], {
      env: childEnv,
      stdio: "inherit",
      cwd: process.cwd(),
      shell: process.platform === "win32",
    });
    console.log("✓ Seed Master Data hoàn tất.");
  } catch (err: any) {
    console.error("❌ Lỗi khi seed dữ liệu:", err.message);
    process.exit(1);
  }

  // 7. Đồng bộ Media lên Cloud Storage nếu có cấu hình
  if (childEnv.SUPABASE_URL && childEnv.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("\n[3/3] Đang đồng bộ tài sản hình ảnh lên Cloud Storage...");
    try {
      execFileSync("pnpm", ["exec", "tsx", "scripts/sync-media-to-cloud.ts"], {
        env: childEnv,
        stdio: "inherit",
        cwd: process.cwd(),
        shell: process.platform === "win32",
      });
    } catch (err: any) {
      console.warn("⚠️ Cảnh báo đồng bộ media:", err.message);
    }
  } else {
    console.log("\n[3/3] Bỏ qua đồng bộ media vì chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }

  // 8. Hậu kiểm định toàn vẹn trực tiếp trên Cloud Database
  console.log("\n• Đang kiểm tra đối soát trực tiếp trên Cloud Database...");
  const isCloud = !directUrl.includes("127.0.0.1") && !directUrl.includes("localhost");
  const customCaCert = parsedEnv["DATABASE_SSL_CERT"] || process.env.DATABASE_SSL_CERT || undefined;
  const pool = new Pool({
    connectionString: directUrl,
    ssl: isCloud
      ? {
          rejectUnauthorized: true,
          ca: customCaCert || SUPABASE_CA_BUNDLE,
        }
      : undefined,
  });
  try {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN publish_status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN publish_status = 'draft' THEN 1 END) as drafts
      FROM lessons;
    `);

    const stats = res.rows[0];
    const total = parseInt(stats.total, 10);
    const published = parseInt(stats.published, 10);
    const drafts = parseInt(stats.drafts, 10);

    console.log("==================================================================");
    console.log("✅ KẾT QUẢ THIẾT LẬP DATABASE CLOUD THÀNH CÔNG VƯỢT TRỘI:");
    console.log(`  • Tổng số bài học:     ${total}/156 bài`);
    console.log(`  • Số bài đã xuất bản:  ${published} bài (Đạt chuẩn: 0 bài)`);
    console.log(`  • Số bài bản nháp:     ${drafts} bài (Đạt chuẩn: 156 bài)`);
    console.log("==================================================================");

    if (total === 156 && published === 0 && drafts === 156) {
      console.log("🎉 BẤT BIẾN DỮ LIỆU ĐẠT CHUẨN 100%: Toàn bộ 156 bài học đều ở trạng thái Draft.");
    } else {
      console.error("⚠️ CẢNH BÁO: Số lượng bài học hoặc trạng thái không khớp kỳ vọng.");
    }
  } catch (err: any) {
    console.warn("⚠️ Không thể hậu kiểm tự động qua pool:", err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runCloudSetup().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
