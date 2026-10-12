import * as path from 'path';
import * as fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { createServer, LogLevel } from 'pglite-server';

const dataDir = path.resolve(process.cwd(), 'data/sentrang-pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`[SEN TRẮNG DB] Khởi chạy PostgreSQL Engine tại: ${dataDir}`);

const db = new PGlite(dataDir, {
  extensions: {
    pg_trgm,
    unaccent,
  },
});

const port = parseInt(process.env.PG_PORT || '5433', 10);

async function start() {
  await db.waitReady;
  
  // Kích hoạt extensions theo đặc tả V1.3
  await db.exec(`
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  `);
  console.log('[SEN TRẮNG DB] Đã kích hoạt extension unaccent và pg_trgm.');

  const server = createServer(db, {
    logLevel: LogLevel.Warn,
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[SEN TRẮNG DB] PostgreSQL wire-protocol server listening on 127.0.0.1:${port}`);
    console.log(`[SEN TRẮNG DB] Connection URL: postgresql://postgres:postgres@127.0.0.1:${port}/sentrang?schema=public`);
  });

  const shutdown = async () => {
    console.log('\n[SEN TRẮNG DB] Đang dừng máy chủ cơ sở dữ liệu...');
    server.close();
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[SEN TRẮNG DB] Khởi chạy thất bại:', err);
  process.exit(1);
});
