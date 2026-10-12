import { NextRequest } from "next/server";
import { searchPublicLessons } from "@/lib/dal/search";
import { apiPaginated, apiError } from "@/lib/api-response";
import { parsePagination, parseSearchQuery, validateFilterIds } from "@/lib/query-validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Kiểm tra từ khóa tìm kiếm: BẮT BUỘC có q và không rỗng sau khi trim
    const { q, error: qError } = parseSearchQuery(searchParams);
    if (!q || q.length === 0) {
      return apiError(
        "INVALID_QUERY",
        qError || "Vui lòng nhập từ khóa tìm kiếm hợp lệ.",
        400
      );
    }

    // 2. Kiểm tra bộ lọc bậc và lĩnh vực (nếu có)
    const { level, category, error: filterError } = validateFilterIds(searchParams);
    if (filterError) {
      return apiError("INVALID_FILTER", filterError, 400);
    }

    // 3. Phân trang
    const { page, limit, skip } = parsePagination(searchParams);

    // 4. Tìm kiếm có xếp hạng độ tương đồng và ưu tiên tiêu đề
    const { items, total, totalPages } = await searchPublicLessons({
      q,
      level,
      category,
      page,
      limit,
      skip,
    });

    return apiPaginated(items, { page, limit, total, totalPages });
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/search:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi thực hiện tìm kiếm.", 500);
  }
}
