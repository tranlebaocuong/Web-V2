import { NextRequest } from "next/server";
import { getPublicBranches } from "@/lib/dal/branches";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const branches = await getPublicBranches();
    return apiSuccess(branches);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/branches:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải danh sách ngành.", 500);
  }
}
