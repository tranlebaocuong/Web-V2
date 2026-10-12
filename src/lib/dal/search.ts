import { prisma } from "../prisma";

export interface SearchHitItem {
  id: string;
  title: string;
  slug: string;
  sequence: number;
  summary: string | null;
  score: number;
  level: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export interface SearchLessonsParams {
  q: string;
  level?: string;
  category?: string;
  page: number;
  limit: number;
  skip: number;
}

export async function searchPublicLessons(params: SearchLessonsParams): Promise<{
  items: SearchHitItem[];
  total: number;
  totalPages: number;
}> {
  const { q, level, category, limit, skip } = params;
  const cleanQ = q.trim();

  // Tạo điều kiện filter linh hoạt an toàn qua Prisma
  // Chúng ta sử dụng raw SQL của PostgreSQL với unaccent và pg_trgm
  const whereClauses: string[] = [
    `l.publish_status = 'published'`,
    `l.content_status = 'ready'`,
  ];
  const queryParams: any[] = [cleanQ];

  let paramIndex = 2;

  if (level) {
    whereClauses.push(`l.level_id = $${paramIndex}`);
    queryParams.push(level);
    paramIndex++;
  }

  if (category) {
    whereClauses.push(`l.category_id = $${paramIndex}`);
    queryParams.push(category);
    paramIndex++;
  }

  // Điều kiện tìm kiếm văn bản: Khớp title (ưu tiên dùng f_unaccent để hit GIN index) hoặc khớp content_json
  whereClauses.push(`(
    f_unaccent(l.title) ILIKE f_unaccent('%' || $1 || '%')
    OR similarity(f_unaccent(l.title), f_unaccent($1)) > 0.15
    OR f_unaccent(coalesce(l.summary, '')) ILIKE f_unaccent('%' || $1 || '%')
    OR f_unaccent(coalesce(lc.content_json::text, '')) ILIKE f_unaccent('%' || $1 || '%')
  )`);

  const whereSql = whereClauses.join(" AND ");

  // 1. Đếm tổng số kết quả khớp
  const countSql = `
    SELECT count(*)::int as total
    FROM lessons l
    LEFT JOIN lesson_contents lc ON l.id = lc.lesson_id
    WHERE ${whereSql};
  `;

  const countResult: any = await prisma.$queryRawUnsafe(countSql, ...queryParams);
  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (total === 0) {
    return {
      items: [],
      total: 0,
      totalPages: 1,
    };
  }

  // 2. Lấy danh sách kết quả có xếp hạng điểm (Ranking)
  // Ưu tiên:
  // - Khớp chính xác tiêu đề (ILIKE unaccent) -> +50 điểm
  // - Điểm tương đồng trigram tiêu đề -> similarity * 40
  // - Khớp tóm tắt summary -> +15 điểm
  // - Khớp nội dung block text -> +10 điểm
  const selectSql = `
    SELECT 
      l.id,
      l.title,
      l.slug,
      l.sequence,
      l.summary,
      sl.id AS level_id,
      sl.name AS level_name,
      c.id AS category_id,
      c.name AS category_name,
      (
        CASE 
          WHEN f_unaccent(l.title) ILIKE f_unaccent('%' || $1 || '%') THEN 50.0 
          ELSE 0.0 
        END
        + (similarity(f_unaccent(l.title), f_unaccent($1)) * 40.0)
        + CASE 
            WHEN f_unaccent(coalesce(l.summary, '')) ILIKE f_unaccent('%' || $1 || '%') THEN 15.0 
            ELSE 0.0 
          END
        + CASE 
            WHEN f_unaccent(coalesce(lc.content_json::text, '')) ILIKE f_unaccent('%' || $1 || '%') THEN 10.0 
            ELSE 0.0 
          END
      ) AS relevance_score
    FROM lessons l
    JOIN study_levels sl ON l.level_id = sl.id
    JOIN categories c ON l.category_id = c.id
    LEFT JOIN lesson_contents lc ON l.id = lc.lesson_id
    WHERE ${whereSql}
    ORDER BY relevance_score DESC, l.sequence ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  const pagedParams = [...queryParams, limit, skip];
  const rows: any = await prisma.$queryRawUnsafe(selectSql, ...pagedParams);

  const items: SearchHitItem[] = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    sequence: r.sequence,
    summary: r.summary,
    score: Math.round((Number(r.relevance_score) || 0) * 10) / 10,
    level: {
      id: r.level_id,
      name: r.level_name,
    },
    category: {
      id: r.category_id,
      name: r.category_name,
    },
  }));

  return {
    items,
    total,
    totalPages,
  };
}
