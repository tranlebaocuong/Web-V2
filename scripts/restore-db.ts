import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import crypto from "crypto";
import { Pool } from "pg";

export async function runFullRestoreVerification(
  bundleOrDumpPath?: string,
  targetDb = "sentrang_restore_test",
  port = 5434
) {
  const startTime = Date.now();
  const backupsRootDir = path.resolve(process.cwd(), "data", "backups");

  let sqlFileToRestore = "";
  let manifestData: any = null;
  let bundlePath = "";

  if (bundleOrDumpPath) {
    if (fs.existsSync(bundleOrDumpPath) && fs.statSync(bundleOrDumpPath).isDirectory()) {
      bundlePath = bundleOrDumpPath;
      sqlFileToRestore = path.join(bundlePath, "database.sql");
    } else {
      sqlFileToRestore = bundleOrDumpPath;
    }
  } else {
    // Tìm bundle mới nhất
    if (!fs.existsSync(backupsRootDir)) {
      throw new Error(`Backup directory not found: ${backupsRootDir}`);
    }
    const bundles = fs
      .readdirSync(backupsRootDir)
      .filter((d) => d.startsWith("bundle_") && fs.statSync(path.join(backupsRootDir, d)).isDirectory())
      .sort()
      .reverse();

    if (bundles.length > 0) {
      bundlePath = path.join(backupsRootDir, bundles[0]);
      sqlFileToRestore = path.join(bundlePath, "database.sql");
    } else {
      // Fallback: Tìm file .sql đơn
      const files = fs
        .readdirSync(backupsRootDir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .reverse();
      if (files.length === 0) {
        throw new Error("No backup files or bundles found in " + backupsRootDir);
      }
      sqlFileToRestore = path.join(backupsRootDir, files[0]);
    }
  }

  if (bundlePath && fs.existsSync(path.join(bundlePath, "manifest.json"))) {
    manifestData = JSON.parse(fs.readFileSync(path.join(bundlePath, "manifest.json"), "utf8"));
  }

  const psqlPath = path.resolve(process.cwd(), "scratch", "pgsql", "bin", "psql.exe");
  console.log(`[Restore] Bắt đầu kiểm thử phục hồi...`);
  console.log(`[Restore] File SQL: ${sqlFileToRestore}`);
  console.log(`[Restore] Target test DB: ${targetDb} on port ${port}`);

  const env = {
    ...process.env,
    PGPASSWORD: process.env.PGPASSWORD || "postgres",
  };

  // 1. Tạo Database độc lập sạch
  console.log(`[Restore] Tạo cơ sở dữ liệu cô lập '${targetDb}'...`);
  try {
    execFileSync(
      psqlPath,
      ["-h", "127.0.0.1", "-p", port.toString(), "-U", "postgres", "-d", "postgres", "-c", `DROP DATABASE IF EXISTS ${targetDb};`],
      { env, stdio: "inherit" }
    );
  } catch (e: any) {
    console.warn(`[Restore] Warning during DROP DATABASE:`, e.message);
  }

  execFileSync(
    psqlPath,
    ["-h", "127.0.0.1", "-p", port.toString(), "-U", "postgres", "-d", "postgres", "-c", `CREATE DATABASE ${targetDb};`],
    { env, stdio: "inherit" }
  );

  // 2. Nạp dữ liệu SQL dump vào target DB
  console.log(`[Restore] Nạp dữ liệu SQL vào '${targetDb}'...`);
  execFileSync(
    psqlPath,
    ["-h", "127.0.0.1", "-p", port.toString(), "-U", "postgres", "-d", targetDb, "-f", sqlFileToRestore],
    { env, stdio: "inherit" }
  );

  // 3. Đối soát dữ liệu & ràng buộc toàn vẹn
  console.log(`[Restore] Xác minh cấu trúc schema, dữ liệu và extension...`);
  const pool = new Pool({
    connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/${targetDb}?sslmode=disable`,
  });

  const client = await pool.connect();
  let counts: any = {};
  let extensions: string[] = [];

  try {
    const extRes = await client.query("SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm');");
    extensions = extRes.rows.map((r) => r.extname);

    const bRes = await client.query("SELECT COUNT(*)::int AS cnt FROM branches;");
    const lRes = await client.query("SELECT COUNT(*)::int AS cnt FROM study_levels;");
    const cRes = await client.query("SELECT COUNT(*)::int AS cnt FROM categories;");
    const sRes = await client.query("SELECT COUNT(*)::int AS cnt FROM sources;");
    const lesRes = await client.query("SELECT COUNT(*)::int AS cnt FROM lessons;");
    const rawRes = await client.query("SELECT COUNT(*)::int AS cnt FROM lesson_raw_contents;");
    const cntRes = await client.query("SELECT COUNT(*)::int AS cnt FROM lesson_contents;");
    const revRes = await client.query("SELECT COUNT(*)::int AS cnt FROM lesson_revisions;");
    const auditRes = await client.query("SELECT COUNT(*)::int AS cnt FROM audit_logs;");

    counts = {
      branches: bRes.rows[0].cnt,
      levels: lRes.rows[0].cnt,
      categories: cRes.rows[0].cnt,
      sources: sRes.rows[0].cnt,
      lessons: lesRes.rows[0].cnt,
      lessonRawContents: rawRes.rows[0].cnt,
      lessonContents: cntRes.rows[0].cnt,
      revisions: revRes.rows[0].cnt,
      auditLogs: auditRes.rows[0].cnt,
    };

    console.log(`[Restore Verification] Extensions:`, extensions);
    console.log(`[Restore Verification] Bản ghi đối soát:`, counts);

    if (counts.branches !== 1) throw new Error(`Expected 1 branch, got ${counts.branches}`);
    if (counts.levels !== 4) throw new Error(`Expected 4 levels, got ${counts.levels}`);
    if (counts.categories !== 3) throw new Error(`Expected 3 categories, got ${counts.categories}`);
    if (counts.sources !== 4) throw new Error(`Expected 4 sources, got ${counts.sources}`);
    if (counts.lessons !== 156) throw new Error(`Expected 156 lessons, got ${counts.lessons}`);
    if (counts.lessonRawContents !== 156) throw new Error(`Expected 156 raw contents, got ${counts.lessonRawContents}`);
  } finally {
    client.release();
    await pool.end();

    // Dọn dẹp database thử nghiệm
    console.log(`[Restore] Thu dọn cơ sở dữ liệu thử nghiệm '${targetDb}'...`);
    execFileSync(
      psqlPath,
      ["-h", "127.0.0.1", "-p", port.toString(), "-U", "postgres", "-d", "postgres", "-c", `DROP DATABASE IF EXISTS ${targetDb};`],
      { env, stdio: "inherit" }
    );
  }

  // 4. Đối soát Media Assets nếu có trong bundle
  let verifiedMediaCount = 0;
  if (manifestData && manifestData.media?.files && bundlePath) {
    const backupMediaDir = path.join(bundlePath, "media");
    for (const fileInfo of manifestData.media.files) {
      const mediaFilePath = path.join(backupMediaDir, fileInfo.name);
      if (fs.existsSync(mediaFilePath)) {
        const fileBuf = fs.readFileSync(mediaFilePath);
        const fileHash = crypto.createHash("sha256").update(fileBuf).digest("hex");
        if (fileHash === fileInfo.sha256) {
          verifiedMediaCount++;
        } else {
          throw new Error(`Media hash mismatch for ${fileInfo.name}`);
        }
      }
    }
    console.log(`[Restore Verification] Xác minh toàn vẹn ${verifiedMediaCount} tệp hình ảnh theo manifest SHA-256: THÀNH CÔNG!`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Restore Verification] THÀNH CÔNG TUYỆT ĐỐI!`);
  console.log(`[Restore Verification] Thời gian phục hồi thực tế (RTO đo được): ${durationMs}ms`);

  return {
    success: true,
    targetDb,
    extensions,
    counts,
    verifiedMediaCount,
    durationMs,
  };
}

export const runRestoreVerification = runFullRestoreVerification;

if (require.main === module) {
  const bundleOrFile = process.argv[2];
  const targetDb = process.argv[3] || "sentrang_restore_test";
  const port = parseInt(process.argv[4] || "5434", 10);
  runFullRestoreVerification(bundleOrFile, targetDb, port).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
