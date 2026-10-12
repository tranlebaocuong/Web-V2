/**
 * Phase 5 Automated Test Suite: Admin, Block Editor & Publishing Workflow
 * Tests run against port 3002 (sentrang_test) for mutations,
 * and verifies port 3001 (sentrang) for strict draft isolation.
 */

const TEST_PORT = 3002;
const MAIN_PORT = 3001;
const BASE_TEST_URL = `http://localhost:${TEST_PORT}`;
const BASE_MAIN_URL = `http://localhost:${MAIN_PORT}`;

const ADMIN_EMAIL = "admin@sentrang.gdpt.vn";
const ADMIN_PASSWORD = "SenTrang@Admin2026!";

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`  ✗ FAIL: ${name} - ${detail || ""}`);
    results.push({ name, passed: false, message: detail });
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("       SEN TRẮNG - CHẶNG 5 AUTOMATED TEST SUITE               ");
  console.log("===============================================================\n");

  // -------------------------------------------------------------
  // GROUP 1: UNAUTHENTICATED ACCESS GUARDS (401)
  // -------------------------------------------------------------
  console.log("--- GROUP 1: UNAUTHENTICATED GUARDS ---");
  const unauthMe = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`);
  assert(unauthMe.status === 401, "API /api/admin/auth/me returns 401 when no session cookie");

  const unauthLessons = await fetch(`${BASE_TEST_URL}/api/admin/lessons`);
  assert(unauthLessons.status === 401, "API /api/admin/lessons returns 401 when unauthenticated");

  const unauthStats = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`);
  assert(unauthStats.status === 401, "API /api/admin/dashboard/stats returns 401 when unauthenticated");

  const unauthAudit = await fetch(`${BASE_TEST_URL}/api/admin/audit-logs`);
  assert(unauthAudit.status === 401, "API /api/admin/audit-logs returns 401 when unauthenticated");

  const unauthPatch = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: 1, contentJson: { version: 1, blocks: [] } }),
  });
  assert(unauthPatch.status === 401, "API PATCH /api/admin/lessons/[id] returns 401 when unauthenticated");

  // -------------------------------------------------------------
  // GROUP 2: AUTHENTICATION (LOGIN & LOGOUT)
  // -------------------------------------------------------------
  console.log("\n--- GROUP 2: AUTHENTICATION FLOW ---");
  const badLogin = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "WrongPassword123!" }),
  });
  assert(badLogin.status === 401, "Login with wrong password rejected with 401");

  const goodLogin = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert(goodLogin.status === 200, "Login with valid credentials returns 200 OK");

  const setCookie = goodLogin.headers.get("set-cookie") || "";
  assert(setCookie.includes("sentrang_admin_session"), "Login sets sentrang_admin_session cookie");
  assert(setCookie.includes("HttpOnly"), "Session cookie has HttpOnly flag");

  // Extract session cookie for subsequent authenticated requests
  const sessionCookie = setCookie.split(";")[0];
  const authHeaders = {
    Cookie: sessionCookie,
  };

  const authMe = await fetch(`${BASE_TEST_URL}/api/admin/auth/me`, { headers: authHeaders });
  const authMeJson = await authMe.json();
  assert(
    authMe.status === 200 && authMeJson.data?.user?.email === ADMIN_EMAIL,
    "GET /api/admin/auth/me returns authenticated admin user profile"
  );

  // -------------------------------------------------------------
  // GROUP 3: DASHBOARD STATS & LESSON QUERYING
  // -------------------------------------------------------------
  console.log("\n--- GROUP 3: DASHBOARD STATS & LESSON QUERIES ---");
  const statsRes = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`, { headers: authHeaders });
  const statsJson = await statsRes.json();
  assert(statsRes.status === 200, "GET /api/admin/dashboard/stats returns 200");
  assert(statsJson.data?.overview?.totalLessons === 156, "Dashboard confirms 156 total lessons");
  assert(statsJson.data?.levels?.length === 4, "Dashboard confirms 4 levels breakdown");
  assert(statsJson.data?.categories?.length === 3, "Dashboard confirms 3 categories breakdown");

  const lessonsRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons?limit=10`, { headers: authHeaders });
  const lessonsJson = await lessonsRes.json();
  assert(lessonsRes.status === 200 && lessonsJson.meta?.total === 156, "GET /api/admin/lessons returns 156 lessons total");

  const moMatRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons?levelId=mo-mat&limit=50`, { headers: authHeaders });
  const moMatJson = await moMatRes.json();
  assert(moMatJson.meta?.total === 32, "Filter by level 'mo-mat' returns exactly 32 lessons");

  const detailRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, { headers: authHeaders });
  const detailJson = await detailRes.json();
  assert(detailRes.status === 200, "GET /api/admin/lessons/D-MM-A-01 returns 200");
  assert(detailJson.data?.id === "D-MM-A-01", "Lesson detail contains correct ID D-MM-A-01");
  assert(Array.isArray(detailJson.data?.rawContent?.pagesJson), "Lesson detail includes rawContent.pagesJson");

  // -------------------------------------------------------------
  // GROUP 4: BLOCK EDITOR & OPTIMISTIC CONCURRENCY (409)
  // -------------------------------------------------------------
  console.log("\n--- GROUP 4: BLOCK EDITOR & OPTIMISTIC CONCURRENCY ---");
  const currentVersion = detailJson.data.version;

  const editPayload = {
    version: currentVersion,
    summary: "Bài học đầu tiên của Bậc Mở Mắt về ý nghĩa hoa sen trắng và danh xưng GĐPT.",
    contentJson: {
      version: 1,
      blocks: [
        {
          id: "heading-1",
          type: "heading",
          level: 2,
          text: "I. Ý NGHĨA HOA SEN TRẮNG",
        },
        {
          id: "para-1",
          type: "paragraph",
          text: "Hoa sen trắng tinh khiết tượng trưng cho sự thanh tịnh, vô nhiễm và giác ngộ trong giáo lý đạo Phật.",
        },
        {
          id: "list-1",
          type: "list",
          ordered: false,
          items: [
            "Biểu tượng của đức thanh tịnh",
            "Màu trắng tượng trưng cho ánh sáng trí tuệ",
            "Năm cánh hoa tiêu biểu cho năm đức tính",
          ],
        },
        {
          id: "callout-1",
          type: "callout",
          variant: "info",
          title: "Lời dạy Huynh trưởng",
          text: "Mỗi đoàn sinh Oanh Vũ hãy luôn giữ gìn thân tâm trong sạch như đóa sen trắng.",
        },
      ],
    },
  };

  const editRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(editPayload),
  });
  const editJson = await editRes.json();
  assert(editRes.status === 200, "PATCH lesson content succeeds with HTTP 200");
  assert(editJson.data?.version === currentVersion + 1, `Lesson version incremented to ${currentVersion + 1}`);
  assert(editJson.data?.contentStatus === "editing", "Lesson content status transitioned to 'editing'");

  // TEST 409 CONFLICT: Send update with OLD version
  console.log("Testing 409 Conflict with outdated version...");
  const conflictPayload = {
    version: currentVersion, // Outdated! Current is currentVersion + 1
    summary: "Attempting concurrent edit with stale version",
    contentJson: {
      version: 1,
      blocks: [{ id: "heading-x", type: "heading", level: 2, text: "Stale edit" }],
    },
  };

  const conflictRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(conflictPayload),
  });
  const conflictJson = await conflictRes.json();
  assert(conflictRes.status === 409, "Outdated version rejected with HTTP 409 Conflict");
  assert(conflictJson.error?.code === "CONCURRENCY_CONFLICT", "Error code is CONCURRENCY_CONFLICT");

  // -------------------------------------------------------------
  // GROUP 5: 5-STEP PUBLISHING WORKFLOW
  // -------------------------------------------------------------
  console.log("\n--- GROUP 5: 5-STEP PUBLISHING WORKFLOW ---");
  // Find a lesson currently in raw_extracted status
  const rawListRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons?contentStatus=raw_extracted&limit=1`, { headers: authHeaders });
  const rawListJson = await rawListRes.json();
  const rawTarget = rawListJson.data[0];
  const targetId = rawTarget.id;
  const targetSlug = rawTarget.slug;
  const rawVersion = rawTarget.version;

  console.log(`Testing 5-step workflow on raw lesson: ${targetId} (current status: ${rawTarget.contentStatus})`);

  // Step 1: Attempt to publish raw lesson -> MUST FAIL 400
  const illegalPublishRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/publish`, {
    method: "POST",
    headers: authHeaders,
  });
  const illegalPublishJson = await illegalPublishRes.json();
  assert(illegalPublishRes.status === 400, "Publishing raw_extracted lesson rejected with HTTP 400 Bad Request");
  assert(illegalPublishJson.error?.code === "LESSON_NOT_READY", "Error code is LESSON_NOT_READY");

  // Step 2: Edit content for raw lesson
  const step2Res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      version: rawVersion,
      summary: `Biên tập nội dung chuẩn cho bài ${targetId}`,
      contentJson: {
        version: 1,
        blocks: [
          { id: "h1", type: "heading", level: 2, text: `Nội dung bài học ${targetId}` },
          { id: "p1", type: "paragraph", text: "Nội dung tu học đã được biên tập chu đáo theo giáo trình." },
        ],
      },
    }),
  });
  assert(step2Res.status === 200, "Step 2: Save edited content succeeds (status becomes 'editing')");

  // Step 3: Mark Ready
  const markReadyRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/mark-ready`, {
    method: "POST",
    headers: authHeaders,
  });
  const markReadyJson = await markReadyRes.json();
  assert(markReadyRes.status === 200, "Step 3: Mark Ready returns 200 OK");
  assert(markReadyJson.data?.contentStatus === "ready", "Lesson contentStatus is now 'ready'");

  // Step 4: Publish
  const publishRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/publish`, {
    method: "POST",
    headers: authHeaders,
  });
  const publishJson = await publishRes.json();
  assert(publishRes.status === 200, "Step 4: Publish ready lesson returns 200 OK");
  assert(publishJson.data?.publishStatus === "published", "Lesson publishStatus is 'published'");
  assert(publishJson.data?.publishedAt !== null, "publishedAt timestamp recorded");

  // Verify public reader on sentrang_test returns HTTP 200
  const publicReaderRes = await fetch(`${BASE_TEST_URL}/bai-hoc/${targetSlug}`);
  assert(publicReaderRes.status === 200, `Public reader returns HTTP 200 for published lesson ${targetSlug}`);

  // Step 5: Unpublish
  const unpublishRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetId}/unpublish`, {
    method: "POST",
    headers: authHeaders,
  });
  const unpublishJson = await unpublishRes.json();
  assert(unpublishRes.status === 200, "Step 5: Unpublish returns 200 OK");
  assert(unpublishJson.data?.publishStatus === "draft", "Lesson returned to 'draft' status");
  assert(unpublishJson.data?.publishedAt === null, "publishedAt cleared to null");

  // Verify public reader on sentrang_test now returns HTTP 404
  const publicReaderAfterUnpublish = await fetch(`${BASE_TEST_URL}/bai-hoc/${targetSlug}`);
  assert(publicReaderAfterUnpublish.status === 404, "Public reader immediately returns 404 after unpublishing");

  // -------------------------------------------------------------
  // GROUP 6: MEDIA UPLOAD SECURITY & AUDIT TRAIL
  // -------------------------------------------------------------
  console.log("\n--- GROUP 6: MEDIA UPLOAD & AUDIT TRAIL ---");
  // 1x1 transparent PNG buffer
  const validPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const formData = new FormData();
  formData.append("file", new Blob([validPngBuffer], { type: "image/png" }), "test_lotus.png");
  formData.append("lessonId", "D-MM-A-01");
  formData.append("altText", "Biểu tượng hoa sen thử nghiệm");
  formData.append("caption", "Ảnh kiểm thử Chặng 5");

  const uploadRes = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });
  const uploadJson = await uploadRes.json();
  assert(uploadRes.status === 200, "Upload valid PNG image succeeds with 200 OK");
  assert(uploadJson.data?.url?.startsWith("/uploads/"), "Upload returns safe URL in /uploads/");
  assert(uploadJson.data?.url?.endsWith(".png"), "Upload preserves safe .png extension");

  // Invalid mime rejection test
  const invalidFormData = new FormData();
  invalidFormData.append("file", new Blob(["Malicious text content"], { type: "text/plain" }), "script.bat");
  const badUploadRes = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
    method: "POST",
    headers: authHeaders,
    body: invalidFormData,
  });
  assert(badUploadRes.status === 400, "Uploading non-image (text/plain) rejected with 400");

  // Query audit logs
  const auditRes = await fetch(`${BASE_TEST_URL}/api/admin/audit-logs?limit=50`, { headers: authHeaders });
  const auditJson = await auditRes.json();
  assert(auditRes.status === 200, "GET /api/admin/audit-logs returns 200");
  const actions = (auditJson.data || []).map((l: any) => l.action);
  assert(actions.includes("AUTH_LOGIN_SUCCESS"), "Audit logs record AUTH_LOGIN_SUCCESS");
  assert(actions.includes("LESSON_UPDATE_CONTENT"), "Audit logs record LESSON_UPDATE_CONTENT");
  assert(actions.includes("LESSON_MARK_READY"), "Audit logs record LESSON_MARK_READY");
  assert(actions.includes("LESSON_PUBLISH"), "Audit logs record LESSON_PUBLISH");
  assert(actions.includes("LESSON_UNPUBLISH"), "Audit logs record LESSON_UNPUBLISH");
  assert(actions.includes("MEDIA_UPLOAD"), "Audit logs record MEDIA_UPLOAD");

  // -------------------------------------------------------------
  // GROUP 7: MAIN DATABASE (PORT 3001) STRICT ISOLATION
  // -------------------------------------------------------------
  console.log("\n--- GROUP 7: MAIN DATABASE DRAFT ISOLATION (PORT 3001) ---");
  // Verify on main database sentrang: all 156 lessons remain draft!
  const mainStats = await fetch(`${BASE_MAIN_URL}/api/admin/dashboard/stats`, { headers: authHeaders });
  const mainStatsJson = await mainStats.json();
  assert(mainStatsJson.data?.overview?.publishedLessons === 0, "Main database sentrang: publishedLessons === 0");
  assert(mainStatsJson.data?.overview?.draftLessons === 156, "Main database sentrang: draftLessons === 156");

  // Verify that any public reader on port 3001 returns 404
  const mainReader = await fetch(`${BASE_MAIN_URL}/bai-hoc/d-mm-a-01-y-nghia-hoa-sen-trang`);
  assert(mainReader.status === 404, "Public reader on main database strictly returns 404 for draft lessons");

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n===============================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  if (failedTests === 0) {
    console.log(">>> ALL CHẶNG 5 AUTOMATED TESTS PASSED SUCCESSFULLY! <<<");
  } else {
    console.error(`>>> ${failedTests} TESTS FAILED! <<<`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite execution crashed:", err);
  process.exit(1);
});
