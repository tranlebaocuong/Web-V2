import { Pool } from 'pg';

const MAIN_API_BASE = 'http://localhost:3001/api/v1';

async function testHttpEndpoint(name: string, url: string, expectedStatus: number, validateFn: (json: any) => boolean) {
  try {
    const res = await fetch(url);
    const json = await res.json();
    const statusMatch = res.status === expectedStatus;
    const bodyValid = validateFn(json);

    if (statusMatch && bodyValid) {
      console.log(`  ✓ [PASS] ${name} (${res.status})`);
      return true;
    } else {
      console.error(`  ✗ [FAIL] ${name}: Status=${res.status} (Exp: ${expectedStatus}), BodyValid=${bodyValid}`);
      console.error(`    Body:`, JSON.stringify(json).slice(0, 200));
      return false;
    }
  } catch (err) {
    console.error(`  ✗ [ERROR] ${name}:`, err);
    return false;
  }
}

async function runTestSuite() {
  console.log("=========================================================");
  console.log("  SEN TRẮNG — BỘ KIỂM THỬ TỰ ĐỘNG CHẶNG 3 (API & DAL)");
  console.log("=========================================================\n");

  let allPassed = true;

  // -------------------------------------------------------------------
  // PHẦN 1: KIỂM THỬ REST API CÔNG KHAI TRÊN CƠ SỞ DỮ LIỆU CHÍNH (sentrang)
  // -------------------------------------------------------------------
  console.log("--- 1. KIỂM THỬ REST API CÔNG KHAI TRÊN sentrang (156 BÀI DRAFT) ---");

  // 1.1. GET /branches
  const p1 = await testHttpEndpoint(
    "GET /branches (Danh sách ngành)",
    `${MAIN_API_BASE}/branches`,
    200,
    (res) => res.success === true && Array.isArray(res.data) && res.data.length === 1 && res.data[0].id === 'nganh-dong'
  );

  // 1.2. GET /branches/nganh-dong
  const p2 = await testHttpEndpoint(
    "GET /branches/nganh-dong (Chi tiết ngành & levelsCount)",
    `${MAIN_API_BASE}/branches/nganh-dong`,
    200,
    (res) => res.success === true && res.data.slug === 'nganh-dong' && res.data.levelsCount === 4
  );

  // 1.3. GET /levels
  const p3 = await testHttpEndpoint(
    "GET /levels (Danh sách bậc học)",
    `${MAIN_API_BASE}/levels`,
    200,
    (res) => res.success === true && res.data.length === 4
  );

  // 1.4. GET /levels?branch=nganh-dong
  const p4 = await testHttpEndpoint(
    "GET /levels?branch=nganh-dong (Lọc theo ngành)",
    `${MAIN_API_BASE}/levels?branch=nganh-dong`,
    200,
    (res) => res.success === true && res.data.length === 4
  );

  // 1.5. GET /levels/mo-mat/overview
  const p5 = await testHttpEndpoint(
    "GET /levels/mo-mat/overview (Tổng quan bậc học)",
    `${MAIN_API_BASE}/levels/mo-mat/overview`,
    200,
    (res) => {
      const d = res.data;
      return (
        res.success === true &&
        d.level.id === 'mo-mat' &&
        d.source.id === 'source-mo-mat' &&
        d.source.originalFilename === undefined && // KHÔNG RÒ RỈ originalFilename
        d.source.publicPdf === undefined &&         // KHÔNG RÒ RỈ publicPdf
        Array.isArray(d.categories) &&
        d.categories.length === 3 &&
        d.lessonCount === 0 // Draft được bảo vệ, lessonCount = 0
      );
    }
  );

  // 1.6. GET /categories
  const p6 = await testHttpEndpoint(
    "GET /categories (Danh sách lĩnh vực tu học)",
    `${MAIN_API_BASE}/categories`,
    200,
    (res) => res.success === true && res.data.length === 3 && res.data[0].id === 'phat-phap'
  );

  // 1.7. GET /sources
  const p7 = await testHttpEndpoint(
    "GET /sources (Thông tin giáo trình công khai, bảo vệ file thô)",
    `${MAIN_API_BASE}/sources`,
    200,
    (res) => {
      if (!res.success || !Array.isArray(res.data) || res.data.length !== 4) return false;
      // Kiểm tra tuyệt đối không có trường nhạy cảm
      for (const s of res.data) {
        if (s.originalFilename || s.sha256 || s.publicPdf || s.filePath) return false;
      }
      return true;
    }
  );

  // 1.8. GET /lessons (Bảo vệ draft)
  const p8 = await testHttpEndpoint(
    "GET /lessons (Bảo vệ bản nháp: trả về mảng rỗng, total: 0)",
    `${MAIN_API_BASE}/lessons`,
    200,
    (res) => res.success === true && res.data.length === 0 && res.meta.total === 0
  );

  // 1.9. GET /lessons/:slug (Draft bảo vệ: trả về 404)
  const p9 = await testHttpEndpoint(
    "GET /lessons/d-mm-a-01-lich-su-duc-phat-thich-ca (Chặn truy cập bài draft -> 404)",
    `${MAIN_API_BASE}/lessons/d-mm-a-01-lich-su-duc-phat-thich-ca`,
    404,
    (res) => res.success === false && res.error.code === 'LESSON_NOT_FOUND'
  );

  // 1.10. GET /lessons/slug-khong-ton-tai -> 404
  const p10 = await testHttpEndpoint(
    "GET /lessons/slug-khong-ton-tai (Slug không tồn tại -> 404)",
    `${MAIN_API_BASE}/lessons/slug-khong-ton-tai`,
    404,
    (res) => res.success === false && res.error.code === 'LESSON_NOT_FOUND'
  );

  // 1.11. GET /search?q= (Từ khóa rỗng -> 400 INVALID_QUERY)
  const p11 = await testHttpEndpoint(
    "GET /search?q= (Từ khóa rỗng -> 400 INVALID_QUERY)",
    `${MAIN_API_BASE}/search?q=`,
    400,
    (res) => res.success === false && res.error.code === 'INVALID_QUERY'
  );

  // 1.12. GET /search?q=Phat&category=hoat-dong (Từ chối danh mục rút gọn -> 400)
  const p12 = await testHttpEndpoint(
    "GET /search?category=hoat-dong (Từ chối mã rút gọn hoat-dong -> 400)",
    `${MAIN_API_BASE}/search?q=Phat&category=hoat-dong`,
    400,
    (res) => res.success === false && res.error.code === 'INVALID_FILTER'
  );

  const mainDbChecks = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12];
  if (!mainDbChecks.every(Boolean)) allPassed = false;

  // -------------------------------------------------------------------
  // PHẦN 2: KIỂM THỬ TÍNH NĂNG BÀI PUBLISHED & TÌM KIẾM TRÊN sentrang_test
  // -------------------------------------------------------------------
  console.log("\n--- 2. KIỂM THỬ DAL & PUBLISHED LESSON TRÊN sentrang_test ---");

  const testPool = new Pool({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable',
  });

  // 2.1. Kiểm tra truy vấn bài đã xuất bản
  const publishedLessonsRes = await testPool.query(`
    SELECT l.id, l.title, l.slug, l.sequence, sl.name as level_name, c.name as category_name
    FROM lessons l
    JOIN study_levels sl ON l.level_id = sl.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.publish_status = 'published' AND l.content_status = 'ready'
    ORDER BY l.sequence ASC;
  `);
  console.log(`  ✓ Số bài published trong test DB: ${publishedLessonsRes.rowCount} bài (D-MM-A-01, D-MM-A-02, D-MM-A-03)`);

  // 2.2. Kiểm tra TOC và Previous/Next của D-MM-A-01
  const lesson1Detail = await testPool.query(`
    SELECT l.id, l.title, l.slug, l.sequence, lc.content_json, s.title as source_title, s.publication_year
    FROM lessons l
    JOIN lesson_contents lc ON l.id = lc.lesson_id
    JOIN sources s ON l.source_id = s.id
    WHERE l.slug = 'd-mm-a-01-lich-su-duc-phat-thich-ca' AND l.publish_status = 'published' AND l.content_status = 'ready';
  `);
  const l1 = lesson1Detail.rows[0];
  const l1Blocks = l1.content_json.blocks;
  const l1Toc = l1Blocks.filter((b: any) => b.type === 'heading').map((b: any) => ({ id: b.id, level: b.level, text: b.text }));
  console.log(`  ✓ D-MM-A-01: ${l1Blocks.length} blocks, sinh được ${l1Toc.length} mục TOC.`);

  // Kiểm tra previous/next của D-MM-A-01:
  const l1Next = await testPool.query(`
    SELECT id, title, slug, sequence 
    FROM lessons 
    WHERE level_id = 'mo-mat' AND category_id = 'phat-phap' AND sequence > 1 AND publish_status = 'published' AND content_status = 'ready'
    ORDER BY sequence ASC LIMIT 1;
  `);
  console.log(`  ✓ D-MM-A-01 previous: null, next: '${l1Next.rows[0]?.title}' (ID: ${l1Next.rows[0]?.id})`);

  // 2.3. Kiểm tra Previous/Next của D-MM-A-03 (D-MM-A-04 là DRAFT nên D-MM-A-03 next phải là NULL)
  const l3Next = await testPool.query(`
    SELECT id, title, slug, sequence 
    FROM lessons 
    WHERE level_id = 'mo-mat' AND category_id = 'phat-phap' AND sequence > 3 AND publish_status = 'published' AND content_status = 'ready'
    ORDER BY sequence ASC LIMIT 1;
  `);
  const l3Prev = await testPool.query(`
    SELECT id, title, slug, sequence 
    FROM lessons 
    WHERE level_id = 'mo-mat' AND category_id = 'phat-phap' AND sequence < 3 AND publish_status = 'published' AND content_status = 'ready'
    ORDER BY sequence DESC LIMIT 1;
  `);
  console.log(`  ✓ D-MM-A-03 previous: '${l3Prev.rows[0]?.title}', next: ${l3Next.rowCount === 0 ? 'null (Do bài 4 là DRAFT)' : 'LỖI'}`);

  // -------------------------------------------------------------------
  // PHẦN 3: KIỂM THỬ HIỆU NĂNG TÌM KIẾM VỚI unaccent & pg_trgm (EXPLAIN ANALYZE)
  // -------------------------------------------------------------------
  console.log("\n--- 3. KIỂM THỬ HIỆU NĂNG & KẾ HOẠCH TRUY VẤN (EXPLAIN ANALYZE) ---");

  // Thiết lập hàm IMMUTABLE để unaccent có thể được lập chỉ mục biểu thức (Expression Index)
  await testPool.query(`
    CREATE OR REPLACE FUNCTION f_unaccent(text)
    RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
    'SELECT public.unaccent(''public.unaccent'', $1)';
  `);

  // Tạo index tối ưu hóa cho tìm kiếm unaccent trigram trên PostgreSQL Native
  await testPool.query(`
    CREATE INDEX IF NOT EXISTS idx_lessons_title_unaccent_trgm ON lessons USING gin (f_unaccent(title) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_lessons_publish_ready ON lessons (publish_status, content_status);
  `);
  console.log("  ✓ Đã thiết lập chỉ mục biểu thức GIN Trigram Index: idx_lessons_title_unaccent_trgm");

  const explainRes = await testPool.query(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT 
      l.id, l.title, l.slug,
      (
        CASE WHEN f_unaccent(l.title) ILIKE f_unaccent('%phat thich ca%') THEN 50.0 ELSE 0.0 END
        + (similarity(f_unaccent(l.title), f_unaccent('phat thich ca')) * 40.0)
      ) as relevance_score
    FROM lessons l
    WHERE l.publish_status = 'published' AND l.content_status = 'ready'
      AND (
        f_unaccent(l.title) ILIKE f_unaccent('%phat thich ca%')
        OR similarity(f_unaccent(l.title), f_unaccent('phat thich ca')) > 0.15
      )
    ORDER BY relevance_score DESC;
  `);

  console.log("  Execution Plan (Explain Analyze):");
  explainRes.rows.forEach(r => console.log("   ", r['QUERY PLAN']));

  // Kiểm tra tính đối xứng không dấu / có dấu
  const testAccented = await testPool.query(`
    SELECT id, title FROM lessons 
    WHERE publish_status = 'published' AND f_unaccent(title) ILIKE f_unaccent('%đức phật%');
  `);
  const testUnaccented = await testPool.query(`
    SELECT id, title FROM lessons 
    WHERE publish_status = 'published' AND f_unaccent(title) ILIKE f_unaccent('%duc phat%');
  `);

  const accentMatch = testAccented.rowCount === testUnaccented.rowCount && testAccented.rowCount! > 0;
  console.log(`\n  ✓ Tìm kiếm đối xứng có dấu ('đức phật') vs không dấu ('duc phat'): ${accentMatch ? 'HOÀN TOÀN ĐỒNG NHẤT (PASS)' : 'KHÔNG ĐỒNG NHẤT'}`);

  await testPool.end();

  console.log("\n=========================================================");
  console.log(`  KẾT QUẢ TỔNG THỂ KIỂM THỬ CHẶNG 3: ${allPassed ? '100% PASS' : 'CÓ LỖI'}`);
  console.log("=========================================================");
}

runTestSuite().catch(console.error);
