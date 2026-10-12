import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/sentrang?sslmode=disable',
});

async function main() {
  console.log("Query 1: SELECT version();");
  const res1 = await pool.query('SELECT version();');
  console.log(JSON.stringify(res1.rows, null, 2));

  console.log("\nQuery 2: SELECT extname FROM pg_extension;");
  const res2 = await pool.query('SELECT extname FROM pg_extension;');
  console.log(JSON.stringify(res2.rows, null, 2));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
