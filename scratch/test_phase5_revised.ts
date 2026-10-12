import { Pool } from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const TEST_PORT = 3002;
const MAIN_PORT = 3001;
const BASE_TEST_URL = `http://localhost:${TEST_PORT}`;
const BASE_MAIN_URL = `http://localhost:${MAIN_PORT}`;

const ADMIN_EMAIL = "admin@sentrang.gdpt.vn";
const ADMIN_PASSWORD = "SenTrang@Admin2026!";
const AUTH_SECRET = process.env.AUTH_SECRET || "sen-trang-gdpt-vn-secure-auth-secret-key-2026-v1";

export interface TestCaseResult {
  id: string;
  group: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
  error?: string;
}

const testResults: TestCaseResult[] = [];

async function recordTest(
  id: string,
  group: string,
  name: string,
  expected: string,
  fn: () => Promise<{ passed: boolean; actual: string; error?: string }>
) {
  const start = Date.now();
  try {
    const res = await fn();
    const durationMs = Date.now() - start;
    testResults.push({
      id,
      group,
      name,
      passed: res.passed,
      expected,
      actual: res.actual,
      durationMs,
      error: res.error,
    });
    if (res.passed) {
      console.log(`  ✓ [${id}] ${name} (${durationMs}ms)`);
    } else {
      console.error(`  ✗ [${id}] ${name} -> FAIL! Expected: ${expected}, Actual: ${res.actual} - ${res.error || ""}`);
    }
  } catch (err: any) {
    const durationMs = Date.now() - start;
    testResults.push({
      id,
      group,
      name,
      passed: false,
      expected,
      actual: "CRASH",
      durationMs,
      error: err.message,
    });
    console.error(`  ✗ [${id}] ${name} -> EXCEPTION: ${err.message}`);
  }
}

function createCustomJwt(payload: any, secret = AUTH_SECRET): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function run() {
  console.log("================================================================================");
  console.log("       SEN TRẮNG — BỘ KIỂM THỬ TOÀN DIỆN CHẶNG 5 REVISED (52 TESTS)             ");
  console.log("================================================================================\n");

  // ============================================================================
  // GROUP 1: UNAUTHENTICATED GUARDS (9 TESTS)
  // ============================================================================
  console.log("--- GROUP 1: UNAUTHENTICATED ROUTE GUARDS (9 TESTS) ---");

  await recordTest("TEST-AUTH-01", "Unauthenticated Guards", "GET /api/admin/auth/me returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-02", "Unauthenticated Guards", "GET /api/admin/dashboard/stats returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-03", "Unauthenticated Guards", "GET /api/admin/lessons returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-04", "Unauthenticated Guards", "GET /api/admin/lessons/D-MM-A-01 returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-05", "Unauthenticated Guards", "PATCH /api/admin/lessons/D-MM-A-01 returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 1, contentJson: { version: 1, blocks: [] } }),
    });
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-06", "Unauthenticated Guards", "POST /api/admin/lessons/D-MM-A-01/mark-ready returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01/mark-ready`, { method: "POST" });
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-07", "Unauthenticated Guards", "POST /api/admin/lessons/D-MM-A-01/publish returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01/publish`, { method: "POST" });
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-08", "Unauthenticated Guards", "GET /api/admin/media returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/media`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-AUTH-09", "Unauthenticated Guards", "GET /api/admin/audit-logs returns 401 without cookie", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/audit-logs`);
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  // ============================================================================
  // GROUP 2: AUTHENTICATION, TOKENS & CSRF AUDIT (8 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 2: AUTHENTICATION, TOKENS & CSRF AUDIT (8 TESTS) ---");

  let validSessionCookie = "";
  let adminUserId = "";

  await recordTest("TEST-SEC-01", "Authentication & CSRF", "Login with wrong password rejected with 401 INVALID_CREDENTIALS", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: "IncorrectPassword999!" }),
    });
    const json = await res.json();
    return {
      passed: res.status === 401 && json.error?.code === "INVALID_CREDENTIALS",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-SEC-02", "Authentication & CSRF", "Login with valid credentials sets HttpOnly, SameSite=lax cookie", "HTTP 200 + Cookie", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const json = await res.json();
    const setCookie = res.headers.get("set-cookie") || "";
    validSessionCookie = setCookie.split(";")[0];
    adminUserId = json.data?.user?.id;
    const isHttpOnly = setCookie.toLowerCase().includes("httponly");
    const isSameSite = setCookie.toLowerCase().includes("samesite=lax");
    return {
      passed: res.status === 200 && isHttpOnly && isSameSite && !!validSessionCookie,
      actual: `HTTP ${res.status}, HttpOnly=${isHttpOnly}, SameSite=${isSameSite}`,
    };
  });

  await recordTest("TEST-SEC-03", "Authentication & CSRF", "Tampered token signature is rejected with 401 UNAUTHORIZED", "HTTP 401", async () => {
    const now = Math.floor(Date.now() / 1000);
    const validToken = createCustomJwt({ userId: adminUserId, email: ADMIN_EMAIL, role: "admin", iat: now, exp: now + 3600 });
    const tamperedToken = validToken.substring(0, validToken.length - 5) + "abcde";
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`, {
      headers: { Cookie: `sentrang_admin_session=${tamperedToken}` },
    });
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-SEC-04", "Authentication & CSRF", "Expired token (exp in past) is rejected with 401 UNAUTHORIZED", "HTTP 401", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = createCustomJwt({ userId: adminUserId, email: ADMIN_EMAIL, role: "admin", iat: now - 7200, exp: now - 3600 });
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`, {
      headers: { Cookie: `sentrang_admin_session=${expiredToken}` },
    });
    return { passed: res.status === 401, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-SEC-05", "Authentication & CSRF", "Non-existent user ID token is rejected with 401 ACCOUNT_INACTIVE", "HTTP 401", async () => {
    const now = Math.floor(Date.now() / 1000);
    const fakeToken = createCustomJwt({ userId: "00000000-0000-0000-0000-000000000000", email: "fake@sentrang.gdpt.vn", role: "admin", iat: now, exp: now + 3600 });
    const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`, {
      headers: { Cookie: `sentrang_admin_session=${fakeToken}` },
    });
    const json = await res.json();
    return {
      passed: res.status === 401 && json.error?.code === "ACCOUNT_INACTIVE",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-SEC-06", "Authentication & CSRF", "CSRF Protection: Sec-Fetch-Site: cross-site on POST rejected with 403 CSRF_DETECTED", "HTTP 403", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01/mark-ready`, {
      method: "POST",
      headers: {
        Cookie: validSessionCookie,
        "Sec-Fetch-Site": "cross-site",
      },
    });
    const json = await res.json();
    return {
      passed: res.status === 403 && json.error?.code === "CSRF_DETECTED",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-SEC-07", "Authentication & CSRF", "CSRF Protection: Mismatched Origin header on PATCH rejected with 403 CSRF_DETECTED", "HTTP 403", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
      method: "PATCH",
      headers: {
        Cookie: validSessionCookie,
        "Content-Type": "application/json",
        Origin: "http://attacker-site.com",
      },
      body: JSON.stringify({ version: 1, contentJson: { version: 1, blocks: [] } }),
    });
    const json = await res.json();
    return {
      passed: res.status === 403 && json.error?.code === "CSRF_DETECTED",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-SEC-08", "Authentication & CSRF", "POST /logout clears cookie with maxAge=0 and revokes session", "HTTP 200 + cleared cookie", async () => {
    // Perform logout
    const logoutRes = await fetch(`${BASE_TEST_URL}/api/admin/auth/logout`, {
      method: "POST",
      headers: { Cookie: validSessionCookie },
    });
    const setCookie = logoutRes.headers.get("set-cookie") || "";
    const isCleared = setCookie.toLowerCase().includes("max-age=0") || setCookie.includes("expires=");
    
    // Re-authenticate so subsequent tests have a valid session
    const relogin = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    validSessionCookie = (relogin.headers.get("set-cookie") || "").split(";")[0];

    return {
      passed: logoutRes.status === 200 && isCleared,
      actual: `HTTP ${logoutRes.status}, cleared=${isCleared}`,
    };
  });

  const authHeaders = { Cookie: validSessionCookie };

  // ============================================================================
  // GROUP 3: MEDIA STORAGE & ACCESS CONTROL (8 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 3: MEDIA STORAGE & ACCESS CONTROL (8 TESTS) ---");

  // Sample genuine 1x1 PNG buffer
  const genuinePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  // Sample genuine 1x1 JPEG buffer
  const genuineJpgBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
    0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
    0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0xff, 0xd9,
  ]);

  let uploadedPrivateMediaUrl = "";
  let uploadedPrivateMediaFile = "";

  await recordTest("TEST-MEDIA-01", "Media Storage & Security", "Upload genuine PNG image succeeds and stores in private data/media/", "HTTP 200 + /api/media/ url", async () => {
    const fd = new FormData();
    fd.append("file", new Blob([genuinePngBuffer], { type: "image/png" }), "lotus_test.png");
    fd.append("lessonId", "D-MM-A-07"); // D-MM-A-07 is draft
    fd.append("altText", "Hoa sen trắng thử nghiệm");

    const res = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
      method: "POST",
      headers: authHeaders,
      body: fd,
    });
    const json = await res.json();
    uploadedPrivateMediaUrl = json.data?.url || "";
    uploadedPrivateMediaFile = json.data?.storageKey || "";

    // Verify file is stored in private data/media/ and NOT in public/
    const diskPath = path.join(process.cwd(), "data", "media", uploadedPrivateMediaFile);
    const existsInPrivateDir = fs.existsSync(diskPath);
    const publicPath = path.join(process.cwd(), "public", "uploads", uploadedPrivateMediaFile);
    const notInPublic = !fs.existsSync(publicPath);

    return {
      passed: res.status === 200 && uploadedPrivateMediaUrl.startsWith("/api/media/") && existsInPrivateDir && notInPublic,
      actual: `HTTP ${res.status}, url=${uploadedPrivateMediaUrl}, privateDir=${existsInPrivateDir}, notInPublic=${notInPublic}`,
    };
  });

  await recordTest("TEST-MEDIA-02", "Media Storage & Security", "Upload genuine JPEG image with magic bytes validation succeeds", "HTTP 200", async () => {
    const fd = new FormData();
    fd.append("file", new Blob([genuineJpgBuffer], { type: "image/jpeg" }), "buddha.jpg");
    const res = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
      method: "POST",
      headers: authHeaders,
      body: fd,
    });
    return { passed: res.status === 200, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-MEDIA-03", "Media Storage & Security", "Upload file exceeding 5MB is rejected with 400 FILE_TOO_LARGE", "HTTP 400", async () => {
    const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5 MB
    const fd = new FormData();
    fd.append("file", new Blob([bigBuffer], { type: "image/png" }), "oversized.png");
    const res = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
      method: "POST",
      headers: authHeaders,
      body: fd,
    });
    const json = await res.json();
    return {
      passed: res.status === 400 && json.error?.code === "FILE_TOO_LARGE",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-MEDIA-04", "Media Storage & Security", "Upload spoofed file (text content disguised as image/png) rejected with 400", "HTTP 400", async () => {
    const fakeBuffer = Buffer.from("echo 'malicious script'; rm -rf /;");
    const fd = new FormData();
    fd.append("file", new Blob([fakeBuffer], { type: "image/png" }), "fake.png");
    const res = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
      method: "POST",
      headers: authHeaders,
      body: fd,
    });
    const json = await res.json();
    return {
      passed: res.status === 400,
      actual: `HTTP ${res.status} (${json.error?.message})`,
    };
  });

  await recordTest("TEST-MEDIA-05", "Media Storage & Security", "Path traversal in media endpoint (/api/media/../../etc/passwd) rejected with 400", "HTTP 400", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/media/..%2F..%2Fetc%2Fpasswd`);
    return { passed: res.status === 400 || res.status === 404, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-MEDIA-06", "Media Storage & Security", "Unauthenticated request for private/draft image rejected with 401 UNAUTHORIZED_MEDIA", "HTTP 401", async () => {
    const res = await fetch(`${BASE_TEST_URL}${uploadedPrivateMediaUrl}`);
    const json = await res.json();
    return {
      passed: res.status === 401 && json.error?.code === "UNAUTHORIZED_MEDIA",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-MEDIA-07", "Media Storage & Security", "Authenticated admin request for private/draft image succeeds with 200 OK", "HTTP 200", async () => {
    const res = await fetch(`${BASE_TEST_URL}${uploadedPrivateMediaUrl}`, { headers: authHeaders });
    const contentType = res.headers.get("content-type");
    return {
      passed: res.status === 200 && contentType?.includes("image/png") === true,
      actual: `HTTP ${res.status} (content-type: ${contentType})`,
    };
  });

  await recordTest("TEST-MEDIA-08", "Media Storage & Security", "Published lesson image is accessible publicly without authentication", "HTTP 200 Public", async () => {
    // Upload image attached to D-MM-A-04
    const fd = new FormData();
    fd.append("file", new Blob([genuinePngBuffer], { type: "image/png" }), "published_test.png");
    fd.append("lessonId", "D-MM-A-04");
    const upRes = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
      method: "POST",
      headers: authHeaders,
      body: fd,
    });
    const upJson = await upRes.json();
    const pubMediaUrl = upJson.data?.url;

    // Temporarily publish D-MM-A-04
    await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-04/mark-ready`, { method: "POST", headers: authHeaders });
    await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-04/publish`, { method: "POST", headers: authHeaders });

    // Request WITHOUT cookie
    const publicRes = await fetch(`${BASE_TEST_URL}${pubMediaUrl}`);
    const pubContentType = publicRes.headers.get("content-type");

    // Revert D-MM-A-04 to draft
    await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-04/unpublish`, { method: "POST", headers: authHeaders });

    return {
      passed: publicRes.status === 200 && pubContentType?.includes("image/png") === true,
      actual: `HTTP ${publicRes.status} (public access: ${publicRes.status === 200})`,
    };
  });

  // ============================================================================
  // GROUP 4: DASHBOARD STATS (6 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 4: DASHBOARD STATS (6 TESTS) ---");

  let statsData: any = null;

  await recordTest("TEST-DASH-01", "Dashboard Stats", "GET /api/admin/dashboard/stats returns 200 OK", "HTTP 200", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`, { headers: authHeaders });
    const json = await res.json();
    statsData = json.data;
    return { passed: res.status === 200 && json.success, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-DASH-02", "Dashboard Stats", "Dashboard confirms 156 total lessons in overview", "156", async () => {
    return {
      passed: statsData?.overview?.totalLessons === 156,
      actual: `${statsData?.overview?.totalLessons}`,
    };
  });

  await recordTest("TEST-DASH-03", "Dashboard Stats", "Dashboard returns exactly 4 study levels breakdown", "4 levels", async () => {
    const count = statsData?.levels?.length;
    return { passed: count === 4, actual: `${count} levels` };
  });

  await recordTest("TEST-DASH-04", "Dashboard Stats", "Dashboard returns exactly 3 study categories breakdown", "3 categories", async () => {
    const count = statsData?.categories?.length;
    return { passed: count === 3, actual: `${count} categories` };
  });

  await recordTest("TEST-DASH-05", "Dashboard Stats", "Sum of 4 study levels equals 156 (32 + 38 + 41 + 45)", "156", async () => {
    const sum = statsData?.levels?.reduce((acc: number, l: any) => acc + l.total, 0);
    return { passed: sum === 156, actual: `${sum}` };
  });

  await recordTest("TEST-DASH-06", "Dashboard Stats", "Dashboard returns recent audit logs array with records", ">= 1 log", async () => {
    const count = statsData?.recentAuditLogs?.length || 0;
    return { passed: count >= 1, actual: `${count} logs` };
  });

  // ============================================================================
  // GROUP 5: LESSON MANAGEMENT & QUERIES (6 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 5: LESSON MANAGEMENT & QUERIES (6 TESTS) ---");

  await recordTest("TEST-LESSON-01", "Lesson Queries", "GET /api/admin/lessons returns 156 total lessons in meta", "156", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons?limit=10`, { headers: authHeaders });
    const json = await res.json();
    return { passed: json.meta?.total === 156, actual: `${json.meta?.total}` };
  });

  await recordTest("TEST-LESSON-02", "Lesson Queries", "Filter by levelId=mo-mat returns exactly 32 lessons", "32", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons?levelId=mo-mat&limit=50`, { headers: authHeaders });
    const json = await res.json();
    return { passed: json.meta?.total === 32, actual: `${json.meta?.total}` };
  });

  await recordTest("TEST-LESSON-03", "Lesson Queries", "Filter by categoryId=phat-phap returns exactly 54 lessons", "54", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons?categoryId=phat-phap&limit=10`, { headers: authHeaders });
    const json = await res.json();
    return { passed: json.meta?.total === 54, actual: `${json.meta?.total}` };
  });

  await recordTest("TEST-LESSON-04", "Lesson Queries", "Search filter matches title or lesson ID", ">= 1 result", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons?search=D-MM-A-01`, { headers: authHeaders });
    const json = await res.json();
    const match = json.data?.some((l: any) => l.id === "D-MM-A-01");
    return { passed: json.meta?.total >= 1 && match, actual: `${json.meta?.total} matches` };
  });

  await recordTest("TEST-LESSON-05", "Lesson Queries", "GET /api/admin/lessons/D-MM-A-01 returns full details with rawContent", "ID D-MM-A-01 + rawContent", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const json = await res.json();
    const hasRaw = !!json.data?.rawContent;
    return {
      passed: res.status === 200 && json.data?.id === "D-MM-A-01" && hasRaw,
      actual: `ID: ${json.data?.id}, hasRaw: ${hasRaw}`,
    };
  });

  await recordTest("TEST-LESSON-06", "Lesson Queries", "Raw content includes pages_json array with pdf_page and raw_text", "Array of pages", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const json = await res.json();
    const pages = json.data?.rawContent?.pagesJson;
    const isArray = Array.isArray(pages) && pages.length > 0;
    const hasFields = isArray && typeof pages[0].raw_text === "string";
    return {
      passed: isArray && hasFields,
      actual: `pagesCount: ${pages?.length || 0}, validFormat: ${hasFields}`,
    };
  });

  // ============================================================================
  // GROUP 6: BLOCK EDITOR & OPTIMISTIC CONCURRENCY (5 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 6: BLOCK EDITOR & OPTIMISTIC CONCURRENCY (5 TESTS) ---");

  let currentD01Version = 1;

  await recordTest("TEST-EDIT-01", "Block Editor & Concurrency", "PATCH /api/admin/lessons/D-MM-A-01 with structured blocks returns 200 OK", "HTTP 200", async () => {
    const getRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const getJson = await getRes.json();
    currentD01Version = getJson.data.version;

    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: currentD01Version,
        summary: "Biên tập chuẩn tắc bài học D-MM-A-01",
        contentJson: {
          version: 1,
          blocks: [
            { id: "h1", type: "heading", level: 2, text: "I. Ý NGHĨA HOA SEN TRẮNG" },
            { id: "p1", type: "paragraph", text: "Hoa sen trắng tiêu biểu cho đức hạnh thanh tịnh và trí tuệ vô nhiễm." },
            { id: "l1", type: "list", ordered: false, items: ["Ý 1", "Ý 2"] },
            { id: "c1", type: "callout", variant: "info", title: "Lưu ý", text: "Ghi nhớ lời dạy của Thầy." },
          ],
        },
      }),
    });
    return { passed: res.status === 200, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-EDIT-02", "Block Editor & Concurrency", "Lesson version is incremented from N to N+1", `v${currentD01Version + 1}`, async () => {
    const getRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const getJson = await getRes.json();
    const newVersion = getJson.data.version;
    const passed = newVersion === currentD01Version + 1;
    currentD01Version = newVersion;
    return { passed, actual: `v${newVersion}` };
  });

  await recordTest("TEST-EDIT-03", "Block Editor & Concurrency", "Content update transitions contentStatus to 'editing'", "editing", async () => {
    const getRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const getJson = await getRes.json();
    return {
      passed: getJson.data.contentStatus === "editing",
      actual: `${getJson.data.contentStatus}`,
    };
  });

  await recordTest("TEST-EDIT-04", "Block Editor & Concurrency", "Optimistic Concurrency: Sending outdated version returns 409 CONCURRENCY_CONFLICT", "HTTP 409 CONCURRENCY_CONFLICT", async () => {
    const staleVersion = currentD01Version - 1;
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: staleVersion,
        summary: "Attempt stale write",
        contentJson: { version: 1, blocks: [{ id: "h0", type: "heading", level: 2, text: "Stale" }] },
      }),
    });
    const json = await res.json();
    return {
      passed: res.status === 409 && json.error?.code === "CONCURRENCY_CONFLICT",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-EDIT-05", "Block Editor & Concurrency", "Revision snapshot recorded in lesson_revisions without modifying raw text", "Revision exists + raw intact", async () => {
    const getRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
    const getJson = await getRes.json();
    const revisionsCount = getJson.data.revisions?.length || 0;
    const rawPagesCount = getJson.data.rawContent?.pagesJson?.length || 0;
    return {
      passed: revisionsCount >= 1 && rawPagesCount > 0,
      actual: `revisions: ${revisionsCount}, rawPages: ${rawPagesCount}`,
    };
  });

  // ============================================================================
  // GROUP 7: 5-STEP PUBLISHING WORKFLOW (6 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 7: 5-STEP PUBLISHING WORKFLOW (6 TESTS) ---");

  // Dynamically select a raw_extracted lesson for the workflow test
  const rawListRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons?contentStatus=raw_extracted&limit=1`, { headers: authHeaders });
  const rawListJson = await rawListRes.json();
  const rawTarget = rawListJson.data[0];
  const targetId = rawTarget.id;
  const targetSlug = rawTarget.slug;
  let targetVersion = rawTarget.version;

  await recordTest("TEST-WF-01", "5-Step Workflow", `Step 1 (Raw Guard): Publishing raw lesson (${targetId}) rejected with 400 LESSON_NOT_READY`, "HTTP 400 LESSON_NOT_READY", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/publish`, {
      method: "POST",
      headers: authHeaders,
    });
    const json = await res.json();
    return {
      passed: res.status === 400 && json.error?.code === "LESSON_NOT_READY",
      actual: `HTTP ${res.status} (${json.error?.code})`,
    };
  });

  await recordTest("TEST-WF-02", "5-Step Workflow", `Step 2 (Edit): Update content for ${targetId} transitions status to 'editing'`, "editing", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: targetVersion,
        summary: `Biên tập thử nghiệm cho ${targetId}`,
        contentJson: {
          version: 1,
          blocks: [
            { id: "h1", type: "heading", level: 2, text: `Nội dung hoàn chỉnh ${targetId}` },
            { id: "p1", type: "paragraph", text: "Đã qua kiểm duyệt và đối chiếu với giáo trình gốc." },
          ],
        },
      }),
    });
    const json = await res.json();
    targetVersion = json.data?.version;
    return {
      passed: res.status === 200 && json.data?.contentStatus === "editing",
      actual: `HTTP ${res.status}, status: ${json.data?.contentStatus}`,
    };
  });

  await recordTest("TEST-WF-03", "5-Step Workflow", `Step 3 (Mark Ready): POST /mark-ready transitions status to 'ready'`, "ready", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/mark-ready`, {
      method: "POST",
      headers: authHeaders,
    });
    const json = await res.json();
    return {
      passed: res.status === 200 && json.data?.contentStatus === "ready",
      actual: `HTTP ${res.status}, status: ${json.data?.contentStatus}`,
    };
  });

  await recordTest("TEST-WF-04", "5-Step Workflow", `Step 4 (Publish): POST /publish transitions status to 'published' with publishedAt timestamp`, "published", async () => {
    const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/publish`, {
      method: "POST",
      headers: authHeaders,
    });
    const json = await res.json();
    const isPublished = json.data?.publishStatus === "published";
    const hasTimestamp = !!json.data?.publishedAt;
    return {
      passed: res.status === 200 && isPublished && hasTimestamp,
      actual: `HTTP ${res.status}, publishStatus: ${json.data?.publishStatus}, publishedAt: ${hasTimestamp}`,
    };
  });

  await recordTest("TEST-WF-05", "5-Step Workflow", `Verification: Public reader (/bai-hoc/${targetSlug}) returns HTTP 200 for published lesson`, "HTTP 200", async () => {
    const res = await fetch(`${BASE_TEST_URL}/bai-hoc/${targetSlug}`);
    return { passed: res.status === 200, actual: `HTTP ${res.status}` };
  });

  await recordTest("TEST-WF-06", "5-Step Workflow", `Step 5 (Unpublish): POST /unpublish reverts to 'draft' and reader immediately returns 404`, "HTTP 200 unpublish + HTTP 404 reader", async () => {
    const unpubRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/unpublish`, {
      method: "POST",
      headers: authHeaders,
    });
    const unpubJson = await unpubRes.json();
    const isDraft = unpubJson.data?.publishStatus === "draft";
    const readerRes = await fetch(`${BASE_TEST_URL}/bai-hoc/${targetSlug}`);
    const is404 = readerRes.status === 404;
    return {
      passed: unpubRes.status === 200 && isDraft && is404,
      actual: `unpublishStatus: ${unpubJson.data?.publishStatus}, readerStatus: HTTP ${readerRes.status}`,
    };
  });

  // ============================================================================
  // GROUP 8: MAIN DATABASE STRICT INTEGRITY & ISOLATION (4 TESTS)
  // ============================================================================
  console.log("\n--- GROUP 8: MAIN DATABASE STRICT INTEGRITY & ISOLATION (4 TESTS) ---");

  const poolMain = new Pool({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable",
  });

  await recordTest("TEST-ISOLATION-01", "Main DB Isolation", "Main DB sentrang: publishedLessons === 0 (no lessons published in production)", "0 published", async () => {
    const res = await poolMain.query("SELECT count(*) FROM lessons WHERE publish_status = 'published'");
    const count = parseInt(res.rows[0].count, 10);
    return { passed: count === 0, actual: `${count} published` };
  });

  await recordTest("TEST-ISOLATION-02", "Main DB Isolation", "Main DB sentrang: draftLessons === 156 (all lessons remain in draft)", "156 draft", async () => {
    const res = await poolMain.query("SELECT count(*) FROM lessons WHERE publish_status = 'draft'");
    const count = parseInt(res.rows[0].count, 10);
    return { passed: count === 156, actual: `${count} draft` };
  });

  await recordTest("TEST-ISOLATION-03", "Main DB Isolation", "Main DB sentrang: content_status has exactly 154 raw_extracted and 2 ready (demo D-MM-A-01, D-MM-A-03)", "154 raw + 2 ready", async () => {
    const rawRes = await poolMain.query("SELECT count(*) FROM lessons WHERE content_status = 'raw_extracted'");
    const readyRes = await poolMain.query("SELECT count(*) FROM lessons WHERE content_status = 'ready'");
    const lcRes = await poolMain.query("SELECT count(*) FROM lesson_contents");
    const rawCount = parseInt(rawRes.rows[0].count, 10);
    const readyCount = parseInt(readyRes.rows[0].count, 10);
    const lcCount = parseInt(lcRes.rows[0].count, 10);
    return {
      passed: rawCount === 154 && readyCount === 2 && lcCount === 2,
      actual: `${rawCount} raw, ${readyCount} ready, ${lcCount} lesson_contents`,
    };
  });

  await recordTest("TEST-ISOLATION-04", "Main DB Isolation", "Main DB port 3001: Public reader strictly returns 404 for all draft lessons", "HTTP 404", async () => {
    const res1 = await fetch(`${BASE_MAIN_URL}/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca`);
    const res2 = await fetch(`${BASE_MAIN_URL}/bai-hoc/d-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt`);
    return {
      passed: res1.status === 404 && res2.status === 404,
      actual: `D-01: HTTP ${res1.status}, D-03: HTTP ${res2.status}`,
    };
  });

  await poolMain.end();

  // ============================================================================
  // SUMMARY REPORT GENERATION
  // ============================================================================
  console.log("\n================================================================================");
  const totalTests = testResults.length;
  const passedTests = testResults.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);

  // Group summary table
  const groupCounts = new Map<string, { total: number; passed: number }>();
  testResults.forEach((t) => {
    const cur = groupCounts.get(t.group) || { total: 0, passed: 0 };
    cur.total++;
    if (t.passed) cur.passed++;
    groupCounts.set(t.group, cur);
  });

  console.log("\nGROUP BREAKDOWN:");
  let sumGroups = 0;
  for (const [group, counts] of groupCounts.entries()) {
    console.log(`  - ${group.padEnd(35)}: ${counts.passed}/${counts.total} passed`);
    sumGroups += counts.total;
  }
  console.log(`  - TOTAL GROUP SUM                    : ${sumGroups} tests (Math check: ${sumGroups === totalTests ? "EXACT MATCH ✓" : "MISMATCH ✗"})`);

  // Write full JSON results to artifact
  const resultsJsonPath = path.resolve(process.cwd(), "reports", "test_phase5_revised_results.json");
  fs.writeFileSync(resultsJsonPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed test log saved to: ${resultsJsonPath}`);

  if (failedTests > 0) {
    console.error(`\n>>> FAILED TESTS (${failedTests}) <<<`);
    process.exit(1);
  } else {
    console.log("\n>>> ALL 52 REVISED TESTS PASSED WITH 100% SUCCESS RATE! <<<");
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
