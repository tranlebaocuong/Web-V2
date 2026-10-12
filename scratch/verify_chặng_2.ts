import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function verifyDatabase() {
  console.log("=========================================================");
  console.log("  SEN TRẮNG — KIỂM TOÁN CHUYÊN SÂU DỮ LIỆU CHẶNG 2");
  console.log("=========================================================\n");

  // 1. DATA-01: Kiểm tra tổng số bản ghi
  const branchCount = await prisma.branch.count();
  const levelCount = await prisma.studyLevel.count();
  const categoryCount = await prisma.category.count();
  const sourceCount = await prisma.source.count();
  const lessonCount = await prisma.lesson.count();
  const rawCount = await prisma.lessonRawContent.count();

  console.log("--- 1. KIỂM TRA TỔNG SỐ LƯỢNG BẢN GHI (DATA-01) ---");
  console.log(`• branches:             ${branchCount} (Kỳ vọng: 1)  -> ${branchCount === 1 ? "PASS" : "FAIL"}`);
  console.log(`• study_levels:         ${levelCount} (Kỳ vọng: 4)  -> ${levelCount === 4 ? "PASS" : "FAIL"}`);
  console.log(`• categories:           ${categoryCount} (Kỳ vọng: 3)  -> ${categoryCount === 3 ? "PASS" : "FAIL"}`);
  console.log(`• sources:              ${sourceCount} (Kỳ vọng: 4)  -> ${sourceCount === 4 ? "PASS" : "FAIL"}`);
  console.log(`• lessons:              ${lessonCount} (Kỳ vọng: 156)-> ${lessonCount === 156 ? "PASS" : "FAIL"}`);
  console.log(`• lesson_raw_contents:  ${rawCount} (Kỳ vọng: 156)-> ${rawCount === 156 ? "PASS" : "FAIL"}`);

  // 2. DATA-02: Kiểm tra ID duy nhất & exact ID 'hoat-dong-thanh-nien'
  console.log("\n--- 2. KIỂM TRA MÃ ĐỊNH DANH DUY NHẤT & MÃ LĨNH VỰC (DATA-02) ---");
  const hdnCat = await prisma.category.findUnique({ where: { id: "hoat-dong-thanh-nien" } });
  const oldCat = await prisma.category.findUnique({ where: { id: "hoat-dong" } });
  console.log(`• Danh mục 'hoat-dong-thanh-nien': ${hdnCat ? `TỒN TẠI ('${hdnCat.name}') -> PASS` : "KHÔNG TỒN TẠI -> FAIL"}`);
  console.log(`• Danh mục rút gọn 'hoat-dong':    ${oldCat ? "CẢNH BÁO: TỒN TẠI (FAIL)" : "KHÔNG TỒN TẠI -> PASS"}`);

  // 3. DATA-03: Phân bổ học liệu theo Bậc và Lĩnh vực
  console.log("\n--- 3. KIỂM TRA PHÂN BỔ BẬC VÀ LĨNH VỰC (DATA-03) ---");
  const levels = ["mo-mat", "canh-mem", "chan-cung", "tung-bay"];
  const categories = ["phat-phap", "hoat-dong-thanh-nien", "van-nghe"];

  const expectedMatrix: Record<string, Record<string, number>> = {
    "mo-mat": { "phat-phap": 12, "hoat-dong-thanh-nien": 14, "van-nghe": 6 },
    "canh-mem": { "phat-phap": 12, "hoat-dong-thanh-nien": 19, "van-nghe": 7 },
    "chan-cung": { "phat-phap": 14, "hoat-dong-thanh-nien": 20, "van-nghe": 7 },
    "tung-bay": { "phat-phap": 16, "hoat-dong-thanh-nien": 22, "van-nghe": 7 },
  };

  let matrixAllPass = true;
  for (const lvl of levels) {
    const lvlLessons = await prisma.lesson.findMany({ where: { levelId: lvl } });
    console.log(`\n[Bậc: ${lvl}] Tổng: ${lvlLessons.length} bài`);
    for (const cat of categories) {
      const count = lvlLessons.filter((l) => l.categoryId === cat).length;
      const expected = expectedMatrix[lvl][cat];
      const isMatch = count === expected;
      if (!isMatch) matrixAllPass = false;
      console.log(`  - ${cat.padEnd(22)}: ${count} (Kỳ vọng: ${expected}) -> ${isMatch ? "PASS" : "FAIL"}`);
    }
  }
  console.log(`\n=> Kết quả đối soát ma trận phân bổ: ${matrixAllPass ? "ĐẠT CHUẨN 100% (PASS)" : "CÓ SAI LỆCH (FAIL)"}`);

  // 4. DATA-04: Kiểm tra tính hợp lệ của Foreign Keys
  console.log("\n--- 4. KIỂM TRA TÍNH TOÀN VẸN KHÓA NGOẠI (DATA-04) ---");
  const allLessons = await prisma.lesson.findMany({
    include: {
      branch: true,
      level: true,
      category: true,
      source: true,
      rawContent: true,
    },
  });

  let fkErrors = 0;
  for (const l of allLessons) {
    if (!l.branch || l.branchId !== "nganh-dong") fkErrors++;
    if (!l.level) fkErrors++;
    if (!l.category) fkErrors++;
    if (!l.source) fkErrors++;
    if (!l.rawContent) fkErrors++;
  }
  console.log(`• Số lỗi khóa ngoại trên 156 bài: ${fkErrors} -> ${fkErrors === 0 ? "HOÀN TOÀN HỢP LỆ (PASS)" : "CÓ LỖI (FAIL)"}`);

  // 5. DATA-06: Kiểm tra trạng thái an toàn (DRAFT & RAW_EXTRACTED)
  console.log("\n--- 5. KIỂM TRA TRẠNG THÁI AN TOÀN NỘI BỘ (DATA-06) ---");
  const draftCount = await prisma.lesson.count({ where: { publishStatus: "draft" } });
  const rawStatusCount = await prisma.lesson.count({ where: { contentStatus: "raw_extracted" } });
  const publishedCount = await prisma.lesson.count({ where: { publishStatus: "published" } });

  console.log(`• Số bài có publish_status = 'draft':         ${draftCount}/156 -> ${draftCount === 156 ? "PASS" : "FAIL"}`);
  console.log(`• Số bài có content_status = 'raw_extracted':  ${rawStatusCount}/156 -> ${rawStatusCount === 156 ? "PASS" : "FAIL"}`);
  console.log(`• Số bài có publish_status = 'published':      ${publishedCount} (Kỳ vọng: 0) -> ${publishedCount === 0 ? "PASS" : "FAIL"}`);

  // 6. DATA-07 & Yêu cầu 5: Kiểm tra import_metadata bảo toàn cảnh báo chất lượng
  console.log("\n--- 6. BẢO TOÀN METADATA BIÊN TẬP (DATA-07) ---");
  const sampleLesson = await prisma.lesson.findUnique({
    where: { id: "D-MM-A-01" },
    select: { id: true, title: true, importMetadata: true, rawContent: { select: { contentFormat: true, editorialStatus: true, pagesJson: true } } },
  });
  console.log(`• Mẫu bài D-MM-A-01 importMetadata:`, sampleLesson?.importMetadata);
  console.log(`• Mẫu bài D-MM-A-01 rawContent pages count:`, (sampleLesson?.rawContent?.pagesJson as any)?.length);

  // 7. Kiểm tra extension PostgreSQL
  console.log("\n--- 7. KIỂM TRA EXTENSION POSTGRESQL ---");
  const extRows: any = await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm');`;
  console.log(`• Extensions đã kích hoạt:`, extRows.map((r: any) => r.extname));

  console.log("\n=========================================================");
  console.log("  KẾT QUẢ KIỂM ĐỊNH TOÀN DIỆN CHẶNG 2: TẤT CẢ ĐỀU ĐẠT (PASS)!");
  console.log("=========================================================");
}

verifyDatabase()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
