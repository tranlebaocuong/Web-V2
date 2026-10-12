# SEN TRẮNG — Software Requirements Specification (SRS) V1.3

**Trạng thái:** Bản đặc tả bàn giao kỹ thuật — CHƯA LẬP TRÌNH.  **Ngày chốt:** 10/10/2026.  **Dữ liệu nền:** Master Data ngành Đồng V1.2 (đính kèm nguyên bản).

## 1. Mục tiêu, người sử dụng và nguyên tắc

Sen Trắng là thư viện tu học dành cho Huynh trưởng Gia Đình Phật Tử Việt Nam, cho phép tìm và đọc từng bài trực tiếp trên website, giữ trình tự nội dung giáo trình. Khách không cần đăng nhập. Admin có thể nhập, biên tập, xem trước và xuất bản bài.

- Nguồn đầu vào: 4 bộ tài liệu **Mở Mắt, Cánh Mềm, Chân Cứng, Tung Bay**, do chủ dự án cung cấp; **156 mục chương trình** trong dữ liệu nền.
- Cấu trúc: **Ngành Đồng → Bậc → lĩnh vực → bài học**. Một bậc có 4 khu vực trên UI: **Tổng quan** (khu vực UI tổng hợp), **Phật pháp – Tinh thần – Lịch sử**, **Hoạt động Thanh niên và Xã hội**, **Văn nghệ** (3 lĩnh vực thật).
- Giữ mỗi bài làm một đơn vị, **không chia số tiết thành đối tượng dữ liệu**; các tiêu đề nhỏ có thể tạo mục lục đọc bài.
- PDF chỉ là nguồn nội bộ phục vụ biên tập: **KHÔNG** tạo trình xem PDF, không upload PDF vào kho public, không có nút tải PDF.
- Không triển khai ngân hàng đề thi, AI, tài khoản người đọc, bình luận, điểm số, học trực tuyến, hệ thống tiến độ trong V1.
- Giữ thông tin nguồn giáo trình ở trang bài; không tự gán nội dung bổ trợ là nội dung gốc.

## 2. Personas và các luồng sử dụng

**Người đọc (Huynh trưởng/đoàn sinh):** Vào trang chủ → gõ từ khóa → xem kết quả → mở bài → đọc; hoặc chọn Thư viện → Ngành Đồng → bậc → lĩnh vực → bài. Từ trang bài có breadcrumb, mục lục theo đề mục, chỉnh cỡ chữ, chuyển nền đọc, bài trước/sau, chia sẻ liên kết.

**Quản trị viên:** Đăng nhập → danh sách nội dung → mở bài đang `draft` → biên tập văn bản và hình → xem trước → xuất bản → kiểm tra trang công khai; có quyền ẩn và phục hồi bản chỉnh sửa trước.

## 3. Các yêu cầu chức năng

| Mã | Mức | Yêu cầu và kết quả quan sát được |
|---|---|---|
| FR-01 | P0 | Trang chủ gồm nhận diện, SearchBar và truy cập bốn bậc |
| FR-02 | P0 | Trang ngành Đồng hiển thị bậc theo thứ tự Master Data |
| FR-03 | P0 | Trang bậc có Tổng quan + 3 lĩnh vực; Tổng quan không thêm bảng category |
| FR-04 | P0 | Trang lĩnh vực liệt kê bài theo `sequence`; lọc tên bài trong phạm vi hiện tại |
| FR-05 | P0 | Trang đọc hiển thị `content_json` đã biên tập, đề mục và hình đúng vị trí |
| FR-06 | P0 | Tra cứu tiếng Việt có dấu/không dấu; lọc theo bậc/lĩnh vực; khớp tên ưu tiên |
| FR-07 | P0 | Trang bài có breadcrumb, tài liệu nguồn, bài trước/sau, sao chép liên kết |
| FR-08 | P0 | Admin xác thực, xem danh sách, tạo/sửa, nháp/xuất bản/ẩn, tải hình |
| FR-09 | P0 | Import Master Data idempotent, bảo toàn mã và các trạng thái draft |
| FR-10 | P0 | Không có API public cho nội dung raw/draft và PDF; bảo vệ admin ở server |
| FR-11 | P1 | Reader: mục lục, tăng/giảm cỡ chữ, nền sáng/nền giấy |
| FR-12 | P1 | History chỉnh sửa, xử lý phiên bản tránh ghi đè khi lưu đồng thời |
| FR-13 | P1 | SEO title/description/canonical, sitemap trang published, trạng thái 404 |
| FR-14 | P1 | Responsive desktop/tablet/mobile và trạng thái loading/empty/error |

P0: bắt buộc để phát hành bản đầu; P1: nên hoàn thiện trong V1. Không xây dựng các tính năng ngoài phạm vi nếu chưa được chủ dự án chốt.

## 4. Quy tắc nghiệp vụ (BR)

1. Mã `lessons.id` từ Master Data bất biến; không tự thay tên hoặc số thứ tự bài khi nhập.
2. Một bài gắn đúng một bậc, một lĩnh vực chính, một nguồn. Bậc của bài phải phù hợp với ngành và nguồn.
3. Thứ tự mặc định theo `sequence` trong đúng bậc/lĩnh vực; trường hợp trùng sequence phải được báo khi import.
4. Chỉ `publish_status=published` và `content_status=ready` mới được hiển thị công khai.
5. `lesson_raw_contents` là tài liệu biên tập nội bộ, tuyệt đối không render thành nội dung public trực tiếp.
6. Bài thiếu nội dung biên tập hợp lệ hoặc tham chiếu hình không tồn tại không được xuất bản.
7. Khách không có quyền ghi, xem bản nháp hoặc truy cập URL media riêng tư.
8. Nội dung bài giữ nguyên thứ tự, ý nghĩa và hình minh họa từ giáo trình; không bắt buộc phân tiết.
9. Xóa bài và media phải kiểm tra tham chiếu; ưu tiên xóa mềm đối với bài.
10. Nguồn PDF và trang tham chiếu chỉ phục vụ nội bộ; thông tin sách, năm, đơn vị được phép hiển thị khi phù hợp.
11. Chủ dự án xác nhận dùng giáo trình làm nguồn chuẩn. **Quyền công bố lại toàn văn** vẫn cần xác định riêng, vì tài liệu ghi “Phát hành nội bộ”; không mặc nhiên coi việc bỏ PDF là có quyền công bố nguyên văn.

## 5. Phạm vi nội dung và giới hạn chất lượng

Master Data cung cấp 156 mục học liệu và nhóm raw-text theo các trang PDF, **không phải 156 bài HTML đã hiệu đính**. Một số trang có phần tiếp nối của bài kề bên, lỗi ngắt dòng hoặc thiếu ảnh/ký âm. Import dữ liệu raw chỉ tạo bản nháp. Admin phải làm sạch và chèn ảnh trước khi xuất bản.

## 6. Non-functional requirements

- Mobile-first; các điểm kiểm thử 390, 834, 1440 px; không tràn ngang và vùng chạm quan trọng tối thiểu 44×44 px.
- WCAG 2.2 AA mục tiêu: bàn phím, focus, độ tương phản, heading logic, alt ảnh, labels và reduced motion.
- Mục tiêu Core Web Vitals ở p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 khi đo trên môi trường thực phù hợp.
- Security: session cookie HttpOnly/Secure/SameSite, kiểm tra quyền trên server, rate limit, validate upload, XSS-safe editor, bảo vệ CSRF với mutation cookie-auth.
- Dữ liệu: UTF-8, backup DB/media; import có log lỗi, rollback/transaction phù hợp, không ghi đè nội dung biên tập.

## 7. Điều kiện hoàn thành

Chạy pass bộ acceptance tests trong file `05_TestPlan_Acceptance.md`; tất cả bài công khai phải có nội dung đã biên tập và rõ thông tin nguồn. Đặc tả này không yêu cầu tự động public toàn bộ 156 mục trong lần triển khai đầu.
