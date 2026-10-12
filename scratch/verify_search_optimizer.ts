import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable',
});

async function main() {
  console.log("================================================================================");
  console.log("  POSTGRESQL 17 NATIVE — XÁC MINH CƠ CHẾ HOẠT ĐỘNG GIN TRIGRAM INDEX & OPTIMIZER");
  console.log("================================================================================\n");

  // 1. Kiểm tra thông tin Index và hàm f_unaccent trong System Catalog
  console.log("--- 1. KIỂM TRA ĐỊNH NGHĨA INDEX & HÀM TRONG SYSTEM CATALOG ---");
  const catRes = await pool.query(`
    SELECT 
      i.relname AS index_name,
      am.amname AS index_type,
      pg_get_indexdef(i.oid) AS index_definition
    FROM pg_index x
    JOIN pg_class c ON c.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_am am ON am.oid = i.relam
    WHERE c.relname = 'lessons' AND i.relname LIKE 'idx_lessons_%'
    ORDER BY i.relname;
  `);
  console.table(catRes.rows);

  const funcRes = await pool.query(`
    SELECT proname, provolatile, proparallel, pg_get_functiondef(oid) as def
    FROM pg_proc
    WHERE proname = 'f_unaccent';
  `);
  console.log("Hàm f_unaccent: provolatile =", funcRes.rows[0]?.provolatile, "(i = IMMUTABLE), proparallel =", funcRes.rows[0]?.proparallel, "(s = PARALLEL SAFE)");

  // 2. Phân tích chi phí: Tại sao PostgreSQL chọn Seq Scan trên 156 bản ghi?
  console.log("\n--- 2. TẠI SAO OPTIMIZER CHỌN SEQ SCAN TRÊN 156 BẢN GHI? ---");
  const statsRes = await pool.query(`
    SELECT relname, relpages, reltuples 
    FROM pg_class 
    WHERE relname IN ('lessons', 'idx_lessons_title_unaccent_trgm');
  `);
  console.log("Kích thước bảng và chỉ mục:");
  console.table(statsRes.rows);

  // 3. Test EXPLAIN ANALYZE với mặc định (enable_seqscan = on)
  console.log("\n--- 3. TRUY VẤN TÌM KIẾM TIÊU ĐỀ: enable_seqscan = ON (Mặc định CBO) ---");
  const defaultPlan = await pool.query(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, title, similarity(f_unaccent(title), f_unaccent('Phat Thich Ca')) as score
    FROM lessons
    WHERE f_unaccent(title) ILIKE f_unaccent('%Phat Thich Ca%')
       OR similarity(f_unaccent(title), f_unaccent('Phat Thich Ca')) > 0.2;
  `);
  defaultPlan.rows.forEach(r => console.log(" ", r['QUERY PLAN']));

  // 4. Test EXPLAIN ANALYZE khi ép tắt Seq Scan (enable_seqscan = off)
  console.log("\n--- 4. TRUY VẤN TÌM KIẾM TIÊU ĐỀ: enable_seqscan = OFF (Chứng minh GIN Index Scan) ---");
  await pool.query("SET enable_seqscan = off;");
  
  // Lưu ý: Trong pg_trgm, để GIN index hoạt động tối ưu với ILIKE, pattern phải được cung cấp
  const ginPlan = await pool.query(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, title
    FROM lessons
    WHERE f_unaccent(title) ILIKE '%Phat Thich Ca%';
  `);
  ginPlan.rows.forEach(r => console.log(" ", r['QUERY PLAN']));

  // 5. Test GIN Trigram similarity scan
  console.log("\n--- 5. TRUY VẤN VỚI TOÁN TỬ TƯƠNG ĐỒNG % (GIN Trigram Similarity Operator) ---");
  // Toán tử % trong pg_trgm được thiết kế riêng cho GIN/GiST index
  await pool.query("SET pg_trgm.similarity_threshold = 0.2;");
  const trgmOpPlan = await pool.query(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, title
    FROM lessons
    WHERE f_unaccent(title) % 'Phat Thich Ca';
  `);
  trgmOpPlan.rows.forEach(r => console.log(" ", r['QUERY PLAN']));

  await pool.query("SET enable_seqscan = on;");

  // 6. Quy trình REINDEX khi từ điển unaccent hoặc dữ liệu thay đổi
  console.log("\n--- 6. QUY TRÌNH REINDEX KHI CẬP NHẬT TỪ ĐIỂN HOẶC HÀM ---");
  const reindexTimeStart = Date.now();
  await pool.query("REINDEX INDEX idx_lessons_title_unaccent_trgm;");
  console.log(`✓ REINDEX INDEX idx_lessons_title_unaccent_trgm hoàn tất trong: ${Date.now() - reindexTimeStart} ms.`);

  await pool.end();
}

main().catch(console.error);
