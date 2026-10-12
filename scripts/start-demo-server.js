// Script khởi chạy Next.js phục vụ môi trường DEMO & UAT
// DATABASE_URL được cấu hình tường minh trỏ đến sentrang_test
// Cổng mặc định: 3000
// Thiết lập APP_ENV = "demo", kích hoạt cơ chế Fail-Fast bảo vệ

process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable";
process.env.APP_ENV = "demo";
process.env.PORT = "3000";
process.env.NODE_ENV = "production";

const { spawn } = require("child_process");
const nextBin = require.resolve("next/dist/bin/next");

console.log("==================================================================");
console.log("    TỦ SÁCH ÁO LAM V1.3 — MÁY CHỦ DEMO & UAT SẴN SÀNG            ");
console.log("==================================================================");
console.log("  • Cổng lắng nghe:     http://localhost:3000");
console.log("  • Cơ sở dữ liệu:     sentrang_test (PostgreSQL 17 Native :5434)");
console.log("  • Môi trường:        demo (Bảo vệ Fail-Fast kép)");
console.log("==================================================================\n");

const child = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  console.log(`[Demo Server] Tiến trình đã dừng với mã: ${code}`);
  process.exit(code || 0);
});
