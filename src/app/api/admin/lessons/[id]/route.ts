import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAdminLessonDetail, updateAdminLessonContent } from "@/lib/dal/admin/lessons";
import { SaveLessonContentSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const lesson = await getAdminLessonDetail(id);

  if (!lesson) {
    return apiError("NOT_FOUND", `Không tìm thấy bài học có mã hoặc slug "${id}".`, 404);
  }

  return apiSuccess(lesson);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Dữ liệu JSON không hợp lệ.", 400);
  }

  const parsed = SaveLessonContentSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError("VALIDATION_ERROR", errorMsg, 400);
  }

  const result = await updateAdminLessonContent(
    id,
    {
      version: parsed.data.version,
      summary: parsed.data.summary,
      contentJson: parsed.data.contentJson,
    },
    auth.user
  );

  if (result.notFound) {
    return apiError("NOT_FOUND", result.error || "Bài học không tồn tại.", 404);
  }

  if (result.conflict) {
    // Return HTTP 409 Conflict for optimistic concurrency failure
    return apiError("CONCURRENCY_CONFLICT", result.error || "Xung đột sửa đổi đồng thời.", 409);
  }

  if (!result.success) {
    return apiError("UPDATE_FAILED", result.error || "Cập nhật bài học thất bại.", 400);
  }

  return apiSuccess(result.lesson);
}
