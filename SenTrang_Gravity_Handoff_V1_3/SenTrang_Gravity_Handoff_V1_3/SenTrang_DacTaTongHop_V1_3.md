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


---

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


---

# SEN TRẮNG — REST API Contract V1.3

**Base URL:** `/api/v1`.  **Content-Type:** `application/json; charset=utf-8`.  Tất cả nội dung ví dụ là hợp đồng thiết kế, không phải server đang hoạt động.

## 1. Response conventions

**Success**: `{ "success": true, "data": ..., "meta": {"requestId": "..."} }`. Danh sách phân trang bổ sung `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`.

**Failure**: `{ "success": false, "error": {"code":"LESSON_NOT_FOUND", "message":"Không tìm thấy bài học."}, "meta":{"requestId":"..."} }`.

Status: 200 read/update, 201 create, 204 delete/no body, 400 invalid request, 401 unauthenticated, 403 forbidden, 404 missing/unpublished, 409 version conflict, 413 file too large, 415 bad MIME, 429 rate limited, 500 server error. Bảo vệ rò rỉ nội dung chưa public qua error payload.

## 2. API công khai (GET; không yêu cầu tài khoản)

| Route | Query params | Response `data` |
|---|---|---|
| `/branches` | — | `[{id,name,slug,description}]` |
| `/branches/:slug` | — | `{id,name,description,levelsCount}` |
| `/levels` | `branch` optional | `[{id,branchId,name,slug,sortOrder}]` |
| `/levels/:id/overview` | — | `{level,source,categories:[{id,name,lessonCount}],lessonCount}` |
| `/categories` | — | `[{id,name,slug}]` |
| `/lessons` | `branch,level,category,q,page,limit` | paginated lesson summaries |
| `/lessons/:slug` | — | published lesson with `content`, `toc`, `source`, `previous`, `next` |
| `/search` | `q,level,category,page,limit` | ranked, paginated public lesson hits |
| `/sources` | — | publishable metadata only; **no** `original_filename`, file path or PDF URL |

Filter values are **Master Data IDs**: `nganh-dong`, `mo-mat|canh-mem|chan-cung|tung-bay`, `phat-phap|hoat-dong-thanh-nien|van-nghe`. Không dùng `hoat-dong`.

**GET `/lessons`**: default `page=1, limit=20`, max `limit=100`, sort `sequence ASC` within level/category. For category listing require `level` and `category` or handle server-defined global ordering consistently. `q` trims whitespace, max 200 chars.

**GET `/search`**: require nonempty `q` after trim, else `400 INVALID_QUERY`; accent-insensitive matching, title before body; published/ready only. Search does not return raw page text, drafts, admin annotations.

**GET `/lessons/:slug`**: if not both PUBLISHED and READY, respond 404. TOC from headings in `content_json`; previous/next filtered within same `level_id + category_id`, ordered by sequence among published lessons.

Example of published lesson response (schematic):

```json
{
 "success":true,
 "data":{
  "id":"D-MM-A-03", "title":"Ý nghĩa huy hiệu Hoa Sen GĐPT.",
  "slug":"d-mm-a-03-y-nghia-huy-hieu-hoa-sen-gdpt",
  "level":{"id":"mo-mat","name":"Mở Mắt"},
  "category":{"id":"phat-phap","name":"Phật pháp – Tinh thần – Lịch sử"},
  "content":{"version":1,"blocks":[]},
  "toc":[],
  "source":{"title":"Tài liệu tu học ngành Đồng – Mở Mắt","publicationYear":2016},
  "previous":null,"next":null
 },
 "meta":{"requestId":"req-example"}
}
```

## 3. Auth và admin API

Admin session dùng thư viện auth phù hợp; không bắt buộc tự viết login endpoint. Mọi route `/admin/*` dưới đây cần server-side auth + role admin, kiểm tra CSRF với mutation dùng cookie session, rate limit.

| Method | Route | Body/tác dụng |
|---|---|---|
| GET | `/admin/dashboard` | counts theo trạng thái |
| GET | `/admin/lessons` | lọc status/level/category/q; paginated kể cả draft |
| GET | `/admin/lessons/:id` | full edited + raw (chỉ admin) + current `version` |
| POST | `/admin/lessons` | title, levelId, categoryId, sourceId, sequence, content draft |
| PATCH | `/admin/lessons/:id` | `{title?,content?,summary?,version}`; optimistic locking |
| POST | `/admin/lessons/:id/publish` | `{version}`; kiểm tra ready & media |
| POST | `/admin/lessons/:id/hide` | `{version}`; hides public result |
| GET | `/admin/lessons/:id/revisions` | lịch sử phiên bản |
| POST | `/admin/lessons/:id/restore` | `{revisionId,version}`; restore creates new revision |
| POST | `/admin/media` | multipart upload image only; returns image ID |
| DELETE | `/admin/media/:id` | từ chối nếu ảnh đang được dùng |
| GET | `/admin/sources` | full internal source metadata (không file public) |
| PATCH | `/admin/settings` | validated known configuration fields |

### PATCH example

```json
{
 "version": 3,
 "title": "Tên bài học đã kiểm tra",
 "content": {"version": 1, "blocks": [{"id":"h1","type":"heading","level":2,"text":"I. Mục đích"}]}
}
```

On successful save: increment server `version` atomically and create revision/audit log. On mismatch: `409 VERSION_CONFLICT`, include safe currentVersion, do not overwrite.

### Publish conditions

- Non-empty valid `content_json` that has actual reading text or supported media; no orphaned image IDs.
- `content_status=ready` (admin explicitly marks ready after cleaning text); `publish_status=published` after successful transaction.
- Appropriate displayable source metadata; rights/publication check remains an operational owner decision, not a purported automated authenticity validation.
- Revalidate site caches/search indexes after mutation.

## 4. Validation, security, caching

- Validate body/query via schema (Zod or equivalent), sanitize/escape editor content, reject arbitrary embedded HTML/scripts.
- Media MIME allowlisted JPEG, PNG, WebP, SVG disallowed by default; size policy e.g. 5MB and pixel limits; protect private storage keys.
- Cache only public read endpoints; do not cache admin responses publicly.
- Avoid sensitive info in errors, logs, response metadata. Use URL-safe slug handling and SQL parameterization/ORM.


---

# SEN TRẮNG — UI Implementation Blueprint V1.3

## 1. Design direction AC

**A + C:** hiện đại, tối giản, giao diện thư viện học tập. Ưu tiên trải nghiệm Huynh trưởng tìm bài nhanh và đọc bài thoải mái. Giữ cảm hứng hoa sen/áo Lam tinh tế, **không** dùng hình/logo chính thức chưa được cung cấp làm asset giả.

### Design tokens

| Token | Giá trị |
|---|---|
| primary | `#176B4A` |
| secondary | `#345E88` |
| background | `#F8F7F2` |
| surface | `#FFFFFF` |
| accent | `#D4AD69` |
| ink | `#24352E` |
| font family | Be Vietnam Pro, system sans fallback |
| max container | 1200 px |
| max reader | 740 px |
| header desktop/mobile | 72/60 px |
| spacing | 4, 8, 12, 16, 24, 32, 48 px |
| card radius/button radius | 16/12 px |
| hit target | >=44×44 px |
| desktop / tablet / mobile | >=1024 / 768-1023 / <768 px |
| QA viewports | 1440 / 834 / 390 px |

Typography: H1 36/27 px desktop/mobile; H2 28/23; H3 21/19; app body 16/15; lesson body 18/17 with line-height ~1.75; caption 13/12. Text contrast must pass accessible checks; tokens are base palette, not permission to use every color on every background.

### Shared components

`GlobalHeader`, `MobileNav`, `Footer`, `SearchBar`, `Breadcrumb`, `LevelCard`, `CategoryCard`, `LessonCard`, `FilterPanel`, `ReaderTOC`, `ReaderToolbar`, `SourceInfo`, `Pagination`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `AdminSidebar`, `LessonEditor`, `MediaPicker`, `ConfirmDialog`, `Toast`.

Reusable states: default, hover, focus-visible, disabled when relevant, loading, empty and error. 150–250 ms subtle animations, honor reduced motion.

## 2. UI-01 — Trang chủ `/`

**Desktop 1440**: max1200 container; 72px header, logo on left, navigation right; hero above fold with heading, short description and centered SearchBar max700 px; four LevelCard row; explanatory section and footer. **Mobile 390**: 60px header; logo/menu; hero short, search full width; two-column level cards; vertical footer.

Interactions: Enter / Search submit `q` to `/tim-kiem?q=...`; clicking any level navigates to level. Empty search displays suggestion UI or asks for term, not a blank result query.

## 3. UI-02 — Ngành Đồng `/thu-vien/nganh-dong`

Intro + four LevelCard in Master Data order (32/38/41/45 catalog entries, not necessarily published count). Desktop 4 columns, mobile 2 with one-column fallback. Card entire click target. Do not fake learning progress.

## 4. UI-03 — Bậc `/thu-vien/nganh-dong/[level]`

Level selector + title + four cards: `Tổng quan`, `Phật pháp`, `Hoạt động Thanh niên`, `Văn nghệ`. `Tổng quan` aggregates from the 3 real categories; no 4th DB category. Desktop 4 columns, tablet/mobile 2. Switching level synchronously updates title and associated content; route is canonical source of state.

## 5. UI-04 — Danh sách bài `/thu-vien/nganh-dong/[level]/[category]`

Desktop: 240px sidebar (other categories) + main list; heading/category count, local filter by title, lesson cards sorted `sequence`, optional pagination. Mobile: filters collapsed, list in one column, tap target full card. Empty state supports clearing filter. Public only published lessons; catalog counts must specify whether counting all vs published.

## 6. UI-05 — Chi tiết bài `/bai-hoc/[slug]`

Desktop: sticky TOC left, reading width ≤740; breadcrumb, H1 title, source metadata, article content, previous/next, copy-link. Mobile: one reading column, TOC in accessible drawer, toolbar near heading. Reader font size 15–23 px, default desktop18/mobile17; white/paper modes (`#FFFFFF`/`#F5F0E4`). Persist reader preferences in local browser (not account). Reader TOC generated from article headings; sticky header must not obscure anchored heading. Responsive images preserve aspect ratio and have alt. **No public PDF view or download.**

## 7. UI-06 — Tìm kiếm `/tim-kiem?q=...`

Desktop: left filter sidebar and ranked search results; mobile: filter drawer. Search accent-insensitive, sort title-first, label each result by level/category. Query and filter state reflected in URL for share/back navigation. No-result suggestion + clear filters. If no verified summary, show title and category without fabricated descriptions.

## 8. UI-07 — Admin `/admin`

Desktop ~240px nav sidebar and data table; mobile drawer and card rows. Dashboard counts; lessons (create/edit/draft/publish/hide), media, sources, site settings. Lesson form: title, level, category, sequence, source, slug, content-block editor, images, preview, save, publish. Rich text allowed: headings, paragraphs, lists, emphasis and images; reject arbitrary HTML/style overrides. Unsaved changes guard, autosave optional and not required. API response confirmation before toast success; `409` conflict dialogue.

## 9. Routes and navigation

| Screen | Route |
|---|---|
| UI-01 Home | `/` |
| UI-02 Branch | `/thu-vien/nganh-dong` |
| UI-03 Level | `/thu-vien/nganh-dong/[level]` |
| UI-04 Category lesson listing | `/thu-vien/nganh-dong/[level]/[category]` |
| UI-05 Lesson reader | `/bai-hoc/[slug]` |
| UI-06 Search | `/tim-kiem` |
| UI-07 Admin | `/admin` |

Secondary informational page `/gioi-thieu` may reuse public layout. Auth library may define additional internal auth routes.

## 10. A11y / technical fidelity

Tab and screenreader semantics, correct input labels, aria-expanded for drawers, escape to close, logical headings, visible focus, alt images, no color-only signal; keyboard navigation for all actions. Test layout 390, 834 and 1440, long Vietnamese headings, empty and error states. Use server render for public lesson SEO, optimize images and keep dynamic editor admin-only.

## 11. UI handoff boundaries

Wireframes are descriptive blueprints, **not** approved pixel-perfect Figma screens or final logo artwork. Gravity should implement this design system consistently and should not fabricate branding assets, copyrighted images or official GĐPT insignia. Ask for approved logo/graphics if needed; until then use a neutral text + simple abstract mark.


---

# SEN TRẮNG — Acceptance Test Plan V1.3

## A. Import và toàn vẹn dữ liệu

- **DATA-01** Import counts = 1 branch, 4 levels, 3 categories, 4 sources, 156 lessons, 156 raw groups.
- **DATA-02** 156 lesson IDs unique; correct exact category ID `hoat-dong-thanh-nien`.
- **DATA-03** Correct distribution by level 32/38/41/45, by categories 54/75/27.
- **DATA-04** Every lesson FK resolves to a valid source, level and category and matching branch/level.
- **DATA-05** Run importer twice; zero duplicates; no reset of manually edited article content.
- **DATA-06** All imported lessons remain DRAFT and not publicly accessible by ID/slug.
- **DATA-07** Import/preview acknowledges raw may contain adjacent article text and missing figures.

## B. User journeys

- **UI-01** Home→Mở Mắt→Phật pháp→list, expected correct level/category.
- **UI-02** Switch to Chân Cứng, content/category counts update, URL consistent.
- **UI-03** Search `hoa sen`, see relevant published results; search `hoa sen` without accent also works against accented titles.
- **UI-04** Filter to level and category; clear filters; empty state.
- **UI-05** Reader displays structured headings/paragraphs/image in order; TOC anchor works.
- **UI-06** Font increase to 23px does not overflow 390px screen; paper mode persists locally.
- **UI-07** Previous/next is correct within same level/category among published lessons.
- **UI-08** Copy-link yields canonical lesson URL. Nonexistent slug yields 404.
- **UI-09** Mobile menu opens and closes via Escape; keyboard focus visible.

## C. Admin and security

- **SEC-01** Public cannot fetch raw contents, drafts, images from private storage or admin API.
- **SEC-02** Unauthenticated mutation returns 401, insufficient role 403.
- **SEC-03** Upload disallowed MIME/oversize → 413/415 or well-defined validation error.
- **SEC-04** Rich text containing scripts/unsafe HTML rejected or safely normalized.
- **SEC-05** Draft→ready→published makes article public only after valid content.
- **SEC-06** Publish without reviewed content/images fails validation.
- **SEC-07** Two stale edit sessions: second save gets HTTP 409; first edit preserved.
- **SEC-08** Hide published article removes public/search access after cache refresh.
- **SEC-09** No links to PDF document download/view in public UI or public API.

## D. Nonfunctional quality

- **NFR-01** Viewports 390, 834, 1440: no unintended horizontal scroll.
- **NFR-02** Text and controls meet contrast/accessibility checks; image alt and labels present.
- **NFR-03** Site map excludes draft/hidden and admin.
- **NFR-04** SEO HTML includes meaningful title, canonical, metadata where available.
- **NFR-05** Observe p75 CWV targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 after deploy with field data; lab test beforehand and report any gaps.
- **NFR-06** Verify backup/restore approach and logging excludes secrets and lesson draft data leaks.

## E. Definition of done

No release until P0 functional tests, DATA-01..07, SEC-01..09 and mobile usability pass. Public launch additionally depends on right-to-republish confirmation by owner for internal-print materials. This test plan is a **specification**, not an assertion that implementation tests already ran.


---

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
