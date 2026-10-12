import { getValidatedDatabaseUrl } from "../src/lib/prisma";

async function runDbConfigTests() {
  console.log("=== KIỂM THỬ CẤU HÌNH DATABASE & CƠ CHẾ FAIL-FAST ===");

  let passed = 0;
  let total = 0;

  function assert(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name} -> ${err.message}`);
    }
  }

  // 1. Kiểm thử thiếu DATABASE_URL
  assert("Ném lỗi khi DATABASE_URL rỗng hoặc thiếu", () => {
    let threw = false;
    try {
      getValidatedDatabaseUrl("");
    } catch (e: any) {
      threw = e.message.includes("[CONFIG_ERROR] DATABASE_URL is missing");
    }
    if (!threw) throw new Error("Expected CONFIG_ERROR for empty URL");
  });

  // 2. Kiểm thử định dạng URL sai
  assert("Ném lỗi khi DATABASE_URL sai định dạng URI", () => {
    let threw = false;
    try {
      getValidatedDatabaseUrl("not-a-valid-url");
    } catch (e: any) {
      threw = e.message.includes("[CONFIG_ERROR] Invalid DATABASE_URL format");
    }
    if (!threw) throw new Error("Expected CONFIG_ERROR for malformed URL");
  });

  // 3. Kiểm thử sai protocol (http thay vì postgres)
  assert("Ném lỗi khi protocol không phải postgresql/postgres", () => {
    let threw = false;
    try {
      getValidatedDatabaseUrl("http://localhost:5432/sentrang");
    } catch (e: any) {
      threw = e.message.includes("is invalid. Must start with postgresql: or postgres:");
    }
    if (!threw) throw new Error("Expected error for non-postgres protocol");
  });

  // 4. Kiểm thử Fail-Fast: Production kết nối nhầm sentrang_test
  assert("Cơ chế Fail-Fast kích hoạt khi Production trỏ tới sentrang_test", () => {
    let threw = false;
    try {
      getValidatedDatabaseUrl(
        "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable",
        "production"
      );
    } catch (e: any) {
      threw = e.message.includes("[FAIL_FAST_SAFETY] Production environment detected with a test database");
    }
    if (!threw) throw new Error("Expected FAIL_FAST_SAFETY error");
  });

  // 5. Kiểm thử Production kết nối sentrang chính xác
  assert("Cho phép kết nối hợp lệ trên Production với database chính sentrang", () => {
    const url = getValidatedDatabaseUrl(
      "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable",
      "production"
    );
    if (!url.includes("sentrang")) throw new Error("Expected valid url return");
  });

  // 6. Kiểm thử Môi trường Test kết nối sentrang_test
  assert("Cho phép kết nối tới sentrang_test khi không ở môi trường production", () => {
    const url = getValidatedDatabaseUrl(
      "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable",
      "test"
    );
    if (!url.includes("sentrang_test")) throw new Error("Expected test db url");
  });

  // 7. Kiểm thử Fail-Fast Demo: Demo kết nối nhầm database chính sentrang
  assert("Cơ chế Fail-Fast kích hoạt khi Demo cố tình trỏ tới database chính sentrang", () => {
    let threw = false;
    try {
      getValidatedDatabaseUrl(
        "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable",
        "demo"
      );
    } catch (e: any) {
      threw = e.message.includes("[FAIL_FAST_SAFETY] Demo environment detected with main/production database");
    }
    if (!threw) throw new Error("Expected FAIL_FAST_SAFETY error for demo connecting to main db");
  });

  // 8. Kiểm thử Demo kết nối sentrang_test hợp lệ
  assert("Cho phép Demo kết nối an toàn tới sentrang_test", () => {
    const url = getValidatedDatabaseUrl(
      "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable",
      "demo"
    );
    if (!url.includes("sentrang_test")) throw new Error("Expected sentrang_test url");
  });

  console.log(`\nKết quả: ${passed}/${total} test cấu hình DB ĐẠT.`);
  if (passed !== total) process.exit(1);
}

runDbConfigTests();
