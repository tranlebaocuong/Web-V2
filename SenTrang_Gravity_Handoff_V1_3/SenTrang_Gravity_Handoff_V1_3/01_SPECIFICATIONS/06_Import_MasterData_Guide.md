# SEN TRẮNG — Hướng dẫn nhập Master Data V1.2

## 1. File cần sử dụng

- `02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.xlsx`: Excel làm bảng tham chiếu cho người kiểm tra.
- `02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.json`: **nguồn dữ liệu dùng để seed database**, gồm sáu collection quan trọng.
- `02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.csv`: chỉ mục lessons dạng CSV để kiểm tra nhanh.
- `02_MASTER_DATA/SenTrang_MasterData_README_V1_2.md`: hướng dẫn gốc kèm dữ liệu, giữ nguyên.

## 2. Không nhầm dữ liệu thô với bài công khai

`lessons` giữ metadata/chỉ mục; `lesson_raw_contents.pages` là văn bản PDF theo trang, có thể lẫn chân trang, nhiều bài và thiếu ảnh. Không được đưa raw text trực tiếp ra trang reader. Bài công khai lấy từ `lesson_contents.content_json` sau biên tập.

## 3. Trình tự seed

1. Validate JSON schema + 156 IDs/156 raw groups.
2. Seed `branches`, `study_levels` từ `levels`, `categories`, `sources`.
3. Seed `lessons` giữ nguyên `id`, `sequence`, `slug`, `source_pdf_start_page/end_page`, status.
4. Seed `lesson_raw_contents` giữ nguyên `pages` và `editorial_status`.
5. Không tạo sample published bài giả trong production. Nếu muốn demo giao diện, dùng seed demo biệt lập được dán nhãn rõ.
6. Bổ sung nội dung biên tập/ảnh qua admin; chỉ publish sau khi kiểm tra đầy đủ.

## 4. Tránh xung đột dữ liệu

- `category_id` của Hoạt động Thanh niên = `hoat-dong-thanh-nien`.
- `sources.year` input map thành `publication_year` trong DB.
- `levels` input map sang `study_levels` DB.
- `lessons.content_status` input là `raw_extracted`, KHÔNG phải `ready`.
- `public=false`, `publish_status=draft` là trạng thái seed.
- `lesson_raw_contents` có mảng `pages`, KHÔNG phải `content_json` editor.
- Không có field `number_of_sessions` hoặc `lesson_hours` bắt buộc.
- Không tự tạo `tong-quan` như lĩnh vực thứ tư.

## 5. Biên bản kiểm thử import tối thiểu

Báo cáo tổng, phân phối theo level/category, danh sách ID thiếu/đúp/FK lỗi, lần seed lặp lại, status sau seed. Không ghi đè bất kỳ bài biên tập đang tồn tại nếu rerun importer.
