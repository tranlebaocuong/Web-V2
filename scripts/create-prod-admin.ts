import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import readline from "readline";
import { SUPABASE_CA_BUNDLE } from "../src/lib/supabase-ca";

// Bảng kiểm tra mật khẩu bị cấm (Blacklist mật khẩu demo / mặc định / yếu)
const FORBIDDEN_PASSWORDS = [
  "sentrang@admin2026!",
  "admin",
  "admin123",
  "password",
  "12345678",
  "tusachaolam2026",
];

const FORBIDDEN_EMAILS = [
  "admin@sentrang.gdpt.vn",
  "demo.admin@sentrang.gdpt.vn",
  "admin@sentrang.local",
];

function maskUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const user = parsed.username ? parsed.username : "";
    return `${parsed.protocol}//${user ? user + ":***@" : ""}${parsed.host}${parsed.pathname}`;
  } catch {
    return "[MASKED_URL]";
  }
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

function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: "Mật khẩu phải có độ dài tối thiểu 12 ký tự." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải chứa ít nhất 1 chữ thường (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải chứa ít nhất 1 chữ số (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)." };
  }
  if (FORBIDDEN_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, reason: "Mật khẩu nằm trong danh sách cấm (mật khẩu demo / mặc định)." };
  }
  return { valid: true };
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

/**
 * Nhập mật khẩu ẩn (Masked Input với dấu *) bảo đảm không lộ mật khẩu trên màn hình
 * và không lưu mật khẩu vào tham số dòng lệnh hay lịch sử bash history.
 */
function promptHiddenPassword(promptMsg: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(promptMsg);
    let password = "";
    const stdin = process.stdin;

    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question("", (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char: string) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write("\n[Đã hủy thao tác]\n");
        process.exit(1);
      } else if (char === "\b" || char === "\x7f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        password += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

function validateCloudTarget(connectionUrl: string): { host: string; dbName: string } {
  if (!connectionUrl) {
    throw new Error("DATABASE_URL / DIRECT_URL không được để trống.");
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionUrl);
  } catch (err: any) {
    throw new Error(`Định dạng kết nối không hợp lệ: ${err.message}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const dbName = parsed.pathname.replace(/^\//, "");

  // Fail-Fast: Chặn kết nối máy cục bộ
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") {
    throw new Error(
      `[FAIL_FAST_SAFETY] Phát hiện địa chỉ nội bộ ('${hostname}'). Script tạo Admin Production chỉ được phép kết nối Database Cloud Production.`
    );
  }

  // Fail-Fast: Chặn database test
  if (dbName.includes("sentrang_test") || dbName.endsWith("_test")) {
    throw new Error(
      `[FAIL_FAST_SAFETY] Phát hiện database thử nghiệm ('${dbName}'). Không được tạo tài khoản quản trị production trên database test.`
    );
  }

  return { host: hostname, dbName };
}

export async function createProductionAdmin() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN PRODUCTION   ");
  console.log("   (Nạp cấu hình tường minh — Nhập mật khẩu ẩn — Xác minh TLS)     ");
  console.log("==================================================================\n");

  // 1. Xác định tệp cấu hình tường minh từ --env-file
  const rawArgs = process.argv.slice(2);
  let envFilePath = "";
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--env-file" && rawArgs[i + 1]) {
      envFilePath = rawArgs[i + 1].trim();
      break;
    }
  }

  if (rawArgs.includes("--password")) {
    console.warn("⚠️  CẢNH BÁO BẢO MẬT: Phát hiện truyền tham số --password qua dòng lệnh!");
    console.warn("   Mật khẩu có thể bị lưu vào lịch sử shell (history) hoặc tiến trình hệ điều hành.");
    console.warn("   Hệ thống chuyển sang phương thức nhập bảo mật tương tác.\n");
  }

  let databaseUrl = process.env.DATABASE_URL || "";
  let directUrl = process.env.DIRECT_URL || databaseUrl;
  let customCaCert = process.env.DATABASE_SSL_CERT || undefined;

  if (envFilePath) {
    const resolvedEnvPath = path.resolve(process.cwd(), envFilePath);
    if (!fs.existsSync(resolvedEnvPath)) {
      console.error(`❌ Lỗi: Không tìm thấy tệp cấu hình tại: ${resolvedEnvPath}`);
      process.exit(1);
    }
    console.log(`• Đang đọc cấu hình từ: ${path.basename(resolvedEnvPath)} (Tải bộ nhớ riêng)...`);
    const rawContent = fs.readFileSync(resolvedEnvPath, "utf-8");
    const parsedEnv = parseDotenvString(rawContent);

    // Ưu tiên DIRECT_URL (Session Pooler port 5432) cho các thao tác DDL/Admin direct connection
    directUrl = parsedEnv["DIRECT_URL"] || parsedEnv["DATABASE_URL"] || "";
    databaseUrl = parsedEnv["DATABASE_URL"] || directUrl;
    customCaCert = parsedEnv["DATABASE_SSL_CERT"] || customCaCert;
  } else if (!databaseUrl) {
    envFilePath = await promptText("• Nhập đường dẫn tệp cấu hình chứa chuỗi kết nối Cloud (ví dụ .env.production.local): ");
    if (envFilePath) {
      const resolvedEnvPath = path.resolve(process.cwd(), envFilePath);
      if (fs.existsSync(resolvedEnvPath)) {
        const rawContent = fs.readFileSync(resolvedEnvPath, "utf-8");
        const parsedEnv = parseDotenvString(rawContent);
        directUrl = parsedEnv["DIRECT_URL"] || parsedEnv["DATABASE_URL"] || "";
        databaseUrl = parsedEnv["DATABASE_URL"] || directUrl;
        customCaCert = parsedEnv["DATABASE_SSL_CERT"] || customCaCert;
      }
    }
  }

  const targetUrl = directUrl || databaseUrl;
  if (!targetUrl) {
    console.error("❌ Lỗi: Chưa cung cấp chuỗi kết nối DATABASE_URL hoặc DIRECT_URL.");
    process.exit(1);
  }

  // 2. Kiểm tra an toàn mục tiêu Cloud
  console.log("• Đang kiểm tra an toàn mục tiêu kết nối Database Cloud...");
  let targetInfo: { host: string; dbName: string };
  try {
    targetInfo = validateCloudTarget(targetUrl);
  } catch (err: any) {
    console.error(`❌ Lỗi an toàn Fail-Fast: ${err.message}`);
    process.exit(1);
  }

  console.log("\n--- THÔNG TIN MỤC TIÊU CLOUD (ĐÃ ẨN MẬT KHẨU) ---");
  console.log(`  • Máy chủ Database: ${targetInfo.host}`);
  console.log(`  • Tên Cơ sở dữ liệu: ${targetInfo.dbName}`);
  console.log(`  • Chuỗi kết nối:     ${maskUrl(targetUrl)}`);
  console.log(`  • Chế độ TLS:        Bắt buộc (rejectUnauthorized: true)`);
  console.log("---------------------------------------------------\n");

  // 3. Nhập Email quản trị
  let email = process.env.PROD_ADMIN_EMAIL || "";
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--email" && rawArgs[i + 1]) {
      email = rawArgs[i + 1].trim();
      break;
    }
  }

  if (!email) {
    email = await promptText("• Nhập Email Quản trị viên Production: ");
  }

  if (!email) {
    console.error("❌ Lỗi: Email không được để trống.");
    process.exit(1);
  }

  if (FORBIDDEN_EMAILS.includes(email.toLowerCase())) {
    console.error(`❌ Lỗi: Email '${email}' là email demo, bị cấm sử dụng trên môi trường Production!`);
    console.error("   Vui lòng sử dụng email thực tế của Ban Quản Trị.");
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`❌ Lỗi: Địa chỉ email '${email}' không đúng định dạng.`);
    process.exit(1);
  }

  // 4. Nhập Mật khẩu kín (Masked Hidden Input với dấu *)
  const password = await promptHiddenPassword("• Nhập Mật khẩu Quản trị (tối thiểu 12 ký tự, ký tự hiển thị *): ");

  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    console.error(`\n❌ Vi phạm chính sách mật khẩu: ${policyCheck.reason}`);
    process.exit(1);
  }

  // 5. Nhập lại mật khẩu để xác nhận
  const confirmPassword = await promptHiddenPassword("• Xác nhận lại Mật khẩu: ");
  if (password !== confirmPassword) {
    console.error("\n❌ Mật khẩu xác nhận không khớp. Vui lòng thực hiện lại.");
    process.exit(1);
  }

  // 6. Kết nối cơ sở dữ liệu với TLS nghiêm ngặt (rejectUnauthorized: true)
  console.log("\n• Đang kết nối tới Database Cloud qua kênh TLS an toàn...");
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: {
      rejectUnauthorized: true,
      ca: customCaCert || SUPABASE_CA_BUNDLE,
    },
  });

  try {
    // Kiểm tra kết nối trước
    await pool.query("SELECT 1;");
    console.log("✓ Kênh kết nối TLS tới Database Cloud đã được xác thực an toàn.");

    console.log("• Băm mật khẩu bằng thuật toán bcrypt (cost = 12)...");
    const passwordHash = await bcrypt.hash(password, 12);

    const userId = crypto.randomUUID();
    const query = `
      INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = $3,
        role = 'admin',
        is_active = true,
        updated_at = NOW()
      RETURNING id, email, role, is_active, created_at;
    `;

    const res = await pool.query(query, [userId, email.toLowerCase(), passwordHash]);
    const createdUser = res.rows[0];

    // Ghi nhật ký kiểm toán hệ thống
    const auditQuery = `
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
      VALUES ($1, $2, 'ADMIN_ACCOUNT_INITIALIZED', 'user', $3, $4, NOW());
    `;

    await pool.query(auditQuery, [
      crypto.randomUUID(),
      createdUser.id,
      createdUser.id,
      JSON.stringify({
        email: createdUser.email,
        role: createdUser.role,
        source: "cli_masked_interactive",
        timestamp: new Date().toISOString(),
      }),
    ]);

    console.log("\n==================================================================");
    console.log("✅ KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG TRÊN CLOUD!");
    console.log(`  • ID Người dùng:  ${createdUser.id}`);
    console.log(`  • Email Quản trị: ${createdUser.email}`);
    console.log(`  • Vai trò:        ${createdUser.role}`);
    console.log(`  • Trạng thái:     ${createdUser.is_active ? 'Đã kích hoạt (Active)' : 'Chưa kích hoạt'}`);
    console.log("  • Mật khẩu:       Đã băm an toàn bcrypt cost 12 (Không lưu dấu vết)");
    console.log("  • Xác thực TLS:   Đã xác minh chứng chỉ số máy chủ (Strict TLS)");
    console.log("  • Nhật ký:        Đã ghi nhận sự kiện ADMIN_ACCOUNT_INITIALIZED");
    console.log("==================================================================");
  } catch (err: any) {
    console.error("\n❌ Lỗi khi khởi tạo tài khoản quản trị:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createProductionAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
