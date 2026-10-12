import { Pool } from 'pg';

async function run() {
  const poolMain = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable' });
  const poolTest = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable' });

  const cMain = await poolMain.query('SELECT count(*) FROM lessons');
  const rawMain = await poolMain.query('SELECT count(*) FROM lesson_raw_contents');
  const dMain = await poolMain.query("SELECT id, title, content_status, publish_status, version FROM lessons LIMIT 3");

  const cTest = await poolTest.query('SELECT count(*) FROM lessons');
  const rawTest = await poolTest.query('SELECT count(*) FROM lesson_raw_contents');

  console.log('MAIN sentrang:');
  console.log(' - lessons:', cMain.rows[0].count);
  console.log(' - raw contents:', rawMain.rows[0].count);
  console.log(' - sample:', dMain.rows);

  console.log('\nTEST sentrang_test:');
  console.log(' - lessons:', cTest.rows[0].count);
  console.log(' - raw contents:', rawTest.rows[0].count);

  await poolMain.end();
  await poolTest.end();
}

run().catch(console.error);
