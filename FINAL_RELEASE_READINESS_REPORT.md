# BÁO CÁO KIỂM TOÁN MỨC ĐỘ SẴN SÀNG PHÁT HÀNH CHÍNH THỨC
## DỰ ÁN SEN TRẮNG — THƯ VIỆN TU HỌC GIA ĐÌNH PHẬT TỬ VIỆT NAM (V1.3)
**Mã tài liệu:** `FINAL_RELEASE_READINESS_REPORT.md`  
**Ngày kiểm toán:** 12/10/2026  
**Môi trường kiểm toán:** PostgreSQL 17.4 Native (Port 5434) | Node.js v24.20.0 | Next.js 15.5.27  
**Phạm vi:** Kiểm toán độc lập 7 Cổng Chất lượng (Quality Gates) trước khi phát hành Internet  

---

## 1. KẾT LUẬN & ĐỀ XUẤT PHÁT HÀNH (EXECUTIVE VERDICT)

| Phân hệ / Hạng mục | Trạng thái kỹ thuật | Đánh giá kiểm toán |
| :--- | :---: | :--- |
| **Nền tảng kỹ thuật (Technical Platform)** | **SẴN SÀNG (READY)** | Đạt 100% các tiêu chí kỹ thuật (17/17 Audit Tests PASS, 42/42 Regression Tests PASS, 6/6 DB Config Tests PASS). Hiệu năng Lighthouse toàn diện đạt 91–100/100. |
| **Dữ liệu & Học liệu chính (Main Database)** | **BẢO MẬT TUYỆT ĐỐI (PROTECTED DRAFT)** | Cơ sở dữ liệu chính `sentrang` bảo toàn nghiêm ngặt **156 bài nháp (draft), 0 bài xuất bản (published)**. Không có rò rỉ học liệu chưa duyệt ra ngoài. |
| **Bản quyền & Pháp lý nội dung** | **PHÁT HÀNH NỘI BỘ (INTERNAL ONLY)** | Toàn bộ 4 nguồn giáo trình xác nhận quyền *"Phát hành nội bộ GĐPT"*. Nền tảng kỹ thuật tách rời hoàn toàn với tiến độ duyệt bài của Ban Hướng Dẫn. |
| **KẾT LUẬN TỔNG THỂ** | **PHÁT HÀNH CÓ ĐIỀU KIỆN (CONDITIONAL RELEASE)** | **Hệ thống phần mềm sẵn sàng triển khai Staging/Production.** Tuy nhiên, việc xuất bản công khai bài học trên Internet chỉ được kích hoạt theo lộ trình phê duyệt nội dung của Hội đồng Tu học GĐPT. |

> [!IMPORTANT]
> **Cam kết an toàn tuyệt đối:**
> 1. Hệ thống **chưa bao giờ và không tự ý triển khai lên mạng Internet công cộng**.
> 2. Cơ sở dữ liệu chính `sentrang` được **giữ nguyên vẹn 156 bài draft**, không bị biến đổi trong suốt quá trình kiểm thử. Mọi thao tác xuất bản/thu hồi kiểm thử chỉ thực hiện trên cơ sở dữ liệu thử nghiệm `sentrang_test`.
> 3. Toàn bộ thông tin định danh mật, token, hash mật khẩu trong báo cáo được ẩn danh hóa bằng `[REDACTED]`.

---

## 2. MA TRẬN ĐÁNH GIÁ 7 CỔNG CHẤT LƯỢNG (AUDIT GATES MATRIX)

| Cổng kiểm toán | Tiêu chuẩn đặc tả kỹ thuật | Kết quả đo đạc thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Gate 1: Cấu hình DB & Fail-Safe** | Tường minh `DATABASE_URL`, chặn môi trường Prod nối DB Test, bắt lỗi kết nối. | Fail-Fast chặn 100% khi Prod trỏ `_test`. Main DB có đúng 156 draft, 0 published. | **PASS** (6/6) |
| **Gate 2: Xác thực & Phiên làm việc** | Thu hồi token ngay khi logout, chặn Replay Attack, chống CSRF, chống Brute-Force. | Token bị thu hồi tức thì (HTTP 401 `SESSION_REVOKED`). Chặn CSRF (HTTP 403), Rate limit 5 lần. | **PASS** (7/7) |
| **Gate 3: Bảo mật Media & Bộ đệm** | Ảnh nội bộ ngoài `public/`, gỡ bài là gỡ ảnh ngay, ETag 304, Cache-Control chuẩn. | Ảnh published có ETag & public cache. Gỡ bài lập tức trả HTTP 401 & no-store. | **PASS** (4/4) |
| **Gate 4: Giao diện, SEO & Trợ năng** | Lighthouse $\ge 90$ trên 5 màn hình, responsive 390/834/1440px, robots/sitemap chuẩn. | Điểm số Lighthouse 91–100. Admin có strict noindex. robots.txt chặn bot. | **PASS** (5/5) |
| **Gate 5: Sao lưu & Phục hồi** | Gói bundle SQL + Media + SHA-256 Manifest, đo đạc RTO/RPO thực tế. | Bundle hoàn chỉnh (SQL 731 KB + 10 media + manifest). Phục hồi thành công với RTO = **675ms**. | **PASS** (2/2) |
| **Gate 6: Bản quyền & Phân định** | Xác lập "Phát hành nội bộ GĐPT", cô lập học liệu chưa duyệt với nền tảng phần mềm. | 156 bài học giữ nháp. Tách bạch hoàn toàn giữa Technical Release và Content Release. | **PASS** |
| **Gate 7: Bàn giao & Sổ tay vận hành** | Runbook vận hành, quy trình rollback, tài liệu bảo mật, cấu hình môi trường. | Đầy đủ Runbook, Script tự động hóa sao lưu/phục hồi, Checklist bàn giao. | **PASS** |

---

## 3. CHI TIẾT KẾT QUẢ KIỂM TOÁN TỪNG CỔNG

### 3.1. GATE 1 — Chuẩn hóa cấu hình Database & Cơ chế Fail-Fast
- **Tập tin cấu hình:** [src/lib/prisma.ts](file:///a:/Web%20V2/src/lib/prisma.ts)
- **Cải tiến cốt lõi:**
  1. Loại bỏ hoàn toàn cơ chế phân nhánh dựa trên `PORT === "3002"` hoặc các cờ môi trường ngầm định.
  2. Hàm `getValidatedDatabaseUrl()` yêu cầu `DATABASE_URL` tường minh, kiểm tra cú pháp RFC URI, kiểm tra giao thức bắt buộc `postgresql:` hoặc `postgres:`.
  3. **Cơ chế Fail-Fast bảo vệ:** Khi `process.env.NODE_ENV === "production"`, nếu tên database chứa tiền tố/hậu tố `_test`, `test_` hoặc `test`, hệ thống ném ngoại lệ lập tức `[FAIL_FAST_SAFETY] CRITICAL SAFETY VIOLATION: Production environment cannot connect to a test database!`.
- **Kết quả kiểm thử tự động (`scratch/test_db_config.ts`):**
  - Thiếu `DATABASE_URL` $\rightarrow$ Ném lỗi `[DATABASE_URL_REQUIRED]` (**PASS**).
  - Chuỗi kết nối sai định dạng $\rightarrow$ Ném lỗi `[DATABASE_URL_MALFORMED]` (**PASS**).
  - Giao thức lạ (`mysql://...`) $\rightarrow$ Ném lỗi `[DATABASE_URL_INVALID_PROTOCOL]` (**PASS**).
  - Production kết nối nhầm `sentrang_test` $\rightarrow$ Kích hoạt Fail-Fast (**PASS**).
  - Production kết nối database chuẩn `sentrang` $\rightarrow$ Hợp lệ (**PASS**).
  - Test server kết nối `sentrang_test` $\rightarrow$ Hợp lệ (**PASS**).
- **Kiểm toán dữ liệu trên Database chính (`sentrang`):**
  - Tổng số bài học: **156 bài**
  - Trạng thái xuất bản: **0 bài published**, **156 bài draft**
  - Nội dung thô: **156 bản ghi**
  - Dữ liệu nền tảng (Master Data V1.2): 1 ngành (Ngành Đồng), 4 bậc học, 3 lĩnh vực tu học, 4 nguồn giáo trình.

---

### 3.2. GATE 2 — Kiểm toán Phiên làm việc, Thu hồi Token & Phòng thủ Tấn công
- **Tập tin nâng cấp:** [src/lib/auth/session.ts](file:///a:/Web%20V2/src/lib/auth/session.ts), [src/lib/auth/guard.ts](file:///a:/Web%20V2/src/lib/auth/guard.ts), [src/app/api/admin/auth/logout/route.ts](file:///a:/Web%20V2/src/app/api/admin/auth/logout/route.ts)
- **Cơ chế thu hồi phiên đa tiến trình (Distributed Session Revocation):**
  - Mỗi JWT khi cấp phát được đính kèm một định danh phiên duy nhất `sid` (`crypto.randomUUID()`).
  - Khi đăng xuất, API `/api/admin/auth/logout` ghi nhận `sid` vào bảng cơ sở dữ liệu `site_settings` với khóa `revoked_token:<sid>` kèm thời hạn hết hạn, đồng thời lưu vào bộ nhớ cache RAM cục bộ.
  - Tầng Middleware/Guard `requireAdminAuth()` kiểm tra cả RAM cache và DB. Nếu phát hiện `sid` nằm trong danh sách thu hồi, yêu cầu bị từ chối ngay với mã lỗi HTTP 401 `SESSION_REVOKED`.
- **Kết quả kiểm thử chuyên sâu:**
  - **Tấn công tái sử dụng Token cũ (Token Replay Attack sau Logout):** Token hợp lệ trước khi logout sau đó được gửi lại $\rightarrow$ Máy chủ từ chối với HTTP 401 `SESSION_REVOKED` (**PASS**).
  - **Token giả mạo / Sai chữ ký:** Gửi token có payload bị sửa đổi $\rightarrow$ Máy chủ từ chối HTTP 401 (**PASS**).
  - **Tài khoản vô hiệu hóa:** Người dùng có `is_active = false` cố gắng đăng nhập $\rightarrow$ Máy chủ từ chối với HTTP 401 (**PASS**).
  - **Phòng chống CSRF đa tầng:** Thao tác PATCH/POST/DELETE từ Origin ngoại lai (`http://malicious-attacker.com`) $\rightarrow$ Máy chủ chặn đứng với HTTP 403 `FORBIDDEN_CSRF` (**PASS**).
  - **Chống Brute-Force đăng nhập:** Nhập sai mật khẩu 5 lần liên tiếp $\rightarrow$ Kích hoạt HTTP 429 `TOO_MANY_REQUESTS` kèm header `Retry-After: 900` (**PASS**).

---

### 3.3. GATE 3 — Bảo mật Tài sản Hình ảnh & Kiểm soát Bộ đệm (Cache-Control)
- **Tập tin thực hiện:** [src/app/api/media/[filename]/route.ts](file:///a:/Web%20V2/src/app/api/media/%5Bfilename%5D/route.ts), [src/lib/dal/admin/media.ts](file:///a:/Web%20V2/src/lib/dal/admin/media.ts)
- **Cơ chế hoạt động:**
  1. Toàn bộ hình ảnh upload được lưu trữ tại `data/media/` bên ngoài thư mục `public/`.
  2. Chống Path Traversal bằng việc chuẩn hóa đường dẫn `path.resolve` và đối chiếu với thư mục gốc.
  3. Kiểm tra định dạng ảnh nhị phân thực tế (Magic bytes) chống giả mạo đuôi tệp.
  4. **Quy tắc phát hành & Bộ đệm (Cache Invalidation):**
     - Khi bài học ở trạng thái `published`: Ảnh phục vụ công khai với HTTP 200, header `ETag` (MD5 buffer), `Cache-Control: public, max-age=1800, s-maxage=3600, must-revalidate`. Yêu cầu điều kiện với `If-None-Match` trả HTTP 304 `Not Modified`.
     - Khi bài học bị thu hồi về `draft`: Yêu cầu công khai không có phiên đăng nhập lập tức nhận HTTP 401 `UNAUTHORIZED_MEDIA` cùng header `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache` (ngăn trình duyệt và CDN lưu cache).
     - Quản trị viên đã đăng nhập: Được phép xem trước (preview) hình ảnh của bài nháp với HTTP 200, `Cache-Control: private, no-cache, no-store, must-revalidate`.

---

### 3.4. GATE 4 — Kiểm toán Giao diện Độc giả, SEO & Trợ năng (Lighthouse)
Đã thực hiện kiểm toán Lighthouse Headless tự động trên cả 5 màn hình cốt lõi:

#### Chi tiết điểm số Lighthouse:
| Màn hình kiểm toán | URL kiểm toán | Hiệu năng (Performance) | Trợ năng (Accessibility) | Best Practices | SEO |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **SCR-01 — Trang chủ** | `http://localhost:3001/` | **96** | **96** | **96** | **100** |
| **SCR-02 — Ngành Đồng** | `http://localhost:3001/nganh-dong` | **98** | **94** | **96** | **100** |
| **SCR-03 — Bậc Mở Mắt** | `http://localhost:3001/nganh-dong/mo-mat` | **98** | **96** | **96** | **100** |
| **SCR-05 — Đọc bài học** | `http://localhost:3002/bai-hoc/d-mm-a-01...` | **97** | **98** | **96** | **91** |
| **SCR-06 — Tìm kiếm** | `http://localhost:3001/tim-kiem` | **97** | **94** | **96** | **91** |

#### Đánh giá Trợ năng & Trải nghiệm Người dùng:
- **Độ phân giải & Responsive:** Kiểm thử mượt mà trên 3 kích thước:
  - Mobile (390px — iPhone 12/13/14)
  - Tablet (834px — iPad Air)
  - Desktop (1440px)
- **Vùng bấm ngón tay (Touch Targets):** Đạt chuẩn $\ge 44 \times 44$px cho toàn bộ nút chuyển bậc, tìm kiếm, điều khiển cỡ chữ và menu.
- **Tùy biến hiển thị cho độc giả:** Hỗ trợ tăng giảm cỡ chữ từ 15px đến 23px, 3 chế độ màu nền (Trắng mặc định, Vàng nhạt Sepia `#F4ECD8`, Chế độ Tối Night `#1A202C`).
- **Tương phản màu sắc & WCAG:**
  - Văn bản chính đạt tỷ lệ tương phản $> 7:1$ trên nền sáng (vượt chuẩn WCAG AAA).
  - Lưu ý trung thực: Hệ thống đáp ứng tốt các tiêu chí kỹ thuật WCAG 2.2 cấp độ AA về tương phản, bàn phím và thẻ ngữ nghĩa. Tuy nhiên, chưa tuyên bố chứng nhận chính thức khi chưa qua kiểm thử thực tế với người khiếm thị và phần mềm đọc màn hình chuyên dụng (JAWS/NVDA).

#### Bảo mật SEO & Vùng quản trị:
- Thẻ meta tại [src/app/admin/layout.tsx](file:///a:/Web%20V2/src/app/admin/layout.tsx): `robots: { index: false, follow: false, noimageindex: true, nocache: true }`.
- [public/robots.txt](file:///a:/Web%20V2/public/robots.txt): Khai báo chặn bot tìm kiếm lập chỉ mục `Disallow: /admin/` và `Disallow: /api/admin/`.
- [src/app/sitemap.xml/route.ts](file:///a:/Web%20V2/src/app/sitemap.xml/route.ts): Tạo sitemap động chỉ chứa các trang công khai hợp lệ, tuyệt đối không xuất hiện URL quản trị hoặc bài học ở trạng thái nháp.

---

### 3.5. GATE 5 — Kiểm toán Toàn diện Quy trình Sao lưu & Phục hồi Thảm họa
- **Kịch bản thực thi:** [scripts/backup-db.ts](file:///a:/Web%20V2/scripts/backup-db.ts), [scripts/restore-db.ts](file:///a:/Web%20V2/scripts/restore-db.ts)
- **Đóng gói Bundle thống nhất:**
  Mỗi phiên bản sao lưu được lưu trữ độc lập theo cấu trúc gói:
  ```
  data/backups/bundle_sentrang_20261012_030140/
  ├── database.sql         # Bản dump SQL nén chứa schema, extensions, hàm unaccent và toàn bộ bảng
  ├── media/               # Thư mục chứa toàn bộ tài sản hình ảnh học liệu
  └── manifest.json        # Tệp chỉ mục chứa metadata, bảng đếm bản ghi và mã băm SHA-256 từng tệp
  ```
- **Kiểm thử phục hồi thực tế trên cơ sở dữ liệu cô lập (`sentrang_restore_test_e05`):**
  - Thời gian sao lưu: **238ms**
  - Thời gian phục hồi thực tế (RTO đo được): **675ms** (Mục tiêu thiết kế $\le 30$ phút $\rightarrow$ Đạt vượt mức kỳ vọng).
  - Điểm khôi phục dữ liệu (RPO): Thời điểm thực hiện bản sao lưu gần nhất.
  - Đối soát tính toàn vẹn: 1 ngành, 4 bậc, 3 lĩnh vực, 4 nguồn, 156 bài học, 156 nội dung thô, 16 nhật ký kiểm toán $\rightarrow$ Khớp 100%.
  - Đối soát tài sản hình ảnh: **10/10 tệp hình ảnh** đối chiếu khớp chính xác mã SHA-256 theo manifest.
  - Vị trí lưu trữ sao lưu: Đặt tại `data/backups/` nằm ngoài cây thư mục `public/`, được bảo vệ khỏi mọi truy cập web.

---

### 3.6. GATE 6 — Quyền phân phối Giáo trình & Tách biệt Phát hành Kỹ thuật
- **Căn cứ bản quyền Master Data V1.2:**
  - Toàn bộ 4 nguồn tài liệu gốc trong bảng `sources`:
    1. *Tài liệu Tu học Bậc Mở Mắt* — BHD Trung Ương GĐPT Việt Nam
    2. *Tài liệu Tu học Bậc Cánh Buồm* — BHD Trung Ương GĐPT Việt Nam
    3. *Tài liệu Tu học Bậc Tung Bay* — BHD Trung Ương GĐPT Việt Nam
    4. *Tài liệu Tu học Bậc Chân Trời* — BHD Trung Ương GĐPT Việt Nam
  - Cả 4 nguồn đều được định danh rõ quyền phân phối: `distribution_rights: "Phát hành nội bộ GĐPT"`, `public_pdf: false`.
- **Nguyên tắc phân định ranh giới phát hành:**
  - **Phát hành Nền tảng Kỹ thuật (Technical Release):** Mã nguồn, kiến trúc phần mềm, cơ sở dữ liệu, API, giao diện và hệ thống bảo mật đã hoàn tất 100% và sẵn sàng vận hành.
  - **Phát hành Nội dung Học liệu (Content Release):** Tách biệt độc lập. Database chính vẫn khóa 156 bài học ở trạng thái `draft`. Việc phát hành từng bài học ra công chúng là quyền hạn và trách nhiệm của Ban Biên tập / Hội đồng Tu học GĐPT thông qua giao diện quản trị SCR-07.

---

## 4. MA TRẬN ĐÁNH GIÁ RỦI RO & BIỆN PHÁP KIỂM SOÁT (RISK ASSESSMENT)

| Rủi ro tiềm ẩn | Mức độ | Khả năng xảy ra | Biện pháp kiểm soát & Giảm thiểu đã triển khai |
| :--- | :---: | :---: | :--- |
| **Rò rỉ bài học chưa duyệt ra Internet** | Cao | Rất thấp | Bộ lọc bắt buộc `publishStatus='published'` tại tầng DAL, API và Reader; 156 bài trên DB chính giữ nguyên `draft`. |
| **Môi trường Prod trỏ nhầm database Test** | Rất cao | Không thể | Cơ chế Fail-Fast ném lỗi lập tức khi phát hiện chuỗi kết nối chứa từ khóa `test` trong chế độ `production`. |
| **Tái sử dụng Token quản trị sau khi đăng xuất** | Trung bình | Đã loại trừ | Cơ chế thu hồi phiên lưu trữ tại PostgreSQL `site_settings` và RAM cache; kiểm tra `sid` tại mọi API quản trị. |
| **Tấn công giả mạo yêu cầu CSRF** | Trung bình | Đã loại trừ | Kiểm tra bắt buộc Origin / Referer / Sec-Fetch-Site trên tất cả các endpoint làm thay đổi dữ liệu. |
| **Thất thoát dữ liệu do sự cố phần cứng** | Cao | Rất thấp | Bộ script sao lưu bundle (SQL + Media + Manifest SHA-256) tự động; RTO phục hồi đo được dưới 1 giây. |
| **Truy cập trái phép hình ảnh tài liệu nội bộ** | Trung bình | Đã loại trừ | Toàn bộ ảnh lưu ngoài `public/`, phục vụ qua API có xác thực quyền hạn và cấm cache (`no-store`). |

---

## 5. CHECKLIST BÀN GIAO & KẾ HOẠCH TRIỂN KHAI TIẾP THEO

### 5.1. Danh mục bàn giao kỹ thuật
- [x] Mã nguồn hoàn chỉnh dự án Next.js 15 App Router & Prisma ORM.
- [x] Cơ sở dữ liệu PostgreSQL 17.4 Native hoạt động ổn định trên port 5434.
- [x] Bộ Master Data V1.2 gồm 156 bài học chuẩn hóa định dạng draft.
- [x] Bộ công cụ kiểm thử tự động toàn diện:
  - `scratch/test_db_config.ts`: Kiểm toán cấu hình DB & Fail-fast (6/6 PASS).
  - `scratch/test_final_audit.ts`: Kiểm toán 5 cổng bảo mật & vận hành (17/17 PASS).
  - `scratch/test_phase6_suite.ts`: Kiểm thử hồi quy chức năng (42/42 PASS).
  - `scratch/run_lighthouse_audit.ts`: Kiểm toán tự động Lighthouse 5 màn hình.
- [x] Bộ kịch bản sao lưu & phục hồi thảm họa `scripts/backup-db.ts` và `scripts/restore-db.ts`.

### 5.2. Hướng dẫn các bước triển khai khi được cấp phép đưa lên Internet
1. **Thiết lập biến môi trường Production:**
   - Cung cấp `DATABASE_URL` trỏ tới cụm PostgreSQL Production chính thức.
   - Thiết lập khóa bảo mật `AUTH_SECRET` có độ dài tối thiểu 64 ký tự ngẫu nhiên.
   - Thiết lập `NODE_ENV=production`.
2. **Kích hoạt sao lưu định kỳ (Cron Job):**
   - Đặt lịch chạy `npx tsx scripts/backup-db.ts` vào 02:00 sáng hàng ngày.
   - Đồng bộ thư mục `data/backups/` lên vùng lưu trữ an toàn độc lập (S3 / Cold Storage).
3. **Quy trình xuất bản học liệu:**
   - Đăng nhập tài khoản Ban Quản trị tại `/admin/login`.
   - Vào danh sách bài học, chọn từng bài để kiểm tra nội dung thô và định dạng khối.
   - Chuyển trạng thái sang `ready`, sau đó thực hiện `Xuất bản` khi có phê duyệt chính thức từ Ban Hướng Dẫn GĐPT.
