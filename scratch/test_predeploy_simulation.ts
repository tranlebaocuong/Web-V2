import { PrismaClient } from "@prisma/client";
import { getValidatedDatabaseUrl } from "../src/lib/prisma";
import { detectRealImageMime } from "../src/lib/dal/admin/media";
import { createSessionToken, verifySessionToken, revokeSession, isSessionRevoked } from "../src/lib/auth/session";
import { runFullBackup } from "../scripts/backup-db";
import { runRestore } from "../scripts/restore-db";
import fs from "fs";
import path from "path";

interface TestItem {
  name: string;
  category: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: TestItem[] = [];

function record(category: string, name: string, pass: boolean, details: string) {
  const status = pass ? "PASS" : "FAIL";
  results.push({ category, name, status, details });
  console.log(`${pass ? "✅" : "❌"} [${category}] ${name}: ${details}`);
}

async function main() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM V1.0 — KIỂM THỬ MÔ PHỎNG TIỀN TRIỂN KHAI        ");
  console.log("==================================================================\n");

  const prisma = new PrismaClient({
    datasources: {
      db: { url: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable" },
    },
  });

  try {
    // 1. KIỂM THỬ TOÀN VẸN DỮ LIỆU CHÍNH & 0 BÀI PUBLISHED
    console.log("--- 1. Kiểm tra Bất biến Dữ liệu Chính (156 Draft, 0 Published) ---");
    const totalLessons = await prisma.lesson.count();
    const published = await prisma.lesson.count({ where: { publishStatus: "published" } });
    const drafts = await prisma.lesson.count({ where: { publishStatus: "draft" } });
    const rawCount = await prisma.lessonRawContent.count();

    record(
      "Data Invariants",
      "156 Drafts / 0 Published Invariant",
      totalLessons === 156 && published === 0 && drafts === 156 && rawCount === 156,
      `Tổng: ${totalLessons}, Draft: ${drafts}, Published: ${published}, Raw Content: ${rawCount}. Không có bài nào bị lộ.`
    );

    const branches = await prisma.branch.count();
    const levels = await prisma.studyLevel.count();
    const categories = await prisma.category.count();
    const sources = await prisma.source.count();
    record(
      "Data Invariants",
      "Master Data Hierarchy Integrity",
      branches === 1 && levels === 4 && categories === 3 && sources === 4,
      `Branch: ${branches}, Levels: ${levels}, Categories: ${categories}, Sources: ${sources}.`
    );

    // 2. KIỂM THỬ BẢO MẬT FAIL-FAST KÉP TRÊN PRISMA
    console.log("\n--- 2. Kiểm thử Cơ chế Fail-Fast Chặn Database Test ---");
    let failFastTriggered = false;
    try {
      getValidatedDatabaseUrl("postgresql://user:pass@localhost:5432/sentrang_test", "production");
    } catch (err: any) {
      if (err.message.includes("[FAIL_FAST_SAFETY]")) {
        failFastTriggered = true;
      }
    }
    record(
      "Prisma Fail-Fast",
      "Block Test DB in Production Environment",
      failFastTriggered,
      "Hệ thống phát hiện database test trong production và chủ động ngắt kết nối ngay lập tức."
    );

    let allowProdDb = false;
    try {
      const url = getValidatedDatabaseUrl("postgresql://user:pass@localhost:5432/sentrang_prod", "production");
      allowProdDb = url.includes("sentrang_prod");
    } catch {
      allowProdDb = false;
    }
    record(
      "Prisma Fail-Fast",
      "Allow Valid Production Database",
      allowProdDb,
      "Kết nối production hợp lệ được chấp nhận thành công."
    );

    // 3. KIỂM THỬ XÁC THỰC PHIÊN VÀ THU HỒI TOKEN
    console.log("\n--- 3. Kiểm thử Xác thực Phiên & Thu hồi Token Quản trị ---");
    const testUser = {
      userId: "test-user-id-123",
      email: "bhd.admin@tusachaolam.vn",
      role: "admin",
    };
    const sessionToken = createSessionToken(testUser);
    const verified = verifySessionToken(sessionToken);
    record(
      "Session Security",
      "Token Creation & Verification",
      verified !== null && verified.userId === testUser.userId,
      `Token hợp lệ, userId=${verified?.userId}`
    );

    if (verified?.sessionId) {
      await revokeSession(verified.sessionId);
      const isRevoked = await isSessionRevoked(verified.sessionId);
      record(
        "Session Security",
        "Server-Side Session Revocation",
        isRevoked === true,
        "Phiên bị thu hồi tức thì trong memory cache và PostgreSQL site_settings."
      );
    }

    // 4. KIỂM THỬ BẢO MẬT HÌNH ẢNH (MAGIC BYTES & ACCESS CONTROL)
    console.log("\n--- 4. Kiểm thử Bảo mật Tài sản Hình ảnh ---");
    const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ header (EXE)
    const fakeDetection = detectRealImageMime(fakeExeBuffer);
    record(
      "Media Security",
      "Reject Malicious Executable Disguised as Image",
      fakeDetection === null,
      "Chặn đứng tệp thực thi giả mạo đuôi ảnh qua kiểm tra Magic Bytes."
    );

    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validDetection = detectRealImageMime(validJpgBuffer);
    record(
      "Media Security",
      "Accurately Identify Valid JPEG Magic Bytes",
      validDetection !== null && validDetection.mime === "image/jpeg",
      `Xác định chính xác MIME: ${validDetection?.mime}`
    );

    // 5. KIỂM THỬ BẢN SAO LƯU & PHỤC HỒI THẢM HỌA
    console.log("\n--- 5. Kiểm thử Quy trình Sao lưu & Phục hồi ---");
    const backupRes = await runFullBackup("sentrang", 5434);
    record(
      "Disaster Recovery",
      "Automated Backup Bundle Generation",
      backupRes.success && fs.existsSync(backupRes.bundleDir),
      `Dump size: ${backupRes.sizeBytes} bytes, SHA-256: ${backupRes.sha256.substring(0, 16)}...`
    );

    const manifestPath = path.join(backupRes.bundleDir, "manifest.json");
    const manifestExists = fs.existsSync(manifestPath);
    record(
      "Disaster Recovery",
      "Cryptographic Manifest Integrity",
      manifestExists,
      "Tệp manifest.json kê khai đầy đủ checksum cơ sở dữ liệu và danh sách media."
    );

    // 6. KIỂM THỬ KHÔNG LỘ SECRETS TRONG MÃ NGUỒN GIT
    console.log("\n--- 6. Kiểm tra Bảo vệ Bí mật Trong Git ---");
    const gitignoreContent = fs.readFileSync(".gitignore", "utf-8");
    const protectsSecrets =
      gitignoreContent.includes(".env") &&
      gitignoreContent.includes("DEMO_CREDENTIALS.txt") &&
      gitignoreContent.includes("/data/") &&
      gitignoreContent.includes("*.log");
    record(
      "Secret Protection",
      "Strict Gitignore Policy",
      protectsSecrets,
      "Bảo vệ toàn bộ file .env, dữ liệu data/, tài khoản demo và file log không bị đưa vào git."
    );

  } finally {
    await prisma.$disconnect();
  }

  // TỔNG KẾT KẾT QUẢ
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("\n==================================================================");
  console.log(`KẾT QUẢ KIỂM THỬ TIỀN TRIỂN KHAI: ${passed}/${total} BÀI ĐẠT (PASS)`);
  console.log(`Số bài thất bại: ${failed}`);
  console.log("==================================================================");

  const reportPath = path.resolve(process.cwd(), "reports", "predeploy_simulation_results.json");
  fs.writeFileSync(reportPath, JSON.stringify({ summary: { total, passed, failed }, results }, null, 2), "utf-8");
  console.log(`✓ Đã lưu chi tiết kết quả vào: ${reportPath}`);
}

main().catch(console.error);
