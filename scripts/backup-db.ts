import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import crypto from "crypto";

export async function runFullBackup(dbName = "sentrang", port = 5434) {
  const startTime = Date.now();
  const backupsRootDir = path.resolve(process.cwd(), "data", "backups");
  if (!fs.existsSync(backupsRootDir)) {
    fs.mkdirSync(backupsRootDir, { recursive: true });
  }

  // Đảm bảo thư mục backup được bảo vệ không commit vào git
  const gitignorePath = path.join(backupsRootDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, "*\n!.gitignore\n!README.md\n", "utf8");
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "_")
    .replace(/\..+/, "");

  const bundleDir = path.join(backupsRootDir, `bundle_${dbName}_${timestamp}`);
  fs.mkdirSync(bundleDir, { recursive: true });

  const backupSqlFile = path.join(bundleDir, "database.sql");
  const backupMediaDir = path.join(bundleDir, "media");
  fs.mkdirSync(backupMediaDir, { recursive: true });

  const pgDumpPath = path.resolve(process.cwd(), "scratch", "pgsql", "bin", "pg_dump.exe");

  console.log(`[Backup] Bắt đầu sao lưu toàn diện cho '${dbName}' trên cổng ${port}...`);
  console.log(`[Backup] Thư mục gói sao lưu: ${bundleDir}`);

  // 1. Sao lưu Cơ sở dữ liệu bằng pg_dump
  const env = {
    ...process.env,
    PGPASSWORD: process.env.PGPASSWORD || "postgres",
  };

  const args = [
    "-h", "127.0.0.1",
    "-p", port.toString(),
    "-U", "postgres",
    "-d", dbName,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "-f", backupSqlFile,
  ];

  execFileSync(pgDumpPath, args, { env, stdio: "inherit" });

  const sqlStats = fs.statSync(backupSqlFile);
  const sqlBuffer = fs.readFileSync(backupSqlFile);
  const sqlSha256 = crypto.createHash("sha256").update(sqlBuffer).digest("hex");

  // 2. Sao lưu Tài sản Hình ảnh từ data/media/
  const sourceMediaDir = path.resolve(process.cwd(), "data", "media");
  const mediaFilesManifest: Array<{ name: string; size: number; sha256: string }> = [];

  if (fs.existsSync(sourceMediaDir)) {
    const files = fs.readdirSync(sourceMediaDir);
    for (const file of files) {
      const srcFile = path.join(sourceMediaDir, file);
      const destFile = path.join(backupMediaDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        const fileBuf = fs.readFileSync(destFile);
        const fileHash = crypto.createHash("sha256").update(fileBuf).digest("hex");
        mediaFilesManifest.push({
          name: file,
          size: fileBuf.length,
          sha256: fileHash,
        });
      }
    }
  }

  // 3. Tạo Tệp kê khai toàn vẹn (manifest.json)
  const manifest = {
    version: "1.3",
    timestamp: new Date().toISOString(),
    database: {
      name: dbName,
      file: "database.sql",
      sizeBytes: sqlStats.size,
      sha256: sqlSha256,
    },
    media: {
      count: mediaFilesManifest.length,
      files: mediaFilesManifest,
    },
    system: {
      engine: "PostgreSQL 17.4 Native x64",
      platform: process.platform,
    },
  };

  const manifestPath = path.join(bundleDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  // Also maintain legacy single sql file for backward compatibility
  const legacySqlPath = path.join(backupsRootDir, `${dbName}_backup_${timestamp}.sql`);
  fs.copyFileSync(backupSqlFile, legacySqlPath);

  const durationMs = Date.now() - startTime;

  console.log(`[Backup] HOÀN TẤT SAO LƯU TOÀN DIỆN!`);
  console.log(`[Backup] Thư mục: ${bundleDir}`);
  console.log(`[Backup] SQL Dump: ${sqlStats.size} bytes (SHA-256: ${sqlSha256})`);
  console.log(`[Backup] Media Files: ${mediaFilesManifest.length} tệp`);
  console.log(`[Backup] Thời gian thực thi (RTO tiềm năng): ${durationMs}ms`);

  return {
    success: true,
    bundleDir,
    backupFile: backupSqlFile,
    legacySqlFile: legacySqlPath,
    sizeBytes: sqlStats.size,
    sha256: sqlSha256,
    mediaCount: mediaFilesManifest.length,
    durationMs,
  };
}

export const runBackup = runFullBackup;

if (require.main === module) {
  const targetDb = process.argv[2] || "sentrang";
  const targetPort = parseInt(process.argv[3] || "5434", 10);
  runFullBackup(targetDb, targetPort).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
