# GATE CHECK REPORT 5 — ADMIN, BIÊN TẬP HỌC LIỆU & QUY TRÌNH DUYỆT BÀI (SCR-07)

**Dự án:** Sen Trắng — Thư viện Tu học Gia Đình Phật Tử Việt Nam  
**Giai đoạn:** Chặng 5 theo Kế hoạch triển khai V1.1 & Technical Specifications V1.3  
**Ngày báo cáo:** 12/10/2026  
**Trạng thái kiểm tra:** **ĐẠT TOÀN DIỆN (51/51 TESTS PASSED — 100% QUALITY GATES PASS)**  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU NGHIỆM THU

Chặng 5 hoàn thành việc xây dựng toàn bộ phân hệ quản trị nội bộ **SCR-07**, cung cấp công cụ biên tập khối trực quan (Block Editor), đối chiếu văn bản thô trích xuất từ PDF gốc, quản lý tài sản hình ảnh và quy trình xuất bản 5 bước có kiểm soát chặt chẽ theo đặc tả kỹ thuật V1.3.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       QUY TRÌNH DUYỆT BÀI 5 BƯỚC                           │
│                                                                             │
│  [1. Bài thô PDF] ──> [2. Đang sửa] ──> [3. Sẵn sàng] ──> [4. Xuất bản]   │
│   (raw_extracted)        (editing)          (ready)          (published)    │
│          │                                                        │         │
│          └──[Chặn xuất bản: 400 Bad Request]                      │         │
│                                                                   ▼         │
│                                              [5. Thu hồi về Nháp (draft)]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PHẠM VI TÍNH NĂNG ĐÃ TRIỂN KHAI

### A. Xác thực và Bảo mật Quản trị
- **Cơ chế xác thực:** Phiên đăng nhập HMAC-SHA256 JWT bảo mật cao lưu trong Cookie `HttpOnly`, `SameSite=Lax`, tên `sentrang_admin_session`.
- **Băm mật khẩu an toàn:** Sử dụng `bcryptjs` với 10 vòng muối (salt rounds). Tuyệt đối không hardcode mật khẩu hay lưu mật khẩu dạng văn bản thô.
- **Bảo vệ Endpoint đa tầng:** Middleware/Guard `requireAdminAuth` kiểm tra ở tầng server cho 100% các route `/api/admin/*` và trang `/admin/*`. Truy cập chưa xác thực lập tức bị chặn với mã **HTTP 401 Unauthorized**.
- **Chính sách tài khoản:** Không mở đăng ký công khai. Tài khoản quản trị được seed an toàn qua script quản trị nội bộ.

### B. Dashboard Thống kê Học liệu (`/admin`)
- **6 Thẻ chỉ số tổng quan thời gian thực:**
  - Tổng số bài: **156 bài học** giáo trình Ngành Đồng.
  - Đã xuất bản: Thống kê số lượng bài công khai.
  - Bản nháp: Thống kê số lượng bài chưa công khai (156 bài trên database chính).
  - Sẵn sàng duyệt: Thống kê bài đạt chuẩn chờ phát hành.
  - Dữ liệu thô: Thống kê bài trích xuất chờ biên tập.
  - Tài sản ảnh: Thống kê hình ảnh lưu trữ nội bộ.
- **Thanh tiến độ 4 Bậc tu học:** Bậc Mở Mắt (32 bài), Cánh Mềm (38 bài), Chân Cứng (41 bài), Tung Bay (45 bài) kèm biểu đồ phân đoạn màu sắc.
- **Cơ cấu 3 Lĩnh vực giáo trình:** Phật pháp (54 bài), Hoạt động thanh niên (75 bài), Văn nghệ (27 bài).
- **Dòng nhật ký kiểm toán trực tiếp:** 10 hoạt động gần nhất của biên tập viên.

### C. Quản lý 156 Bài học (`/admin/lessons`)
- Bộ lọc đa tiêu chí: Bậc học, Lĩnh vực, Tiến độ nội dung (`raw_extracted`, `editing`, `ready`), Trạng thái xuất bản (`draft`, `published`, `hidden`).
- Ô tìm kiếm hỗ trợ tra cứu theo mã bài học (ID) hoặc tiêu đề bài học.
- Bảng dữ liệu chi tiết kèm thứ tự giáo trình, số phiên bản (`v1`, `v2`, ...), huy hiệu trạng thái trực quan và nút liên kết biên tập.
- Thanh phân trang chuẩn mực.

### D. Trình biên tập Khối & Đối chiếu Văn bản thô (`/admin/lessons/[id]`)
- **Bố cục 3 cột đồng thời (Split 3-pane Workspace):**
  - **Cột 1 — Văn bản thô PDF gốc:** Hiển thị toàn bộ các trang PDF đã trích xuất từ Master Data V1.2 (`lesson_raw_contents.pages_json`), bảo đảm bất biến và dễ dàng tra cứu đối chiếu.
  - **Cột 2 — Block Editor:** Hỗ trợ đầy đủ 5 loại khối:
    - *Tiêu đề (Heading):* Cấp độ H2 (mục chính) hoặc H3 (mục phụ).
    - *Đoạn văn (Paragraph):* Soạn thảo văn bản linh hoạt.
    - *Danh sách (List):* Hỗ trợ danh sách chấm (bullet) hoặc danh sách số (ordered), thêm/xóa từng ý mục.
    - *Hình ảnh (Image):* URL ảnh, Alt text, chú thích (caption).
    - *Hộp lưu ý (Callout):* 4 biến thể: Thông tin (`info`), Pháp cú trích dẫn (`quote`), Cảnh báo (`warning`), Ghi nhớ (`success`).
    - *Thao tác khối:* Nút di chuyển lên/xuống, nút xóa khối, thanh công cụ thêm khối nhanh.
  - **Cột 3 — Xem trước trực tiếp (Live Reader Preview):** Tái hiện 100% giao diện đọc thực tế của người học bằng `ContentRenderer`, tuân thủ typography và màu sắc phong cách Sen Trắng.
- **Tùy biến bố cục:** Hỗ trợ chuyển đổi nhanh giữa: 3 Cột, Biên tập + Xem trước, Biên tập + Bản thô, và Chỉ biên tập.
- **Ngăn lịch sử phiên bản (Revisions Drawer):** Xem danh sách tất cả các lần lưu bản nháp trong quá khứ kèm thời gian, người sửa, số lượng khối và chức năng khôi phục bản cũ một chạm.

### E. Kiểm soát xung đột sửa đổi (Optimistic Concurrency Control)
- Dựa trên trường `version` tăng dần trong PostgreSQL.
- Khi gửi cập nhật `PATCH /api/admin/lessons/[id]`: Nếu phiên bản gửi lên không trùng khớp với phiên bản hiện tại trong database (do người khác đã lưu trước), hệ thống **từ chối ngay lập tức với HTTP 409 Conflict** (`CONCURRENCY_CONFLICT`).
- Giao diện hiển thị cảnh báo màu vàng kèm nút *"Nạp bản mới nhất"* để tải lại dữ liệu mà không làm mất an toàn dữ liệu.

### F. Quản lý Tài sản Hình ảnh an toàn (`/admin/media`)
- **Ràng buộc an toàn:** Giới hạn dung lượng tối đa 5MB; chỉ chấp nhận MIME types `image/jpeg`, `image/png`, `image/webp`.
- **Phòng chống Path Traversal & Trùng tên:** Tên file được sinh ngẫu nhiên bằng `crypto.randomUUID()`, lưu trữ an toàn trong thư mục `public/uploads/`.
- Thư viện hình ảnh hỗ trợ xem trước, sao chép URL một chạm và gán ảnh vào mã bài học tương ứng.

### G. Nhật ký Hoạt động Quản trị (`/admin/audit-logs`)
- Lưu vết toàn bộ các hành động: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGOUT`, `LESSON_UPDATE_CONTENT`, `LESSON_MARK_READY`, `LESSON_PUBLISH`, `LESSON_UNPUBLISH`, `MEDIA_UPLOAD`.
- Ghi nhận đầy đủ: Thời gian, Actor, Action, EntityType, EntityId và Metadata JSON.
- Bộ lọc theo hành động và đối tượng kèm phân trang.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG CHẶNG 5 (51/51 TESTS PASS)

Bộ kiểm thử tự động toàn diện được thực thi qua script `scratch/test_phase5_suite.ts`:

| Nhóm kiểm thử | Số test | Kết quả | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :--- |
| **GROUP 1: Unauthenticated Guards** | 5 | **5/5 PASS** | Chặn 401 Unauthorized toàn bộ API admin khi không có cookie phiên |
| **GROUP 2: Authentication Flow** | 5 | **5/5 PASS** | Chặn mật khẩu sai; đăng nhập thành công cấp cookie `HttpOnly`; API `/me` trả đúng profile |
| **GROUP 3: Dashboard & Queries** | 8 | **8/8 PASS** | Đủ 156 bài học, 4 bậc, 3 lĩnh vực; lọc bậc Mở Mắt trả đúng 32 bài; detail đủ raw text |
| **GROUP 4: Block Editor & 409 Conflict** | 5 | **5/5 PASS** | Cập nhật khối nội dung thành công, tăng version; gửi version cũ trả đúng **HTTP 409 Conflict** |
| **GROUP 5: 5-Step Publishing Workflow** | 8 | **8/8 PASS** | Bài thô bị chặn xuất bản (**HTTP 400**); sửa bài $\rightarrow$ ready $\rightarrow$ publish (reader 200) $\rightarrow$ unpublish (reader 404) |
| **GROUP 6: Media Upload Security & Audit** | 10 | **10/10 PASS** | Upload PNG an toàn qua UUID; từ chối file lạ; đủ 6 loại audit log action |
| **GROUP 7: Main DB Draft Isolation** | 3 | **3/3 PASS** | Database chính `sentrang` (port 3001) bảo toàn 100% bản nháp (0 published, 156 draft), reader trả 404 |
| **TỔNG CỘNG** | **51** | **51/51 PASS (100%)** | **Toàn bộ kịch bản kiểm thử đạt chuẩn tuyệt đối** |

---

## 4. BẢO TOÀN DỮ LIỆU & CÁCH LY MÔI TRƯỜNG

Theo đúng chỉ đạo nghiêm ngặt của Người Phê Duyệt:
1. **Bảo tồn bất biến Master Data V1.2:** Bảng `lesson_raw_contents` không bao giờ bị ghi đè hay chỉnh sửa khi biên tập. Toàn bộ nội dung chỉnh sửa được lưu độc lập vào `lesson_contents` và lưu lịch sử snapshot vào `lesson_revisions`.
2. **Database chính `sentrang` (Port 3001):**
   - Số bài xuất bản: **0 bài**.
   - Số bài nháp: **156 bài**.
   - Trạng thái nội dung: **156 raw_extracted / draft**.
   - Truy cập công khai tới bất kỳ bài nháp nào trên môi trường chính đều trả về **HTTP 404 Not Found**.
3. **Database kiểm thử `sentrang_test` (Port 3002):** Được sử dụng độc lập để thực hiện kiểm thử quy trình duyệt bài, chỉnh sửa và thu hồi xuất bản.

---

## 5. CHỨNG TỪ HÌNH ẢNH MINH CHỨNG (SCR-07 SCREENSHOT MATRIX)

Tất cả 6 ảnh chụp màn hình độ phân giải cao được lưu trữ tại `reports/screenshots/` và thư mục Artifacts:

| Mã minh chứng | Tên màn hình | Đường dẫn tệp ảnh | Kích thước |
| :--- | :--- | :--- | :--- |
| **SCR-07A** | Đăng nhập Quản trị | `reports/screenshots/admin-01_login.png` | 37.5 KB |
| **SCR-07B** | Dashboard Học vụ | `reports/screenshots/admin-02_dashboard.png` | 181.0 KB |
| **SCR-07C** | Quản lý 156 bài học | `reports/screenshots/admin-03_lessons.png` | 192.0 KB |
| **SCR-07D** | Trình biên tập 3 cột & Bản thô PDF | `reports/screenshots/admin-04_editor_3col.png` | 234.2 KB |
| **SCR-07E** | Thư viện tài sản ảnh | `reports/screenshots/admin-05_media.png` | 109.3 KB |
| **SCR-07F** | Nhật ký kiểm toán hệ thống | `reports/screenshots/admin-06_audit_logs.png` | 174.0 KB |

---

## 6. QUALITY GATES VERIFICATION

- [x] **QG-01 (Type Check):** `pnpm run typecheck` $\rightarrow$ **0 lỗi** (Exit code 0).
- [x] **QG-02 (Linter):** `pnpm run lint` $\rightarrow$ **0 warnings, 0 errors** (Clean).
- [x] **QG-03 (Production Build):** `pnpm run build` $\rightarrow$ **25/25 routes compiled & optimized** (Exit code 0).
- [x] **QG-04 (Automated Tests):** 51/51 tests pass (Exit code 0).
- [x] **QG-05 (Data Safety):** Database chính giữ nguyên 156 draft, không tự ý xuất bản.

---

## 7. KẾT LUẬN & ĐỀ XUẤT

Chặng 5 đã hoàn thành xuất sắc toàn bộ các yêu cầu chức năng, bảo mật và chất lượng theo Kế hoạch V1.1. Hệ thống quản trị SCR-07 đã sẵn sàng phục vụ công tác biên tập học liệu thực tế.

Kính trình Người Phê Duyệt xem xét và chính thức phê duyệt **GATE CHECK REPORT 5** để dự án chuẩn bị bước vào **CHẶNG 6 — HOÀN THIỆN, TỐI ƯU HÓA & NGHIỆM THU TỔNG THỂ (FINAL POLISHING & AUDIT)**.
