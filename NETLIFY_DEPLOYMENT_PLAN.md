# KẾ HOẠCH TRIỂN KHAI THAY THẾ WEBSITE TRÊN NETLIFY (V1.1 — REVISED)
## DỰ ÁN: TỦ SÁCH ÁO LAM V1.0
**Mã tài liệu:** `TUSAC-NETLIFY-PLAN-V1.1` | **Trạng thái:** Chờ Ban Điều Hành phê duyệt  
**Ngày cập nhật:** 12/10/2026 | **Phiên bản mã nguồn đóng gói:** Git Release Tag `v1.0.0`  
**Hạ tầng mục tiêu:** Netlify (Serverless + Global Edge CDN) + Supabase (PostgreSQL 17 Free + Private Object Storage)  

---

## 1. NGUYÊN TẮC BẢO MẬT & ĐIỀU CHỈNH AN TOÀN V1.1

Theo chỉ đạo mới nhất từ Ban Điều Hành, kế hoạch V1.1 bổ sung và tuân thủ tuyệt đối 6 nguyên tắc an toàn:

1. **Bảo vệ Lịch sử Git & Tuyệt đối Không Push Force:**
   * **Nghiêm cấm hoàn toàn:** Không bao giờ sử dụng lệnh `git push --force` lên repository cũ của website thực hành.
   * **Giải pháp:** Thiết lập nhánh độc lập riêng biệt (ví dụ: `release/v1.0.0-tu-sach-ao-lam`) hoặc liên kết tới một **Repository GitHub mới chuyên biệt** cho TỦ SÁCH ÁO LAM. Toàn bộ lịch sử commit của dự án thực hành cũ được giữ nguyên vẹn 100%.
   * **Kiểm tra file được Git theo dõi (`git ls-files`):** Đã rà soát toàn diện danh mục tệp trong Git tree, xác nhận không có bất kỳ file `.env`, mật khẩu, database nội bộ hay token nào bị theo dõi hoặc lưu trong lịch sử.

2. **Bảo mật Thông tin Đăng nhập & Không Chia sẻ Secrets trong Chat:**
   * **Tuyệt đối không yêu cầu người dùng gửi `DATABASE_URL`, mật khẩu Database hay `SERVICE_ROLE_KEY` vào cửa sổ chat.**
   * Cung cấp quy trình từng bước để Bạn tự nhập trực tiếp các giá trị nhạy cảm vào mục **Netlify Environment Variables** và file cấu hình migration cục bộ tạm thời.
   * **Tạo Admin Production an toàn:** Script [`scripts/create-prod-admin.ts`](file:///a:/Web%20V2/scripts/create-prod-admin.ts) đã được nâng cấp sang **chế độ nhập mật khẩu ẩn (Masked Hidden Input với ký tự `*`)**, không truyền mật khẩu qua tham số dòng lệnh để tránh bị ghi lại trong bash history hay tiến trình hệ điều hành.

3. **Tương thích Prisma với Supabase Connection Pooler & Mạng Windows:**
   * Schema Prisma [`prisma/schema.prisma`](file:///a:/Web%20V2/prisma/schema.prisma) đã được nâng cấp hỗ trợ đồng thời cả `DATABASE_URL` (cho ứng dụng chạy trên Netlify) và `DIRECT_URL` (cho thao tác migration).
   * **Giải quyết bài toán IPv6 trên Windows:** Tránh lỗi kết nối IPv6 của các nhà mạng tại Việt Nam bằng cách sử dụng **Session Pooler Domain** (`aws-0-[region].pooler.supabase.com:5432`), hỗ trợ phân giải IPv4 nguyên bản.

4. **Định mức Miễn phí & Cảnh báo Tạm dừng Tự động (Auto-pause Alert):**
   * Dự án vận hành với **Tổng chi phí 0 VNĐ** dựa trên hạn mức Free Tier chính thức.
   * **Cảnh báo quan trọng:** Dự án Supabase Free sẽ tự động bị **tạm dừng (paused)** nếu không có yêu cầu truy vấn nào trong **7 ngày liên tục**. Kế hoạch V1.1 cung cấp giải pháp thiết lập Ping kiểm tra tự động (0 VNĐ) để giữ hệ thống luôn luôn hoạt động.

5. **Bảo vệ Dữ liệu & 0 Bài Published Ban Đầu:**
   * Cơ sở dữ liệu production chỉ nạp 156 bài học ở trạng thái **`draft` (bản nháp nội bộ)**. Tuyệt đối không có bài nào tự động xuất bản.
   * Toàn bộ 6 màn hình công khai đã được xác minh hiển thị Empty State chuẩn, trang chi tiết draft trả về 404 cho người chưa đăng nhập.

6. **Cam kết Trước Triển khai:**
   * Dừng lại ở bước chuẩn bị. **Không push production, không thay đổi website công khai và không đăng ký bất kỳ dịch vụ trả phí nào** cho đến khi Bạn phê duyệt.

---

## 2. KIẾN TRÚC HỆ THỐNG MỤC TIÊU (TARGET ARCHITECTURE)

```mermaid
flowchart TD
    subgraph Client["Độc giả & Huynh trưởng (Toàn cầu)"]
        Browser["Trình duyệt Web (HTTPS)"]
    end

    subgraph Netlify["Hạ tầng Netlify (Serverless Jamstack)"]
        EdgeCDN["Netlify Global Edge CDN<br/>• Static Pages (SCR-01, SCR-02, SCR-03)<br/>• Brand Logos & Favicon<br/>• Security Headers & DDoS Shield"]
        ServerlessFunc["Netlify Functions (AWS Lambda Node.js 20)<br/>OpenNext / Next.js Runtime V5<br/>• API Routes & Admin SCR-07<br/>• Search & SSR Readers"]
    end

    subgraph Supabase["Hạ tầng Supabase Free (Singapore Data Center)"]
        subgraph SupabasePooler["Bộ Điều Phối Kết Nối (Supavisor)"]
            PoolerTx["Cổng 6543 (Transaction Mode) — DATABASE_URL<br/>Dành cho Netlify Serverless Functions"]
            PoolerDirect["Cổng 5432 (Session Mode / IPv4) — DIRECT_URL<br/>Dành cho Prisma Migration từ máy tính"]
        end

        subgraph SupabaseEngine["Cơ Sở Dữ Liệu PostgreSQL 17"]
            DB[("Database: postgres<br/>• Extensions: unaccent, pg_trgm<br/>• 156 Bài học (Draft)")]
        end

        subgraph SupabaseStorage["Cloud Object Storage (Private)"]
            Bucket[("Bucket: sentrang-media<br/>• Tài sản hình ảnh giáo trình<br/>• Xác thực qua Service Role REST API")]
        end
    end

    subgraph KeepAlive["Giám sát Giữ Hoạt động (Zero-Cost Keep-Alive)"]
        CronPing["GitHub Actions / UptimeRobot (Free)<br/>Gửi GET /api/v1/levels mỗi 2 ngày<br/>Ngăn ngừa Supabase Auto-pause 7 ngày"]
    end

    Browser -->|HTTPS Tên miền riêng| EdgeCDN
    EdgeCDN -->|Dynamic / SSR / API| ServerlessFunc
    ServerlessFunc -->|DATABASE_URL pooled| PoolerTx
    PoolerTx --> DB
    ServerlessFunc -->|REST API xác thực| Bucket
    CronPing -.->|Keep-Alive Ping| EdgeCDN
```

---

## 3. PHÂN TÍCH ĐỊNH MỨC MIỄN PHÍ & CẢNH BÁO AUTO-PAUSE

Bảng đối chiếu định mức tài nguyên và nhu cầu thực tế của TỦ SÁCH ÁO LAM V1.0:

| Dịch vụ | Tài nguyên | Hạn mức Free Tier (2026) | Nhu cầu thực tế của Dự án | Mức độ sử dụng | Đánh giá |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Netlify** | Băng thông (Bandwidth) | **100 GB / tháng** | ~ 5 – 10 GB / tháng | 5 – 10% | Rất an toàn |
| | Thời gian Build (Build minutes) | **300 phút / tháng** | ~ 1.5 phút / lần build | < 5% | Thoải mái cập nhật code |
| | Serverless Invocations | **125.000 lượt / tháng** | ~ 15.000 – 30.000 lượt | 15 – 25% | Đủ phục vụ tra cứu |
| **Supabase** | Dung lượng Database | **500 MB** | ~ 18 MB (156 bài + Trigram index) | **~ 3.6%** | Rất nhỏ gọn |
| | Bộ nhớ RAM Compute | **Shared Micro** | Phục vụ kết nối qua Pooler | Ổn định | Tối ưu qua Supavisor |
| | Cloud Object Storage | **1 GB** | ~ 20 – 50 MB (ảnh minh họa bài) | **~ 5%** | Đủ chứa hàng trăm ảnh |
| | Băng thông Storage Egress | **2 GB / tháng** | ~ 500 MB – 1 GB / tháng | 25 – 50% | Đạt chuẩn |
| | Người dùng kích hoạt (MAU) | **50.000 users** | ~ 5 – 10 tài khoản Quản trị | < 0.1% | Dư dả |

### ⚠️ CẢNH BÁO QUAN TRỌNG: CƠ CHẾ AUTO-PAUSE CỦA SUPABASE FREE
> [!WARNING]
> **Chính sách của Supabase:** Các dự án thuộc gói Free không nhận được bất kỳ truy vấn cơ sở dữ liệu nào trong **7 ngày liên tục** sẽ bị hệ thống tự động đưa vào trạng thái **"Paused" (Tạm dừng)** để tiết kiệm tài nguyên máy chủ.
> 
> **Hiện tượng khi bị pause:** Website sẽ không thể truy xuất bài học và báo lỗi kết nối cơ sở dữ liệu. Quản trị viên phải đăng nhập vào Supabase Dashboard và bấm "Restore project" (mất khoảng 2 phút).
> 
> **GIẢI PHÁP PHÒNG NGỪA (100% MIỄN PHÍ):**
> 1. Thiết lập một **GitHub Actions Workflow** chạy định kỳ mỗi 3 ngày (hoặc tạo một monitor miễn phí trên **UptimeRobot**) gửi một yêu cầu `GET` đơn giản tới endpoint công khai `https://tenmiencuaban.vn/api/v1/levels`.
> 2. Yêu cầu này tạo một truy vấn đọc nhẹ vào cơ sở dữ liệu, giúp Supabase ghi nhận hoạt động liên tục và **không bao giờ bị tạm dừng**.

---

## 4. CHI TIẾT KỸ THUẬT: PRISMA, NETLIFY RUNTIME VÀ STORAGE

### A. Cấu hình Prisma Đa Nền tảng với Connection Pooler
Trong [`prisma/schema.prisma`](file:///a:/Web%20V2/prisma/schema.prisma):
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Trỏ tới Supavisor Pooler (Port 6543)
  directUrl = env("DIRECT_URL")     // Trỏ tới Session Pooler IPv4 (Port 5432) cho Migration
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]
}
```
* **Tại sao cần `directUrl`?** Khi chạy `prisma migrate deploy`, Prisma cần thiết lập khóa bảng cấp cao (`advisory locks`) mà Transaction Pooler (cổng 6543) không hỗ trợ. `directUrl` giải quyết triệt để vấn đề này.

### B. Khắc phục vấn đề mạng IPv6 trên máy tính Windows
* **Hiện tượng:** Máy tính Windows tại một số nhà mạng ở Việt Nam (VNPT, Viettel, FPT) chưa bật định tuyến IPv6, dẫn đến lệnh chạy migration tới `db.[ref].supabase.co:5432` bị lỗi `ETIMEDOUT`.
* **Giải pháp chuẩn:** Sử dụng địa chỉ **Pooler IPv4**:
  * Khi lấy connection string từ Supabase, Bạn tick chọn **"Use connection pooling"** và chọn chế độ **Session (port 5432)** làm `DIRECT_URL`.
  * Địa chỉ này có dạng: `aws-0-ap-southeast-1.pooler.supabase.com:5432`, hỗ trợ đầy đủ IPv4 trên mọi đường truyền Internet tại Việt Nam.

### C. Netlify Runtime Hiện Hành (Không Cố Định Cứng Phiên Bản)
* File [netlify.toml](file:///a:/Web%20V2/netlify.toml) sử dụng cấu hình Runtime chuẩn:
  ```toml
  [build]
    command = "prisma generate && next build"
    publish = ".next"

  [build.environment]
    NODE_VERSION = "20"

  [[plugins]]
    package = "@netlify/plugin-nextjs"
  ```
* Netlify tự động tải bản phát hành Next.js Runtime mới nhất (Next.js Runtime V5 / OpenNext engine) phù hợp với Next.js 15.1.7 mà không bị xung đột phiên bản.

### D. Cơ chế Quản lý Media & Thu hồi Cache khi Unpublish
* Ảnh được lưu trong Bucket riêng tư (`sentrang-media`).
* Ảnh gắn với bài học `draft` chỉ có thể truy cập khi có phiên đăng nhập Quản trị viên hợp lệ (`HttpOnly` cookie).
* Khi Quản trị viên bấm **"Thu hồi bài học" (Unpublish)** trong `/admin/lessons/[id]`:
  * Database cập nhật `publishStatus = 'draft'`.
  * Yêu cầu tiếp theo tới `/api/media/[filename]` lập tức nhận mã `401 Unauthorized` kèm header:
    ```http
    Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
    Pragma: no-cache
    ```
  * Trình duyệt và proxy ngay lập tức loại bỏ hình ảnh khỏi bộ nhớ đệm.

---

## 5. QUY TRÌNH ROLLBACK & SAO LƯU WEBSITE CŨ

### A. Sao lưu Website Cũ Trước Khi Thay Thế
1. Truy cập **Netlify Dashboard $\rightarrow$ Sites $\rightarrow$ [Site của Bạn] $\rightarrow$ Deploys**.
2. Tìm bản deploy đang xuất bản thành công gần nhất (**Published deploy**).
3. Nhấp vào mục ba chấm $\rightarrow$ Chọn **"Download deploy"** để tải tệp `.zip` của website cũ về máy tính lưu trữ an toàn.
4. Ghi nhận danh sách biến môi trường cũ tại: **Site configuration $\rightarrow$ Environment variables**.

### B. Kịch bản Rollback 1-Click Tức Thì
* **Nếu muốn khôi phục website cũ:**
  * Trên Netlify Dashboard $\rightarrow$ **Deploys** $\rightarrow$ Bấm vào bản deploy cũ đã lưu $\rightarrow$ Chọn **"Publish deploy"**.
  * Website cũ lập tức được khôi phục trực tuyến trong vòng **1 giây**.

---

## 6. KẾT QUẢ KIỂM THỬ MÔ PHỎNG TIỀN TRIỂN KHAI (PRE-DEPLOY SIMULATION)

Toàn bộ 11 bài kiểm thử tiền triển khai đã được chạy thực tế qua script [`scratch/test_predeploy_simulation.ts`](file:///a:/Web%20V2/scratch/test_predeploy_simulation.ts) với kết quả **11/11 PASS (ĐẠT 100%)**:

```
==================================================================
KẾT QUẢ KIỂM THỬ TIỀN TRIỂN KHAI: 11/11 BÀI ĐẠT (PASS)
Số bài thất bại: 0
==================================================================
✅ [Data Invariants] 156 Drafts / 0 Published Invariant: 156 draft, 0 published
✅ [Data Invariants] Master Data Hierarchy Integrity: 1 branch, 4 levels, 3 categories, 4 sources
✅ [Prisma Fail-Fast] Block Test DB in Production: Tự động chặn kết nối sentrang_test
✅ [Prisma Fail-Fast] Allow Valid Production DB: Chấp nhận kết nối production hợp lệ
✅ [Session Security] Token Creation & Verification: JWT bảo mật hợp lệ
✅ [Session Security] Server-Side Session Revocation: Thu hồi token tức thì qua DB
✅ [Media Security] Reject Malicious Executable Disguised as Image: Chặn file giả mạo đuôi ảnh
✅ [Media Security] Accurately Identify Valid JPEG: Xác thực chính xác MIME qua Magic Bytes
✅ [Disaster Recovery] Automated Backup Bundle Generation: Dump size: 748,684 bytes
✅ [Disaster Recovery] Cryptographic Manifest Integrity: SHA-256 kê khai đầy đủ
✅ [Secret Protection] Strict Gitignore Policy: Bảo vệ 100% tệp bí mật
```

---

## 7. HƯỚNG DẪN THAO TÁC DÀNH CHO BAN ĐIỀU HÀNH (KHÔNG CHIA SẺ SECRETS TRONG CHAT)

Để giữ bảo mật tuyệt đối, Bạn **không cần chia sẻ bất kỳ mật khẩu hay chuỗi kết nối nào trong chat**. Bạn chỉ cần thực hiện theo các bước sau:

### BƯỚC 1: TẠO DỰ ÁN SUPABASE MIỄN PHÍ
1. Đăng nhập [supabase.com](https://supabase.com) bằng tài khoản GitHub của Bạn.
2. Nhấn **New Project**:
   * **Name:** `tu-sach-ao-lam`
   * **Database Password:** Tự tạo một mật khẩu mạnh và lưu vào trình quản lý mật khẩu của Bạn.
   * **Region:** Chọn **Singapore (`ap-southeast-1`)** để đạt tốc độ nhanh nhất tại Việt Nam.
3. Kích hoạt Extension tiếng Việt:
   * Vào menu bên trái $\rightarrow$ **SQL Editor** $\rightarrow$ Dán câu lệnh sau và nhấn **Run**:
     ```sql
     CREATE EXTENSION IF NOT EXISTS unaccent;
     CREATE EXTENSION IF NOT EXISTS pg_trgm;
     ```
4. Tạo Storage Bucket lưu ảnh:
   * Vào menu **Storage** $\rightarrow$ **New bucket** $\rightarrow$ Đặt tên: `sentrang-media` $\rightarrow$ Tắt tùy chọn *Public bucket* (để ở chế độ Private) $\rightarrow$ Nhấn **Save**.

---

### BƯỚC 2: TỰ NẠP MASTER DATA VÀ TẠO ADMIN TỪ MÁY TÍNH CỦA BẠN
Trên máy tính của Bạn (trong thư mục `a:\Web V2`), Bạn tạo một file tạm thời mang tên `.env.production.local` (file này đã nằm trong `.gitignore`, không bao giờ bị lộ):

1. Mở file `.env.production.local` và điền chuỗi kết nối của Supabase Bạn vừa tạo:
   ```env
   # Lấy tại Supabase Dashboard -> Project Settings -> Database -> Connection string:
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   APP_ENV="production"
   
   # Lấy tại Supabase Dashboard -> Project Settings -> API:
   SUPABASE_URL="https://[REF].supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJh..."
   SUPABASE_STORAGE_BUCKET="sentrang-media"
   ```
2. Mở PowerShell trong thư mục dự án và chạy các lệnh sau:
   ```powershell
   # 1. Đẩy cấu trúc bảng lên Supabase
   pnpm prisma migrate deploy

   # 2. Nạp 156 bài học Master Data V1.2 (ở trạng thái Draft an toàn)
   pnpm exec tsx prisma/seed.ts

   # 3. Đồng bộ 10 ảnh tài sản lên Supabase Storage
   pnpm exec tsx scripts/sync-media-to-cloud.ts

   # 4. Tạo tài khoản Quản trị viên chính thức (Nhập mật khẩu kín, ký tự *)
   pnpm exec tsx scripts/create-prod-admin.ts
   ```
3. Sau khi chạy xong, Bạn xóa file `.env.production.local` khỏi máy tính:
   ```powershell
   Remove-Item .env.production.local
   ```

---

### BƯỚC 3: CẤU HÌNH GITHUB AN TOÀN
* Tạo một nhánh mới trên repository hiện tại (ví dụ: `release/v1.0.0-tu-sach-ao-lam`) hoặc tạo một repository mới trên GitHub (ví dụ: `tu-sach-ao-lam`).
* Đẩy mã nguồn lên nhánh mới mà **không dùng `--force`**:
  ```powershell
  git checkout -b release/v1.0.0-tu-sach-ao-lam
  git push origin release/v1.0.0-tu-sach-ao-lam
  ```

---

### BƯỚC 4: NHẬP BIẾN MÔI TRƯỜNG TRÊN NETLIFY DASHBOARD
Truy cập Netlify Dashboard $\rightarrow$ Chọn Site của Bạn $\rightarrow$ **Site configuration** $\rightarrow$ **Environment variables**, nhập trực tiếp các biến sau:

| Tên biến (Key) | Giá trị (Value) |
| :--- | :--- |
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `APP_ENV` | `production` |
| `DATABASE_URL` | *Chuỗi Pooled URL (cổng 6543) từ Supabase* |
| `DIRECT_URL` | *Chuỗi Session URL (cổng 5432) từ Supabase* |
| `AUTH_SECRET` | *Chuỗi ngẫu nhiên sinh bằng `openssl rand -hex 32`* |
| `NEXT_PUBLIC_APP_URL` | *Tên miền chính thức của Bạn (ví dụ: `https://tenmiencuaban.vn`)* |
| `SUPABASE_URL` | *Project URL từ Supabase Dashboard* |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role secret key từ Supabase Dashboard* |
| `SUPABASE_STORAGE_BUCKET` | `sentrang-media` |

---

### BƯỚC 5: CHUYỂN NHÁNH DEPLOY VÀ KÍCH HOẠT TRIỂN KHAI
1. Trong Netlify Dashboard $\rightarrow$ **Site configuration** $\rightarrow$ **Build & deploy** $\rightarrow$ **Continuous deployment** $\rightarrow$ Đổi **Production branch** thành nhánh mới `release/v1.0.0-tu-sach-ao-lam`.
2. Nhấn **Trigger deploy** $\rightarrow$ **Deploy site**.
3. Tiến hành kiểm thử trên tên miền chính thức.

---

> [!IMPORTANT]
> **Cam kết:** Tôi **chưa thực hiện bất kỳ lệnh push hay deploy nào** lên GitHub hoặc Netlify. Toàn bộ mã nguồn và database cục bộ đang được giữ an toàn tại máy của Bạn.
