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
