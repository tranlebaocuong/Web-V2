// Script khởi động máy chủ thử nghiệm (Test/Staging) lắng nghe tại port 3002
// Gán tường minh DATABASE_URL trỏ đến sentrang_test
process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable";
process.env.PORT = "3002";
process.env.NODE_ENV = "test";

const { spawn } = require("child_process");
const nextBin = require.resolve("next/dist/bin/next");

console.log("[Server 3002] Khởi chạy với DATABASE_URL=sentrang_test tại cổng 3002");
const child = spawn(process.execPath, [nextBin, "start", "-p", "3002"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  console.log(`[Server 3002] Đã thoát với mã: ${code}`);
  process.exit(code || 0);
});
