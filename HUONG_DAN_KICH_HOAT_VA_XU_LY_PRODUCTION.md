# BÁO CÁO KỸ THUẬT & HƯỚNG DẪN KÍCH HOẠT HỆ THỐNG PRODUCTION
## DỰ ÁN: TỦ SÁCH ÁO LAM V1.0
* **Tên miền hoạt động:** `https://cuonghoclaptrinh.io.vn`
* **Mã tài liệu:** `TUSAC-DOC-OPS-01`
* **Phiên bản:** 1.0 (Phát hành chính thức)
* **Ngày lập:** 12/10/2026
* **Đơn vị lập:** Ban Kỹ Thuật Dự Án Tủ Sách Áo Lam — GĐPT
* **Đối tượng tiếp nhận:** Bộ phận Vận hành, Quản trị Hệ thống và Ban Điều Hành Dự Án

---

## MỤC LỤC
1. [TỔNG QUAN HIỆN TRẠNG HỆ THỐNG TRÊN NETLIFY](#1-tổng-quan-hiện-trạng-hệ-thống-trên-netlify)
2. [PHÂN TÍCH NGUYÊN NHÂN LỖI (ROOT CAUSE ANALYSIS)](#2-phân-tích-nguyên-nhân-lỗi-root-cause-analysis)
3. [CÁC CẢI TIẾN MÃ NGUỒN ĐÃ HOÀN TẤT](#3-các-cải-tiến-mã-nguồn-đã-hoàn-tất)
4. [QUY TRÌNH KÍCH HOẠT CLOUD PRODUCTION (RUNBOOK DÀNH CHO BỘ PHẬN KỸ THUẬT)](#4-quy-trình-kích-hoạt-cloud-production-runbook-dành-cho-bộ-phận-kỹ-thuật)
5. [CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN NETLIFY DASHBOARD](#5-cấu-hình-biến-môi-trường-trên-netlify-dashboard)
6. [QUY TRÌNH KIỂM THỬ XUẤT BẢN BÀI HỌC (E2E VERIFICATION)](#6-quy-trình-kiểm-thử-xuất-bản-bài-học-e2e-verification)
7. [QUY ĐỊNH BẢO MẬT & KẾ HOẠCH BẢO TRÌ ĐỊNH KỲ](#7-quy-định-bảo-mật--kế-hoạch-bảo-trì-định-kỳ)

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG TRÊN NETLIFY

Website **TỦ SÁCH ÁO LAM V1.0** đã được triển khai lên máy chủ Netlify với tên miền `https://cuonghoclaptrinh.io.vn`. Kết quả kiểm định trực tiếp qua các yêu cầu HTTP ghi nhận:

### 1.1. Giao diện Độc giả Công khai
* **Trang chủ (`/`):** Hoạt động hoàn hảo (**HTTP 200 OK**). Hiển thị đầy đủ nhận diện thương hiệu Tủ Sách Áo Lam, logo hoa sen trắng kết hợp quyển sách mở, màu chủ đạo xanh lá đậm `#176B4A`, khẩu hiệu *"Nơi tìm kiếm tài liệu tu học mới nhất"*, cấu trúc 4 bậc học Ngành Đồng.

### 1.2. Phân hệ Quản trị (`/admin`)
* **Trang đăng nhập (`/admin/login`):** Hoạt động hoàn hảo (**HTTP 200 OK**). Giao diện form đăng nhập hiển thị đầy đủ, tiêu đề tab *"Quản Trị Học Vụ | Tủ Sách Áo Lam — GĐPT"*, cờ bảo mật SEO `noindex, nofollow, nocache`.
* **Trang quản trị (`/admin`) & Danh sách bài học (`/admin/lessons`):** Hoạt động đúng thiết kế bảo mật (**HTTP 200 OK & Tự động Redirect**).
  * Mã nguồn phía máy khách (Client-side) tự động kiểm tra phiên làm việc qua `GET /api/admin/auth/me`.
  * Khi người dùng chưa đăng nhập, API trả về mã `401 Unauthorized`. Layout lập tức chuyển hướng an toàn người dùng về `/admin/login`.
* **API Đăng xuất (`/api/admin/auth/logout`):** Hoạt động tốt (**HTTP 200 OK**), xóa cookie phiên `sentrang_admin_session`.
* **Vị trí khu vực quản trị:** Địa chỉ đăng nhập chính thức là:  
  👉 **`https://cuonghoclaptrinh.io.vn/admin/login`** (hoặc truy cập **`/admin`**).  
  *Ghi chú: Nút bấm Admin cố tình không hiển thị trên thanh điều hướng công khai để giữ sự trang nghiêm và ngăn người đọc phổ thông tò mò truy cập.*

---

## 2. PHÂN TÍCH NGUYÊN NHÂN LỖI (ROOT CAUSE ANALYSIS)

### 2.1. Hiện tượng lỗi
Khi người dùng thử nhập thông tin đăng nhập hoặc gọi các API truy vấn cơ sở dữ liệu:
* `POST /api/admin/auth/login` ➜ Trả về **HTTP 500 Internal Server Error** (`{"code":"INTERNAL_ERROR","message":"Lỗi hệ thống khi xử lý đăng nhập."}`).
* `GET /api/v1/levels` ➜ Trả về **HTTP 500 Internal Server Error** (`{"code":"INTERNAL_SERVER_ERROR","message":"Đã có lỗi xảy ra khi tải danh sách bậc học."}`).
* `GET /api/v1/search?q=phat` ➜ Trả về **HTTP 500 Internal Server Error** (`{"code":"INTERNAL_SERVER_ERROR","message":"Đã có lỗi xảy ra khi thực hiện tìm kiếm."}`).

### 2.2. Nguyên nhân cốt lõi
1. **Cơ sở dữ liệu Supabase Cloud chưa được chạy Migration:**
   * Dự án Supabase của tổ chức vừa được tạo nhưng **hoàn toàn trống** (chưa có các bảng dữ liệu `lessons`, `users`, `levels`, `categories`, `site_settings`...).
   * Khi API backend gọi truy vấn `prisma.user.findUnique` hoặc `prisma.level.findMany`, hệ quản trị PostgreSQL trên Supabase ném lỗi cấu trúc: `relation "users" does not exist`. Do đó, serverless function bắt lỗi và trả về HTTP 500.
2. **Chưa có tài khoản Quản trị viên (Admin Production):**
   * Trong cơ sở dữ liệu Cloud chưa tồn tại bất kỳ tài khoản người dùng nào. Theo nguyên tắc bảo mật, hệ thống tuyệt đối không dùng tài khoản demo cục bộ trên môi trường Production.
3. **Biến môi trường trên Netlify Functions cần đầy đủ Scope:**
   * Biến `DATABASE_URL` trên Netlify cần đảm bảo cấp quyền cho cả hai phạm vi: **Builds** và **Functions (Runtime)**.

---

## 3. CÁC CẢI TIẾN MÃ NGUỒN ĐÃ HOÀN TẤT

Ban Kỹ thuật đã hoàn thiện và đẩy (push) các bản cập nhật mới nhất lên nhánh `main` (Commit `32eeb78`):
1. **Tối ưu hóa Prisma cho môi trường Serverless (Netlify Functions):**
   * Cơ chế **Lazy Initialization**: Chỉ kết nối database khi có yêu cầu thực tế, không gây lỗi khi build tĩnh Next.js.
   * Kích hoạt tự động **SSL Cloud** (`rejectUnauthorized: false`) khi kết nối máy chủ Supabase từ môi trường Netlify.
   * Giới hạn `max: 5` kết nối đồng thời và tăng thời gian chờ `connectionTimeoutMillis: 10000` (10 giây) để tránh nghẽn mạng xuyên vùng địa lý và tránh chạm hạn mức kết nối miễn phí của Supabase.
2. **Cơ chế nạp dữ liệu an toàn (Fail-Fast Pre-flight):**
   * Script nạp dữ liệu tự động kiểm tra, chặn kết nối nhầm máy local và che giấu thông tin mật khẩu dưới dạng `***`.
   * Cập nhật seed đảm bảo tính **Idempotent 100%**: Không ghi đè mất các bài học đã qua biên tập.

---

## 4. QUY TRÌNH KÍCH HOẠT CLOUD PRODUCTION (RUNBOOK DÀNH CHO BỘ PHẬN KỸ THUẬT)

Bộ phận kỹ thuật thực hiện tuần tự các bước dưới đây trên máy tính nội bộ có quyền quản trị dự án (không chia sẻ mật khẩu hay chuỗi kết nối vào kênh chat công cộng):

### Bước 4.1: Chuẩn bị tệp cấu hình tạm thời `.env.production.local`
Tại thư mục gốc dự án (`a:\Web V2`), tạo tệp `.env.production.local` với nội dung mẫu:

```env
# ==============================================================================
# CẤU HÌNH KẾT NỐI SUPABASE CLOUD PRODUCTION (THAY THẾ BẰNG THÔNG TIN DỰ ÁN CỦA BẠN)
# ==============================================================================

# 1. Chuỗi kết nối Transaction Pooler (Port 6543) - Dành cho ứng dụng truy vấn
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# 2. Chuỗi kết nối Session Pooler (Port 5432 IPv4) - Dành cho Migration và DDL
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

# 3. Môi trường ứng dụng
APP_ENV="production"
NODE_ENV="production"

# 4. Khóa bí mật ký phiên làm việc JWT Admin (Tối thiểu 32 ký tự ngẫu nhiên)
AUTH_SECRET="khoa-bi-mat-ngau-nhien-it-nhat-32-ky-tu-tu-sach-ao-lam-2026"

# 5. Cấu hình Supabase Storage (Tùy chọn nếu đã tạo bucket 'sentrang-media')
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="sentrang-media"
```

> **Lưu ý kỹ thuật quan trọng về cổng Supabase:**
> * `DIRECT_URL` sử dụng Session Pooler `aws-0-ap-southeast-1.pooler.supabase.com` ở cổng **5432** để bảo đảm phân giải địa chỉ qua mạng IPv4 ổn định tại Việt Nam (thay vì direct hostname `db.[ref].supabase.co` chỉ có IPv6).

---

### Bước 4.2: Chạy Script nạp Schema & 156 bài học Master Data
Mở terminal (PowerShell / Command Prompt) tại thư mục dự án và chạy lệnh:

```bash
pnpm exec tsx scripts/run-cloud-setup.ts --env-file .env.production.local
```

**Diễn biến thực thi chuẩn:**
1. Script kiểm tra chuỗi kết nối: Phát hiện máy chủ Cloud `aws-0-ap-southeast-1.pooler.supabase.com`, in chuỗi kết nối đã che mật khẩu dạng `postgresql://postgres.[ref]:***@...`.
2. Hệ thống hiển thị câu hỏi: `⚠️ Xác nhận nạp cấu trúc bảng và 156 bài học Draft vào Database Cloud trên? (yes/no): `
3. Bộ phận kỹ thuật gõ `yes` và nhấn Enter.
4. Quá trình tự động chạy `prisma migrate deploy` (tạo toàn bộ bảng, khóa ngoại, chỉ mục full-text tiếng Việt).
5. Quá trình tự động nạp 156 bài học Master Data V1.2.
6. Hậu kiểm trực tiếp: In thông báo:
   ```
   ✅ KẾT QUẢ THIẾT LẬP DATABASE CLOUD THÀNH CÔNG:
     • Tổng số bài học:     156/156 bài
     • Số bài đã xuất bản:  0 bài
     • Số bài bản nháp:     156 bài
   🎉 BẤT BIẾN DỮ LIỆU ĐẠT CHUẨN 100%: Toàn bộ 156 bài học đều ở trạng thái Draft.
   ```

---

### Bước 4.3: Tạo tài khoản Quản trị viên (Admin Production)
Chạy script chuyên dụng với cơ chế ẩn mật khẩu:

```bash
pnpm exec tsx scripts/create-prod-admin.ts --env-file .env.production.local
```

**Thao tác nhập liệu:**
* Nhập Email quản trị: Ví dụ `admin@gdptvietnam.org` (hoặc email của người phụ trách).
* Nhập Họ và tên: Ví dụ `Quản Trị Viên Học Vụ`.
* Nhập Mật khẩu: Màn hình sẽ ẩn ký tự và hiển thị dấu `*` bảo mật.
* Nhập lại mật khẩu để xác nhận.
* Hệ thống tự động băm mật khẩu bằng thuật toán **bcrypt với độ phức tạp cost = 12**, ghi bản ghi vào bảng `users` và lưu vết vào bảng `audit_logs`.

---

### Bước 4.4: Xóa tệp cấu hình tạm thời
Sau khi hoàn tất Bước 4.2 và 4.3, xóa ngay tệp `.env.production.local` trên máy để tránh rủi ro bảo mật:

```bash
Remove-Item .env.production.local
```

---

## 5. CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN NETLIFY DASHBOARD

Sau khi cơ sở dữ liệu Supabase đã có dữ liệu và tài khoản Admin, bộ phận vận hành cấu hình biến môi trường trên giao diện Netlify:

1. Đăng nhập vào [Netlify Dashboard](https://app.netlify.com).
2. Chọn trang web của dự án (`cuonghoclaptrinh` hoặc site tương ứng).
3. Đi đến mục: **Site configuration** ➜ **Environment variables**.
4. Khai báo 4 biến môi trường sau (chọn phạm vi **All scopes**):

| Tên biến | Giá trị mẫu | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require` | Transaction Pooler (cổng 6543) cho ứng dụng |
| **`DIRECT_URL`** | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require` | Session Pooler IPv4 (cổng 5432) |
| **`AUTH_SECRET`** | Chuỗi bí mật ngẫu nhiên (tối thiểu 32 ký tự) | Dùng để ký và giải mã JWT token phiên Admin |
| **`APP_ENV`** | `production` | Khai báo môi trường vận hành chính thức |

5. **Kích hoạt Deploy lại (Redeploy):**
   * Đi đến mục **Deploys** trên Netlify.
   * Bấm vào nút **Trigger deploy** ➜ Chọn **Deploy site**.
   * Đợi Netlify build xong trong khoảng 1–2 phút để các serverless functions nhận diện cấu hình mới.

---

## 6. QUY TRÌNH KIỂM THỬ XUẤT BẢN BÀI HỌC (E2E VERIFICATION)

Bộ phận vận hành thực hiện kiểm thử nghiệm thu xuất bản đúng **01 bài học duy nhất** theo các bước sau:

```mermaid
flowchart LR
    A["1. Đăng nhập /admin/login"] --> B["2. Dashboard /admin (156 Draft)"]
    B --> C["3. Quản lý bài học (/admin/lessons)"]
    C --> D["4. Chọn bài thử nghiệm (MD-01)"]
    D --> E["5. Bấm Mark Ready"]
    E --> F["6. Bấm Publish"]
    F --> G["7. Độc giả xem trên cuonghoclaptrinh.io.vn"]
```

### Chi tiết các bước thực hiện:
1. **Đăng nhập:** Mở trình duyệt, truy cập `https://cuonghoclaptrinh.io.vn/admin/login`. Nhập email và mật khẩu vừa tạo ở Bước 4.3.
2. **Kiểm tra Dashboard:** Hệ thống điều hướng vào `/admin`. Kiểm tra bảng thông số thống kê:
   * Tổng số bài học: **156 bài**.
   * Số bài bản nháp (Draft): **156 bài**.
   * Số bài đã xuất bản (Published): **0 bài**.
3. **Mở danh sách bài học:** Bấm vào menu **Bài học** (hoặc truy cập `/admin/lessons`).
4. **Chọn bài học thử nghiệm:** Tìm bài học đầu tiên của Bậc Mở Mắt (ví dụ: bài `MD-01` *"Em Đến Chùa"*).
5. **Chuyển trạng thái Sẵn sàng:** Bấm vào chi tiết bài học, nhấn nút **Chuyển sang Sẵn sàng (Mark Ready)**.
6. **Thực hiện Xuất bản:** Nhấn nút **Xuất bản (Publish)**.
7. **Nghiệm thu phía Độc giả:**
   * Mở một cửa sổ trình duyệt ẩn danh (Incognito), truy cập:  
     `https://cuonghoclaptrinh.io.vn/nganh-dong/mo-mat`
   * Xác nhận bài học vừa xuất bản đã hiển thị trong danh sách.
   * Nhấp vào bài đọc để kiểm tra nội dung:  
     `https://cuonghoclaptrinh.io.vn/bai-hoc/em-den-chua`
   * Kiểm tra giao diện đọc: Cỡ chữ, căn chỉnh đoạn, điều hướng về mục lục hoạt động mượt mà.
8. **Bảo toàn bất biến dữ liệu:**
   * Xác nhận **155 bài học còn lại vẫn giữ nguyên 100% trạng thái Draft**, không xuất hiện trên giao diện công chúng.

---

## 7. QUY ĐỊNH BẢO MẬT & KẾ HOẠCH BẢO TRÌ ĐỊNH KỲ

### 7.1. Nguyên tắc Bảo mật Dữ liệu
* Tuyệt đối không tự ý xuất bản hàng loạt; chỉ xuất bản các bài học đã được Hội đồng Học vụ thông qua nội dung biên tập.
* Không chia sẻ thông tin tài khoản Admin hoặc chuỗi kết nối Cloud qua tin nhắn mở.
* Toàn bộ thao tác biên tập và duyệt bài đều được tự động lưu vết vào hệ thống `audit_logs`.

### 7.2. Lịch Sao lưu & Bảo trì Định kỳ (Hàng Tuần)
1. **Sao lưu Cơ sở dữ liệu qua lệnh `pg_dump`:**
   ```bash
   pg_dump "postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" -F c -b -v -f "sentrang_backup_$(Get-Date -Format 'yyyyMMdd').dump"
   ```
2. **Sao lưu Tài nguyên Hình ảnh Cloud về máy cục bộ:**
   ```bash
   pnpm exec tsx scripts/backup-cloud-media.ts --env-file .env.production.local
   ```
3. **Giám sát Hạn mức Gói Miễn phí (0 VNĐ):**
   * Giới hạn cơ sở dữ liệu Supabase: 500 MB (Dự án hiện tại ~25 MB, còn trống > 95%).
   * Giới hạn Cloud Storage: 1 GB.
   * Băng thông Netlify: 100 GB/tháng.
   * Duy trì chi phí vận hành ở mức **0 VNĐ**.

---
*Tài liệu được phê duyệt và ban hành bởi Ban Kỹ Thuật Tủ Sách Áo Lam V1.0.*
