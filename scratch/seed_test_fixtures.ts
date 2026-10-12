import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable',
});

async function main() {
  console.log("=== SEEDING TEST FIXTURES INTO sentrang_test DATABASE ===");

  // 1. Branch
  await pool.query(`
    INSERT INTO branches (id, name, slug, sort_order)
    VALUES ('nganh-dong', 'Ngành Đồng', 'nganh-dong', 1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Levels
  await pool.query(`
    INSERT INTO study_levels (id, branch_id, name, slug, sort_order)
    VALUES 
      ('mo-mat', 'nganh-dong', 'Mở Mắt', 'mo-mat', 1),
      ('canh-mem', 'nganh-dong', 'Cánh Mềm', 'canh-mem', 2),
      ('chan-cung', 'nganh-dong', 'Chân Cứng', 'chan-cung', 3),
      ('tung-bay', 'nganh-dong', 'Tung Bay', 'tung-bay', 4)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. Categories
  await pool.query(`
    INSERT INTO categories (id, name, slug, sort_order)
    VALUES 
      ('phat-phap', 'Phật pháp – Tinh thần – Lịch sử', 'phat-phap', 1),
      ('hoat-dong-thanh-nien', 'Hoạt động Thanh niên và Xã hội', 'hoat-dong-thanh-nien', 2),
      ('van-nghe', 'Văn nghệ', 'van-nghe', 3)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 4. Source
  await pool.query(`
    INSERT INTO sources (id, branch_id, level_id, title, publication_year, page_count, publication_note)
    VALUES ('source-mo-mat', 'nganh-dong', 'mo-mat', 'Tài liệu tu học ngành Đồng – Mở Mắt', 2016, 113, 'Phát hành nội bộ')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 5. Test Lessons: 3 published, 1 draft
  await pool.query(`
    INSERT INTO lessons (id, branch_id, level_id, category_id, source_id, title, slug, sequence, summary, content_status, publish_status, updated_at)
    VALUES 
      ('D-MM-A-01', 'nganh-dong', 'mo-mat', 'phat-phap', 'source-mo-mat', 'Lịch sử Đức Phật Thích Ca.', 'd-mm-a-01-lich-su-duc-phat-thich-ca', 1, 'Bài học về thân thế và thời niên thiếu của Đức Phật', 'ready', 'published', NOW()),
      ('D-MM-A-02', 'nganh-dong', 'mo-mat', 'phat-phap', 'source-mo-mat', 'Em đến chùa.', 'd-mm-a-02-em-den-chua', 2, 'Hướng dẫn oai nghi của đoàn sinh khi đến chùa lễ Phật', 'ready', 'published', NOW()),
      ('D-MM-A-03', 'nganh-dong', 'mo-mat', 'phat-phap', 'source-mo-mat', 'Ý nghĩa huy hiệu Hoa Sen trong GĐPT.', 'd-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt', 3, 'Tìm hiểu nguồn gốc và ý nghĩa 8 cánh hoa sen', 'ready', 'published', NOW()),
      ('D-MM-A-04', 'nganh-dong', 'mo-mat', 'phat-phap', 'source-mo-mat', 'Bài học bản nháp không được xuất bản.', 'd-mm-a-04-bai-hoc-ban-nhap', 4, 'Bản nháp bí mật nội bộ', 'ready', 'draft', NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  // 6. Lesson Content for D-MM-A-01
  const content1 = {
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 2, text: "A. TỪ SƠ SANH ĐẾN XUẤT GIA (tiết 1)" },
      { id: "h2", type: "heading", level: 3, text: "I. Mục đích" },
      { id: "p1", type: "paragraph", text: "Nắm vững được thân thế và thời niên thiếu của Thái Tử Tất Đạt Đa." },
      { id: "h3", type: "heading", level: 3, text: "II. Nội dung bài giảng" },
      { id: "p2", type: "paragraph", text: "Vào năm 624 trước Tây lịch, vua Tịnh Phạn và hoàng hậu Ma Gia hạ sinh Thái tử tại vườn Lâm Tỳ Ny." }
    ]
  };

  await pool.query(`
    INSERT INTO lesson_contents (id, lesson_id, content_json, schema_version, updated_at)
    VALUES (gen_random_uuid(), 'D-MM-A-01', $1, 1, NOW())
    ON CONFLICT (lesson_id) DO NOTHING;
  `, [JSON.stringify(content1)]);

  // 7. Lesson Content for D-MM-A-03
  const content3 = {
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 2, text: "I. Mục đích" },
      { id: "p1", type: "paragraph", text: "Hiểu khái quát về hình thức và ý nghĩa huy hiệu hoa sen." },
      { id: "h2", type: "heading", level: 2, text: "II. Nội dung bài giảng" },
      { id: "p2", type: "paragraph", text: "Huy hiệu hoa sen màu trắng gồm 8 cánh trên nền xanh lục tượng trưng tuổi trẻ đầy hy vọng." }
    ]
  };

  await pool.query(`
    INSERT INTO lesson_contents (id, lesson_id, content_json, schema_version, updated_at)
    VALUES (gen_random_uuid(), 'D-MM-A-03', $1, 1, NOW())
    ON CONFLICT (lesson_id) DO NOTHING;
  `, [JSON.stringify(content3)]);

  console.log("✓ Đã nạp thành công fixture test database `sentrang_test`!");
  await pool.end();
}

main().catch(console.error);
