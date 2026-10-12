# SEN TRẮNG — MASTER DATA NGÀNH ĐỒNG V1.2

Nguồn: 4 giáo trình ngành Đồng người dùng cung cấp (Mở Mắt, Cánh Mềm, Chân Cứng, Tung Bay).

## Cấu trúc dữ liệu
- branches: ngành
- levels: bậc học
- categories: 3 lĩnh vực. Tổng quan chương trình là tab UI, KHÔNG là lĩnh vực thứ tư.
- sources: thông tin xuất xứ, file PDF nội bộ và SHA-256 (không công bố PDF).
- lessons: 156 mục chương trình, không tách tiết, liên kết nguồn/trang.
- lesson_raw_contents: phần văn bản lấy từ các trang PDF theo khoảng trang; chỉ dùng làm nguyên liệu biên tập.

## Lưu ý cực kỳ quan trọng
1. Nội dung văn bản trích xuất thô có thể chứa tiêu đề/chân trang, lỗi dấu, ngắt dòng và cả phần của bài kề bên khi cùng trang. Không được hiển thị nguyên trạng như bài đã biên tập.
2. Các khoảng trang đã kế thừa dữ liệu V1.1, nhiều ranh giới xác định theo tiêu đề kế tiếp; nên được rà nội dung trước khi xuất bản.
3. Chưa trích xuất và gắn file ảnh minh họa thành các tài nguyên riêng, trường image_asset_path để trống.
4. Không yêu cầu tách tiết; không bắt buộc tính năng hiển thị PDF. PDF gốc chỉ dùng đối chiếu nội bộ.
5. Nguồn ghi phát hành nội bộ; công bố lại nội dung trên website là vấn đề quyền phổ biến riêng cần được xác nhận.
6. publish_status = draft, public = false cho mọi bài.

## Thứ tự nhập
branches -> levels -> categories -> sources -> lessons -> lesson_raw_contents.

## Quy tắc UI
Ngành Đồng -> Bậc -> {Tổng quan, Phật pháp, Hoạt động Thanh niên, Văn nghệ} -> Danh sách bài -> Trang bài.
