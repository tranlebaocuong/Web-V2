import { NextRequest } from "next/server";
import { getPublicLevels } from "@/lib/dal/levels";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateFilterIds } from "@/lib/query-validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { branch, error } = validateFilterIds(searchParams);

    if (error) {
      return apiError("INVALID_FILTER", error, 400);
    }

    const levels = await getPublicLevels(branch);
    return apiSuccess(levels);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/levels:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải danh sách bậc học.", 500);
  }
}
