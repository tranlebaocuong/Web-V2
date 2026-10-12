import { NextRequest } from "next/server";
import { getPublicLessons } from "@/lib/dal/lessons";
import { apiPaginated, apiError } from "@/lib/api-response";
import { parsePagination, parseSearchQuery, validateFilterIds } from "@/lib/query-validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Kiểm tra tham số bộ lọc
    const { branch, level, category, error: filterError } = validateFilterIds(searchParams);
    if (filterError) {
      return apiError("INVALID_FILTER", filterError, 400);
    }

    // 2. Kiểm tra từ khóa q (nếu có)
    const { q, error: qError } = parseSearchQuery(searchParams);
    if (qError) {
      return apiError("INVALID_QUERY", qError, 400);
    }

    // 3. Phân trang
    const { page, limit, skip } = parsePagination(searchParams);

    // 4. Lấy dữ liệu công khai đã kiểm duyệt (chỉ published & ready)
    const { items, total, totalPages } = await getPublicLessons({
      branch,
      level,
      category,
      q: q || undefined,
      page,
      limit,
      skip,
    });

    return apiPaginated(items, { page, limit, total, totalPages });
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/lessons:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải danh sách bài học.", 500);
  }
}
