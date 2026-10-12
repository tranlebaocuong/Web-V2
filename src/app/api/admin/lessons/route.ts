import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiPaginated, apiError } from "@/lib/api-response";
import { getAdminLessons } from "@/lib/dal/admin/lessons";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const levelId = searchParams.get("levelId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const contentStatus = searchParams.get("contentStatus") || undefined;
    const publishStatus = searchParams.get("publishStatus") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminLessons({
      search,
      levelId,
      categoryId,
      contentStatus,
      publishStatus,
      page,
      limit,
    });

    return apiPaginated(result.lessons, result.pagination);
  } catch (err: any) {
    console.error("Admin lessons query failed:", err);
    return apiError("SERVER_ERROR", "Lỗi máy chủ khi lấy danh sách bài học.", 500);
  }
}
