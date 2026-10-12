import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import readline from "readline";
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
      // Môi trường không hỗ trợ TTY (pipe / subshell): đọc theo dòng
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
      // Enter hoặc kết thúc
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        // Ctrl+C: Hủy bỏ
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write("\n[Đã hủy thao tác]\n");
        process.exit(1);
      } else if (char === "\b" || char === "\x7f") {
        // Phím Backspace: Xóa ký tự cuối và cập nhật màn hình
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        // Ký tự hợp lệ
        password += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

export async function createProductionAdmin() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN PRODUCTION   ");
  console.log("   (Phương thức nhập mật khẩu bảo mật — Không lưu lịch sử dòng lệnh)");
  console.log("==================================================================\n");

  // Kiểm tra cảnh báo nếu người dùng truyền mật khẩu qua tham số dòng lệnh
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes("--password")) {
    console.warn("⚠️  CẢNH BÁO BẢO MẬT: Phát hiện truyền tham số --password qua dòng lệnh!");
    console.warn("   Mật khẩu có thể bị lưu vào lịch sử shell (history) hoặc tiến trình hệ điều hành.");
    console.warn("   Hệ thống chuyển sang phương thức nhập bảo mật tương tác.\n");
  }

  let email = process.env.PROD_ADMIN_EMAIL || "";
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--email" && rawArgs[i + 1]) {
      email = rawArgs[i + 1].trim();
      break;
    }
  }

  // 1. Nhập Email nếu chưa có
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

  // 2. Nhập Mật khẩu kín (Masked Hidden Input)
  let password = await promptHiddenPassword("• Nhập Mật khẩu Quản trị (tối thiểu 12 ký tự, ký tự sẽ hiển thị *): ");

  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    console.error(`\n❌ Vi phạm chính sách mật khẩu: ${policyCheck.reason}`);
    process.exit(1);
  }

  // 3. Nhập lại mật khẩu để xác nhận chống gõ nhầm
  const confirmPassword = await promptHiddenPassword("• Xác nhận lại Mật khẩu: ");
  if (password !== confirmPassword) {
    console.error("\n❌ Mật khẩu xác nhận không khớp. Vui lòng thực hiện lại.");
    process.exit(1);
  }

  console.log("\n• Đang xác thực chuỗi kết nối Database...");
  const connectionString = getValidatedDatabaseUrl();
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
        source: "cli_masked_interactive",
        timestamp: new Date().toISOString(),
      }),
    ]);

    console.log("\n==================================================================");
    console.log("✅ KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG!");
    console.log(`  • ID Người dùng:  ${createdUser.id}`);
    console.log(`  • Email Quản trị: ${createdUser.email}`);
    console.log(`  • Vai trò:        ${createdUser.role}`);
    console.log(`  • Trạng thái:     ${createdUser.is_active ? 'Đã kích hoạt (Active)' : 'Chưa kích hoạt'}`);
    console.log("  • Mật khẩu:       Đã băm an toàn bcrypt cost 12 (Không lưu dấu vết)");
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
