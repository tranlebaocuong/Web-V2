# DANH MỤC KIỂM TRA TIỀN TRIỂN KHAI (V1.1 — REVISED)
## DỰ ÁN: TỦ SÁCH ÁO LAM V1.0 (NETLIFY + GITHUB + SUPABASE FREE)
**Mã tài liệu:** `TUSAC-PREDEPLOY-CHK-V1.1` | **Trạng thái:** Sẵn sàng nghiệm thu  
**Ngày cập nhật:** 12/10/2026 | **Phiên bản mã nguồn:** Git Release Tag `v1.0.0`  

---

Bảng kiểm tra này đã khắc phục hoàn toàn **4 điểm chặn triển khai** theo chỉ đạo của Ban Điều Hành:
1. Quy trình nạp migration và seed được bảo vệ bằng script Fail-Fast chuyên dụng (`scripts/run-cloud-setup.ts`), nạp biến môi trường tường minh, tự động chặn `localhost`, `sentrang_test` và ẩn toàn bộ credentials.
2. Phân tách rành mạch biến môi trường giữa **Deploy Preview** và **Production** trên Netlify để bản xem trước không bao giờ ghi đè dữ liệu thật.
3. Bổ sung bắt buộc bước **Kiểm thử trên Netlify Deploy Preview** trước khi đổi Production branch.
4. Đính chính UptimeRobot là giải pháp hỗ trợ; bổ sung quy trình sao lưu thủ công định kỳ cho Database và Media cùng bảng giám sát hạn mức miễn phí.

---

### PHẦN A: SAO LƯU AN TOÀN & KIỂM TRA GIT TREE

- [ ] **A.1. Tải bản sao lưu Website cũ từ Netlify Dashboard:**
  - [ ] Đăng nhập Netlify $\rightarrow$ Chọn Site $\rightarrow$ Mục **Deploys**.
  - [ ] Nhấp vào bản deploy gần nhất đang chạy (**Published deploy**) $\rightarrow$ Nhấn **"Download deploy"** $\rightarrow$ Lưu tệp zip vào máy tính.
- [ ] **A.2. Ghi nhận cấu hình cũ của Netlify Site:**
  - [ ] Lưu lại danh sách biến môi trường cũ tại: **Site configuration $\rightarrow$ Environment variables**.
  - [ ] Ghi lại tên GitHub repo và nhánh deploy cũ (`main` hoặc `master`).
- [ ] **A.3. Kiểm tra các tệp Git đang theo dõi (`git ls-files`):**
  - [ ] Đã chạy lệnh `git ls-files` xác nhận: **100% không có** file `.env`, mật khẩu, `DEMO_CREDENTIALS.txt`, database dump hay file `.pem` nào bị Git commit.
- [ ] **A.4. Bản sao lưu cơ sở dữ liệu nội bộ trên máy:**
  - [ ] Đã tạo gói sao lưu toàn diện tại [`data/backups/bundle_sentrang_20261012_041958`](file:///a:/Web%20V2/data/backups) (SQL dump 748.561 bytes, SHA-256 `e122e0a46...`).

---

### PHẦN B: THIẾT LẬP HẠ TẦNG SUPABASE (0 VNĐ) & PHÂN TÁCH MÔI TRƯỜNG

- [ ] **B.1. Khởi tạo Project Supabase:**
  - [ ] Đăng nhập [supabase.com](https://supabase.com) bằng tài khoản GitHub.
  - [ ] Nhấn **New Project** $\rightarrow$ Name: `tu-sach-ao-lam`.
  - [ ] Tự đặt mật khẩu Database mạnh (Lưu trong trình quản lý mật khẩu cá nhân, **không chia sẻ trong chat**).
  - [ ] Chọn vùng máy chủ: **Singapore (`ap-southeast-1`)** $\rightarrow$ Bấm **Create new project**.
- [ ] **B.2. Bật Extension Tìm kiếm tiếng Việt:**
  - [ ] Mở mục **SQL Editor** trong menu bên trái.
  - [ ] Dán đoạn SQL sau và bấm **Run**:
    ```sql
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ```
  - [ ] Xác nhận kết quả hiển thị `Success. No rows returned`.
- [ ] **B.3. Tạo Kho lưu trữ Ảnh riêng tư (Storage Buckets):**
  - [ ] Mở mục **Storage** $\rightarrow$ Bấm **New bucket**.
  - [ ] Tạo Bucket Production: Name: `sentrang-media` $\rightarrow$ Tắt *Public bucket* (**Private**) $\rightarrow$ Bấm Save.
  - [ ] Tạo Bucket Preview (Dành riêng cho Deploy Preview): Name: `sentrang-media-preview` $\rightarrow$ Tắt *Public bucket* (**Private**) $\rightarrow$ Bấm Save.
- [ ] **B.4. Lấy chuỗi kết nối và API Keys:**
  - [ ] Vào **Project Settings $\rightarrow$ Database $\rightarrow$ Connection string**:
    - [ ] Chọn tab **URI** $\rightarrow$ Tick chọn **Use connection pooling** $\rightarrow$ Mode: **Transaction (Port 6543)** $\rightarrow$ Sao chép làm `DATABASE_URL`.
    - [ ] Mode: **Session (Port 5432 / Pooler IPv4)** $\rightarrow$ Sao chép làm `DIRECT_URL`.
  - [ ] Vào **Project Settings $\rightarrow$ API**:
    - [ ] Sao chép **Project URL** (làm `SUPABASE_URL`).
    - [ ] Sao chép khóa **`service_role` secret** (làm `SUPABASE_SERVICE_ROLE_KEY`).

---

### PHẦN C: NẠP DỮ LIỆU & TẠO ADMIN BẢO MẬT BẰNG SCRIPT FAIL-FAST

> [!IMPORTANT]
> Toàn bộ thao tác nạp dữ liệu được thực thi thông qua script bảo vệ [`scripts/run-cloud-setup.ts`](file:///a:/Web%20V2/scripts/run-cloud-setup.ts). Script sẽ tự động ngắt kết nối ngay lập tức nếu phát hiện kết nối nhầm `localhost`, `127.0.0.1`, `sentrang_test` và che giấu toàn bộ mật khẩu trên màn hình.

- [ ] **C.1. Tạo file cấu hình tạm thời `.env.production.local`:**
  - [ ] Tại thư mục `a:\Web V2`, tạo file `.env.production.local` (file đã được `.gitignore` bảo vệ):
    ```env
    DATABASE_URL="postgresql://postgres.[REF]:[MAT_KHAU_CUA_BAN]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    DIRECT_URL="postgresql://postgres.[REF]:[MAT_KHAU_CUA_BAN]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    APP_ENV="production"
    SUPABASE_URL="https://[REF].supabase.co"
    SUPABASE_SERVICE_ROLE_KEY="eyJh..."
    SUPABASE_STORAGE_BUCKET="sentrang-media"
    ```
- [ ] **C.2. Chạy quy trình thiết lập Cloud an toàn:**
  - [ ] Mở PowerShell tại `a:\Web V2` và chạy lệnh:
    ```powershell
    pnpm exec tsx scripts/run-cloud-setup.ts --env-file .env.production.local
    ```
  - [ ] Kiểm tra màn hình Pre-flight:
    - [ ] Máy chủ hiển thị: `aws-0-ap-southeast-1.pooler.supabase.com`
    - [ ] Chuỗi kết nối được che giấu: `postgresql://postgres.xxx:***@...`
  - [ ] Gõ `yes` để xác nhận thực thi.
  - [ ] Xác nhận kết quả tự động:
    - [ ] Migration bảng và chỉ mục hoàn tất.
    - [ ] Seed 156 bài học hoàn tất (156 Draft, 0 Published).
    - [ ] Đồng bộ 10 ảnh tài sản vào bucket `sentrang-media` thành công.
- [ ] **C.3. Khởi tạo tài khoản Quản trị viên Production (Mật khẩu ẩn):**
  - [ ] Chạy lệnh:
    ```powershell
    pnpm exec tsx scripts/create-prod-admin.ts
    ```
  - [ ] Nhập Email quản trị chính thức của Bạn.
  - [ ] Nhập mật khẩu bí mật (Màn hình hiển thị `*`, không in mật khẩu ra terminal hay lưu history).
  - [ ] Nhập lại mật khẩu để xác nhận.
- [ ] **C.4. Dọn dẹp an toàn:**
  - [ ] Xóa ngay file cấu hình tạm thời khỏi máy tính:
    ```powershell
    Remove-Item .env.production.local
    ```

---

### PHẦN D: THIẾT LẬP GITHUB (TUYỆT ĐỐI KHÔNG DÙNG `--FORCE`)

- [ ] **D.1. Tạo nhánh phát hành độc lập:**
  - [ ] Tại thư mục dự án `a:\Web V2`, tạo nhánh mới:
    ```powershell
    git checkout -b release/v1.0.0-tu-sach-ao-lam
    ```
- [ ] **D.2. Đẩy nhánh lên GitHub:**
  - [ ] Đẩy nhánh mới lên repository (Không dùng `--force`):
    ```powershell
    git push origin release/v1.0.0-tu-sach-ao-lam
    ```
  - [ ] *(Hoặc đẩy lên Repository GitHub mới riêng biệt nếu Bạn muốn tách rời hoàn toàn với website thực hành cũ)*.

---

### PHẦN E: CẤU HÌNH BIẾN MÔI TRƯỜNG PHÂN TÁCH TRÊN NETLIFY DASHBOARD

Truy cập Netlify Dashboard $\rightarrow$ Chọn Site $\rightarrow$ **Site configuration** $\rightarrow$ **Environment variables**. Thiết lập các biến môi trường theo ngữ cảnh (Deploy Context):

- [ ] **E.1. Biến dùng chung (All Deploys):**
  - [ ] `NODE_VERSION` = `20`
  - [ ] `NODE_ENV` = `production`
  - [ ] `APP_ENV` = `production`
- [ ] **E.2. Biến Production Context (Chỉ áp dụng cho nhánh Production):**
  - [ ] `DATABASE_URL` = *(Pooled URL trỏ về Supabase Production)*
  - [ ] `DIRECT_URL` = *(Session URL trỏ về Supabase Production)*
  - [ ] `AUTH_SECRET` = *(Chuỗi ngẫu nhiên 64 ký tự hex cho Production)*
  - [ ] `NEXT_PUBLIC_APP_URL` = *(Tên miền chính thức với https://)*
  - [ ] `SUPABASE_STORAGE_BUCKET` = `sentrang-media`
- [ ] **E.3. Biến Deploy Previews Context (Chỉ áp dụng cho bản xem trước):**
  - [ ] `DATABASE_URL` = *(Trỏ về Staging/Preview Database hoặc schema riêng)*
  - [ ] `AUTH_SECRET` = *(Khóa bí mật riêng cho Preview)*
  - [ ] `SUPABASE_STORAGE_BUCKET` = `sentrang-media-preview`
  - [ ] *(Đảm bảo Deploy Preview không bao giờ đọc/ghi vào dữ liệu Production)*.

---

### PHẦN F: KIỂM THỬ TRÊN NETLIFY DEPLOY PREVIEW (BẮT BUỘC TRƯỚC KHI ĐỔI PRODUCTION)

- [ ] **F.1. Kích hoạt Deploy Preview:**
  - [ ] Tạo một Pull Request trên GitHub từ nhánh `release/v1.0.0-tu-sach-ao-lam`.
  - [ ] Netlify tự động kích hoạt bản build **Deploy Preview** kèm URL có dạng: `https://deploy-preview-1--yoursite.netlify.app`.
- [ ] **F.2. Kiểm thử Khói Toàn diện trên Deploy Preview URL:**
  - [ ] **Trang chủ (`/`):** Hiển thị đầy đủ nhận diện TỦ SÁCH ÁO LAM, logo hoa sen + sách mở `#176B4A`, tagline.
  - [ ] **Bảo vệ Draft (`/bai-hoc/[slug]`):** Truy cập bài học bất kỳ khi chưa đăng nhập $\rightarrow$ Trả về **404 Not Found**.
  - [ ] **Danh sách chuyên mục (`/nganh-dong/[level]/[category]`):** Hiển thị Empty State: *"Học liệu đang trong quá trình biên tập chuẩn hóa"*.
  - [ ] **Tìm kiếm (`/tim-kiem`):** Thử tìm từ khóa tiếng Việt có dấu/không dấu $\rightarrow$ Trả về 0 kết quả (bảo vệ draft).
  - [ ] **Đăng nhập Quản trị (`/admin/login`):** Đăng nhập thành công với tài khoản Admin mới tạo; từ chối tài khoản demo.
  - [ ] **Thu hồi phiên đăng xuất (`/api/admin/auth/logout`):** Đăng xuất thành công, token cũ không thể tái sử dụng.
  - [ ] **Block Editor (`/admin/lessons/[id]`):** Chỉnh sửa thử tóm tắt 1 bài và lưu $\rightarrow$ Phiên bản tăng lên và ghi nhận lịch sử.
  - [ ] **Tải ảnh riêng tư (`/admin/media`):** Tải lên ảnh JPEG/PNG $\rightarrow$ Ảnh lưu vào bucket `sentrang-media-preview`, không thể xem nếu chưa đăng nhập.
  - [ ] **Thử nghiệm Xuất bản & Thu hồi:**
    - [ ] Bấm **"Xuất bản"** bài học thử nghiệm $\rightarrow$ Bài học xuất hiện công khai trên danh sách và tìm kiếm.
    - [ ] Bấm **"Thu hồi bài học" (Unpublish)** $\rightarrow$ Bài học ngay lập tức biến mất khỏi trang công khai, link bài trả về 404, ảnh trả về 401, cache bị xóa.

---

### PHẦN G: CHUYỂN PRODUCTION BRANCH CHÍNH THỨC

*Chỉ thực hiện phần này sau khi Phần F đạt 100% PASS.*

- [ ] **G.1. Cập nhật nhánh Production trên Netlify:**
  - [ ] Vào **Site configuration $\rightarrow$ Build & deploy $\rightarrow$ Continuous deployment**.
  - [ ] Đổi **Production branch** thành: `release/v1.0.0-tu-sach-ao-lam`.
  - [ ] Merge Pull Request trên GitHub (hoặc Trigger Deploy trên Netlify).
- [ ] **G.2. Kiểm tra lần cuối trên tên miền chính thức:**
  - [ ] Truy cập tên miền chính thức $\rightarrow$ Xác nhận website hoạt động hoàn hảo.

---

### PHẦN H: SAO LƯU ĐỊNH KỲ & GIÁM SÁT HẠN MỨC FREE

- [ ] **H.1. Hỗ trợ Duy trì Hoạt động (Uptime Ping):**
  - [ ] Thiết lập monitor trên UptimeRobot gửi `GET https://tenmiencuaban.vn/api/v1/levels` mỗi 15 phút.
  - [ ] *Lưu ý:* Đây là giải pháp hỗ trợ giảm thiểu nguy cơ, không phải cam kết tuyệt đối chống pause của Supabase.
- [ ] **H.2. Quy trình Sao lưu Thủ công Định kỳ (Thực hiện mỗi 2 tuần / 1 tháng):**
  - [ ] **Sao lưu Database:** Dùng lệnh `pg_dump` từ máy tính:
    ```bash
    pg_dump -d "$DIRECT_URL" --clean --if-exists --no-owner --no-privileges -f backup_supabase_$(date +%Y%m%d).sql
    ```
  - [ ] **Sao lưu Media:** Chạy script:
    ```bash
    pnpm exec tsx scripts/backup-cloud-media.ts
    ```
- [ ] **H.3. Giám sát Hạn mức Miễn phí:**
  - [ ] Định kỳ kiểm tra Supabase Dashboard: Database Size (< 500 MB), Egress (< 2 GB), Storage (< 1 GB).
  - [ ] Định kỳ kiểm tra Netlify Dashboard: Bandwidth (< 100 GB), Build Minutes (< 300 phút).

---

### XÁC NHẬN NGHIỆM THU
Toàn bộ các tiêu chí kiểm tra trong tài liệu này đảm bảo việc thay thế website diễn ra an toàn 100%, không mất dữ liệu cũ, không lộ bí mật và không phát sinh chi phí.
