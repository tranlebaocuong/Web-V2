import { NextRequest } from "next/server";
import { getPublicLessonBySlug } from "@/lib/dal/lessons";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug || slug.trim().length === 0) {
      return apiError("INVALID_SLUG", "Đường dẫn bài học không hợp lệ.", 400);
    }

    const lesson = await getPublicLessonBySlug(slug.trim());

    // Nếu bài học không tồn tại, hoặc chưa PUBLISHED, hoặc chưa READY -> Trả về 404 bảo vệ dữ liệu nội bộ
    if (!lesson) {
      return apiError(
        "LESSON_NOT_FOUND",
        "Không tìm thấy bài học hoặc bài học chưa được phát hành chính thức.",
        404
      );
    }

    return apiSuccess(lesson);
  } catch (error) {
    console.error("[API_ERROR] GET /api/v1/lessons/[slug]:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra khi tải nội dung bài học.", 500);
  }
}
