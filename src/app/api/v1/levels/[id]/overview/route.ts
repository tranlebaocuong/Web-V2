import { NextRequest } from "next/server";
import { getPublicLevelOverview } from "@/lib/dal/levels";
import { apiSuccess, apiError } from "@/lib/api-response";
import { VALID_LEVEL_IDS } from "@/lib/query-validation";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id || !VALID_LEVEL_IDS.includes(id as any)) {
      return apiError(
        "INVALID_LEVEL_ID",
        `Mã bậc học không hợp lệ: '${id}'. Chỉ chấp nhận: ${VALID_LEVEL_IDS.join(", ")}.`,
        400
      );
    }

    const overview = await getPublicLevelOverview(id);
    if (!overview) {
      return apiError("LEVEL_NOT_FOUND", `Không tìm thấy bậc học với mã: '${id}'.`, 404);
    }

    return apiSuccess(overview);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/levels/[id]/overview:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải tổng quan bậc học.", 500);
  }
}
