import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/sentrang?sslmode=disable',
});

async function main() {
  const versionRes = await pool.query('SELECT version();');
  console.log('=== SELECT version(); ===');
  console.log(versionRes.rows[0].version);

  const extRes = await pool.query('SELECT extname, extversion FROM pg_extension ORDER BY extname;');
  console.log('=== SELECT extname, extversion FROM pg_extension; ===');
  console.table(extRes.rows);

  const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('=== TABLES IN sentrang ===');
  console.log(tablesRes.rows.map(r => r.table_name).join(', '));

  await pool.end();
}

main().catch(console.error);
