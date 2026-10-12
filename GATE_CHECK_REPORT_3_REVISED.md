# BÁO CÁO KIỂM SOÁT CỔNG CHẶNG 3 — HIỆU CHỈNH
# GATE CHECK REPORT 3 (REVISED)
## DỰ ÁN SEN TRẮNG — THƯ VIỆN TU HỌC GIA ĐÌNH PHẬT TỬ VIỆT NAM

> **Người thực hiện:** Nhóm Kỹ thuật Sen Trắng  
> **Thời điểm cập nhật:** 11/10/2026 23:45 (GMT+7)  
> **Nội dung kiểm định:** Chặng 3 — Data Access Layer & REST API Contract V1.3  
> **Căn cứ kỹ thuật:** Kế hoạch V1.1, Đặc tả kỹ thuật V1.3, `03_API_Contract.md`  
> **Trạng thái:** **100% PASS (ĐÃ CẬP NHẬT ĐẦY ĐỦ THEO YÊU CẦU RÀ SOÁT)**

---

## 1. TỔNG HỢP KẾT QUẢ TRIỂN KHAI CHẶNG 3

Nhóm kỹ thuật đã hoàn thành toàn diện các yêu cầu nghiệp vụ và kỹ thuật của Chặng 3:

1. ✅ **Kết nối Cơ sở Dữ liệu Native:** Cấu hình Data Access Layer (DAL) và Prisma Client kết nối trực tiếp đến **PostgreSQL 17 Native x64** trên cổng `5434` (`sentrang`).
2. ✅ **Xây dựng Data Access Layer (DAL) chuẩn mực:** Tách biệt rõ ràng tầng truy cập dữ liệu trong thư mục `src/lib/dal/` (`branches.ts`, `levels.ts`, `categories.ts`, `sources.ts`, `lessons.ts`, `search.ts`).
3. ✅ **Triển khai đầy đủ 9 REST API Endpoints chuẩn Contract V1.3** tại tiền tố `/api/v1`:
   - `GET /api/v1/branches`: Danh sách ngành học.
   - `GET /api/v1/branches/:slug`: Chi tiết ngành học và số lượng bậc học (`levelsCount`).
   - `GET /api/v1/levels`: Danh sách bậc học (hỗ trợ lọc theo `branch`).
   - `GET /api/v1/levels/:id/overview`: Tổng quan bậc học, nguồn tài liệu và thống kê bài học theo từng lĩnh vực.
   - `GET /api/v1/categories`: Danh sách lĩnh vực tu học (Phật pháp, Hoạt động thanh niên, Văn nghệ).
   - `GET /api/v1/sources`: Thông tin nguồn giáo trình đã được vệ sinh an toàn.
   - `GET /api/v1/lessons`: Danh sách bài học phân trang, sắp xếp theo thứ tự `sequence ASC`.
   - `GET /api/v1/lessons/:slug`: Chi tiết bài học đã xuất bản, tự động sinh mục lục (TOC), điều hướng bài trước/sau (`previous`/`next`).
   - `GET /api/v1/search`: Tìm kiếm tiếng Việt thông minh có dấu/không dấu, xếp hạng ưu tiên tiêu đề trước nội dung.
4. ✅ **Bảo vệ tuyệt đối dữ liệu nội bộ (100% Draft Protection):**
   - Tất cả API công khai bắt buộc áp dụng bộ lọc: `publish_status = 'published'` VÀ `content_status = 'ready'`.
   - Toàn bộ 156 bài học trong database chính `sentrang` đang ở trạng thái `draft` được bảo vệ nghiêm ngặt: `GET /api/v1/lessons` trả về mảng rỗng `[]` (`total: 0`), `GET /api/v1/lessons/:slug` trả về `404 Not Found`.
   - Tuyệt đối không rò rỉ nội dung thô (`raw_text`), ghi chú chất lượng (`quality_note`), thông tin biên tập (`import_metadata`) hay file nội bộ (`original_filename`, `public_pdf`).
5. ✅ **Tách biệt môi trường kiểm thử (Test Fixtures Isolation):**
   - Khởi tạo database kiểm thử độc lập `sentrang_test` trên cổng `5434` để kiểm tra toàn bộ luồng bài học đã xuất bản (`published`), TOC và `previous`/`next` mà không làm thay đổi bất kỳ trạng thái nào của 156 bài học trong database chính `sentrang`.
6. ✅ **Bộ ba Kiểm định Chất lượng đạt tuyệt đối:** TypeScript Strict Typecheck (0 lỗi), ESLint (0 cảnh báo), Production Build (10/10 routes compiled thành công).

---

## 2. XÁC MINH CHUYÊN SÂU CƠ CHẾ CHỈ MỤC TÌM KIẾM POSTGRESQL

Thực hiện yêu cầu rà soát của Chủ dự án về việc giải trình nguyên nhân `Seq Scan` và chứng minh tính tương thích của chỉ mục `gin_trgm_ops`:

### 2.1. Đóng gói Migration Có Thể Tái Lập (Reproducible Migration)
Toàn bộ hàm xử lý biểu thức và các chỉ mục đã được đóng gói thành tệp migration chính thức của dự án:
[`prisma/migrations/20261011000001_add_search_trigram_indexes/migration.sql`](file:///a:/Web%20V2/prisma/migrations/20261011000001_add_search_trigram_indexes/migration.sql)

```sql
-- Function wrapper để unaccent có tính chất IMMUTABLE, cho phép lập Expression Index trong PostgreSQL
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
'SELECT public.unaccent(''public.unaccent'', $1)';

-- GIN Trigram Expression Index phục vụ tìm kiếm tiếng Việt không dấu siêu tốc bằng unaccent và pg_trgm
CREATE INDEX IF NOT EXISTS idx_lessons_title_unaccent_trgm 
ON lessons USING gin (f_unaccent(title) gin_trgm_ops);

-- B-Tree Composite Index phục vụ lọc bắt buộc theo trạng thái bài xuất bản và biên tập
CREATE INDEX IF NOT EXISTS idx_lessons_publish_ready 
ON lessons (publish_status, content_status);
```
* **Xác nhận tính tái lập:** Đã thực thi qua lệnh `pnpm exec prisma migrate deploy` trên cả hai cơ sở dữ liệu `sentrang` và `sentrang_test`. Lệnh `prisma migrate status` xác nhận: `Database schema is up to date!` (2 migrations applied).

---

### 2.2. Tại sao PostgreSQL Cost-Based Optimizer (CBO) Chọn `Seq Scan` trên 156 Bản Ghi?
Dữ liệu kiểm tra thực tế từ PostgreSQL System Catalog (`pg_class`):
```text
┌─────────┬───────────────────────────────────┬──────────┬───────────┐
│ (index) │ relname                           │ relpages │ reltuples │
├─────────┼───────────────────────────────────┼──────────┼───────────┤
│ 0       │ 'lessons'                         │ 9        │ 156       │
│ 1       │ 'idx_lessons_title_unaccent_trgm' │ 7        │ 4946      │
└─────────┴───────────────────────────────────┴──────────┴───────────┘
```

* **Nguyên lý của Cost-Based Optimizer:**
  1. Toàn bộ 156 bài học chỉ chiếm **9 trang đĩa (disk pages)** (~72 KB). Khi thực hiện quét tuần tự (`Seq Scan`), PostgreSQL chỉ cần nạp 9 trang này trực tiếp vào Shared Buffers RAM với chi phí I/O tuần tự rất thấp (`cost = 102.86`, thời gian thực thi: **1.3 ms**).
  2. Nếu sử dụng GIN Index Scan, PostgreSQL phải:
     - Đọc 7 trang của cây GIN Index để tìm các trigram keys.
     - Dựng Bitmap trong bộ nhớ RAM (`Bitmap Index Scan`).
     - Thực hiện truy cập ngẫu nhiên (Random I/O) vào từng block heap của bảng để kiểm tra lại điều kiện recheck (`Bitmap Heap Scan`).
  3. Với bảng kích thước nhỏ, chi phí đọc ngẫu nhiên (mặc định `random_page_cost = 4.0`) cộng với chi phí duyệt cây GIN cao hơn chi phí đọc liên tục 9 trang đĩa. Do đó, **việc Optimizer lựa chọn `Seq Scan` là quyết định hoàn toàn tối ưu và chuẩn xác của PostgreSQL**.

---

### 2.3. Bằng chứng Kỹ thuật: Index `gin_trgm_ops` Hoạt động Khi Tắt `enable_seqscan`
Để chứng minh truy vấn hoàn toàn tương thích và khớp với cấu trúc GIN Trigram Index, nhóm kỹ thuật đã thực hiện truy vấn với `SET enable_seqscan = off`:

#### 1. Tìm kiếm mẫu với toán tử `ILIKE` trên biểu thức không dấu:
```sql
SET enable_seqscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title
FROM lessons
WHERE f_unaccent(title) ILIKE '%Phat Thich Ca%';
```
**Kết quả Kế hoạch Thực thi (Execution Plan):**
```text
Bitmap Heap Scan on lessons  (cost=52.77..57.04 rows=1 width=63) (actual time=0.099..0.107 rows=4 loops=1)
  Recheck Cond: (f_unaccent((title)::text) ~~* '%Phat Thich Ca%'::text)
  Heap Blocks: exact=4
  Buffers: shared hit=27
  ->  Bitmap Index Scan on idx_lessons_title_unaccent_trgm  (cost=0.00..52.77 rows=1 width=0) (actual time=0.053..0.054 rows=4 loops=1)
        Index Cond: (f_unaccent((title)::text) ~~* '%Phat Thich Ca%'::text)
        Buffers: shared hit=23
Planning Time: 0.159 ms
Execution Time: 0.710 ms
```
* **Bằng chứng rõ ràng:** PostgreSQL thực hiện trực tiếp **`Bitmap Index Scan on idx_lessons_title_unaccent_trgm`** thông qua điều kiện `Index Cond: (f_unaccent((title)::text) ~~* '%Phat Thich Ca%'::text)`.

#### 2. Tìm kiếm với toán tử tương đồng trigram `%`:
```sql
SET enable_seqscan = off;
SET pg_trgm.similarity_threshold = 0.2;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title
FROM lessons
WHERE f_unaccent(title) % 'Phat Thich Ca';
```
**Kết quả Kế hoạch Thực thi:**
```text
Bitmap Heap Scan on lessons  (cost=66.05..71.74 rows=2 width=63) (actual time=0.083..0.732 rows=15 loops=1)
  Recheck Cond: (f_unaccent((title)::text) % 'Phat Thich Ca'::text)
  Rows Removed by Index Recheck: 81
  Heap Blocks: exact=9
  Buffers: shared hit=38
  ->  Bitmap Index Scan on idx_lessons_title_unaccent_trgm  (cost=0.00..66.05 rows=2 width=0) (actual time=0.047..0.047 rows=96 loops=1)
        Index Cond: (f_unaccent((title)::text) % 'Phat Thich Ca'::text)
        Buffers: shared hit=29
Planning Time: 0.425 ms
Execution Time: 0.741 ms
```
* **Kết luận kỹ thuật:** Cú pháp truy vấn trong Data Access Layer (`src/lib/dal/search.ts`) hoàn toàn tương thích 100% với GIN Trigram Index. Khi dữ liệu tăng trưởng lên hàng ngàn hoặc hàng chục ngàn bài học (vượt ngưỡng chi phí quét tuần tự), PostgreSQL CBO sẽ tự động kích hoạt `Bitmap Index Scan on idx_lessons_title_unaccent_trgm` mà không cần bất kỳ can thiệp cấu hình nào.

---

### 2.4. Quy trình REINDEX Chuẩn khi Thay đổi Từ điển hoặc Định nghĩa Hàm
Khi nâng cấp hoặc tinh chỉnh bộ quy tắc bỏ dấu tiếng Việt trong từ điển `unaccent.rules` hoặc định nghĩa lại hàm `f_unaccent()`, chỉ mục biểu thức GIN cần được tái lập để bảo đảm tính toàn vẹn:

* **Môi trường Phát triển / Bảo trì:**
  ```sql
  REINDEX INDEX idx_lessons_title_unaccent_trgm;
  ```
  *(Thời gian thực thi đo lường thực tế trên máy chủ: **6 ms**).*

* **Môi trường Production (Không khóa đọc/ghi bảng `lessons`):**
  ```sql
  REINDEX INDEX CONCURRENTLY idx_lessons_title_unaccent_trgm;
  ```
  Lệnh `CONCURRENTLY` cho phép người dùng tiếp tục đọc bài học và tìm kiếm bình thường trong suốt quá trình xây dựng lại chỉ mục ngầm dưới nền.

---

## 3. PHẠM VI TRIỂN KHAI CHẶNG 4: SÁU MÀN HÌNH CÔNG KHAI (THEO KẾ HOẠCH V1.1)

Nhóm kỹ thuật đã hiệu chỉnh và chuẩn hóa tuyệt đối định danh 6 màn hình công khai sẽ triển khai trong **Chặng 4 — Frontend Core Screens: Màn hình Đọc & Tra cứu** theo đúng Kế hoạch V1.1 và Technical Specifications V1.3:

| Mã màn hình | Tên màn hình | Tuyến đường (App Router Route) | Mục tiêu nghiệp vụ & Thành phần chính | Phong cách AC & Design Tokens |
|:---:|---|---|---|---|
| **SCR-01** | **Trang chủ** | `/` | Hero section, giới thiệu 4 Bậc tu học Ngành Đồng, ô tìm kiếm nhanh trung tâm, tôn chỉ thư viện. | Nền Warm Cream `#F8F7F2`, thẻ Card bo góc `12px`, Zen minimal, typography Be Vietnam Pro. |
| **SCR-02** | **Trang Ngành Đồng** | `/nganh-dong` | Tổng quan Ngành Đồng (Oanh Vũ), 4 Bậc tu học (Mở Mắt, Cánh Mềm, Chân Cứng, Tung Bay), thống kê học liệu. | Thẻ Card phân cấp bậc học, Badge trạng thái màu xanh lá `#176B4A`, bố cục Container 1200px. |
| **SCR-03** | **Trang Bậc học** | `/nganh-dong/[level]`<br>*(vd: `/nganh-dong/mo-mat`)* | Tổng quan bậc tu học, thông tin giáo trình gốc, 3 lĩnh vực tu học (Phật pháp, Hoạt động, Văn nghệ). | Thống kê số lượng bài học theo lĩnh vực, Card lĩnh vực với layout phân tầng rõ ràng. |
| **SCR-04** | **Danh sách bài học theo lĩnh vực** | `/nganh-dong/[level]/[category]`<br>*(vd: `/nganh-dong/mo-mat/phat-phap`)* | Danh sách bài học theo thứ tự giáo trình chuẩn (`sequence ASC`), phân trang, bộ lọc nhanh. | Bảng/danh sách bài học tối giản, hiển thị thứ tự bài, tiêu đề chuẩn mực, thẻ trạng thái. |
| **SCR-05** | **Trang đọc bài học** | `/bai-hoc/[slug]`<br>*(vd: `/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca`)* | Giao diện đọc bài học chuyên sâu (Reading Mode), mục lục bài học (TOC) cố định, điều hướng bài trước/sau (`previous`/`next`). | Chiều rộng văn bản tối ưu 720px, font Be Vietnam Pro 18px line-height 1.8, không gây xao nhãng. |
| **SCR-06** | **Tìm kiếm toàn thư viện** | `/tim-kiem` | Tìm kiếm tiếng Việt thông minh có dấu/không dấu, bộ lọc theo Bậc và Lĩnh vực, hiển thị kết quả xếp hạng độ liên quan. | Ô tìm kiếm lớn, chips bộ lọc linh hoạt, trích đoạn bài học khớp từ khóa, phân trang chuẩn. |

> [!NOTE]
> Màn hình **SCR-07: Trang Quản trị & Đăng nhập Admin** (`/admin/*`) thuộc phạm vi độc lập của **Chặng 5 (Admin & Biên tập Học liệu)** theo đúng Kế hoạch V1.1 đã phê duyệt.

---

## 4. KẾT QUẢ BỘ BA KIỂM ĐỊNH CHẤT LƯỢNG (QUALITY GATES)

Sau khi hoàn thiện migration và cập nhật Data Access Layer, nhóm kỹ thuật đã chạy độc lập 3 bài kiểm định:

### 4.1. TypeScript Strict Typecheck
```bash
> pnpm typecheck
$ tsc --noEmit
Exit Code: 0 (0 lỗi kiểu dữ liệu)
```

### 4.2. ESLint
```bash
> pnpm lint
$ next lint
✔ No ESLint warnings or errors
Exit Code: 0
```

### 4.3. Production Build
```bash
> pnpm build
$ next build
   ▲ Next.js 15.5.27
   - Environments: .env
 ✓ Compiled successfully in 4.7s
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (10/10)
   Finalizing page optimization ...

Route (app)                                 Size  First Load JS
┌ ○ /                                      148 B         103 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/v1/branches                       148 B         103 kB
├ ƒ /api/v1/branches/[slug]                148 B         103 kB
├ ƒ /api/v1/categories                     148 B         103 kB
├ ƒ /api/v1/lessons                        148 B         103 kB
├ ƒ /api/v1/lessons/[slug]                 148 B         103 kB
├ ƒ /api/v1/levels                         148 B         103 kB
├ ƒ /api/v1/levels/[id]/overview           148 B         103 kB
├ ƒ /api/v1/search                         148 B         103 kB
└ ƒ /api/v1/sources                        148 B         103 kB
+ First Load JS shared by all             103 kB

Exit Code: 0
```

---

## 5. BẢNG THEO DÕI LỖI TỒN ĐỌNG (DEFECT LOG)

| Mã lỗi | Hạng mục | Hiện tượng ghi nhận | Xử lý & Khắc phục | Trạng thái |
|---|---|---|---|:---:|
| **DEF-06** | Postgres Index | `unaccent` mặc định là `STABLE`, không thể tạo expression index trực tiếp. | Thiết lập wrapper function `f_unaccent(text) IMMUTABLE` gọi `unaccent('public.unaccent', $1)` và đóng gói vào migration `20261011000001_add_search_trigram_indexes`. | **ĐÃ GIẢI QUYẾT** |
| **DEF-07** | Process Port | Khi reload Next.js build mới, port 3001 bị giữ bởi tiến trình nền cũ (`EADDRINUSE`). | Script tự động giải phóng PID chiếm dụng cổng 3001 trước khi khởi chạy service mới. | **ĐÃ GIẢI QUYẾT** |
| **DEF-08** | Scope Mapping | Báo cáo ban đầu tóm tắt chưa đầy đủ định danh 6 màn hình Chặng 4. | Hiệu chỉnh bảng ánh xạ chi tiết SCR-01 đến SCR-06 theo đúng Kế hoạch V1.1. | **ĐÃ GIẢI QUYẾT** |
| — | Không còn lỗi tồn đọng | Toàn bộ các yêu cầu của Chặng 3 đã hoàn tất trọn vẹn. | — | **SẴN SÀNG CHUYỂN CHẶNG** |

---

## 6. ĐỀ NGHỊ PHÊ DUYỆT CHÍNH THỨC & CHUYỂN GIAO SANG CHẶNG 4

Nhóm kỹ thuật đã hoàn thành toàn diện việc giải trình kỹ thuật chỉ mục tìm kiếm và chuẩn hóa phạm vi màn hình cho Chặng 4. 

Kính đề nghị Chủ dự án:
1. **Nghiệm thu và chính thức phê duyệt Báo cáo GATE_CHECK_REPORT_3_REVISED.md.**
2. **Cho phép nhóm kỹ thuật bắt đầu triển khai CHẶNG 4 — FRONTEND CORE SCREENS: MÀN HÌNH ĐỌC & TRA CỨU** (xây dựng đầy đủ sáu màn hình công khai từ SCR-01 đến SCR-06 theo phong cách AC).

---

*(Ký tên / Xác nhận phê duyệt)*  
**BAN ĐIỀU HÀNH DỰ ÁN SEN TRẮNG**
