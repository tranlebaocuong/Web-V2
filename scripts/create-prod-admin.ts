import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getValidatedDatabaseUrl } from "../src/lib/prisma";

// Bảng kiểm tra mật khẩu bị cấm (Blacklist mật khẩu demo / yếu)
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
];

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

function parseArgs(): { email?: string; password?: string } {
  const args = process.argv.slice(2);
  const result: { email?: string; password?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      result.email = args[i + 1].trim();
      i++;
    } else if (args[i] === "--password" && args[i + 1]) {
      result.password = args[i + 1];
      i++;
    }
  }

  // Fallback sang biến môi trường nếu có
  if (!result.email && process.env.PROD_ADMIN_EMAIL) {
    result.email = process.env.PROD_ADMIN_EMAIL.trim();
  }
  if (!result.password && process.env.PROD_ADMIN_PASSWORD) {
    result.password = process.env.PROD_ADMIN_PASSWORD;
  }

  return result;
}

export async function createProductionAdmin() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN PRODUCTION   ");
  console.log("==================================================================");

  const { email, password } = parseArgs();

  if (!email) {
    console.error("❌ Lỗi: Chưa cung cấp email quản trị viên.");
    console.error("   Cách dùng: pnpm exec tsx scripts/create-prod-admin.ts --email <email> --password <mat_khau>");
    console.error("   Hoặc đặt biến môi trường: PROD_ADMIN_EMAIL và PROD_ADMIN_PASSWORD");
    process.exit(1);
  }

  if (FORBIDDEN_EMAILS.includes(email.toLowerCase())) {
    console.error(`❌ Lỗi: Email '${email}' là email demo, bị cấm sử dụng trên môi trường Production!`);
    console.error("   Vui lòng sử dụng email thực tế của Ban Điều Hành / Ban Quản Trị.");
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`❌ Lỗi: Địa chỉ email '${email}' không đúng định dạng.`);
    process.exit(1);
  }

  if (!password) {
    console.error("❌ Lỗi: Chưa cung cấp mật khẩu quản trị viên.");
    process.exit(1);
  }

  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    console.error(`❌ Vi phạm chính sách mật khẩu: ${policyCheck.reason}`);
    process.exit(1);
  }

  // Lấy và xác thực chuỗi kết nối Database với cơ chế Fail-Fast
  const connectionString = getValidatedDatabaseUrl();
  console.log("• Xác thực DATABASE_URL thành công (Fail-Fast validated).");

  const pool = new Pool({ connectionString });

  try {
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
        source: "cli_setup_production",
        timestamp: new Date().toISOString(),
      }),
    ]);

    console.log("==================================================================");
    console.log("✅ KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG!");
    console.log(`  • ID Người dùng:  ${createdUser.id}`);
    console.log(`  • Email Quản trị: ${createdUser.email}`);
    console.log(`  • Vai trò:        ${createdUser.role}`);
    console.log(`  • Kích hoạt:      ${createdUser.is_active ? 'Có (Active)' : 'Không'}`);
    console.log("  • Mật khẩu:       Đã băm an toàn (Argon2id/Bcrypt cost 12)");
    console.log("  • Nhật ký:        Đã ghi nhận sự kiện vào audit_logs");
    console.log("==================================================================");
  } catch (err: any) {
    console.error("❌ Lỗi khi khởi tạo tài khoản quản trị:", err.message);
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
