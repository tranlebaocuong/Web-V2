-- Function wrapper để unaccent có tính chất IMMUTABLE, cho phép lập Expression Index
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
'SELECT public.unaccent(''public.unaccent'', $1)';

-- GIN Trigram Expression Index phục vụ tìm kiếm tiếng Việt không dấu siêu tốc
CREATE INDEX IF NOT EXISTS idx_lessons_title_unaccent_trgm 
ON lessons USING gin (f_unaccent(title) gin_trgm_ops);

-- B-Tree Composite Index phục vụ lọc bắt buộc theo trạng thái bài xuất bản
CREATE INDEX IF NOT EXISTS idx_lessons_publish_ready 
ON lessons (publish_status, content_status);
