import { NextRequest } from "next/server";
import { getPublicSources } from "@/lib/dal/sources";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const sources = await getPublicSources();
    return apiSuccess(sources);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/sources:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải danh sách nguồn giáo trình.", 500);
  }
}
