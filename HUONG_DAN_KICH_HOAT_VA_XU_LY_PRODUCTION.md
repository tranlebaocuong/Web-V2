# BÁO CÁO KỸ THUẬT & HƯỚNG DẪN KÍCH HOẠT HỆ THỐNG PRODUCTION (REVISED V1.1)
## DỰ ÁN: TỦ SÁCH ÁO LAM V1.0
* **Tên miền hoạt động:** `https://cuonghoclaptrinh.io.vn`
* **Mã tài liệu:** `TUSAC-DOC-OPS-01-REV1`
* **Phiên bản:** 1.1 (Cập nhật chuẩn bảo mật & Master Data V1.2)
* **Ngày lập:** 12/10/2026
* **Đơn vị lập:** Ban Kỹ Thuật Dự Án Tủ Sách Áo Lam — GĐPT
* **Đối tượng tiếp nhận:** Bộ phận Vận hành, Quản trị Hệ thống và Ban Điều Hành Dự Án

---

## MỤC LỤC
1. [TỔNG QUAN HIỆN TRẠNG HỆ THỐNG TRÊN NETLIFY](#1-tổng-quan-hiện-trạng-hệ-thống-trên-netlify)
2. [BẰNG CHỨNG XÁC MINH NGUYÊN NHÂN LỖI HTTP 500](#2-bằng-chứng-xác-minh-nguyên-nhân-lỗi-http-500)
3. [CÁC CẢI TIẾN BẢO MẬT & KẾT NỐI TLS CHÍNH QUY TRONG MÃ NGUỒN](#3-các-cải-tiến-bảo-mật--kết-nối-tls-chính-quy-trong-mã-nguồn)
4. [HƯỚNG DẪN LẤY CHUỖI KẾT NỐI TỪ SUPABASE DASHBOARD](#4-hướng-dẫn-lấy-chuỗi-kết-nối-từ-supabase-dashboard)
5. [QUY TRÌNH KÍCH HOẠT CLOUD PRODUCTION (RUNBOOK KỸ THUẬT)](#5-quy-trình-kích-hoạt-cloud-production-runbook-kỹ-thuật)
6. [CẤU HÌNH BIẾN MÔI TRƯỜNG PHÂN TÁCH TRÊN NETLIFY DASHBOARD](#6-cấu-hình-biến-môi-trường-phân-tách-trên-netlify-dashboard)
7. [QUY TRÌNH KIỂM THỬ XUẤT BẢN THEO CHUẨN MASTER DATA V1.2](#7-quy-trình-kiểm-thử-xuất-bản-theo-chuẩn-master-data-v12)
8. [QUY TẮC BẢO MẬT & GIÁM SÁT HẠN MỨC 0 VNĐ](#8-quy-tắc-bảo-mật--giám-sát-hạn-mức-0-vnđ)

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG TRÊN NETLIFY

Website **TỦ SÁCH ÁO LAM V1.0** đã được triển khai lên hạ tầng Netlify kết nối tên miền `https://cuonghoclaptrinh.io.vn`. Kết quả kiểm tra trực tiếp qua giao thức HTTP:

### 1.1. Giao diện Độc giả Công khai
* **Trang chủ (`/`):** Hoạt động tốt (**HTTP 200 OK**). Nhận diện thương hiệu chuẩn xác: Logo hoa sen kết hợp sách mở trên nền xanh `#176B4A`, khẩu hiệu *"Nơi tìm kiếm tài liệu tu học mới nhất"*, cấu trúc 4 bậc Ngành Đồng.

### 1.2. Phân hệ Quản trị (`/admin`)
* **Trang đăng nhập (`/admin/login`):** Hoạt động tốt (**HTTP 200 OK**). Form đăng nhập hoàn chỉnh, tiêu đề *"Quản Trị Học Vụ | Tủ Sách Áo Lam — GĐPT"*, cờ bảo mật SEO `noindex, nofollow, nocache`.
* **Trang quản trị (`/admin`) & Bài học (`/admin/lessons`):** Hoạt động đúng thiết kế bảo mật (**HTTP 200 OK & Redirect**).
  * Layout quản trị `AdminClientLayout` tự động gọi kiểm tra phiên `GET /api/admin/auth/me`.
  * Khi người dùng chưa có cookie hợp lệ, API trả về `401 Unauthorized`, client chuyển hướng an toàn về `/admin/login`.
* **API Đăng xuất (`/api/admin/auth/logout`):** Hoạt động tốt (**HTTP 200 OK**), xóa cookie `sentrang_admin_session`.
* **Vị trí khu vực quản trị:** Địa chỉ đăng nhập chính thức là:  
  👉 **`https://cuonghoclaptrinh.io.vn/admin/login`** (hoặc truy cập **`/admin`**).  
  *Ghi chú: Nút bấm Admin cố tình không hiển thị trên Header công khai để bảo vệ tính trang nghiêm và an toàn cho website tu học.*

---

## 2. BẰNG CHỨNG XÁC MINH NGUYÊN NHÂN LỖI HTTP 500

### 2.1. Bằng chứng kiểm thử thực tế từ HTTP Requests
* `GET /api/v1/levels` ➜ **HTTP 500** (`requestId: req-da9b50d4-aa4c-4c2e-9678-ddcd43c0ef9d`).
* `GET /api/v1/search?q=phat` ➜ **HTTP 500** (`requestId: req-77caf857-6a54-4df1-9e60-9f14fed29aff`).
* `POST /api/admin/auth/login` ➜ **HTTP 500** (`{"code":"INTERNAL_ERROR","message":"Lỗi hệ thống khi xử lý đăng nhập."}`).
* `POST /api/admin/auth/logout` ➜ **HTTP 200 OK** (`{"message":"Đăng xuất thành công."}`).
* `GET /api/admin/auth/me` ➜ **HTTP 401 Unauthorized** (khi chưa gửi cookie).

### 2.2. Đối chiếu mã nguồn và nguyên nhân kỹ thuật
1. **Phân tách giữa API không chạm DB và API có chạm DB:**
   * Các endpoint không truy vấn DB (`/admin/login`, `/api/admin/auth/logout`, `/api/admin/auth/me` khi chưa có cookie) hoạt động bình thường (200 / 401).
   * Mọi endpoint gọi `prisma` (`prisma.level.findMany`, `prisma.user.findUnique`, `prisma.$queryRaw`) đều phát sinh lỗi 500.
2. **Đối chiếu Netlify Function Logs & Tình trạng Supabase:**
   * **Cách kiểm tra logs:** Truy cập **Netlify Dashboard ➜ Logs ➜ Functions ➜ [Next.js Server Handler]**. Tìm kiếm theo mã `requestId` (ví dụ `req-da9b50d4-aa4c-4c2e-9678-ddcd43c0ef9d`) hoặc cụm từ `[API_ERROR]` / `Login route error:`.
   * **Đối chiếu Supabase Table Editor:** Truy cập **Supabase Dashboard ➜ Table Editor**. Nếu danh sách bảng trống (0 tables), điều đó xác thực 100% database Supabase chưa được chạy lệnh `prisma migrate deploy` (chưa có bảng `users`, `lessons`, `levels`, `site_settings`...), khiến truy vấn SQL bị lỗi `relation "..." does not exist`.
   * **Tài khoản Admin:** Cơ sở dữ liệu Cloud chưa có tài khoản Quản trị viên nào (hệ thống kiên quyết không dùng tài khoản demo trên Production).

---

## 3. CÁC CẢI TIẾN BẢO MẬT & KẾT NỐI TLS CHÍNH QUY TRONG MÃ NGUỒN

1. **Loại bỏ hoàn toàn `rejectUnauthorized: false`:**
   * Đã cấu hình xác minh chứng chỉ số TLS nghiêm ngặt (`rejectUnauthorized: true`) trong `src/lib/prisma.ts`, `scripts/run-cloud-setup.ts` và `scripts/create-prod-admin.ts`.
   * Chứng chỉ TLS của máy chủ Supabase (`*.pooler.supabase.com` và `*.supabase.co`) được cấp bởi Certificate Authority công khai uy tín (Amazon Root CA 1 / Let's Encrypt), tương thích hoàn toàn với CA store mặc định của Node.js runtime mà không cần tắt xác minh.
   * Hỗ trợ nạp chứng chỉ gốc tùy chỉnh qua biến `DATABASE_SSL_CERT` khi cần thiết.
2. **Tối ưu hóa Serverless Connection Pool:**
   * Giới hạn `max: 5` kết nối trong môi trường production nhằm ngăn chặn tình trạng cạn kiệt kết nối pooler trên Supabase Free tier.
   * Thiết lập `connectionTimeoutMillis: 10000` (10 giây) để đảm bảo ổn định trong giai đoạn cold-start xuyên khu vực.
3. **Cơ chế nạp Lazy Prisma Client:**
   * Ngăn lỗi build tĩnh trong quá trình `next build` khi môi trường biên dịch chưa nạp runtime secrets.

---

## 4. HƯỚNG DẪN LẤY CHUỖI KẾT NỐI TỪ SUPABASE DASHBOARD

> [!IMPORTANT]
> **Quy tắc bất biến:** Không tự suy đoán hoặc ghép thủ công hostname/port. Hãy sao chép trực tiếp từ bảng điều khiển của Supabase.

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án của Bạn (ví dụ `tu-sach-ao-lam`).
3. Đi đến: **Project Settings** (biểu tượng bánh răng góc dưới bên trái) ➜ **Database**.
4. Cuộn xuống phần **Connection string**, chọn thẻ **URI**:
   * **Để lấy `DATABASE_URL` (cho ứng dụng Netlify & truy vấn pooled):**
     * Chọn chế độ: **Transaction** (hoặc Pooled, hiển thị cổng `6543`).
     * Bấm nút **Copy URI**.
     * Thay thế `[YOUR-PASSWORD]` bằng mật khẩu database của Bạn.
   * **Để lấy `DIRECT_URL` (cho Migration DDL & Script thiết lập):**
     * Chọn chế độ: **Session** (hiển thị cổng `5432`, hỗ trợ IPv4).
     * Bấm nút **Copy URI**.
     * Thay thế `[YOUR-PASSWORD]` bằng mật khẩu database của Bạn.

---

## 5. QUY TRÌNH KÍCH HOẠT CLOUD PRODUCTION (RUNBOOK KỸ THUẬT)

Bộ phận kỹ thuật thực hiện tuần tự các bước trên terminal máy tính nội bộ (không gửi mật khẩu hay chuỗi kết nối vào chat):

### Bước 5.1: Sinh khóa bảo mật `AUTH_SECRET` ngẫu nhiên
Chạy lệnh sau trong PowerShell hoặc Terminal để sinh chuỗi khóa ngẫu nhiên 64 ký tự hex (độ hỗn loạn mật mã học cao):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*Sao chép chuỗi kết quả sinh ra để sử dụng làm `AUTH_SECRET`.*

### Bước 5.2: Chuẩn bị tệp cấu hình tạm thời `.env.production.local`
Tạo tệp `.env.production.local` tại thư mục gốc `a:\Web V2` với nội dung:

```env
# Dán chuỗi Transaction Pooler (URI) lấy từ Supabase Dashboard:
DATABASE_URL="<DAN_CHUOI_TRANSACTION_POOLER_TU_SUPABASE_DASHBOARD_VAO_DAY>"

# Dán chuỗi Session Pooler (URI) lấy từ Supabase Dashboard:
DIRECT_URL="<DAN_CHUOI_SESSION_POOLER_TU_SUPABASE_DASHBOARD_VAO_DAY>"

APP_ENV="production"
NODE_ENV="production"

# Dán chuỗi khóa ngẫu nhiên vừa sinh ở Bước 5.1:
AUTH_SECRET="<DAN_CHUOI_NGẪU_NHIÊN_SINH_O_BUOC_5_1_VAO_DAY>"
```

### Bước 5.3: Chạy Script nạp Schema & 156 bài học Master Data V1.2
Chạy lệnh nạp dữ liệu an toàn có cơ chế Fail-Fast (kiểm tra đích đến, che mật khẩu dạng `***`, kiểm tra TLS nghiêm ngặt và yêu cầu xác nhận `yes`):

```bash
pnpm exec tsx scripts/run-cloud-setup.ts --env-file .env.production.local
```

> **Kết quả đạt được:**
> * Tự động tạo toàn bộ bảng, khóa ngoại và chỉ mục tìm kiếm full-text tiếng Việt.
> * Nạp 156 bài học Master Data V1.2.
> * Bất biến dữ liệu bảo toàn 100%: **156 bài học Draft / 0 bài Published**.

### Bước 5.4: Tạo tài khoản Quản trị viên (Admin Production)
Chạy script chuyên dụng với cơ chế ẩn mật khẩu (`*`):

```bash
pnpm exec tsx scripts/create-prod-admin.ts --env-file .env.production.local
```
* Nhập Email quản trị viên thực tế của Ban Quản Trị (không dùng email demo).
* Nhập Mật khẩu quản trị (tối thiểu 12 ký tự, đủ chữ hoa, thường, số, ký tự đặc biệt). Màn hình sẽ ẩn ký tự dạng `*`.
* Nhập lại mật khẩu để xác nhận.
* Script băm mật khẩu bằng **bcrypt cost = 12**, kết nối TLS xác thực chứng chỉ và ghi nhận sự kiện vào `audit_logs`.

### Bước 5.5: Xóa tệp cấu hình tạm thời
Xóa ngay tệp `.env.production.local` trên máy để bảo mật tuyệt đối:

```bash
Remove-Item .env.production.local
```

---

## 6. CẤU HÌNH BIẾN MÔI TRƯỜNG PHÂN TÁCH TRÊN NETLIFY DASHBOARD

> [!CAUTION]
> **Nguyên tắc phân tách môi trường:** Tuyệt đối **KHÔNG** đặt secrets production trong "All Deploy Contexts". Chỉ cấu hình cho ngữ cảnh **Production**.

1. Đăng nhập vào [Netlify Dashboard](https://app.netlify.com) ➜ Chọn site dự án.
2. Đi đến: **Site configuration** ➜ **Environment variables**.
3. Thêm các biến môi trường sau với phạm vi **Production only** (Deploy Contexts = Production):

| Tên biến | Giá trị | Deploy Contexts | Scopes |
| :--- | :--- | :--- | :--- |
| **`DATABASE_URL`** | Chuỗi Transaction Pooler lấy từ Supabase Dashboard | **Production only** | Builds + Functions |
| **`DIRECT_URL`** | Chuỗi Session Pooler lấy từ Supabase Dashboard | **Production only** | Builds + Functions |
| **`AUTH_SECRET`** | Khóa bí mật sinh từ Bước 5.1 | **Production only** | Builds + Functions |
| **`APP_ENV`** | `production` | **Production only** | Builds + Functions |

*(Đối với Deploy Previews, để trống hoặc trỏ tới database staging riêng biệt để ngăn PR preview tác động đến dữ liệu production).*

4. **Kích hoạt Deploy lại (Redeploy):**
   * Vào mục **Deploys** trên Netlify.
   * Nhấn **Trigger deploy** ➜ **Deploy site**.

---

## 7. QUY TRÌNH KIỂM THỬ XUẤT BẢN THEO CHUẨN MASTER DATA V1.2

Sau khi hoàn tất cấu hình và redeploy, bộ phận vận hành kiểm tra theo quy trình chuẩn:

> [!IMPORTANT]
> **Nguyên tắc kiểm thử xuất bản:** Chỉ thao tác thử nghiệm với đúng **01 bài học cụ thể** được chỉ định trong Master Data V1.2. Tuyệt đối không xuất bản hàng loạt.

### Thông tin bài học chỉ định theo Master Data V1.2:
* **Mã bài học (ID):** `D-MM-A-01`
* **Tiêu đề chuẩn:** `Lịch sử Đức Phật Thích Ca.`
* **Bậc học:** Bậc Mở Mắt (`mo-mat`)
* **Lĩnh vực:** Phật pháp (`phat-phap`)
* **Đường dẫn độc giả sau xuất bản:** `/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca`
* **Đường dẫn danh mục bậc học:** `/nganh-dong/mo-mat`

### Các bước thực hiện:
1. **Đăng nhập:** Truy cập `https://cuonghoclaptrinh.io.vn/admin/login`, đăng nhập bằng tài khoản tạo ở Bước 5.4.
2. **Xác nhận Dashboard:** Kiểm tra các chỉ số thống kê:
   * Tổng số bài học: **156 bài**.
   * Bản nháp (Draft): **156 bài**.
   * Đã xuất bản (Published): **0 bài**.
3. **Mở danh sách bài học:** Vào menu **Bài học** (`/admin/lessons`).
4. **Mở bài học thử nghiệm:** Tìm bài có mã `D-MM-A-01` (*"Lịch sử Đức Phật Thích Ca."*).
5. **Chuyển trạng thái Sẵn sàng:** Bấm **Chuyển sang Sẵn sàng (Mark Ready)**.
6. **Thực hiện Xuất bản:** Bấm **Xuất bản (Publish)**.
7. **Nghiệm thu phía Độc giả (Mở tab ẩn danh Incognito):**
   * Truy cập: `https://cuonghoclaptrinh.io.vn/nganh-dong/mo-mat` ➜ Xác nhận bài `D-MM-A-01` xuất hiện.
   * Truy cập bài đọc: `https://cuonghoclaptrinh.io.vn/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca` ➜ Xác nhận nội dung hiển thị chuẩn xác, không có lỗi.
8. **Kiểm tra tính bất biến:**
   * **155 bài học còn lại phải giữ nguyên 100% trạng thái Draft**, không xuất hiện trên giao diện độc giả.

---

## 8. QUY TẮC BẢO MẬT & GIÁM SÁT HẠN MỨC 0 VNĐ

1. **Tuyệt đối không rò rỉ Secrets:** Không commit tệp `.env`, không gửi connection string hay token qua chat.
2. **Kế hoạch Sao lưu Hàng tuần:**
   * Chạy lệnh `pg_dump` kết nối Session Pooler (port 5432) để lưu file dump nhị phân có checksum.
   * Chạy script `pnpm exec tsx scripts/backup-cloud-media.ts` để đồng bộ ảnh về máy an toàn.
3. **Giới hạn tài nguyên Free Tier:**
   * Supabase DB: < 500 MB (hiện sử dụng ~25 MB, an toàn 95%).
   * Supabase Storage: < 1 GB.
   * Netlify Bandwidth: < 100 GB/tháng.
   * Cam kết chi phí vận hành: **0 VNĐ**.

---
*Tài liệu được cập nhật và kiểm duyệt bởi Ban Kỹ Thuật Dự Án Tủ Sách Áo Lam V1.0.*
