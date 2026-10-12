import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { publishLesson } from "@/lib/dal/admin/lessons";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const result = await publishLesson(id, auth.user);

  if (result.notFound) {
    return apiError("NOT_FOUND", result.error || "Bài học không tồn tại.", 404);
  }

  if (!result.success) {
    return apiError("LESSON_NOT_READY", result.error || "Bài học chưa sẵn sàng để xuất bản.", 400);
  }

  return apiSuccess(result.lesson);
}
