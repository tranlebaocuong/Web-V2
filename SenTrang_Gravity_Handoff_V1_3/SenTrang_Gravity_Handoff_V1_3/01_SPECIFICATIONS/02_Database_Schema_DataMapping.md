# SEN TRẮNG — Database Schema & Data Mapping V1.3

## 1. Kiến trúc và nguồn sự thật

Chọn PostgreSQL + Prisma ORM, ứng dụng monolith chia module. **Tên field trong JSON V1.2 là dữ liệu đầu vào chính thức**; tên bảng DB có thể theo tài liệu này, nhưng import mapping phải tường minh, không sửa Excel/JSON đầu vào. Bảng dữ liệu nguồn thực tế có các collection: `branches`, `levels`, `categories`, `sources`, `lessons`, `lesson_raw_contents`.

### Mã phân loại đúng theo Master Data (quan trọng)

| Loại | ID thực trong JSON | Tên |
|---|---|---|
| Branch | `nganh-dong` | Ngành Đồng |
| Level | `mo-mat` | Mở Mắt |
| Level | `canh-mem` | Cánh Mềm |
| Level | `chan-cung` | Chân Cứng |
| Level | `tung-bay` | Tung Bay |
| Category | `phat-phap` | Phật pháp – Tinh thần – Lịch sử |
| Category | `hoat-dong-thanh-nien` | Hoạt động Thanh niên và Xã hội |
| Category | `van-nghe` | Văn nghệ |

**Không sử dụng `hoat-dong`** làm ID category trong DB, seed hoặc API. `tong-quan` chỉ là route/trạng thái UI, không phải category.

## 2. Kiểu chung, quan hệ và ràng buộc

### `branches`
`id VARCHAR(50) PK`, `name VARCHAR(150) NOT NULL`, `slug VARCHAR(150) UNIQUE NOT NULL`, `description TEXT NULL`, `sort_order INT NOT NULL DEFAULT 0`, `is_active BOOL NOT NULL DEFAULT true`. Với input thiếu slug, có thể dùng `id` nếu phù hợp; không sửa source JSON.

### `study_levels`
`id VARCHAR(50) PK`, `branch_id VARCHAR(50) NOT NULL REFERENCES branches(id)`, `name VARCHAR(150) NOT NULL`, `slug VARCHAR(150) NOT NULL`, `sort_order INT NOT NULL DEFAULT 0`, `description TEXT NULL`, `is_active BOOL NOT NULL DEFAULT true`. UNIQUE `(branch_id,slug)`; input `levels` map sang bảng này.

### `categories`
`id VARCHAR(80) PK`, `name VARCHAR(200) NOT NULL`, `slug VARCHAR(150) UNIQUE NOT NULL`, `sort_order INT NOT NULL`. ID input chính thức như bảng trên.

### `sources`
`id VARCHAR(80) PK`, `title VARCHAR(300) NOT NULL`, `branch_id FK`, `level_id FK`, `publication_year SMALLINT NULL`, `original_filename VARCHAR(255) NULL`, `page_count INT NULL`, `sha256 CHAR(64) NULL`, `publication_note TEXT NULL`, `distribution_rights TEXT NULL`, `public_pdf BOOL NOT NULL DEFAULT false`, `publisher VARCHAR(300) NULL`.
Mapping JSON `year` → `publication_year`. Không suy ra `publisher` nếu nguồn không có. Không tạo public URL cho PDF.

### `lessons`
`id VARCHAR(80) PK`, `branch_id FK`, `level_id FK`, `category_id FK`, `source_id FK`, `title VARCHAR(400) NOT NULL`, `slug VARCHAR(450) UNIQUE NOT NULL`, `sequence INT NOT NULL`, `summary TEXT NULL`, `source_pdf_start_page INT NULL`, `source_pdf_end_page INT NULL`, `content_status TEXT NOT NULL`, `publish_status TEXT NOT NULL`, `version INT NOT NULL DEFAULT 1`, `published_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`, `deleted_at TIMESTAMPTZ NULL`.
`content_status` import `raw_extracted`; workflow `raw_extracted|editing|ready`. `publish_status`: `draft|published|hidden`. Nếu áp dụng enum DB, cần enum/mapper phù hợp; **không nhập raw_extracted thành ready**. CHECK trang dương, `end >= start` nếu có cả hai. UNIQUE `(level_id, category_id, sequence)` chỉ áp dụng sau khi kiểm tra dữ liệu nguồn có thỏa; nếu có xung đột, báo lỗi thay vì âm thầm sửa sequence. Kiểm tra `branch_id`/`level_id`/`source_id` nhất quán tại import/server.

### `lesson_raw_contents`
`id UUID PK`, `lesson_id VARCHAR(80) UNIQUE FK`, `content_format VARCHAR(80)`, `editorial_status VARCHAR(80)`, `pages_json JSONB NOT NULL`, `created_at TIMESTAMPTZ NOT NULL`. Mapping `pages` input → `pages_json`. Raw có thể chứa `pdf_page`, `raw_text`; nội bộ duy nhất.

### `lesson_contents`
`id UUID PK`, `lesson_id VARCHAR(80) UNIQUE FK`, `content_json JSONB NOT NULL`, `schema_version INT NOT NULL DEFAULT 1`, `edited_by UUID NULL FK users`, `updated_at TIMESTAMPTZ`. Đây là **nội dung duy nhất render public**.

### `lesson_images`
`id UUID PK`, `lesson_id VARCHAR(80) FK`, `storage_key TEXT UNIQUE NOT NULL`, `alt_text TEXT NULL`, `caption TEXT NULL`, `sort_order INT DEFAULT 0`, `created_at TIMESTAMPTZ`. Không upload nguồn PDF public. Kiểm tra file thực tồn tại trước khi publish.

### `users`
`id UUID PK`, `email VARCHAR(254) UNIQUE NOT NULL`, `password_hash TEXT NULL` nếu dùng credential login, `role TEXT NOT NULL DEFAULT 'admin'`, `is_active BOOL NOT NULL DEFAULT true`, `created_at TIMESTAMPTZ`. Không chứa mật khẩu plaintext trong seed. Nếu dùng provider/session adapter, mở rộng theo schema chuẩn thư viện auth.

### `lesson_revisions`
`id UUID PK`, `lesson_id FK`, `revision_number INT NOT NULL`, `snapshot_json JSONB NOT NULL`, `edited_by UUID FK users`, `created_at TIMESTAMPTZ`, UNIQUE `(lesson_id,revision_number)`.

### `audit_logs`
`id UUID PK`, `actor_id UUID NULL FK users`, `action VARCHAR(100)`, `entity_type VARCHAR(100)`, `entity_id TEXT`, `metadata JSONB`, `created_at TIMESTAMPTZ`.

### `site_settings`
`key VARCHAR(100) PK`, `value_json JSONB NOT NULL`, `updated_at TIMESTAMPTZ`.

## 3. Mẫu `content_json` (đây là schema đầu ra thiết kế, không phải nội dung nguồn đã hiệu đính)

```json
{
  "version": 1,
  "blocks": [
    {"id":"b1","type":"heading","level":2,"text":"I. Mục đích"},
    {"id":"b2","type":"paragraph","text":"[Văn bản được biên tập từ giáo trình]"},
    {"id":"b3","type":"image","imageId":"[UUID of lesson_images]","caption":""},
    {"id":"b4","type":"list","ordered":true,"items":["[Mục 1]","[Mục 2]"]}
  ]
}
```

Chỉ cho phép loại block được khai báo (`heading`, `paragraph`, `list`, `image`), validate bằng schema phía server; không render HTML tùy ý trong `text`. Tạo TOC từ heading. Không lưu bài thành HTML tự do.

## 4. Indexes tối thiểu

- `lessons(slug)` unique; `lessons(level_id,category_id,sequence)`; `lessons(publish_status,published_at)`.
- `lesson_raw_contents(lesson_id)` unique; `lesson_contents(lesson_id)` unique; `lesson_images(lesson_id)`.
- `audit_logs(actor_id,created_at)`; `lesson_revisions(lesson_id,revision_number)` unique.
- Tìm không dấu: nghiên cứu triển khai `unaccent` + `pg_trgm` hoặc indexed normalized search text; phải benchmark tiếng Việt thực tế. Full-text Postgres đơn thuần chưa bảo đảm khớp tiếng Việt có dấu/không dấu.

## 5. Import Master Data — quy tắc dữ liệu

1. Đọc nguyên tệp `02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.json`, validate số lượng, FK, ID và trạng thái.
2. Thứ tự: `branches` → `levels` → `categories` → `sources` → `lessons` → `lesson_raw_contents`.
3. Mapping: `levels` → `study_levels`; `sort_order` giữ nguyên; `sources.year` → `sources.publication_year`; `lesson_raw_contents.pages` → `pages_json`.
4. `lessons.public=false`, `publish_status=draft`, `content_status=raw_extracted` giữ nguyên ý nghĩa; không auto publish. `section_layout`, `quality_note` (nếu không có cột riêng) lưu trong `import_metadata JSONB` hoặc bảng import log, không vứt mất dấu vết chất lượng.
5. Import idempotent bằng upsert theo PK nhưng **không cập nhật lesson_contents đã biên tập**, không hạ trạng thái published khi chạy lại import. Cân nhắc chế độ `initial_seed` và `sync_metadata` tách biệt.
6. Không đưa PDF gốc vào `public/` hoặc bucket public; trong handoff chỉ cung cấp file Master Data, không bao gồm PDF nguồn.
7. Xuất báo cáo tổng số bản ghi và các FK lỗi, duplicate, danh mục không tìm thấy, cảnh báo trang PDF.

## 6. Số liệu chuẩn để kiểm thử import

- `branches=1`, `levels=4`, `categories=3`, `sources=4`, `lessons=156`, `lesson_raw_contents=156`.
- Mở Mắt 32 (12/14/6); Cánh Mềm 38 (12/19/7); Chân Cứng 41 (14/20/7); Tung Bay 45 (16/22/7), theo thứ tự phat-phap / hoat-dong-thanh-nien / van-nghe.
- Tổng category 54/75/27.
