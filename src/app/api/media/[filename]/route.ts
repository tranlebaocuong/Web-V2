import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { MEDIA_DIR, detectRealImageMime } from "@/lib/dal/admin/media";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // 1. Chống Path Traversal
  const safeBaseName = path.basename(filename);
  const filePath = path.resolve(path.join(MEDIA_DIR, safeBaseName));
  const resolvedMediaDir = path.resolve(MEDIA_DIR);

  if (!filePath.startsWith(resolvedMediaDir)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PATH", message: "Đường dẫn tệp không hợp lệ." },
      },
      { status: 400 }
    );
  }

  // 2. Kiểm tra tệp có tồn tại trên đĩa cứng
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "MEDIA_NOT_FOUND", message: "Hình ảnh không tồn tại." },
      },
      { status: 404 }
    );
  }

  // 3. Xác định MIME thực tế qua magic bytes
  const detected = detectRealImageMime(buffer);
  const mimeType = detected ? detected.mime : "application/octet-stream";

  // 4. Kiểm tra quy tắc truy cập (Access Control)
  // Truy vấn xem hình ảnh có liên kết với bài học đã xuất bản công khai hay không
  const lessonImage = await prisma.lessonImage.findFirst({
    where: { storageKey: safeBaseName },
    include: {
      lesson: {
        select: { id: true, publishStatus: true },
      },
    },
  });

  const isPubliclyPublished =
    lessonImage?.lesson && lessonImage.lesson.publishStatus === "published";

  if (isPubliclyPublished) {
    const etag = `"${crypto.createHash("md5").update(buffer).digest("hex")}"`;
    const ifNoneMatch = req.headers.get("if-none-match");

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    // Ảnh gắn với bài học đã xuất bản -> Phục vụ công khai với ETag và revalidation
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=1800, s-maxage=3600, must-revalidate",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Nếu ảnh chưa gắn với bài học, hoặc bài học còn ở trạng thái nháp (draft/hidden)
  // BẮT BUỘC kiểm tra xác thực quyền quản trị viên!
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED_MEDIA",
          message: "Tài nguyên hình ảnh nội bộ. Bạn cần đăng nhập quyền quản trị để xem ảnh này.",
        },
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }

  // Quản trị viên đã xác thực -> Phục vụ ảnh riêng tư, không lưu cache trình duyệt
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
