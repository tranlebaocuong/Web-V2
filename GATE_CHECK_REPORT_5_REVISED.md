# GATE CHECK REPORT 5 — REVISED
## ADMIN, BIÊN TẬP HỌC LIỆU & QUY TRÌNH DUYỆT BÀI (SCR-07)

**Dự án:** Sen Trắng — Thư viện Tu học Gia Đình Phật Tử Việt Nam  
**Giai đoạn:** Chặng 5 theo Kế hoạch triển khai V1.1 & Technical Specifications V1.3  
**Ngày báo cáo:** 12/10/2026  
**Trạng thái nghiệm thu:** **ĐẠT TOÀN DIỆN (52/52 KIỂM THỬ TỰ ĐỘNG PASS — 100% QUALITY GATES PASS)**  

---

## 1. DANH SÁCH TỆP TIN ĐÃ HIỆU CHỈNH & PHÁT TRIỂN TRONG CHẶNG 5

| Tệp tin | Trạng thái | Mục đích & Thay đổi kỹ thuật |
| :--- | :---: | :--- |
| `src/lib/dal/admin/media.ts` | **Đã sửa** | Chuyển vùng lưu trữ sang thư mục riêng `data/media/` (ngoài `public`). Bổ sung thuật toán phát hiện Magic Bytes cho JPEG, PNG, WEBP; chặn file giả mạo đuôi; giới hạn 5MB; chống Path Traversal. |
| `src/app/api/media/[filename]/route.ts` | **Mới** | Endpoint phân phối media an toàn: Ảnh gắn với bài xuất bản được truy cập công khai; ảnh gắn với bài nháp hoặc chưa xuất bản bắt buộc kiểm tra phiên quản trị (chặn 401 Unauthorized đối với khách vãng lai). |
| `src/app/api/admin/media/upload/route.ts` | **Đã sửa** | Tích hợp xác thực magic bytes; xử lý lỗi xác thực trả HTTP 400 Bad Request; sinh URL dạng `/api/media/[filename]`. |
| `src/lib/auth/guard.ts` | **Đã sửa** | Bổ sung kiểm tra CSRF (`Sec-Fetch-Site: cross-site` và `Origin` mismatch trả 403 Forbidden); đối soát trạng thái tài khoản `isActive` trong database PostgreSQL (chặn 401 `ACCOUNT_INACTIVE`). |
| `src/lib/auth/login/route.ts` | **Đã sửa** | Cấu hình cookie `HttpOnly`, `SameSite=lax`, cờ `Secure` tự động kích hoạt trên môi trường production hoặc HTTPS header. |
| `src/lib/auth/logout/route.ts` | **Đã sửa** | Xóa sạch cookie phiên với `maxAge=0` và ghi nhật ký kiểm toán `AUTH_LOGOUT`. |
| `src/lib/dal/admin/lessons.ts` | **Đã sửa** | Tự động chuyển `contentStatus = 'editing'` khi sửa bài; thực thi Optimistic Concurrency Control qua `version` (trả HTTP 409 Conflict khi phát hiện xung đột). |
| `src/app/admin/media/page.tsx` | **Đã sửa** | Cập nhật URL hiển thị ảnh sang `/api/media/[filename]`; loại bỏ hoàn toàn việc tham chiếu trực tiếp thư mục `public`. |
| `scratch/test_phase5_revised.ts` | **Mới** | Bộ kiểm thử tự động toàn diện 52 test cases độc lập, gán mã định danh chuẩn mực từ `TEST-AUTH-01` đến `TEST-ISOLATION-04`. |

---

## 2. KẾT QUẢ KIỂM TOÁN BẢO MẬT HÌNH ẢNH & KIỂM SOÁT PHIÊN

### A. Bảo mật Lưu trữ & Phân phối Hình ảnh
1. **Cô lập vùng lưu trữ:**
   - Đã xóa bỏ hoàn toàn thư mục `public/uploads/`.
   - Toàn bộ hình ảnh tải lên được lưu trong thư mục riêng tư `data/media/` nằm ngoài thư mục web gốc `public/`. Máy chủ Next.js tuyệt đối không phục vụ tĩnh trực tiếp các tệp này.
2. **Kiểm tra Magic Bytes thực tế (Chống giả mạo MIME):**
   - Không dựa vào header `Content-Type` do client gửi lên hoặc phần mở rộng tệp.
   - Kiểm tra trực tiếp các byte đầu tiên của buffer:
     - **JPEG:** Bắt đầu bằng chuỗi byte `FF D8 FF`.
     - **PNG:** Bắt đầu bằng chuỗi 8 byte `89 50 4E 47 0D 0A 1A 0A`.
     - **WEBP:** Bắt đầu bằng `RIFF` và offset 8 là `WEBP`.
   - Mọi tệp văn bản, mã thực thi (.bat, .exe, script) đổi đuôi thành `.png` đều bị hàm `detectRealImageMime()` phát hiện và từ chối với mã **HTTP 400 Bad Request** (`TEST-MEDIA-04`).
3. **Quy tắc phân quyền truy cập Media (Access Control Policy):**
   - *Ảnh công khai:* Chỉ những hình ảnh liên kết với bài học có `publish_status = 'published'` mới được phục vụ công khai qua header cache `public, max-age=86400` (`TEST-MEDIA-08`).
   - *Ảnh nội bộ / Bản nháp:* Ảnh gắn với bài nháp (`publish_status = 'draft'`), bài ẩn (`hidden`) hoặc ảnh chưa gắn bài học đều được bảo vệ nghiêm ngặt:
     - Người chưa đăng nhập truy cập trực tiếp URL $\rightarrow$ Nhận mã lỗi **HTTP 401 Unauthorized** (`UNAUTHORIZED_MEDIA`) (`TEST-MEDIA-06`).
     - Quản trị viên có cookie phiên hợp lệ $\rightarrow$ Phục vụ ảnh bình thường với header `private, no-cache` (`TEST-MEDIA-07`).
4. **Phòng chống Path Traversal:**
   - Endpoint `/api/media/[filename]` chuẩn hóa tên tệp qua `path.basename()` và kiểm tra đường dẫn giải quyết (`path.resolve()`).
   - Các truy vấn dạng `../../etc/passwd` đều bị chặn ngay lập tức với mã **HTTP 400** hoặc **404** (`TEST-MEDIA-05`).

### B. Kiểm toán Xác thực, Phiên & Phòng thủ CSRF
1. **Cấu hình Cookie Phiên:**
   - Tên cookie: `sentrang_admin_session`.
   - `HttpOnly: true` (Trình duyệt chặn 100% JavaScript truy cập qua `document.cookie`).
   - `Secure: true` (Tự động kích hoạt khi chạy production hoặc qua giao thức HTTPS).
   - `SameSite: "lax"` (Ngăn trình duyệt tự động gửi cookie trong các truy vấn chéo trang `POST`/`PATCH`/`DELETE`).
   - Thời hạn: `maxAge: 7 * 86400` (7 ngày, thời hạn hợp lý cho ban biên tập học vụ).
2. **Phòng thủ CSRF (Cross-Site Request Forgery):**
   - Với mọi phương thức làm thay đổi trạng thái (`POST`, `PATCH`, `DELETE`, `PUT`), server guard kiểm tra:
     - `Sec-Fetch-Site: cross-site` $\rightarrow$ Từ chối với **HTTP 403 Forbidden** (`CSRF_DETECTED`) (`TEST-SEC-06`).
     - Header `Origin` không khớp với máy chủ tiếp nhận $\rightarrow$ Từ chối với **HTTP 403 Forbidden** (`CSRF_DETECTED`) (`TEST-SEC-07`).
3. **Kiểm tra Token & Tài khoản:**
   - Token bị can thiệp chữ ký HMAC-SHA256 $\rightarrow$ Bị từ chối **HTTP 401** (`TEST-SEC-03`).
   - Token hết hạn timestamp $\rightarrow$ Bị từ chối **HTTP 401** (`TEST-SEC-04`).
   - Token mang ID của tài khoản đã bị khóa (`isActive = false`) hoặc không tồn tại $\rightarrow$ Bị từ chối **HTTP 401** (`ACCOUNT_INACTIVE`) (`TEST-SEC-05`).
   - Thao tác đăng xuất $\rightarrow$ Thu hồi phiên, set cookie với `maxAge = 0` và ghi nhật ký `AUTH_LOGOUT` (`TEST-SEC-08`).
4. **Bảo mật thông tin:**
   - Toàn bộ mật khẩu, chuỗi secret và token thực tế đều được bảo mật tuyệt đối, không xuất hiện trong báo cáo (được gắn nhãn `[REDACTED]`).

---

## 3. ĐỐI SOÁT TÍNH TOÀN VẸN DỮ LIỆU DATABASE CHÍNH (`sentrang`)

Thực hiện truy vấn SQL trực tiếp trên database chính `sentrang` (Port 5434) vào lúc 00:48:16 12/10/2026:

```sql
SELECT publish_status, count(*) FROM lessons GROUP BY publish_status;
SELECT content_status, count(*) FROM lessons GROUP BY content_status;
SELECT count(*) FROM lesson_contents;
SELECT count(*) FROM lesson_raw_contents;
SELECT count(*) FROM lesson_revisions;
SELECT id, title, content_status, publish_status, version FROM lessons WHERE id IN ('D-MM-A-01', 'D-MM-A-02', 'D-MM-A-03');
```

### Kết quả SQL thực tế trên `sentrang`:

| Chỉ số / Bảng | Giá trị thực tế | Ý nghĩa đối soát kỹ thuật |
| :--- | :---: | :--- |
| **publish_status** | **draft: 156 / published: 0** | **Bảo toàn 100%:** Tuyệt đối không có bài nào bị tự động xuất bản trên database chính. |
| **content_status** | **raw_extracted: 154 / ready: 2** | Gồm 154 bài ở dạng thô PDF và 2 bài demo đã biên tập chuẩn từ Chặng 2. |
| **lesson_contents** | **2 bản ghi** | Tương ứng chính xác với 2 bài demo `D-MM-A-01` và `D-MM-A-03`. |
| **lesson_raw_contents** | **156 bản ghi** | Đầy đủ 156/156 nhóm nội dung thô trích xuất từ Master Data V1.2. |
| **lesson_revisions** | **0 bản ghi** | Chưa có thao tác sửa đổi nào ghi đè vào database chính. |

### Giải trình về trạng thái `content_status` giữa Gate Check 2 và Gate Check 5:
- **Tại Gate Check 2:** Ban dự án đã thực hiện seed nội dung demo chuẩn mực cho hai bài học tiêu biểu `D-MM-A-01` (*Lịch sử Đức Phật Thích Ca*) và `D-MM-A-03` (*Ý nghĩa huy hiệu Hoa Sen trong GĐPT*), đưa `content_status` của 2 bài này về `ready`, trong khi vẫn giữ `publish_status = 'draft'`. 154 bài học còn lại giữ nguyên `raw_extracted`.
- **Tại báo cáo Gate Check 5 ban đầu:** Báo cáo đã ghi khái quát trong phần tóm tắt là *"156 raw_extracted / draft"*, cách diễn đạt này thiếu chính xác về mặt số học chi tiết, dễ gây hiểu lầm rằng 2 bài demo đã bị reset.
- **Xác nhận tính toàn vẹn:** Hệ thống **KHÔNG HỀ** reset, seed đè hay thay đổi database chính `sentrang`. Hai bài demo `D-MM-A-01` và `D-MM-A-03` cùng toàn bộ 156 bản ghi Master Data V1.2 vẫn được bảo tồn vẹn nguyên 100%. Mọi thao tác thử nghiệm duyệt bài đều được cách ly trên database `sentrang_test`.

---

## 4. BẢNG TỔNG HỢP KIỂM THỬ CHÍNH XÁC (52/52 TESTS PASS)

Tất cả 52 kịch bản kiểm thử được đánh mã định danh duy nhất và tự động hóa qua script `scratch/test_phase5_revised.ts`. Log chi tiết được lưu trữ tại `reports/test_phase5_revised_results.json`.

### A. Ma trận Thống kê theo Nhóm (Khớp toán học 100%)

| Mã nhóm | Tên nhóm kiểm thử | Số lượng bài test | Số bài đạt | Tỷ lệ |
| :---: | :--- | :---: | :---: | :---: |
| **GRP-01** | Unauthenticated Route Guards | 9 | 9 | 100% |
| **GRP-02** | Authentication, Tokens & CSRF Audit | 8 | 8 | 100% |
| **GRP-03** | Media Storage & Access Control | 8 | 8 | 100% |
| **GRP-04** | Dashboard Statistics | 6 | 6 | 100% |
| **GRP-05** | Lesson Management & Queries | 6 | 6 | 100% |
| **GRP-06** | Block Editor & Optimistic Concurrency | 5 | 5 | 100% |
| **GRP-07** | 5-Step Publishing Workflow | 6 | 6 | 100% |
| **GRP-08** | Main Database Strict Integrity & Isolation | 4 | 4 | 100% |
| **TỔNG** | **8 Nhóm kiểm thử toàn diện** | **52** | **52** | **100%** |

$$\sum \text{Tests} = 9 + 8 + 8 + 6 + 6 + 5 + 6 + 4 = 52 \quad (\text{Khớp hoàn toàn với tổng số 52 bài test})$$

---

### B. Danh mục Chi tiết 52 Bài Kiểm thử Tự động

| Test ID | Nhóm kiểm thử | Tên kịch bản kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-AUTH-01` | GRP-01 | GET `/api/admin/auth/me` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-02` | GRP-01 | GET `/api/admin/dashboard/stats` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-03` | GRP-01 | GET `/api/admin/lessons` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-04` | GRP-01 | GET `/api/admin/lessons/D-MM-A-01` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-05` | GRP-01 | PATCH `/api/admin/lessons/D-MM-A-01` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-06` | GRP-01 | POST `/api/admin/lessons/D-MM-A-01/mark-ready` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-07` | GRP-01 | POST `/api/admin/lessons/D-MM-A-01/publish` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-08` | GRP-01 | GET `/api/admin/media` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-AUTH-09` | GRP-01 | GET `/api/admin/audit-logs` không có cookie | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-SEC-01` | GRP-02 | Đăng nhập với mật khẩu sai | HTTP 401 INVALID_CREDENTIALS | HTTP 401 (INVALID_CREDENTIALS) | **PASS** |
| `TEST-SEC-02` | GRP-02 | Đăng nhập thành công thiết lập HttpOnly, SameSite=lax cookie | HTTP 200 + Cookie | HTTP 200, HttpOnly=true, SameSite=true | **PASS** |
| `TEST-SEC-03` | GRP-02 | Token bị thay đổi chữ ký (tampered signature) | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-SEC-04` | GRP-02 | Token đã hết hạn thời gian (expired timestamp) | HTTP 401 | HTTP 401 | **PASS** |
| `TEST-SEC-05` | GRP-02 | Token chứa User ID không tồn tại hoặc bị khóa | HTTP 401 ACCOUNT_INACTIVE | HTTP 401 (ACCOUNT_INACTIVE) | **PASS** |
| `TEST-SEC-06` | GRP-02 | Phòng thủ CSRF: `Sec-Fetch-Site: cross-site` trên POST | HTTP 403 CSRF_DETECTED | HTTP 403 (CSRF_DETECTED) | **PASS** |
| `TEST-SEC-07` | GRP-02 | Phòng thủ CSRF: Mismatched Origin header trên PATCH | HTTP 403 CSRF_DETECTED | HTTP 403 (CSRF_DETECTED) | **PASS** |
| `TEST-SEC-08` | GRP-02 | Đăng xuất xóa sạch cookie với maxAge=0 | HTTP 200 + cleared cookie | HTTP 200, cleared=true | **PASS** |
| `TEST-MEDIA-01` | GRP-03 | Tải ảnh PNG chuẩn lưu vào vùng riêng `data/media/` | HTTP 200 + /api/media/ url | HTTP 200, privateDir=true, notInPublic=true | **PASS** |
| `TEST-MEDIA-02` | GRP-03 | Tải ảnh JPEG chuẩn kiểm tra magic bytes thành công | HTTP 200 | HTTP 200 | **PASS** |
| `TEST-MEDIA-03` | GRP-03 | Tải tệp vượt quá 5MB bị từ chối | HTTP 400 FILE_TOO_LARGE | HTTP 400 (FILE_TOO_LARGE) | **PASS** |
| `TEST-MEDIA-04` | GRP-03 | Tải tệp giả mạo định dạng (script đổi đuôi .png) | HTTP 400 | HTTP 400 (Nội dung nhị phân không hợp lệ) | **PASS** |
| `TEST-MEDIA-05` | GRP-03 | Ngăn chặn Path Traversal (`/api/media/../../etc/passwd`) | HTTP 400 hoặc 404 | HTTP 400 | **PASS** |
| `TEST-MEDIA-06` | GRP-03 | Người chưa đăng nhập truy cập ảnh nội bộ/nháp bị chặn | HTTP 401 UNAUTHORIZED_MEDIA | HTTP 401 (UNAUTHORIZED_MEDIA) | **PASS** |
| `TEST-MEDIA-07` | GRP-03 | Quản trị viên đăng nhập xem được ảnh nội bộ/nháp | HTTP 200 + image/png | HTTP 200 (content-type: image/png) | **PASS** |
| `TEST-MEDIA-08` | GRP-03 | Ảnh của bài học đã xuất bản được xem công khai | HTTP 200 Public | HTTP 200 (public access: true) | **PASS** |
| `TEST-DASH-01` | GRP-04 | GET `/api/admin/dashboard/stats` trả về HTTP 200 | HTTP 200 | HTTP 200 | **PASS** |
| `TEST-DASH-02` | GRP-04 | Dashboard xác nhận tổng số bài học là 156 bài | 156 | 156 | **PASS** |
| `TEST-DASH-03` | GRP-04 | Dashboard phân loại chính xác 4 Bậc tu học | 4 levels | 4 levels | **PASS** |
| `TEST-DASH-04` | GRP-04 | Dashboard phân loại chính xác 3 Lĩnh vực | 3 categories | 3 categories | **PASS** |
| `TEST-DASH-05` | GRP-04 | Tổng số bài theo 4 bậc khớp 156 bài ($32+38+41+45$) | 156 | 156 | **PASS** |
| `TEST-DASH-06` | GRP-04 | Danh sách nhật ký kiểm toán gần đây có bản ghi | >= 1 log | >= 1 log | **PASS** |
| `TEST-LESSON-01` | GRP-05 | GET `/api/admin/lessons` trả về meta total = 156 | 156 | 156 | **PASS** |
| `TEST-LESSON-02` | GRP-05 | Lọc theo bậc `mo-mat` trả đúng 32 bài học | 32 | 32 | **PASS** |
| `TEST-LESSON-03` | GRP-05 | Lọc theo lĩnh vực `phat-phap` trả đúng 54 bài | 54 | 54 | **PASS** |
| `TEST-LESSON-04` | GRP-05 | Ô tìm kiếm tra cứu chính xác theo ID hoặc tiêu đề | >= 1 result | 1 matches | **PASS** |
| `TEST-LESSON-05` | GRP-05 | Chi tiết bài học có đủ thông tin và `rawContent` | ID D-MM-A-01 + rawContent | ID: D-MM-A-01, hasRaw: true | **PASS** |
| `TEST-LESSON-06` | GRP-05 | Dữ liệu thô chứa danh sách trang có số trang và chữ | Array of pages | pagesCount: 3, validFormat: true | **PASS** |
| `TEST-EDIT-01` | GRP-06 | PATCH cập nhật khối nội dung trả về HTTP 200 | HTTP 200 | HTTP 200 | **PASS** |
| `TEST-EDIT-02` | GRP-06 | Phiên bản bài học tự động tăng $N \rightarrow N+1$ | $v(N+1)$ | v2 | **PASS** |
| `TEST-EDIT-03` | GRP-06 | Cập nhật nội dung chuyển trạng thái sang `editing` | editing | editing | **PASS** |
| `TEST-EDIT-04` | GRP-06 | Optimistic Concurrency: Gửi version cũ trả 409 | HTTP 409 CONCURRENCY_CONFLICT | HTTP 409 (CONCURRENCY_CONFLICT) | **PASS** |
| `TEST-EDIT-05` | GRP-06 | Bản snapshot được lưu vào `lesson_revisions`, văn bản thô bất biến | Revisions snapshot | revisions: >=1, rawPages: 3 | **PASS** |
| `TEST-WF-01` | GRP-07 | Bước 1: Bài thô xuất bản bị chặn 400 LESSON_NOT_READY | HTTP 400 LESSON_NOT_READY | HTTP 400 (LESSON_NOT_READY) | **PASS** |
| `TEST-WF-02` | GRP-07 | Bước 2: Biên tập nội dung chuyển sang `editing` | editing | HTTP 200, status: editing | **PASS** |
| `TEST-WF-03` | GRP-07 | Bước 3: Đánh dấu sẵn sàng chuyển sang `ready` | ready | HTTP 200, status: ready | **PASS** |
| `TEST-WF-04` | GRP-07 | Bước 4: Xuất bản bài sẵn sàng ghi nhận `publishedAt` | published | HTTP 200, publishStatus: published, publishedAt: true | **PASS** |
| `TEST-WF-05` | GRP-07 | Trang đọc độc giả trả HTTP 200 cho bài đã xuất bản | HTTP 200 | HTTP 200 | **PASS** |
| `TEST-WF-06` | GRP-07 | Bước 5: Thu hồi về nháp và độc giả lập tức nhận 404 | HTTP 200 unpublish + HTTP 404 | unpublishStatus: draft, readerStatus: HTTP 404 | **PASS** |
| `TEST-ISOLATION-01` | GRP-08 | Database chính `sentrang`: `publishedLessons === 0` | 0 published | 0 published | **PASS** |
| `TEST-ISOLATION-02` | GRP-08 | Database chính `sentrang`: `draftLessons === 156` | 156 draft | 156 draft | **PASS** |
| `TEST-ISOLATION-03` | GRP-08 | Database chính `sentrang`: 154 raw_extracted + 2 ready | 154 raw + 2 ready | 154 raw, 2 ready, 2 lesson_contents | **PASS** |
| `TEST-ISOLATION-04` | GRP-08 | Trang đọc công khai trên database chính trả 404 cho bài nháp | HTTP 404 | D-01: HTTP 404, D-03: HTTP 404 | **PASS** |

---

## 5. QUALITY GATES VERIFICATION (REVISED)

- [x] **QG-01 (Type Check):** `pnpm run typecheck` $\rightarrow$ **0 lỗi TypeScript** (Exit code 0).
- [x] **QG-02 (Linter):** `pnpm run lint` $\rightarrow$ **0 warnings, 0 errors** (Exit code 0).
- [x] **QG-03 (Production Build):** `pnpm run build` $\rightarrow$ **25/25 routes compiled & optimized** (Exit code 0).
- [x] **QG-04 (Automated Tests):** 52/52 tests pass (Exit code 0, 100% pass rate).
- [x] **QG-05 (Media Security):** Lưu trữ ngoài `public`, kiểm tra magic bytes, chặn 401 với ảnh chưa xuất bản.
- [x] **QG-06 (Data Safety):** Database chính giữ nguyên 156 draft (154 raw_extracted, 2 ready), 0 bài published.

---

## 6. LỖI TỒN ĐỌNG & TRẠNG THÁI HỆ THỐNG

- **Lỗi tồn đọng kỹ thuật:** **KHÔNG CÓ (0 lỗi)**.
- **Tuân thủ cam kết Chặng 5:**
  - Không tiến hành Chặng 6.
  - Không deploy lên môi trường production.
  - Không tự ý xuất bản bài học trên database chính `sentrang`.

---

## 7. KẾT LUẬN & ĐỀ NGHỊ

Hệ thống Quản trị Học liệu & Quy trình Duyệt bài **SCR-07** đã được khắc phục bảo mật toàn diện, hoàn thiện kiểm toán phiên và đối soát dữ liệu với độ chính xác tuyệt đối.

Kính trình Người Phê Duyệt xem xét và chính thức phê duyệt **GATE CHECK REPORT 5 — REVISED**.
