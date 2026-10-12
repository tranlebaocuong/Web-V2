import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Kịch bản chuẩn bị môi trường DEMO & UAT trên cơ sở dữ liệu sentrang_test
const TEST_DB_URL = "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

async function prepareDemo() {
  console.log("==================================================================");
  console.log("   CHUẨN BỊ MÔI TRƯỜNG DEMO & UAT — DỰ ÁN SEN TRẮNG V1.3         ");
  console.log("==================================================================");

  // 1. Kiểm tra tính nguyên vẹn của Master Data V1.2
  const branchCount = await prisma.branch.count();
  const levelCount = await prisma.studyLevel.count();
  const categoryCount = await prisma.category.count();
  const sourceCount = await prisma.source.count();
  const totalLessons = await prisma.lesson.count();

  console.log(`[Master Data] 1 ngành, 4 bậc, 3 lĩnh vực, 4 nguồn giáo trình.`);
  console.log(`[Master Data] Tổng số bài học trong hệ thống: ${totalLessons} bài.`);

  if (branchCount !== 1 || levelCount !== 4 || categoryCount !== 3 || sourceCount !== 4 || totalLessons !== 156) {
    throw new Error("Master Data V1.2 mismatch! Hủy tiến trình để bảo vệ cấu trúc.");
  }

  // 2. Chuẩn bị 3 bài demo trong sentrang_test: D-MM-A-01, D-MM-A-02, D-MM-A-03
  // Thuộc Bậc Mở Mắt (mo-mat), Lĩnh vực Phật Pháp (phat-phap), Thứ tự liền kề: 1, 2, 3

  // Bài 1: D-MM-A-01 (Lịch sử Đức Phật Thích Ca)
  await prisma.lesson.update({
    where: { id: "D-MM-A-01" },
    data: {
      contentStatus: "ready",
      publishStatus: "published",
      publishedAt: new Date("2026-10-01T00:00:00Z"),
    },
  });

  // Bài 2: D-MM-A-02 (Châm ngôn - Điều luật - Khẩu hiệu)
  const contentLesson2 = {
    version: 1,
    blocks: [
      {
        id: "d2-h1-mucdich",
        type: "heading",
        level: 2,
        text: "I. Mục đích",
      },
      {
        id: "d2-p1",
        type: "paragraph",
        text: "Giúp các em đoàn sinh Oanh Vũ thuộc lòng, thấu hiểu ý nghĩa và thực hành Châm ngôn, Điều luật cùng Khẩu hiệu của Đoàn trong đời sống hàng ngày.",
      },
      {
        id: "d2-h2-noidung",
        type: "heading",
        level: 2,
        text: "II. Nội dung bài giảng",
      },
      {
        id: "d2-h2-1",
        type: "heading",
        level: 3,
        text: "1. Châm ngôn của Đoàn Oanh Vũ",
      },
      {
        id: "d2-p2",
        type: "paragraph",
        text: "Châm ngôn của Đoàn Oanh Vũ Gia Đình Phật Tử Việt Nam là: HÒA - TIN - VUI.",
      },
      {
        id: "d2-h2-2",
        type: "heading",
        level: 3,
        text: "2. Ý nghĩa ba chữ Châm ngôn",
      },
      {
        id: "d2-list-ynghia",
        type: "list",
        ordered: false,
        items: [
          "HÒA: Hòa thuận, thương yêu, nhường nhịn và giúp đỡ bạn bè trong đoàn cũng như anh chị em trong gia đình.",
          "TIN: Tin tưởng nơi Đức Phật từ bi, tin tưởng cha mẹ và vâng lời hướng dẫn của quý anh chị trưởng.",
          "VUI: Giữ tâm hồn vui tươi, hồn nhiên, tích cực tham gia sinh hoạt đoàn thể và học tập tiến bộ.",
        ],
      },
      {
        id: "d2-h3-dieuluat",
        type: "heading",
        level: 2,
        text: "III. Điều luật Oanh Vũ (Ba Điều Luật)",
      },
      {
        id: "d2-list-dieuluat",
        type: "list",
        ordered: true,
        items: [
          "Em tưởng nhớ Phật.",
          "Em kính mến cha mẹ và thuận thảo với anh chị em.",
          "Em thương người và vật.",
        ],
      },
      {
        id: "d2-h4-khauhieu",
        type: "heading",
        level: 2,
        text: "IV. Khẩu hiệu Oanh Vũ",
      },
      {
        id: "d2-callout-khauhieu",
        type: "callout",
        variant: "quote",
        title: "Khẩu hiệu Oanh Vũ:",
        text: "DŨNG! — Dũng cảm, mạnh dạn làm việc thiện, không sợ khó khăn trở ngại.",
      },
    ],
  };

  await prisma.lessonContent.upsert({
    where: { lessonId: "D-MM-A-02" },
    update: {
      contentJson: contentLesson2 as any,
      schemaVersion: 1,
    },
    create: {
      lessonId: "D-MM-A-02",
      contentJson: contentLesson2 as any,
      schemaVersion: 1,
    },
  });

  await prisma.lesson.update({
    where: { id: "D-MM-A-02" },
    data: {
      contentStatus: "ready",
      publishStatus: "published",
      publishedAt: new Date("2026-10-02T00:00:00Z"),
    },
  });

  // Bài 3: D-MM-A-03 (Ý nghĩa huy hiệu Hoa Sen trong GĐPT)
  await prisma.lesson.update({
    where: { id: "D-MM-A-03" },
    data: {
      contentStatus: "ready",
      publishStatus: "published",
      publishedAt: new Date("2026-10-03T00:00:00Z"),
    },
  });

  console.log(`[Demo Lessons] Đã kích hoạt 3 bài demo xuất bản trên sentrang_test:`);
  console.log(`  - D-MM-A-01: Lịch sử Đức Phật Thích Ca (Seq: 1)`);
  console.log(`  - D-MM-A-02: Châm ngôn - Điều luật - Khẩu hiệu (Seq: 2)`);
  console.log(`  - D-MM-A-03: Ý nghĩa huy hiệu Hoa Sen trong GĐPT (Seq: 3)`);

  // 3. Chuẩn bị tài khoản Admin riêng cho Demo UAT (tách biệt tài khoản production)
  const DEMO_ADMIN_EMAIL = "demo.admin@sentrang.gdpt.vn";
  const DEMO_PASSWORD_PLAIN = "SenTrang@Demo2026!";
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD_PLAIN, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: {
      passwordHash,
      role: "admin",
      isActive: true,
    },
    create: {
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`[Admin Demo] Đã khởi tạo tài khoản quản trị UAT: ${demoUser.email} (ID: ${demoUser.id})`);

  // 4. Lưu thông tin đăng nhập demo vào tệp cục bộ bảo mật DEMO_CREDENTIALS.txt
  // Tệp này chỉ lưu trên máy cục bộ của người dùng, không đưa mật khẩu vào báo cáo công khai
  const credentialsFilePath = path.resolve(process.cwd(), "DEMO_CREDENTIALS.txt");
  const credContent = `================================================================================
SEN TRẮNG V1.3 — THÔNG TIN ĐĂNG NHẬP MÔI TRƯỜNG DEMO & UAT
(Chỉ sử dụng trên máy tính nội bộ / Không chia sẻ ra bên ngoài)
================================================================================

1. URL ĐĂNG NHẬP QUẢN TRỊ:
   http://localhost:3000/admin/login

2. TÀI KHOẢN QUẢN TRỊ VIÊN DEMO:
   Email:    demo.admin@sentrang.gdpt.vn
   Mật khẩu: ${DEMO_PASSWORD_PLAIN}

3. MÔI TRƯỜNG KẾT NỐI:
   Cơ sở dữ liệu: sentrang_test (PostgreSQL 17 Native, Port 5434)
   Cơ chế:        Cô lập 100% với cơ sở dữ liệu chính sentrang
   Quyền hạn:     Toàn quyền biên tập, lưu bản nháp, duyệt bài, xuất bản và thu hồi

================================================================================
`;

  fs.writeFileSync(credentialsFilePath, credContent, "utf8");
  console.log(`[Credentials] Đã ghi thông tin đăng nhập an toàn vào: ${credentialsFilePath}`);

  console.log("\n✓ HOÀN TẤT CHUẨN BỊ MÔI TRƯỜNG DEMO & UAT THÀNH CÔNG!");
}

prepareDemo()
  .catch((e) => {
    console.error("[DEMO PREP ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
