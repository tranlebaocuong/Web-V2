import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getMediaAssets } from "@/lib/dal/admin/media";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const lessonId = searchParams.get("lessonId") || undefined;
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await getMediaAssets({ lessonId, take, skip });
    return apiSuccess(result);
  } catch (err: any) {
    console.error("Fetch media assets failed:", err);
    return apiError("SERVER_ERROR", "Lỗi máy chủ khi lấy danh sách hình ảnh.", 500);
  }
}
