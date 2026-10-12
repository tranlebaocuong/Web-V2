import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { saveUploadedFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/dal/admin/media";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/dal/admin/audit";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const lessonId = formData.get("lessonId") as string | null;
    const altText = (formData.get("altText") as string) || null;
    const caption = (formData.get("caption") as string) || null;

    if (!file) {
      return apiError("FILE_REQUIRED", "Vui lòng chọn một tệp hình ảnh để tải lên.", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(
        "INVALID_FILE_TYPE",
        `Định dạng "${file.type}" không được hỗ trợ. Chỉ chấp nhận JPEG, PNG, WEBP.`,
        400
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError(
        "FILE_TOO_LARGE",
        `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(2)} MB) vượt quá giới hạn 5MB.`,
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const saved = await saveUploadedFile(buffer, file.name, file.type);

    let lessonImage = null;
    if (lessonId) {
      // Link to lesson if lessonId is provided
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (lesson) {
        lessonImage = await prisma.lessonImage.create({
          data: {
            lessonId,
            storageKey: saved.storageKey,
            altText,
            caption,
          },
        });
      }
    }

    await logAudit({
      actorId: auth.user.userId,
      action: "MEDIA_UPLOAD",
      entityType: "media",
      entityId: saved.storageKey,
      metadata: {
        originalName: file.name,
        size: saved.size,
        mimeType: file.type,
        lessonId: lessonId || undefined,
        url: saved.publicUrl,
      },
    });

    return apiSuccess({
      storageKey: saved.storageKey,
      url: saved.publicUrl,
      size: saved.size,
      mimeType: file.type,
      lessonImage,
    });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return apiError("UPLOAD_ERROR", err.message || "Tải lên tệp thất bại.", 400);
  }
}
