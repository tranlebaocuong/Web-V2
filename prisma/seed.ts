import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/prisma";

const JSON_SOURCE_PATH = path.resolve(
  process.cwd(),
  "SenTrang_Gravity_Handoff_V1_3/SenTrang_Gravity_Handoff_V1_3/02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.json"
);

interface JsonSourceData {
  project: string;
  version: string;
  branches: Array<{
    id: string;
    name: string;
    sort_order: number;
    description?: string;
  }>;
  levels: Array<{
    id: string;
    branch_id: string;
    name: string;
    sort_order: number;
    description?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    sort_order: number;
  }>;
  sources: Array<{
    id: string;
    title: string;
    branch_id: string;
    level_id: string;
    year: number;
    original_filename?: string;
    page_count?: number;
    sha256?: string;
    publication_note?: string;
    distribution_rights?: string;
    public_pdf?: boolean;
    publisher?: string;
  }>;
  lessons: Array<{
    id: string;
    branch_id: string;
    level_id: string;
    category_id: string;
    sequence: number;
    title: string;
    slug: string;
    source_id: string;
    source_pdf_start_page: number;
    source_pdf_end_page: number;
    content_status: string;
    publish_status: string;
    public: boolean;
    section_layout?: string;
    quality_note?: string;
    summary?: string;
  }>;
  lesson_raw_contents: Array<{
    lesson_id: string;
    content_format: string;
    editorial_status: string;
    pages: Array<{
      pdf_page: number;
      raw_text: string;
    }>;
  }>;
}

export async function runMasterDataSeed() {
  console.log("=========================================================");
  console.log("  SEN TRẮNG — BẮT ĐẦU SEED MASTER DATA NGÀNH ĐỒNG V1.2");
  console.log("=========================================================");
  console.log(`[SEED] Đang đọc nguồn dữ liệu chuẩn: ${JSON_SOURCE_PATH}`);

  if (!fs.existsSync(JSON_SOURCE_PATH)) {
    throw new Error(`[FAIL-FAST] Không tìm thấy file JSON Master Data tại: ${JSON_SOURCE_PATH}`);
  }

  const rawJson = fs.readFileSync(JSON_SOURCE_PATH, "utf-8");
  const data: JsonSourceData = JSON.parse(rawJson);

  // 1. Kiểm tra toàn vẹn trước khi nạp (Pre-seed Validation)
  console.log("[SEED] Đang kiểm tra tính hợp lệ dữ liệu (Pre-seed validation)...");
  if (!data.branches || data.branches.length !== 1) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 1 ngành ('nganh-dong'), tìm thấy: ${data.branches?.length}`);
  }
  if (!data.levels || data.levels.length !== 4) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 4 bậc, tìm thấy: ${data.levels?.length}`);
  }
  if (!data.categories || data.categories.length !== 3) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 3 lĩnh vực, tìm thấy: ${data.categories?.length}`);
  }
  if (!data.sources || data.sources.length !== 4) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 4 nguồn, tìm thấy: ${data.sources?.length}`);
  }
  if (!data.lessons || data.lessons.length !== 156) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 156 bài học, tìm thấy: ${data.lessons?.length}`);
  }
  if (!data.lesson_raw_contents || data.lesson_raw_contents.length !== 156) {
    throw new Error(`[FAIL-FAST] Yêu cầu đúng 156 bản ghi thô, tìm thấy: ${data.lesson_raw_contents?.length}`);
  }

  // 2. Nạp Branch
  console.log("\n[SEED: 1/6] Nạp danh mục Ngành (branches)...");
  for (const b of data.branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {
        name: b.name,
        slug: b.id,
        sortOrder: b.sort_order,
        description: b.description ?? null,
      },
      create: {
        id: b.id,
        name: b.name,
        slug: b.id,
        sortOrder: b.sort_order,
        description: b.description ?? null,
      },
    });
    console.log(`  ✓ Ngành: ${b.name} (${b.id})`);
  }

  // 3. Nạp StudyLevel (levels -> study_levels)
  console.log("\n[SEED: 2/6] Nạp Bậc học (study_levels)...");
  for (const lvl of data.levels) {
    await prisma.studyLevel.upsert({
      where: { id: lvl.id },
      update: {
        branchId: lvl.branch_id,
        name: lvl.name,
        slug: lvl.id,
        sortOrder: lvl.sort_order,
        description: lvl.description ?? null,
      },
      create: {
        id: lvl.id,
        branchId: lvl.branch_id,
        name: lvl.name,
        slug: lvl.id,
        sortOrder: lvl.sort_order,
        description: lvl.description ?? null,
      },
    });
    console.log(`  ✓ Bậc: ${lvl.name} (${lvl.id})`);
  }

  // 4. Nạp Category
  console.log("\n[SEED: 3/6] Nạp Lĩnh vực tu học (categories)...");
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.id,
        sortOrder: cat.sort_order,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.id,
        sortOrder: cat.sort_order,
      },
    });
    console.log(`  ✓ Lĩnh vực: ${cat.name} (${cat.id})`);
  }

  // 5. Nạp Source (sources)
  console.log("\n[SEED: 4/6] Nạp Tài liệu nguồn (sources)...");
  for (const src of data.sources) {
    await prisma.source.upsert({
      where: { id: src.id },
      update: {
        title: src.title,
        branchId: src.branch_id,
        levelId: src.level_id,
        publicationYear: src.year,
        originalFilename: src.original_filename ?? null,
        pageCount: src.page_count ?? null,
        sha256: src.sha256 ?? null,
        publicationNote: src.publication_note ?? null,
        distributionRights: src.distribution_rights ?? null,
        publicPdf: false,
        publisher: src.publisher ?? null,
      },
      create: {
        id: src.id,
        title: src.title,
        branchId: src.branch_id,
        levelId: src.level_id,
        publicationYear: src.year,
        originalFilename: src.original_filename ?? null,
        pageCount: src.page_count ?? null,
        sha256: src.sha256 ?? null,
        publicationNote: src.publication_note ?? null,
        distributionRights: src.distribution_rights ?? null,
        publicPdf: false,
        publisher: src.publisher ?? null,
      },
    });
    console.log(`  ✓ Nguồn: ${src.title} (${src.id})`);
  }

  // 6. Nạp Lessons (156 bài học)
  console.log("\n[SEED: 5/6] Nạp 156 Bài học (lessons)...");
  let lessonUpsertCount = 0;
  for (const l of data.lessons) {
    const existing = await prisma.lesson.findUnique({
      where: { id: l.id },
      select: { publishStatus: true, contentStatus: true, summary: true },
    });

    const finalPublishStatus =
      existing && existing.publishStatus === "published"
        ? "published"
        : "draft";
    const finalContentStatus =
      existing && existing.contentStatus === "ready"
        ? "ready"
        : "raw_extracted";
    const finalSummary =
      existing && existing.summary ? existing.summary : (l.summary ?? null);

    await prisma.lesson.upsert({
      where: { id: l.id },
      update: {
        branchId: l.branch_id,
        levelId: l.level_id,
        categoryId: l.category_id,
        sourceId: l.source_id,
        title: l.title,
        slug: l.slug,
        sequence: l.sequence,
        sourcePdfStartPage: l.source_pdf_start_page,
        sourcePdfEndPage: l.source_pdf_end_page,
        summary: finalSummary,
        publishStatus: finalPublishStatus,
        contentStatus: finalContentStatus,
        importMetadata: {
          quality_note: l.quality_note ?? null,
          section_layout: l.section_layout ?? null,
          imported_at: new Date().toISOString(),
        },
      },
      create: {
        id: l.id,
        branchId: l.branch_id,
        levelId: l.level_id,
        categoryId: l.category_id,
        sourceId: l.source_id,
        title: l.title,
        slug: l.slug,
        sequence: l.sequence,
        sourcePdfStartPage: l.source_pdf_start_page,
        sourcePdfEndPage: l.source_pdf_end_page,
        summary: l.summary ?? null,
        publishStatus: "draft",
        contentStatus: "raw_extracted",
        version: 1,
        importMetadata: {
          quality_note: l.quality_note ?? null,
          section_layout: l.section_layout ?? null,
          imported_at: new Date().toISOString(),
        },
      },
    });
    lessonUpsertCount++;
  }
  console.log(`  ✓ Đã nạp thành công: ${lessonUpsertCount}/156 bài học.`);

  // 7. Nạp LessonRawContent (156 nhóm nội dung thô)
  console.log("\n[SEED: 6/6] Nạp 156 Nhóm nội dung thô (lesson_raw_contents)...");
  let rawUpsertCount = 0;
  for (const r of data.lesson_raw_contents) {
    const existingRaw = await prisma.lessonRawContent.findUnique({
      where: { lessonId: r.lesson_id },
      select: { editorialStatus: true },
    });

    const finalEditorialStatus =
      existingRaw && existingRaw.editorialStatus && existingRaw.editorialStatus !== "raw"
        ? existingRaw.editorialStatus
        : r.editorial_status;

    await prisma.lessonRawContent.upsert({
      where: { lessonId: r.lesson_id },
      update: {
        contentFormat: r.content_format,
        editorialStatus: finalEditorialStatus,
        pagesJson: r.pages as any,
      },
      create: {
        lessonId: r.lesson_id,
        contentFormat: r.content_format,
        editorialStatus: r.editorial_status,
        pagesJson: r.pages as any,
      },
    });
    rawUpsertCount++;
  }
  console.log(`  ✓ Đã nạp thành công: ${rawUpsertCount}/156 nhóm nội dung thô.`);

  console.log("\n=========================================================");
  console.log("  HOÀN TẤT SEED MASTER DATA V1.2 THÀNH CÔNG RỰC RỠ!");
  console.log("=========================================================");
}

if (require.main === module) {
  runMasterDataSeed()
    .catch((e) => {
      console.error("[SEED ERROR]", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
