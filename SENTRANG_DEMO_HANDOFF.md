# TÀI LIỆU BÀN GIAO MÔI TRƯỜNG DEMO & USER ACCEPTANCE TESTING (UAT)
## DỰ ÁN SEN TRẮNG — THƯ VIỆN TU HỌC GIA ĐÌNH PHẬT TỬ VIỆT NAM (V1.3)
**Mã tài liệu:** `SENTRANG_DEMO_HANDOFF.md`  
**Ngày bàn giao:** 12/10/2026  
**Môi trường trải nghiệm:** Cục bộ trên máy tính cá nhân (Localhost :3000)  
**Cơ sở dữ liệu:** PostgreSQL 17.4 Native (`sentrang_test` trên cổng 5434)  

---

## 1. XÁC NHẬN TRẠNG THÁI MÁY CHỦ & ĐƯỜNG DẪN TRẢI NGHIỆM

Hệ thống Next.js phiên bản tối ưu Production đã được khởi chạy thành công tại cổng **3000** và đang hoạt động dưới dạng tiến trình nền (Daemon Task). Cơ chế bảo vệ **Fail-Fast** kép đảm bảo máy chủ kết nối tường minh tới cơ sở dữ liệu thử nghiệm `sentrang_test`, cô lập 100% với cơ sở dữ liệu chính.

### Danh mục URL trải nghiệm độc giả (SCR-01 đến SCR-06):

| Mã màn hình | Tên màn hình | Đường dẫn trải nghiệm trực tiếp | Điểm nhấn cần trải nghiệm |
| :--- | :--- | :--- | :--- |
| **SCR-01** | **Trang chủ Sen Trắng** | [http://localhost:3000/](http://localhost:3000/) | Hero banner, ô tìm kiếm nhanh, khối giới thiệu Sen Trắng và 4 bậc Ngành Đồng, thống kê bài học. |
| **SCR-02** | **Tổng quan Ngành Đồng** | [http://localhost:3000/nganh-dong](http://localhost:3000/nganh-dong) | Châm ngôn (Hòa - Tin - Vui), Luật Oanh Vũ, Khẩu hiệu (Dũng), Ý nghĩa Hoa Sen và liên kết 4 bậc học. |
| **SCR-03** | **Chi tiết Bậc Mở Mắt** | [http://localhost:3000/nganh-dong/mo-mat](http://localhost:3000/nganh-dong/mo-mat) | Thông tin giáo trình, tab 3 lĩnh vực tu học, thống kê 3 bài demo đã xuất bản. |
| **SCR-04** | **Danh sách bài học** | [http://localhost:3000/nganh-dong/mo-mat/phat-phap](http://localhost:3000/nganh-dong/mo-mat/phat-phap) | Lưới hiển thị bài học theo thứ tự giáo trình chuẩn, tóm tắt, nhãn trạng thái và điều hướng trang. |
| **SCR-05 (1)** | **Bài 1: Đức Phật Thích Ca** | [http://localhost:3000/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca](http://localhost:3000/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca) | Trình đọc đầy đủ khối: heading, paragraph, list, ảnh minh họa có caption; mục lục TOC bên phải; nút Next sang Bài 2. |
| **SCR-05 (2)** | **Bài 2: Châm ngôn - Điều luật** | [http://localhost:3000/bai-hoc/d-mm-a-02-cham-ngon-dieu-luat-khau-hieu](http://localhost:3000/bai-hoc/d-mm-a-02-cham-ngon-dieu-luat-khau-hieu) | Trình đọc khối: châm ngôn, danh sách điều luật, callout khẩu hiệu; liên kết Previous (Bài 1) $\leftrightarrow$ Next (Bài 3). |
| **SCR-05 (3)** | **Bài 3: Huy hiệu Hoa Sen** | [http://localhost:3000/bai-hoc/d-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt](http://localhost:3000/bai-hoc/d-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt) | Trình đọc khối: ý nghĩa hình tròn, 5 cánh trên, 3 cánh dưới; liên kết Previous về Bài 2. |
| **SCR-06** | **Tìm kiếm tiếng Việt** | [http://localhost:3000/tim-kiem](http://localhost:3000/tim-kiem) | Tìm kiếm tiếng Việt có dấu và không dấu; bộ lọc bậc học và lĩnh vực; kết quả tìm kiếm làm nổi bật từ khóa. |

---

## 2. PHÂN HỆ QUẢN TRỊ & BIÊN TẬP HỌC LIỆU (SCR-07)

### Đường dẫn truy cập Quản trị:
- **Đăng nhập quản trị:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Bảng điều khiển (Dashboard):** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Danh sách 156 bài học & Trạng thái biên tập:** [http://localhost:3000/admin/lessons](http://localhost:3000/admin/lessons)
- **Thư viện Quản lý Tài sản Hình ảnh:** [http://localhost:3000/admin/media](http://localhost:3000/admin/media)
- **Nhật ký Hoạt động Kiểm toán:** [http://localhost:3000/admin/audit-logs](http://localhost:3000/admin/audit-logs)

### Tài khoản Quản trị viên Demo UAT:
- **Email:** `demo.admin@sentrang.gdpt.vn` *(Tài khoản được tạo riêng cho môi trường UAT, hoàn toàn tách biệt với tài khoản production)*.
- **Mật khẩu:** Để tuân thủ nghiêm ngặt nguyên tắc bảo mật và không ghi lộ mật khẩu ra báo cáo hay nhật ký log, mật khẩu đã được lưu an toàn trong tệp văn bản nội bộ trên máy của bạn:  
  👉 **Xem tại tệp cục bộ:** [DEMO_CREDENTIALS.txt](file:///a:/Web%20V2/DEMO_CREDENTIALS.txt)

---

## 3. CHECKLIST TRẢI NGHIỆM NGƯỜI DÙNG (UAT CHECKLIST)

### A. Hành trình Độc giả (Public Reader Journey)
- [ ] **Trang chủ (`/`):**
  - Nhấp vào các thẻ Bậc học để chuyển nhanh tới Bậc Mở Mắt (`/nganh-dong/mo-mat`).
  - Thử gõ từ khóa vào ô tìm kiếm nhanh ở Hero banner và bấm Enter.
- [ ] **Đọc bài học (`/bai-hoc/[slug]`):**
  - **Mục lục động (TOC):** Nhấp vào các mục trong Table of Contents bên phải để cuộn mượt đến các phần tương ứng.
  - **Điều hướng tuần tự (Previous / Next):**
    - Tại Bài 1: Xem nút bài tiếp theo trỏ tới Bài 2.
    - Tại Bài 2: Xem đầy đủ nút lùi về Bài 1 và nút tiến tới Bài 3.
    - Tại Bài 3: Xem nút lùi về Bài 2.
  - **Tùy chỉnh thị giác:**
    - Bấm nút `A-` / `A+` trên thanh công cụ để tăng giảm cỡ chữ trong khoảng 15px – 23px.
    - Bấm chuyển đổi 3 chế độ màu nền đọc: **Trắng (Mặc định)**, **Vàng nhạt (Sepia)**, **Chế độ Tối (Night)**.
  - **Bảo vệ bài nháp:** Thử truy cập một slug bài chưa xuất bản (ví dụ: `http://localhost:3000/bai-hoc/d-mm-a-04-em-tap-an-chay`) $\rightarrow$ Xác nhận hệ thống trả trang **404: Bài học không tìm thấy**.
- [ ] **Tìm kiếm (`/tim-kiem`):**
  - Thử tìm kiếm có dấu: `"Phật"`, `"Hoa Sen"`, `"Châm ngôn"`.
  - Thử tìm kiếm không dấu: `"duc phat"`, `"hoa sen"`, `"cham ngon"`.
  - Xác nhận kết quả tìm kiếm hiển thị chính xác các bài demo tương ứng.

### B. Quy trình Quản trị & Biên tập (Admin Editorial Workflow)
- [ ] **Đăng nhập:** Truy cập `/admin/login`, nhập email `demo.admin@sentrang.gdpt.vn` và mật khẩu trong `DEMO_CREDENTIALS.txt`.
- [ ] **Bộ lọc danh sách bài học (`/admin/lessons`):**
  - Lọc theo Bậc học (`Mở Mắt`), Lĩnh vực (`Phật pháp`), Trạng thái (`published` hoặc `draft`).
- [ ] **Block Editor (Biên tập 3 cột):**
  - Chọn một bài bất kỳ (ví dụ `D-MM-A-02` hoặc `D-MM-A-04`).
  - Xem Cột 1: Văn bản trích xuất gốc từ PDF giáo trình.
  - Thao tác Cột 2: Thêm khối mới (Paragraph, Heading, List, Callout), chỉnh sửa văn bản.
  - Xem Cột 3: Trình xem trước thời gian thực (Live Preview).
  - Bấm **Lưu bản nháp** $\rightarrow$ Xác nhận hệ thống lưu phiên bản thành công.
- [ ] **Vòng đời Xuất bản & Thu hồi (Publish / Unpublish):**
  - Thử bấm **Đánh dấu Sẵn sàng (Mark Ready)**.
  - Thử bấm **Xuất bản (Publish)** $\rightarrow$ Mở tab độc giả xem bài xuất hiện công khai.
  - Thử bấm **Thu hồi (Unpublish)** $\rightarrow$ Mở tab độc giả tải lại trang để xác nhận bài lập tức biến mất (trả 404) và ảnh bị thu hồi quyền truy cập công khai.
- [ ] **Nhật ký Kiểm toán (`/admin/audit-logs`):**
  - Kiểm tra các hành động vừa thực hiện (Đăng nhập, Lưu nháp, Xuất bản, Thu hồi) đều được ghi nhận đầy đủ với Actor, IP và Timestamp.

---

## 4. HƯỚNG DẪN VẬN HÀNH & KHỞI ĐỘNG LẠI (RUNBOOK)

Máy chủ hiện đang hoạt động liên tục trong nền. Nếu bạn tắt máy tính hoặc muốn chủ động khởi động lại môi trường demo, hãy thực hiện theo 2 bước đơn giản sau:

### Bước 1: Khởi động cơ sở dữ liệu PostgreSQL 17 Native (nếu chưa chạy)
Mở PowerShell tại thư mục `A:\Web V2` và chạy:
```powershell
.\scratch\pgsql\bin\postgres.exe -D "data\sentrang-native-pgdata" -p 5434
```

### Bước 2: Khởi động máy chủ Next.js Demo
Mở một cửa sổ PowerShell khác tại `A:\Web V2` và chạy:
```powershell
node scripts/start-demo-server.js
```
*Máy chủ sẽ tự động thiết lập biến môi trường trỏ tới `sentrang_test` và lắng nghe tại cổng `http://localhost:3000`.*

---

## 5. CAM KẾT VÀ BÀN GIAO

- **Cô lập an toàn tuyệt đối:** Database chính `sentrang` được bảo vệ nguyên vẹn 100% draft (156 bài draft, 0 bài xuất bản).
- **Không tự ý thay đổi thiết kế:** Tôi đã dừng lại theo đúng yêu cầu để bạn trực tiếp sử dụng, đánh giá trải nghiệm thực tế và đưa ra các nhận xét UI/UX.
