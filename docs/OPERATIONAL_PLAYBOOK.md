# OPERATIONAL PLAYBOOK — DỰ ÁN SEN TRẮNG
## Sổ tay Vận hành, Quy trình Biên tập & Ứng phó Sự cố
**Hệ thống Thư viện Tu học Gia Đình Phật Tử Việt Nam — Sen Trắng (V1.3)**
*Ngày ban hành: Tháng 10/2026 | Phiên bản tài liệu: 1.0 — Chuẩn hóa Phát hành Nội bộ*

---

## 1. KIẾN TRÚC HỆ THỐNG & TRIỂN KHAI POSTGRESQL 17 NATIVE

### 1.1 Sơ đồ kiến trúc tổng thể
Hệ thống Sen Trắng được thiết kế theo mô hình tối giản, bảo mật cao và chịu tải tối ưu:
- **Tầng Ứng dụng (Application Layer):** Next.js 15+ (App Router), React 19, TypeScript strict mode, Tailwind CSS v4, Lucide Icons.
- **Tầng Dịch vụ & Dữ liệu (DAL & ORM):** Prisma ORM v6 kết hợp driver adapter `@prisma/adapter-pg` và connection pooling `pg.Pool`.
- **Tầng Cơ sở dữ liệu (Database Layer):** PostgreSQL 17.x Native (64-bit), biên dịch chuẩn hệ điều hành máy chủ, kích hoạt hai extension bắt buộc:
  + `unaccent`: Loại bỏ dấu tiếng Việt phục vụ chuẩn hóa tìm kiếm.
  + `pg_trgm`: Chỉ mục GIN Trigram (`gin_trgm_ops`) phục vụ tìm kiếm mờ (fuzzy search) và đối sánh tiền tố/hậu tố.
- **Tầng Lưu trữ Tài sản (Media Storage):** Vùng lưu trữ vật lý riêng biệt `data/media/` nằm ngoài cây thư mục `public/`, được kiểm soát truy cập thông qua Gateway API `/api/media/[filename]` với xác thực MIME thực nghiệm và kiểm tra quyền xuất bản.

### 1.2 Yêu cầu phần cứng & môi trường máy chủ
- **Hệ điều hành:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) hoặc Windows Server 2022.
- **CPU:** Tối thiểu 2 vCPU (khuyến nghị 4 vCPU).
- **RAM:** Tối thiểu 4 GB (khuyến nghị 8 GB cho PostgreSQL buffer cache).
- **Bộ nhớ lưu trữ:** Tối thiểu 20 GB SSD NVMe (đảm bảo IOPS $\ge 3000$).
- **Môi trường Runtime:** Node.js LTS v20.x hoặc v22.x, pnpm v9.x, PostgreSQL 17.x client binaries (`pg_dump`, `psql`).

### 1.3 Cấu hình biến môi trường (`.env`)
Máy chủ sản xuất yêu cầu các biến môi trường sau:
```env
# 1. Cơ sở dữ liệu PostgreSQL Native
DATABASE_URL="postgresql://postgres:[STRONG_PASSWORD]@127.0.0.1:5432/sentrang?sslmode=prefer"

# 2. Khóa ký JWT phiên Quản trị (Tối thiểu 32 ký tự ngẫu nhiên entropy cao)
ADMIN_JWT_SECRET="[STRONG_64_CHAR_RANDOM_SECRET_HEX]"

# 3. Cấu hình Tên miền & Canonical
NEXT_PUBLIC_SITE_URL="https://sentrang.gdptvietnam.org"
NODE_ENV="production"
PORT=3000

# 4. Giới hạn Tải lên & Lưu trữ
MEDIA_UPLOAD_DIR="data/media"
MAX_UPLOAD_SIZE_BYTES=5242880 # 5MB
```

### 1.4 Quy trình Khởi tạo Cơ sở dữ liệu trên Môi trường Mới
1. **Cài đặt PostgreSQL 17 Native & Tạo Database:**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE sentrang ENCODING 'UTF8';"
   ```
2. **Kích hoạt Extension:**
   ```bash
   sudo -u postgres psql -d sentrang -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
   sudo -u postgres psql -d sentrang -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
   ```
3. **Triển khai Schema & Migration thông qua Prisma:**
   ```bash
   pnpm exec prisma migrate deploy
   ```
4. **Nhập Master Data V1.2 (Idempotent Seed):**
   ```bash
   pnpm exec tsx prisma/seed.ts
   ```
   *Kiểm tra số lượng bản ghi sau seed:* 1 ngành, 4 bậc, 3 lĩnh vực, 4 nguồn, 156 bài học nháp, 156 nội dung thô (`lesson_raw_contents`), 0 bài xuất bản.

---

## 2. QUY TRÌNH BIÊN TẬP & XUẤT BẢN CHUẨN 5 BƯỚC (SOP)

Nhằm đảm bảo tính chuẩn xác của giáo trình tu học Gia Đình Phật Tử Việt Nam, mọi bài học từ văn bản quét thô đến khi hiển thị công khai trên website đều phải tuân thủ nghiêm ngặt quy trình 5 bước:

```
[Bước 1: Trích xuất thô]  -->  [Bước 2: Biên tập cấu trúc]  -->  [Bước 3: Hiệu đính & Duyệt]
         │                                   │                                    │
    raw_extracted                         editing                               ready
                                                                                  │
                                                                         [Bước 4: Xem trước Staging]
                                                                                  │
                                                                         [Bước 5: Phát hành chính thức]
                                                                                  │
                                                                              published
```

### Bước 1: Tiếp nhận & Đối soát Dữ liệu Thô (`raw_extracted`)
- **Trạng thái:** `content_status = 'raw_extracted'`, `publish_status = 'draft'`.
- **Đặc điểm:** Dữ liệu trích xuất từ tài liệu PDF gốc được lưu trong bảng `lesson_raw_contents` dạng `pages_json`. Chưa hiển thị ra ngoài công chúng.
- **Thao tác:** Huynh trưởng biên tập mở giao diện Quản trị `/admin/lessons`, chọn bài học cần xử lý, đối chiếu trang PDF gốc hiển thị ở cột 1 (Cột tài liệu tham chiếu).

### Bước 2: Chuẩn hóa & Cấu trúc hóa Bài học (`editing`)
- **Trạng thái:** `content_status = 'editing'`.
- **Thao tác:** Sử dụng Block Editor tại cột 2 để nhập liệu và định dạng:
  + Tiêu đề bài học (`title`): Chuẩn hóa chính tả tiếng Việt, viết hoa chữ cái đầu và danh từ riêng.
  + Mục lục các phần (`heading 2`, `heading 3`): Tách rõ các phần Nội dung bài giảng, Ý nghĩa, Điều cần ghi nhớ.
  + Đoạn văn (`paragraph`), Danh sách (`bullet_list`, `numbered_list`): Tránh ngắt dòng sai sót từ PDF.
  + Khung ghi nhớ / Lời dạy Đức Phật (`callout`): Chọn tông màu trang nghiêm, phù hợp tâm lý lứa tuổi Oanh Vũ.
  + Hình ảnh minh họa: Tải ảnh qua tab Media, ảnh tự động lưu vào vùng an toàn và gắn thẻ mô tả.
- Nhấn **"Lưu bản nháp"** để ghi nhận dữ liệu vào bảng `lesson_contents` và lưu lịch sử vào `lesson_revisions`.

### Bước 3: Thẩm định Học vụ & Duyệt Bản thảo (`ready`)
- **Trạng thái chuyển đổi:** Chuyển từ `editing` sang `ready`.
- **Người thực hiện:** Huynh trưởng phụ trách Học vụ / Ban Biên tập.
- **Tiêu chuẩn kiểm duyệt:**
  1. Nội dung bám sát giáo trình tu học Ngành Đồng do BHD ban hành.
  2. Không có lỗi chính tả, câu chữ trong sáng, phù hợp đoàn sinh 7–12 tuổi.
  3. Cấu trúc bài học có đầy đủ mục lục (TOC) tự động.
- **Thao tác:** Nhấn nút **"Duyệt nội dung (Sẵn sàng xuất bản)"**. Hệ thống xác thực schema khối và kích hoạt trạng thái `ready`.

### Bước 4: Xem trước Giao diện Thực tế (Staging Preview)
- **Thao tác:** Người kiểm duyệt mở tab **"Xem trước"** trên giao diện 3 cột hoặc truy cập URL kiểm tra nội bộ.
- **Tiêu chí kiểm tra:**
  + Kiểm tra hiển thị trên kích thước màn hình điện thoại (390px) và máy tính (1440px).
  + Kiểm tra độ tương phản văn bản và cỡ chữ (từ 15px đến 23px).
  + Kiểm tra các mục TOC nhảy đúng vị trí neo tiêu đề.

### Bước 5: Phát hành Chính thức (`published`)
- **Trạng thái:** `publish_status = 'published'`, `published_at = NOW()`.
- **Người thực hiện:** Trưởng Ban Biên tập hoặc Quản trị viên cấp cao.
- **Thao tác:** Nhấn nút **"Xuất bản công khai"**.
- **Hệ thống tự động thực thi:**
  1. Ghi nhận thời điểm phát hành `published_at`.
  2. Ghi nhật ký kiểm toán quản trị `admin_audit_logs` với action `PUBLISH_LESSON`.
  3. Cập nhật bài học vào sitemap động `/sitemap.xml` và lập chỉ mục tìm kiếm `/api/v1/search`.
  4. Mở quyền truy cập hình ảnh đính kèm bài học thông qua `/api/media/[filename]`.

### Quy trình Thu hồi Bài học Khẩn cấp (Unpublish / Emergency Recall)
Khi phát hiện sai sót học vụ cần chỉnh sửa:
1. Quản trị viên truy cập `/admin/lessons/[id]`.
2. Nhấn nút **"Thu hồi bài viết (Chuyển về Nháp)"**.
3. Hệ thống ngay lập tức chuyển `publish_status = 'draft'`.
4. URL công khai `/bai-hoc/[slug]` lập tức trả về HTTP 404 Not Found.
5. Bài học tự động bị loại khỏi `/sitemap.xml` và kết quả tìm kiếm độc giả mà không bị mất dữ liệu biên tập.

---

## 3. KỊCH BẢN SAO LƯU, PHỤC HỒI & ỨNG PHÓ SỰ CỐ (DISASTER RECOVERY)

### 3.1 Chính sách Sao lưu Định kỳ
- **Tần suất sao lưu:** Tự động chạy mỗi ngày vào lúc 02:00 sáng (UTC+7).
- **Công cụ thực hiện:** Script `scripts/backup-db.ts` gọi trực tiếp `pg_dump.exe` native với cờ an toàn:
  `--clean --if-exists --no-owner --no-privileges`
- **Địa điểm lưu trữ:** Thư mục `data/backups/`, đồng bộ mã hóa lưu trữ lạnh hàng tuần.
- **Thời gian lưu trữ (Retention Policy):**
  + Bản sao lưu hàng ngày: Giữ 14 ngày gần nhất.
  + Bản sao lưu hàng tháng: Giữ 12 tháng gần nhất.

### 3.2 Hướng dẫn Chạy Sao lưu Thủ công
```bash
# Thực hiện sao lưu database sentrang trên cổng 5432 hoặc 5434
pnpm exec tsx scripts/backup-db.ts sentrang 5434
```
*Kết quả sinh ra file dạng:* `data/backups/sentrang_backup_YYYYMMDD_HHMMSS.sql` kèm mã băm SHA-256 để xác thực tính toàn vẹn.

### 3.3 Hướng dẫn Phục hồi & Kiểm thử Khôi phục Dữ liệu
```bash
# Kiểm thử phục hồi tự động vào cơ sở dữ liệu cô lập sentrang_restore_test
pnpm exec tsx scripts/restore-db.ts data/backups/sentrang_backup_YYYYMMDD_HHMMSS.sql sentrang_restore_test 5434
```
Script sẽ tự động:
1. Tạo database sạch độc lập.
2. Nạp dữ liệu từ file SQL dump.
3. Chạy truy vấn kiểm toán số lượng: 1 ngành, 4 bậc, 3 lĩnh vực, 4 nguồn, 156 bài học, 156 bản ghi thô.
4. Báo cáo thành công và tự động thu hồi môi trường thử nghiệm.

### 3.4 Quy trình Phục hồi Thảm họa Trực tiếp (Disaster Recovery SOP)
Trong trường hợp máy chủ gặp sự cố hư hỏng cơ sở dữ liệu chính:
1. **Dừng dịch vụ web:**
   ```bash
   pm2 stop sentrang-app || systemctl stop sentrang-app
   ```
2. **Khôi phục database từ bản backup hợp lệ gần nhất:**
   ```bash
   psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS sentrang; CREATE DATABASE sentrang;"
   psql -h 127.0.0.1 -p 5432 -U postgres -d sentrang -f data/backups/sentrang_backup_LATEST.sql
   ```
3. **Kiểm tra tính toàn vẹn bằng Prisma Client:**
   ```bash
   pnpm exec tsx -e "import { prisma } from './src/lib/prisma'; prisma.lesson.count().then(c => console.log('Lessons:', c));"
   ```
4. **Khởi động lại dịch vụ web:**
   ```bash
   pm2 restart sentrang-app || systemctl restart sentrang-app
   ```

---

## 4. AN NINH TÀI KHOẢN, PHIÊN LÀM VIỆC & PHÂN QUYỀN

### 4.1 Chính sách Quản lý Tài khoản Quản trị
- **Không mở đăng ký công khai:** Hệ thống tuyệt đối không có endpoint đăng ký tài khoản admin.
- **Tạo tài khoản quản trị:** Chỉ tạo qua lệnh máy chủ cục bộ hoặc script nội bộ với mật khẩu băm bằng thuật toán bảo mật an toàn.
- **Phân loại quyền:**
  + `SUPER_ADMIN`: Toàn quyền quản trị hệ thống, xuất bản bài học, xem nhật ký kiểm toán, quản lý tài nguyên.
  + `EDITOR`: Quyền biên tập bài học, tải lên hình ảnh, xem trước bản nháp; không có quyền xóa audit log.

### 4.2 Cơ chế Chống Dò Quét Mật khẩu (Brute-Force Rate Limiting)
- Triển khai tại `src/lib/auth/rate-limiter.ts` và tích hợp tại `/api/admin/auth/login`.
- **Ngưỡng khóa:** Tối đa **5 lần đăng nhập thất bại** liên tiếp từ một địa chỉ IP hoặc tài khoản email trong vòng 15 phút.
- **Phản hồi:** Trả về HTTP 429 Too Many Requests kèm header `Retry-After: 900` và thông báo tiếng Việt: *"Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."*

### 4.3 Quản lý Phiên & Cookie Bảo mật
- **Loại cookie:** Cookie xác thực mang cờ `HttpOnly`, `SameSite=Lax`, `Secure` trên HTTPS.
- **Thời hạn phiên:** 24 giờ.
- **Phòng chống CSRF chuyên sâu:** Mọi mutation API (`POST`, `PATCH`, `DELETE`) tại phân hệ Quản trị đều được chặn nếu phát hiện header `Sec-Fetch-Site: cross-site` hoặc sai lệch tên miền `Origin` / `Referer`.

### 4.4 Quy tắc Bảo mật Hình ảnh (Media ACL)
- Mọi hình ảnh nội bộ và bản nháp được lưu tại `data/media/`.
- Người dùng chưa đăng nhập khi yêu cầu hình ảnh thuộc bài học chưa xuất bản sẽ nhận mã phản hồi **HTTP 401 Unauthorized**.
- Chỉ khi bài học được chuyển sang `published`, hình ảnh mới được phục vụ công khai với bộ đệm trình duyệt tối ưu.

---

## 5. BẢN QUYỀN HỌC LIỆU & TUÂN THỦ TỔ CHỨC

### 5.1 Tuyên bố Mục đích & Phạm vi Phân phối
- Toàn bộ 156 bài học, tài liệu giảng dạy, tài liệu tham khảo và hình ảnh được số hóa trong hệ thống Sen Trắng là **HỌC LIỆU LƯU HÀNH NỘI BỘ CỦA GIA ĐÌNH PHẬT TỬ VIỆT NAM**.
- Phục vụ phi thương mại, phi lợi nhuận nhằm hỗ trợ công tác tu học, huấn luyện Đoàn sinh và Huynh trưởng các cấp.
- Mọi hành vi thương mại hóa, sao chép trái phép ra ngoài tổ chức mà không có sự chuẩn thuận của Ban Hướng Dẫn Trung Ương GĐPT Việt Nam đều vi phạm quy định tổ chức.

### 5.2 Cam kết Dữ liệu Mặc định (Default Draft Stance)
- Nhằm đảm bảo dữ liệu giáo trình không bị phát tán thiếu kiểm duyệt, **100% bản ghi bài học (156 bài) được lưu trữ mặc định ở trạng thái DRAFT** trên cơ sở dữ liệu chính thức `sentrang`.
- Chỉ các bài học đã qua đầy đủ 5 bước của quy trình kiểm duyệt (như bài demo kiểm chuẩn `D-MM-A-01` và `D-MM-A-03`) mới được cấp phép hiển thị công khai.
- Giữ nguyên trạng Master Data V1.2 và không tự ý thay đổi dữ liệu giáo trình gốc khi chưa có quyết định chính thức từ Hội đồng Tu thư BHD.
