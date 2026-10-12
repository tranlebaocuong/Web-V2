import { NextRequest } from "next/server";
import { getPublicBranchBySlug } from "@/lib/dal/branches";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return apiError("INVALID_SLUG", "Mã đường dẫn ngành học không hợp lệ.", 400);
    }

    const branch = await getPublicBranchBySlug(slug);
    if (!branch) {
      return apiError("BRANCH_NOT_FOUND", `Không tìm thấy ngành học với mã: '${slug}'.`, 404);
    }

    return apiSuccess(branch);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/branches/[slug]:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải chi tiết ngành học.", 500);
  }
}
