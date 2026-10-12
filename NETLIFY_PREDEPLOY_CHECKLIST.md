# DANH MỤC KIỂM TRA TIỀN TRIỂN KHAI (PRE-DEPLOYMENT CHECKLIST)
## DỰ ÁN: TỦ SÁCH ÁO LAM V1.0 (NETLIFY + GITHUB + SUPABASE FREE)
**Mã tài liệu:** `TUSAC-PREDEPLOY-CHK-V1.0` | **Trạng thái:** Sẵn sàng thực hiện  
**Ngày lập:** 12/10/2026 | **Phiên bản mã nguồn:** Git Release Tag `v1.0.0`  

---

Bảng kiểm tra này được thiết kế để Ban Điều Hành tự tin thực hiện các thao tác từng bước an toàn, bảo đảm **không bao giờ lộ thông tin mật**, **không làm mất website cũ** và **bảo toàn 100% dữ liệu giáo trình**:

---

### PHẦN A: SAO LƯU AN TOÀN TRƯỚC KHI THỰC HIỆN

- [ ] **A.1. Tải bản sao lưu Website cũ trên Netlify:**
  - [ ] Đăng nhập Netlify $\rightarrow$ Chọn Site $\rightarrow$ Mục **Deploys**.
  - [ ] Bấm vào bản deploy gần nhất đang chạy $\rightarrow$ Nhấn **"Download deploy"** $\rightarrow$ Lưu tệp zip vào máy tính.
- [ ] **A.2. Ghi nhận cấu hình cũ của Netlify Site:**
  - [ ] Chụp ảnh hoặc ghi lại danh sách biến môi trường cũ trong: **Site configuration $\rightarrow$ Environment variables**.
  - [ ] Ghi lại tên GitHub repo và nhánh deploy cũ đang kết nối.
- [ ] **A.3. Kiểm tra các tệp Git đang theo dõi (`git ls-files`):**
  - [ ] Đã xác nhận không có file `.env`, `DEMO_CREDENTIALS.txt`, mật khẩu, database dump hay tệp `.pem` nào bị commit.
- [ ] **A.4. Bản sao lưu cơ sở dữ liệu nội bộ trên máy:**
  - [ ] Đã tạo gói sao lưu toàn diện tại [`data/backups/bundle_sentrang_20261012_041958`](file:///a:/Web%20V2/data/backups) (SHA-256: `e122e0a46...`).

---

### PHẦN B: THIẾT LẬP HẠ TẦNG SUPABASE (0 VNĐ)

- [ ] **B.1. Khởi tạo Project Supabase:**
  - [ ] Đăng nhập [supabase.com](https://supabase.com) bằng tài khoản GitHub.
  - [ ] Bấm **New Project** $\rightarrow$ Đặt tên `tu-sach-ao-lam`.
  - [ ] Nhập mật khẩu Database mạnh (Tự lưu lại mật khẩu, không chia sẻ trong chat).
  - [ ] Chọn vùng máy chủ: **Singapore (`ap-southeast-1`)** $\rightarrow$ Nhấn **Create new project**.
- [ ] **B.2. Bật Extension Tìm kiếm tiếng Việt:**
  - [ ] Mở mục **SQL Editor** trong thanh menu bên trái.
  - [ ] Dán đoạn SQL sau và bấm **Run**:
    ```sql
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ```
  - [ ] Xác nhận kết quả hiển thị `Success. No rows returned`.
- [ ] **B.3. Tạo Kho lưu trữ Ảnh riêng tư (Storage Bucket):**
  - [ ] Mở mục **Storage** $\rightarrow$ Bấm **New bucket**.
  - [ ] Name: `sentrang-media`.
  - [ ] Tắt công tắc **Public bucket** (Giữ ở chế độ **Private** để bảo vệ ảnh draft).
  - [ ] Bấm **Save**.
- [ ] **B.4. Lấy chuỗi kết nối và API Keys:**
  - [ ] Vào **Project Settings $\rightarrow$ Database $\rightarrow$ Connection string**:
    - [ ] Chọn tab **URI** $\rightarrow$ Tick chọn **Use connection pooling** $\rightarrow$ Chọn Mode: **Transaction (Port 6543)** $\rightarrow$ Sao chép làm `DATABASE_URL`.
    - [ ] Chọn Mode: **Session (Port 5432 / Pooler IPv4)** $\rightarrow$ Sao chép làm `DIRECT_URL`.
  - [ ] Vào **Project Settings $\rightarrow$ API**:
    - [ ] Sao chép **Project URL** (làm `SUPABASE_URL`).
    - [ ] Sao chép khóa **`service_role` secret** (làm `SUPABASE_SERVICE_ROLE_KEY`).

---

### PHẦN C: NẠP DỮ LIỆU & TẠO ADMIN AN TOÀN TỪ MÁY TÍNH CỦA BẠN

> [!NOTE]
> Bạn thực hiện bước này trực tiếp trên terminal máy tính của Bạn. Toàn bộ chuỗi kết nối và mật khẩu chỉ nằm trên máy Bạn, không truyền qua mạng internet hay gửi vào chat.

- [ ] **C.1. Tạo file cấu hình tạm thời `.env.production.local`:**
  - [ ] Trong thư mục `a:\Web V2`, tạo file `.env.production.local` với nội dung:
    ```env
    DATABASE_URL="postgresql://postgres.[REF]:[MAT_KHAU_CUA_BAN]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    DIRECT_URL="postgresql://postgres.[REF]:[MAT_KHAU_CUA_BAN]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    APP_ENV="production"
    SUPABASE_URL="https://[REF].supabase.co"
    SUPABASE_SERVICE_ROLE_KEY="eyJh..."
    SUPABASE_STORAGE_BUCKET="sentrang-media"
    ```
- [ ] **C.2. Chạy Migration tạo bảng trên Supabase:**
  - [ ] Mở PowerShell tại `a:\Web V2` và chạy:
    ```powershell
    pnpm prisma migrate deploy
    ```
  - [ ] Xác nhận kết quả: `All migrations have been successfully applied.`
- [ ] **C.3. Nạp 156 bài học Master Data V1.2:**
  - [ ] Chạy lệnh:
    ```powershell
    pnpm exec tsx prisma/seed.ts
    ```
  - [ ] Xác nhận kết quả: Nạp đủ 1 ngành, 4 bậc, 3 lĩnh vực, 4 nguồn và **156 bài học ở trạng thái `draft`**.
  - [ ] Kiểm tra trên Supabase Table Editor: Bảng `lessons` có đủ 156 dòng, cột `publish_status` 100% là `draft`.
- [ ] **C.4. Đồng bộ ảnh tài sản ban đầu lên Supabase Storage:**
  - [ ] Chạy lệnh:
    ```powershell
    pnpm exec tsx scripts/sync-media-to-cloud.ts
    ```
  - [ ] Xác nhận kết quả: Đồng bộ thành công 10/10 tệp hình ảnh vào bucket `sentrang-media`.
- [ ] **C.5. Khởi tạo tài khoản Quản trị viên Production (Mật khẩu ẩn):**
  - [ ] Chạy lệnh tương tác:
    ```powershell
    pnpm exec tsx scripts/create-prod-admin.ts
    ```
  - [ ] Nhập Email quản trị chính thức của Bạn.
  - [ ] Nhập mật khẩu bí mật (Màn hình chỉ hiện ký tự `*`, không hiển thị mật khẩu thực).
  - [ ] Nhập lại mật khẩu để xác nhận.
  - [ ] Xác nhận kết quả: `KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG!`
- [ ] **C.6. Dọn dẹp an toàn:**
  - [ ] Xóa ngay file cấu hình tạm thời khỏi máy tính:
    ```powershell
    Remove-Item .env.production.local
    ```

---

### PHẦN D: THIẾT LẬP GITHUB (KHÔNG DÙNG `--FORCE`)

- [ ] **D.1. Tạo nhánh phát hành độc lập:**
  - [ ] Tại thư mục dự án `a:\Web V2`, tạo nhánh mới:
    ```powershell
    git checkout -b release/v1.0.0-tu-sach-ao-lam
    ```
- [ ] **D.2. Đẩy nhánh lên GitHub (Tuyệt đối không dùng cờ `--force`):**
  - [ ] Đẩy nhánh mới lên repository:
    ```powershell
    git push origin release/v1.0.0-tu-sach-ao-lam
    ```
  - [ ] Hoặc nếu Bạn tạo một repository mới trên GitHub (ví dụ: `tu-sach-ao-lam`):
    ```powershell
    git remote add prod-origin https://github.com/<YOUR_USER>/tu-sach-ao-lam.git
    git push -u prod-origin main
    ```

---

### PHẦN E: CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN NETLIFY DASHBOARD

Truy cập Netlify Dashboard $\rightarrow$ Chọn Site $\rightarrow$ **Site configuration** $\rightarrow$ **Environment variables** $\rightarrow$ Nhấn **Add a variable** và điền đầy đủ các biến sau:

- [ ] `NODE_VERSION` = `20`
- [ ] `NODE_ENV` = `production`
- [ ] `APP_ENV` = `production`
- [ ] `DATABASE_URL` = *(Dán chuỗi Pooled URL cổng 6543)*
- [ ] `DIRECT_URL` = *(Dán chuỗi Session URL cổng 5432)*
- [ ] `AUTH_SECRET` = *(Dán chuỗi 64 ký tự hex sinh bằng `openssl rand -hex 32`)*
- [ ] `NEXT_PUBLIC_APP_URL` = *(Dán tên miền chính thức của Bạn, ví dụ `https://tenmiencuaban.vn`)*
- [ ] `SUPABASE_URL` = *(Dán Project URL của Supabase)*
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = *(Dán service_role secret key của Supabase)*
- [ ] `SUPABASE_STORAGE_BUCKET` = `sentrang-media`

---

### PHẦN F: KÍCH HOẠT TRIỂN KHAI & KIỂM THỬ KHÓI (SMOKE TEST)

- [ ] **F.1. Chuyển Nhánh Deploy Trên Netlify:**
  - [ ] Vào **Site configuration $\rightarrow$ Build & deploy $\rightarrow$ Continuous deployment**.
  - [ ] Đổi **Production branch** thành: `release/v1.0.0-tu-sach-ao-lam` (hoặc nhánh mới vừa push).
- [ ] **F.2. Kích hoạt Build:**
  - [ ] Vào mục **Deploys** $\rightarrow$ Bấm **Trigger deploy $\rightarrow$ Deploy site**.
  - [ ] Theo dõi Deploy log: Xác nhận `prisma generate` thành công, Next.js build thành công (28/28 pages), status chuyển sang **Published**.
- [ ] **F.3. Kiểm thử Khói trên Tên miền chính thức (Smoke Test):**
  - [ ] **Trang chủ (`/`):** Hiển thị logo TỦ SÁCH ÁO LAM, tagline *"Nơi tìm kiếm tài liệu tu học mới nhất"*, 4 bậc tu học Ngành Đồng.
  - [ ] **Bảo vệ Draft (`/bai-hoc/[slug]`):** Thử truy cập bất kỳ bài nào khi chưa đăng nhập $\rightarrow$ Trả về **404 Not Found**.
  - [ ] **Danh sách chuyên mục (`/nganh-dong/[level]/[category]`):** Hiển thị Empty State chuẩn: *"Học liệu đang trong quá trình biên tập chuẩn hóa"*.
  - [ ] **Tìm kiếm (`/tim-kiem`):** Tìm kiếm thử từ khóa bất kỳ $\rightarrow$ Trả về Empty State chuẩn: *"Không tìm thấy bài học phù hợp"*.
  - [ ] **Đăng nhập Quản trị (`/admin/login`):** Đăng nhập thành công với tài khoản Admin mới tạo; đăng nhập thất bại với tài khoản demo cũ.
  - [ ] **Bảng điều khiển Học vụ (`/admin/lessons`):** Hiển thị đủ 156 bài học ở trạng thái `draft`.

---

### PHẦN G: THIẾT LẬP KEEP-ALIVE GIỮ SUPABASE HOẠT ĐỘNG (0 VNĐ)

- [ ] **G.1. Tạo Monitor trên UptimeRobot (Khuyến nghị số 1 - Miễn phí):**
  - [ ] Đăng ký tài khoản miễn phí tại [uptimerobot.com](https://uptimerobot.com).
  - [ ] Bấm **Add New Monitor**:
    - [ ] Monitor Type: **HTTP(s)**.
    - [ ] Friendly Name: `Tu Sach Ao Lam Keep Alive`.
    - [ ] URL: `https://tenmiencuaban.vn/api/v1/levels`.
    - [ ] Monitoring Interval: **15 minutes** (hoặc 30 minutes).
  - [ ] Bấm **Create Monitor**.
  - [ ] *Hiệu quả:* Endpoint này gửi truy vấn nhẹ đọc danh mục bậc học mỗi 15 phút, vừa giúp Bạn nhận cảnh báo nếu website gặp sự cố, vừa **ngăn chặn hoàn toàn Supabase tự động pause sau 7 ngày**.

---

### XÁC NHẬN HOÀN TẤT
Sau khi tích đủ toàn bộ các mục trong bảng kiểm tra này, website **TỦ SÁCH ÁO LAM V1.0** đã chính thức vận hành an toàn, bảo mật và ổn định trên Internet với chi phí **0 VNĐ phát sinh**.
