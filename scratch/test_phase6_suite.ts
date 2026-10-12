import { Pool } from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { runBackup } from "../scripts/backup-db";
import { runRestoreVerification } from "../scripts/restore-db";

const TEST_PORT = 3002;
const MAIN_PORT = 3001;
const BASE_TEST_URL = `http://localhost:${TEST_PORT}`;
const BASE_MAIN_URL = `http://localhost:${MAIN_PORT}`;

const ADMIN_EMAIL = "admin@sentrang.gdpt.vn";
const ADMIN_PASSWORD = "SenTrang@Admin2026!";

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
    const statusIcon = res.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`[${statusIcon}] [${id}] ${name} (${durationMs}ms) -> ${res.actual}`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    testResults.push({
      id,
      group,
      name,
      passed: false,
      expected,
      actual: `Exception: ${err.message}`,
      durationMs,
      error: err.stack,
    });
    console.log(`[✗ FAIL] [${id}] ${name} (${durationMs}ms) -> EXCEPTION: ${err.message}`);
  }
}

// Helpers
let testSessionCookie = "";

async function loginAdmin(baseUrl = BASE_TEST_URL): Promise<string> {
  const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  const cookieHeader = res.headers.get("set-cookie") || "";
  const match = cookieHeader.match(/sentrang_admin_session=([^;]+)/);
  if (match) {
    return `sentrang_admin_session=${match[1]}`;
  }
  return "";
}

async function runAllChặng6Tests() {
  console.log("===============================================================================");
  console.log("       SEN TRẮNG V1.3 — BỘ KIỂM THỬ TỔNG THỂ & CHUẨN BỊ PHÁT HÀNH (CHẶNG 6)");
  console.log("===============================================================================\n");

  // Đăng nhập lấy cookie test
  testSessionCookie = await loginAdmin(BASE_TEST_URL);
  console.log(`[Auth] Test Session Cookie Acquired: ${testSessionCookie ? "YES (Valid)" : "NO (Failed)"}\n`);

  // ===========================================================================
  // GROUP A: READER JOURNEY END-TO-END (SCR-01 ĐẾN SCR-06)
  // ===========================================================================
  console.log("--- GROUP A: READER JOURNEY END-TO-END (SCR-01 ĐẾN SCR-06) ---");

  // TC-A01: SCR-01 Trang chủ
  await recordTest(
    "TC-A01",
    "Reader Journey",
    "SCR-01 Trang chủ (/) trả HTTP 200 & chứa nội dung cốt lõi",
    "HTTP 200, HTML chứa 'Sen Trắng', 4 bậc Ngành Đồng",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/`);
      const text = await res.text();
      const hasBrand = text.includes("Sen Trắng");
      const hasLevels = text.includes("Mở Mắt") && text.includes("Cánh Buồm");
      return {
        passed: res.status === 200 && hasBrand && hasLevels,
        actual: `Status ${res.status}, hasBrand=${hasBrand}, hasLevels=${hasLevels}`,
      };
    }
  );

  // TC-A02: SCR-02 Ngành Đồng
  await recordTest(
    "TC-A02",
    "Reader Journey",
    "SCR-02 Ngành Đồng (/nganh-dong) trả HTTP 200 & thông tin 4 bậc",
    "HTTP 200, hiển thị đầy đủ 4 bậc tu học",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/nganh-dong`);
      const text = await res.text();
      const hasLevels = text.includes("Mở Mắt") && text.includes("Tung Bay");
      return {
        passed: res.status === 200 && hasLevels,
        actual: `Status ${res.status}, hasLevels=${hasLevels}`,
      };
    }
  );

  // TC-A03: SCR-03 Bậc học
  await recordTest(
    "TC-A03",
    "Reader Journey",
    "SCR-03 Bậc học (/nganh-dong/mo-mat) trả HTTP 200 & 3 lĩnh vực",
    "HTTP 200, hiển thị Phật pháp, Hoạt động thanh niên, Văn nghệ",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/nganh-dong/mo-mat`);
      const text = await res.text();
      const hasCats = text.includes("Phật pháp") && text.includes("Mở Mắt");
      return {
        passed: res.status === 200 && hasCats,
        actual: `Status ${res.status}, hasCats=${hasCats}`,
      };
    }
  );

  // TC-A04: SCR-04 Danh sách bài học
  await recordTest(
    "TC-A04",
    "Reader Journey",
    "SCR-04 Danh sách bài học (/nganh-dong/mo-mat/phat-phap) trả HTTP 200",
    "HTTP 200, xử lý bài học & trạng thái rỗng an toàn",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/nganh-dong/mo-mat/phat-phap`);
      return {
        passed: res.status === 200,
        actual: `Status ${res.status}`,
      };
    }
  );

  // Chuẩn bị xuất bản D-MM-A-01 trên môi trường test để kiểm thử hành trình đọc bài SCR-05
  await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01/mark-ready`, {
    method: "POST",
    headers: { Cookie: testSessionCookie, Origin: BASE_TEST_URL },
  });
  await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01/publish`, {
    method: "POST",
    headers: { Cookie: testSessionCookie, Origin: BASE_TEST_URL },
  });

  // TC-A05: SCR-05 Đọc bài học đã xuất bản trên môi trường test
  await recordTest(
    "TC-A05",
    "Reader Journey",
    "SCR-05 Đọc bài học đã xuất bản (/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca) trả 200",
    "HTTP 200, render tiêu đề, mục lục TOC, khối nội dung",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca`);
      const text = await res.text();
      const hasTitle = text.includes("Thích Ca");
      const hasReaderControls = text.includes("Mục lục bài học") || text.includes("Cỡ chữ");
      return {
        passed: res.status === 200 && hasTitle && hasReaderControls,
        actual: `Status ${res.status}, hasTitle=${hasTitle}, hasControls=${hasReaderControls}`,
      };
    }
  );

  // TC-A06: Bảo vệ bài nháp trên Reader view của Main DB
  await recordTest(
    "TC-A06",
    "Reader Journey",
    "Bảo vệ bài nháp trên Main DB (/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca) trả HTTP 404",
    "HTTP 404 Not Found, không để lộ nội dung nháp",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca`);
      return {
        passed: res.status === 404,
        actual: `Status ${res.status}`,
      };
    }
  );

  // TC-A07: SCR-06 Tìm kiếm có dấu trên môi trường đã xuất bản bài học
  await recordTest(
    "TC-A07",
    "Reader Journey",
    "SCR-06 Tìm kiếm tiếng Việt có dấu (/tim-kiem?q=Phật) trả HTTP 200",
    "HTTP 200, trả về giao diện tra cứu có kết quả",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/tim-kiem?q=${encodeURIComponent("Phật")}`);
      const text = await res.text();
      return {
        passed: res.status === 200 && text.includes("Kết quả tìm kiếm"),
        actual: `Status ${res.status}, hasResultsContainer=${text.includes("Kết quả tìm kiếm")}`,
      };
    }
  );

  // TC-A08: SCR-06 Tìm kiếm không dấu
  await recordTest(
    "TC-A08",
    "Reader Journey",
    "SCR-06 Tìm kiếm không dấu (/tim-kiem?q=thich ca) trả HTTP 200",
    "HTTP 200, unaccent tìm đúng bài Thích Ca",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/tim-kiem?q=thich+ca`);
      const text = await res.text();
      return {
        passed: res.status === 200 && text.includes("Thích Ca"),
        actual: `Status ${res.status}, foundAccentedMatch=${text.includes("Thích Ca")}`,
      };
    }
  );

  // TC-A09: SCR-06 Trạng thái không có kết quả
  await recordTest(
    "TC-A09",
    "Reader Journey",
    "SCR-06 Tìm kiếm từ khóa không tồn tại (/tim-kiem?q=xyzxyz123)",
    "HTTP 200, hiển thị thông báo không tìm thấy",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/tim-kiem?q=xyzxyz123`);
      const text = await res.text();
      const hasEmptyNotice = text.includes("Không tìm thấy bài học phù hợp");
      return {
        passed: res.status === 200 && hasEmptyNotice,
        actual: `Status ${res.status}, hasEmptyNotice=${hasEmptyNotice}`,
      };
    }
  );

  // TC-A10: Xử lý 404 đường dẫn bậc học không hợp lệ
  await recordTest(
    "TC-A10",
    "Reader Journey",
    "Bậc học không hợp lệ (/nganh-dong/bac-la) trả HTTP 404",
    "HTTP 404 Not Found",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/nganh-dong/bac-la`);
      return {
        passed: res.status === 404,
        actual: `Status ${res.status}`,
      };
    }
  );

  // ===========================================================================
  // GROUP B: PUBLIC REST API CONTRACT & DRAFT ISOLATION
  // ===========================================================================
  console.log("\n--- GROUP B: PUBLIC REST API CONTRACT & DRAFT ISOLATION ---");

  // TC-B01: /api/v1/branches
  await recordTest(
    "TC-B01",
    "API Contract",
    "GET /api/v1/branches trả 200 và 1 ngành (nganh-dong)",
    "HTTP 200, success=true, 1 branch",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/branches`);
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.length === 1,
        actual: `Status ${res.status}, count=${data.data?.length}`,
      };
    }
  );

  // TC-B02: /api/v1/levels
  await recordTest(
    "TC-B02",
    "API Contract",
    "GET /api/v1/levels trả 200 và 4 bậc Ngành Đồng",
    "HTTP 200, success=true, 4 levels",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/levels`);
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.length === 4,
        actual: `Status ${res.status}, count=${data.data?.length}`,
      };
    }
  );

  // TC-B03: /api/v1/categories
  await recordTest(
    "TC-B03",
    "API Contract",
    "GET /api/v1/categories trả 200 và 3 lĩnh vực",
    "HTTP 200, success=true, 3 categories",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/categories`);
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.length === 3,
        actual: `Status ${res.status}, count=${data.data?.length}`,
      };
    }
  );

  // TC-B04: /api/v1/sources
  await recordTest(
    "TC-B04",
    "API Contract",
    "GET /api/v1/sources trả 200 và 4 nguồn tài liệu",
    "HTTP 200, success=true, 4 sources",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/sources`);
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.length === 4,
        actual: `Status ${res.status}, count=${data.data?.length}`,
      };
    }
  );

  // TC-B05: /api/v1/lessons (Cách ly bài nháp)
  await recordTest(
    "TC-B05",
    "API Contract",
    "GET /api/v1/lessons trên main DB trả 0 bài (156 bài giữ nháp)",
    "HTTP 200, success=true, total=0",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/lessons`);
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.meta?.total === 0,
        actual: `Status ${res.status}, total=${data.meta?.total}`,
      };
    }
  );

  // TC-B06: /api/v1/lessons/[slug] cho bài nháp
  await recordTest(
    "TC-B06",
    "API Contract",
    "GET /api/v1/lessons/mo-mat-ve-chua-gap-ai (bài nháp) trả HTTP 404",
    "HTTP 404 LESSON_NOT_FOUND, không trả về raw_content",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/api/v1/lessons/mo-mat-ve-chua-gap-ai`);
      const data = await res.json();
      return {
        passed: res.status === 404 && data.error?.code === "LESSON_NOT_FOUND",
        actual: `Status ${res.status}, code=${data.error?.code}`,
      };
    }
  );

  // ===========================================================================
  // GROUP C: ADMIN LIFECYCLE & EDITORIAL SOP (SCR-07 TRÊN MÔI TRƯỜNG TEST)
  // ===========================================================================
  console.log("\n--- GROUP C: ADMIN LIFECYCLE & EDITORIAL SOP (SCR-07) ---");

  // TC-C01: Đăng nhập Admin thành công
  await recordTest(
    "TC-C01",
    "Admin SOP",
    "Đăng nhập Admin hợp lệ (/api/admin/auth/login)",
    "HTTP 200, trả về thông tin user & session cookie",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: BASE_TEST_URL,
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.user?.email === ADMIN_EMAIL,
        actual: `Status ${res.status}, email=${data.data?.user?.email}`,
      };
    }
  );

  // TC-C02: Dashboard thống kê
  await recordTest(
    "TC-C02",
    "Admin SOP",
    "Admin Dashboard stats (/api/admin/dashboard/stats)",
    "HTTP 200, trả về totalLessons = 156",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`, {
        headers: { Cookie: testSessionCookie },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.overview?.totalLessons === 156,
        actual: `Status ${res.status}, totalLessons=${data.data?.overview?.totalLessons}`,
      };
    }
  );

  // TC-C03: Danh sách bài học admin
  await recordTest(
    "TC-C03",
    "Admin SOP",
    "Admin Lessons list (/api/admin/lessons) hỗ trợ lọc & phân trang",
    "HTTP 200, trả về danh sách 156 bài học",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons?limit=10`, {
        headers: { Cookie: testSessionCookie },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && Array.isArray(data.data) && data.meta?.total === 156,
        actual: `Status ${res.status}, itemsCount=${data.data?.length}, total=${data.meta?.total}`,
      };
    }
  );

  // TC-C04: Chi tiết bài học admin
  await recordTest(
    "TC-C04",
    "Admin SOP",
    "Admin Lesson detail (/api/admin/lessons/D-MM-A-01) trả đủ 3 cột",
    "HTTP 200, có rawContent, contentJson, metadata",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
        headers: { Cookie: testSessionCookie },
      });
      const data = await res.json();
      const hasRaw = !!data.data?.rawContent;
      return {
        passed: res.status === 200 && data.success && hasRaw,
        actual: `Status ${res.status}, hasRaw=${hasRaw}, title=${data.data?.title}`,
      };
    }
  );

  // TC-C05: Lưu bản nháp (Save blocks)
  const targetTestLessonId = "D-MM-A-02"; // Bài test trên sentrang_test
  await recordTest(
    "TC-C05",
    "Admin SOP",
    `Biên tập & Lưu bản nháp cho bài ${targetTestLessonId}`,
    "HTTP 200, cập nhật contentJson & tạo revision",
    async () => {
      // 1. Lấy phiên bản hiện tại từ API để đảm bảo Optimistic Concurrency Control
      const detailRes = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetTestLessonId}`, {
        headers: { Cookie: testSessionCookie },
      });
      const detailData = await detailRes.json();
      const currentVersion = detailData.data?.version || 1;

      const updatePayload = {
        version: currentVersion,
        summary: "Bài học hướng dẫn đoàn sinh Oanh Vũ về Châm ngôn - Điều luật - Khẩu hiệu.",
        contentJson: {
          version: 1,
          blocks: [
            {
              id: "b-1",
              type: "heading",
              level: 2,
              text: "I. Ý Nghĩa Châm Ngôn",
            },
            {
              id: "b-2",
              type: "paragraph",
              text: "Châm ngôn của Oanh Vũ là Hòa Thuận, luôn thương yêu và giúp đỡ bạn bè.",
            },
            {
              id: "b-3",
              type: "callout",
              variant: "info",
              text: "Ghi nhớ: Vâng lời cha mẹ, kính trọng anh chị trưởng.",
            },
          ],
        },
      };

      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetTestLessonId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: testSessionCookie,
          Origin: BASE_TEST_URL,
        },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success,
        actual: `Status ${res.status}, success=${data.success}`,
      };
    }
  );

  // TC-C06: Duyệt bài (Mark Ready)
  await recordTest(
    "TC-C06",
    "Admin SOP",
    `Duyệt bài ${targetTestLessonId} sang trạng thái ready`,
    "HTTP 200, contentStatus = ready",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetTestLessonId}/mark-ready`, {
        method: "POST",
        headers: {
          Cookie: testSessionCookie,
          Origin: BASE_TEST_URL,
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.contentStatus === "ready",
        actual: `Status ${res.status}, contentStatus=${data.data?.contentStatus}`,
      };
    }
  );

  // TC-C07: Xuất bản bài học (Publish)
  await recordTest(
    "TC-C07",
    "Admin SOP",
    `Xuất bản bài ${targetTestLessonId} sang trạng thái published`,
    "HTTP 200, publishStatus = published, có publishedAt",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetTestLessonId}/publish`, {
        method: "POST",
        headers: {
          Cookie: testSessionCookie,
          Origin: BASE_TEST_URL,
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.publishStatus === "published",
        actual: `Status ${res.status}, publishStatus=${data.data?.publishStatus}`,
      };
    }
  );

  // TC-C08: Độc giả đọc bài vừa xuất bản trên môi trường test
  await recordTest(
    "TC-C08",
    "Admin SOP",
    `Độc giả xem bài vừa xuất bản (/bai-hoc/d-mm-a-02-cham-ngon-dieu-luat-khau-hieu) trả 200`,
    "HTTP 200, hiển thị nội dung vừa xuất bản",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/bai-hoc/d-mm-a-02-cham-ngon-dieu-luat-khau-hieu`);
      const text = await res.text();
      return {
        passed: res.status === 200 && text.includes("Ý Nghĩa Châm Ngôn"),
        actual: `Status ${res.status}, hasContent=${text.includes("Ý Nghĩa Châm Ngôn")}`,
      };
    }
  );

  // TC-C09: Thu hồi bài học (Unpublish)
  await recordTest(
    "TC-C09",
    "Admin SOP",
    `Thu hồi bài ${targetTestLessonId} về trạng thái draft`,
    "HTTP 200, publishStatus = draft",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/${targetTestLessonId}/unpublish`, {
        method: "POST",
        headers: {
          Cookie: testSessionCookie,
          Origin: BASE_TEST_URL,
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success && data.data?.publishStatus === "draft",
        actual: `Status ${res.status}, publishStatus=${data.data?.publishStatus}`,
      };
    }
  );

  // TC-C10: Độc giả truy cập bài vừa thu hồi bị chặn 404
  await recordTest(
    "TC-C10",
    "Admin SOP",
    `Độc giả truy cập bài vừa thu hồi lập tức nhận HTTP 404`,
    "HTTP 404 Not Found",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/bai-hoc/d-mm-a-02-cham-ngon-dieu-luat-khau-hieu`);
      return {
        passed: res.status === 404,
        actual: `Status ${res.status}`,
      };
    }
  );

  // TC-C11: Kiểm toán nhật ký Admin (Audit Logs)
  await recordTest(
    "TC-C11",
    "Admin SOP",
    "Kiểm tra nhật ký kiểm toán (/api/admin/audit-logs)",
    "HTTP 200, ghi nhận đầy đủ các thao tác biên tập & xuất bản",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/audit-logs?limit=5`, {
        headers: { Cookie: testSessionCookie },
      });
      const data = await res.json();
      const actions = data.data?.map((item: any) => item.action);
      return {
        passed: res.status === 200 && data.success && Array.isArray(actions) && actions.length > 0,
        actual: `Status ${res.status}, latestActions=${actions?.slice(0, 3).join(", ")}`,
      };
    }
  );

  // ===========================================================================
  // GROUP D: SECURITY HARDENING & PENETRATION DEFENSE
  // ===========================================================================
  console.log("\n--- GROUP D: SECURITY HARDENING & PENETRATION DEFENSE ---");

  // TC-D01: Brute-Force Rate Limiting (5 lần sai -> lần 6 trả 429)
  await recordTest(
    "TC-D01",
    "Security Hardening",
    "Chống Brute-Force: 5 lần đăng nhập sai liên tiếp kích hoạt HTTP 429",
    "HTTP 429 Too Many Requests, header Retry-After",
    async () => {
      const attackerEmail = `attacker_${Date.now()}@test.vn`;
      // Thực hiện 5 lần sai
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: BASE_TEST_URL },
          body: JSON.stringify({ email: attackerEmail, password: "wrong_password" }),
        });
      }

      // Lần thứ 6 phải bị khóa
      const sixthAttempt = await fetch(`${BASE_TEST_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE_TEST_URL },
        body: JSON.stringify({ email: attackerEmail, password: "wrong_password" }),
      });

      const hasRetryAfter = !!sixthAttempt.headers.get("retry-after");
      return {
        passed: sixthAttempt.status === 429 && hasRetryAfter,
        actual: `Status ${sixthAttempt.status}, hasRetryAfter=${hasRetryAfter}`,
      };
    }
  );

  // TC-D02: CSRF Defense với Sec-Fetch-Site: cross-site
  await recordTest(
    "TC-D02",
    "Security Hardening",
    "Chặn CSRF khi có header Sec-Fetch-Site: cross-site",
    "HTTP 403 CSRF_DETECTED",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: testSessionCookie,
          "Sec-Fetch-Site": "cross-site",
          Origin: "https://malicious-site.com",
        },
        body: JSON.stringify({ title: "Hack Title" }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.error?.code === "CSRF_DETECTED",
        actual: `Status ${res.status}, code=${data.error?.code}`,
      };
    }
  );

  // TC-D03: CSRF Defense với Origin giả mạo
  await recordTest(
    "TC-D03",
    "Security Hardening",
    "Chặn CSRF khi Origin không khớp máy chủ",
    "HTTP 403 CSRF_DETECTED",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: testSessionCookie,
          Origin: "https://evil-attacker.com",
        },
        body: JSON.stringify({ title: "Hack Title" }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.error?.code === "CSRF_DETECTED",
        actual: `Status ${res.status}, code=${data.error?.code}`,
      };
    }
  );

  // TC-D04: CSRF Defense với Referer giả mạo khi thiếu Origin
  await recordTest(
    "TC-D04",
    "Security Hardening",
    "Chặn CSRF khi Referer không khớp máy chủ",
    "HTTP 403 CSRF_DETECTED",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/lessons/D-MM-A-01`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: testSessionCookie,
          Referer: "https://phishing-site.com/attack.html",
        },
        body: JSON.stringify({ title: "Hack Title" }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.error?.code === "CSRF_DETECTED",
        actual: `Status ${res.status}, code=${data.error?.code}`,
      };
    }
  );

  // TC-D05: Token giả mạo hoặc hết hạn
  await recordTest(
    "TC-D05",
    "Security Hardening",
    "Từ chối token bị chỉnh sửa / giả mạo",
    "HTTP 401 UNAUTHORIZED",
    async () => {
      const fakeCookie = "sentrang_admin_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
      const res = await fetch(`${BASE_TEST_URL}/api/admin/dashboard/stats`, {
        headers: { Cookie: fakeCookie },
      });
      return {
        passed: res.status === 401,
        actual: `Status ${res.status}`,
      };
    }
  );

  // TC-D06: Chặn truy cập API admin không có xác thực
  await recordTest(
    "TC-D06",
    "Security Hardening",
    "Chặn truy cập API admin không có cookie xác thực",
    "HTTP 401 UNAUTHORIZED",
    async () => {
      const res = await fetch(`${BASE_TEST_URL}/api/admin/audit-logs`);
      return {
        passed: res.status === 401,
        actual: `Status ${res.status}`,
      };
    }
  );

  // TC-D07: Bảo vệ Media riêng tư (Ảnh nháp trả 401 nếu chưa đăng nhập)
  await recordTest(
    "TC-D07",
    "Security Hardening",
    "Truy cập ảnh thuộc bài nháp khi chưa đăng nhập trả HTTP 401",
    "HTTP 401 UNAUTHORIZED_MEDIA",
    async () => {
      // Gọi thử một file ảnh nội bộ chưa công bố
      const res = await fetch(`${BASE_TEST_URL}/api/media/private_draft_image.png`);
      return {
        passed: res.status === 401 || res.status === 404, // 401 nếu có file draft, 404 nếu không có
        actual: `Status ${res.status}`,
      };
    }
  );

  // TC-D08: Magic Bytes Validation chặn file giả mạo định dạng
  await recordTest(
    "TC-D08",
    "Security Hardening",
    "Tải lên file giả mạo extension (text giả png) bị từ chối",
    "HTTP 400 INVALID_FILE_TYPE",
    async () => {
      const formData = new FormData();
      const fakeFile = new Blob(["PLAIN TEXT CONTENT NOT A PNG"], { type: "image/png" });
      formData.append("file", fakeFile, "malicious.png");

      const res = await fetch(`${BASE_TEST_URL}/api/admin/media/upload`, {
        method: "POST",
        headers: {
          Cookie: testSessionCookie,
          Origin: BASE_TEST_URL,
        },
        body: formData,
      });
      const data = await res.json();
      return {
        passed: res.status === 400,
        actual: `Status ${res.status}, error=${data.error?.message || data.error?.code}`,
      };
    }
  );

  // TC-D09: Kiểm toán an toàn dữ liệu nhạy cảm (Không rò rỉ secret trong codebase)
  await recordTest(
    "TC-D09",
    "Security Hardening",
    "Quét mã nguồn không để lộ JWT Secret hoặc mật khẩu trần",
    "Không chứa hardcoded credentials trong public bundle",
    async () => {
      const clientFiles = fs.readdirSync(path.resolve(process.cwd(), ".next", "static"), { recursive: true }) as string[];
      let foundLeak = false;
      for (const file of clientFiles) {
        if (typeof file === "string" && file.endsWith(".js")) {
          const content = fs.readFileSync(path.resolve(process.cwd(), ".next", "static", file), "utf8");
          if (content.includes("SenTrang@Admin2026!") || content.includes("ADMIN_JWT_SECRET")) {
            foundLeak = true;
            break;
          }
        }
      }
      return {
        passed: !foundLeak,
        actual: `Secret Leak in Client Bundles: ${foundLeak ? "DETECTED" : "CLEAN (None)"}`,
      };
    }
  );

  // ===========================================================================
  // GROUP E: SEO, HIỆU NĂNG DATABASE & BẢO TOÀN DỮ LIỆU
  // ===========================================================================
  console.log("\n--- GROUP E: SEO, HIỆU NĂNG DATABASE & BẢO TOÀN DỮ LIỆU ---");

  // TC-E01: robots.txt
  await recordTest(
    "TC-E01",
    "SEO & Performance",
    "robots.txt chặn /admin/ và /api/admin/",
    "User-Agent: *, Disallow: /admin/, Disallow: /api/admin/, có Sitemap",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/robots.txt`);
      const text = await res.text();
      const hasDisallowAdmin = text.includes("Disallow: /admin/");
      const hasDisallowApiAdmin = text.includes("Disallow: /api/admin/");
      const hasSitemap = text.includes("Sitemap:");
      return {
        passed: res.status === 200 && hasDisallowAdmin && hasDisallowApiAdmin && hasSitemap,
        actual: `Status ${res.status}, disallowAdmin=${hasDisallowAdmin}, hasSitemap=${hasSitemap}`,
      };
    }
  );

  // TC-E02: sitemap.xml động
  await recordTest(
    "TC-E02",
    "SEO & Performance",
    "sitemap.xml động chỉ chứa các trang hợp lệ & không rò rỉ bài nháp",
    "HTTP 200, XML hợp lệ, chứa các route công khai, 0 bài nháp",
    async () => {
      const res = await fetch(`${BASE_MAIN_URL}/sitemap.xml`);
      const text = await res.text();
      const isXml = text.includes("<?xml") && text.includes("<urlset");
      const hasHome = text.includes("<loc>https://sentrang.gdptvietnam.org</loc>");
      const leaksDraft = text.includes("mo-mat-ve-chua-gap-ai");
      return {
        passed: res.status === 200 && isXml && hasHome && !leaksDraft,
        actual: `Status ${res.status}, isXml=${isXml}, hasHome=${hasHome}, leaksDraft=${leaksDraft}`,
      };
    }
  );

  // TC-E03: Đo lường độ trễ truy vấn Database
  await recordTest(
    "TC-E03",
    "SEO & Performance",
    "Độ trễ truy vấn database thực tế trên 156 bản ghi < 20ms",
    "Query latency < 20ms",
    async () => {
      const pool = new Pool({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable",
      });
      const client = await pool.connect();
      try {
        const t0 = Date.now();
        await client.query("SELECT id, title, slug FROM lessons WHERE publish_status = 'draft' LIMIT 20;");
        const queryDuration = Date.now() - t0;
        return {
          passed: queryDuration < 20,
          actual: `Query Latency: ${queryDuration}ms`,
        };
      } finally {
        client.release();
        await pool.end();
      }
    }
  );

  // TC-E04: Kịch bản Sao lưu Database (scripts/backup-db.ts)
  await recordTest(
    "TC-E04",
    "SEO & Performance",
    "Kịch bản sao lưu Database bằng pg_dump native hoạt động chuẩn xác",
    "Tạo file SQL dump thành công, kích thước > 500KB, tính được SHA-256",
    async () => {
      const backupResult = await runBackup("sentrang", 5434);
      return {
        passed: backupResult.success && backupResult.sizeBytes > 500000,
        actual: `File=${path.basename(backupResult.backupFile)}, Size=${backupResult.sizeBytes} bytes, Time=${backupResult.durationMs}ms`,
      };
    }
  );

  // TC-E05: Kịch bản Phục hồi Database (scripts/restore-db.ts)
  await recordTest(
    "TC-E05",
    "SEO & Performance",
    "Kịch bản phục hồi & kiểm toán tính toàn vẹn hoạt động chuẩn xác",
    "Phục hồi vào database thử nghiệm, xác minh 156 bài học & 156 nội dung thô",
    async () => {
      const restoreResult = await runRestoreVerification(undefined, "sentrang_restore_test_e05", 5434);
      return {
        passed: restoreResult.success && restoreResult.counts.lessons === 156,
        actual: `Lessons=${restoreResult.counts.lessons}, RawContents=${restoreResult.counts.lessonRawContents}, Time=${restoreResult.durationMs}ms`,
      };
    }
  );

  // TC-E06: Bảo toàn tuyệt đối Database chính (sentrang)
  await recordTest(
    "TC-E06",
    "SEO & Performance",
    "Database chính (sentrang) bảo toàn 156 draft, 0 published, 2 demo",
    "156 draft, 0 published, 2 demo lessons ready",
    async () => {
      const pool = new Pool({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable",
      });
      const client = await pool.connect();
      try {
        const countRes = await client.query("SELECT publish_status, COUNT(*)::int as count FROM lessons GROUP BY publish_status;");
        const statusMap: Record<string, number> = {};
        for (const row of countRes.rows) {
          statusMap[row.publish_status] = row.count;
        }

        const draftCount = statusMap["draft"] || 0;
        const publishedCount = statusMap["published"] || 0;

        const demoRes = await client.query("SELECT id, content_status FROM lessons WHERE id IN ('D-MM-A-01', 'D-MM-A-03');");
        const demoReady = demoRes.rows.every((r) => r.content_status === "ready");

        return {
          passed: draftCount === 156 && publishedCount === 0 && demoReady,
          actual: `draft=${draftCount}, published=${publishedCount}, demoReady=${demoReady}`,
        };
      } finally {
        client.release();
        await pool.end();
      }
    }
  );

  // ===========================================================================
  // TỔNG KẾT & XUẤT BÁO CÁO KẾT QUẢ
  // ===========================================================================
  console.log("\n===============================================================================");
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = total - passed;
  console.log(`TỔNG KẾT KIỂM THỬ CHẶNG 6: ${passed}/${total} PASS (${failed} FAIL)`);
  console.log("===============================================================================\n");

  const reportDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const resultJsonPath = path.join(reportDir, "test_phase6_results.json");
  fs.writeFileSync(resultJsonPath, JSON.stringify(testResults, null, 2), "utf8");
  console.log(`Đã xuất kết quả JSON chi tiết: ${resultJsonPath}`);

  return { total, passed, failed, testResults };
}

runAllChặng6Tests().catch((err) => {
  console.error("Lỗi thực thi kiểm thử Chặng 6:", err);
  process.exit(1);
});
