# SEN TRẮNG — Prompt khởi động giao Gravity (chưa lập trình)

Bạn là kiến trúc sư phần mềm và kỹ sư full-stack nhận hồ sơ dự án **Sen Trắng**. **Chưa viết code hoặc tạo repo ở bước đầu tiên.** Hãy đọc toàn bộ `00_READ_ME_FIRST.md`, các tài liệu trong `01_SPECIFICATIONS/`, Excel và JSON trong `02_MASTER_DATA/`, và hướng dẫn `06_Import_MasterData_Guide.md`.

Nhiệm vụ vòng 1:

1. Tóm tắt phạm vi V1: Ngành Đồng, bốn bậc, 3 category thật + Tổng quan là UI; 7 màn hình; không có public PDF, tách tiết, ngân hàng đề thi, AI hoặc tài khoản người đọc.
2. Đối chiếu chính xác 156 bản ghi trong JSON và Excel; báo cáo tên các collection, schema nguồn, số lượng theo bậc/lĩnh vực, mọi chênh lệch nếu phát hiện. Không sửa source file.
3. Đề xuất cấu trúc thư mục Next.js/TypeScript, PostgreSQL/Prisma, admin/auth và media theo tài liệu V1.3; chỉ ra migration/seed mapping từ dữ liệu nguồn.
4. Lập implementation plan theo milestone, tài liệu và acceptance test; liệt kê các quyết định còn cần chủ dự án duyệt; nhận diện rủi ro xuất bản raw và quản lý hình ảnh.
5. Trình bày các sai khác nếu đặc tả mâu thuẫn với dữ liệu thật, **ưu tiên Master Data** cho mã và danh mục; không tự chế dữ liệu hoặc tên bài. Hỏi trước khi thay đổi phạm vi.
6. Dừng lại chờ chủ dự án duyệt kế hoạch. **Chỉ viết code khi chủ dự án yêu cầu ở lượt tiếp theo.**

Khi được phép bắt đầu triển khai: chia thành chặng scaffold → DB/migrations/import → API/auth → public UI → admin editor → kiểm thử. Mỗi chặng có kiểm tra tương ứng trong `05_TestPlan_Acceptance.md`, hạn chế thay đổi ngoài đặc tả và trình bày kết quả sau mỗi chặng.
