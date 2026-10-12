import { NextRequest } from "next/server";
import { getPublicCategories } from "@/lib/dal/categories";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const categories = await getPublicCategories();
    return apiSuccess(categories);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/categories:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải danh sách lĩnh vực tu học.", 500);
  }
}
