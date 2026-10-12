import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable',
});

async function main() {
  console.log("=== COMPREHENSIVE COMPATIBILITY AUDIT ON NATIVE POSTGRESQL 17 (PORT 5434) ===");
  
  // 1. Version
  const v = await pool.query('SELECT version();');
  console.log("VERSION:\n", v.rows[0].version);

  // 2. Extensions
  const ext = await pool.query('SELECT extname, extversion FROM pg_extension ORDER BY extname;');
  console.log("\nEXTENSIONS:");
  console.table(ext.rows);

  // 3. Table counts
  const counts = await pool.query(`
    SELECT 'branches' AS tbl, count(*) FROM branches
    UNION ALL SELECT 'study_levels', count(*) FROM study_levels
    UNION ALL SELECT 'categories', count(*) FROM categories
    UNION ALL SELECT 'sources', count(*) FROM sources
    UNION ALL SELECT 'lessons', count(*) FROM lessons
    UNION ALL SELECT 'lesson_raw_contents', count(*) FROM lesson_raw_contents
    UNION ALL SELECT 'lesson_contents', count(*) FROM lesson_contents;
  `);
  console.log("\nTABLE COUNTS:");
  console.table(counts.rows);

  // 4. Safety status checks
  const drafts = await pool.query("SELECT count(*) FROM lessons WHERE publish_status = 'draft';");
  const published = await pool.query("SELECT count(*) FROM lessons WHERE publish_status = 'published';");
  const readyLessons = await pool.query("SELECT count(*) FROM lessons WHERE content_status = 'ready';");
  const rawLessons = await pool.query("SELECT count(*) FROM lessons WHERE content_status = 'raw_extracted';");

  console.log("\nSAFETY STATUS:");
  console.log(`- Draft lessons: ${drafts.rows[0].count} / 156`);
  console.log(`- Published lessons: ${published.rows[0].count} (Expected: 0)`);
  console.log(`- Ready lessons: ${readyLessons.rows[0].count} (Expected: 2)`);
  console.log(`- Raw lessons: ${rawLessons.rows[0].count} (Expected: 154)`);

  // 5. Demo lessons check
  const demoCheck = await pool.query(`
    SELECT l.id, l.title, l.publish_status, l.content_status, 
           jsonb_array_length(lc.content_json->'blocks') as block_count
    FROM lessons l
    JOIN lesson_contents lc ON l.id = lc.lesson_id
    WHERE l.id IN ('D-MM-A-01', 'D-MM-A-03')
    ORDER BY l.id;
  `);
  console.log("\nDEMO LESSONS CHECK (Preserved after 3rd seed):");
  console.table(demoCheck.rows);

  // 6. Search test with unaccent & pg_trgm
  const searchTest = await pool.query(`
    SELECT id, title 
    FROM lessons 
    WHERE unaccent(title) ILIKE unaccent('%phat thich ca%')
    ORDER BY id;
  `);
  console.log("\nUNACCENT SEARCH TEST ('phat thich ca'):");
  console.table(searchTest.rows);

  const trgmTest = await pool.query(`
    SELECT id, title, round(similarity(title, 'Phat Thich Ca')::numeric, 3) as similarity_score
    FROM lessons
    WHERE similarity(title, 'Phat Thich Ca') > 0.3
    ORDER BY similarity_score DESC
    LIMIT 4;
  `);
  console.log("\nPG_TRGM SIMILARITY TEST ('Phat Thich Ca'):");
  console.table(trgmTest.rows);

  await pool.end();
}

main().catch(console.error);
