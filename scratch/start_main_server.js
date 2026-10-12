// Script khởi động máy chủ chính (Production-ready) lắng nghe tại port 3001
// Gán tường minh DATABASE_URL trỏ đến sentrang
process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable";
process.env.PORT = "3001";
process.env.NODE_ENV = "production";

const { spawn } = require("child_process");
const nextBin = require.resolve("next/dist/bin/next");

console.log("[Server 3001] Khởi chạy với DATABASE_URL=sentrang tại cổng 3001");
const child = spawn(process.execPath, [nextBin, "start", "-p", "3001"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  console.log(`[Server 3001] Đã thoát với mã: ${code}`);
  process.exit(code || 0);
});
