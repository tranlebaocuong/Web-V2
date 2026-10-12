import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Private storage directory outside public/ (Configurable via MEDIA_DIR env)
export const MEDIA_DIR = process.env.MEDIA_DIR
  ? path.resolve(process.env.MEDIA_DIR)
  : path.join(process.cwd(), "data", "media");

export async function ensureMediaDir() {
  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to ensure media directory:", err);
  }
}

/**
 * Kiểm tra Magic Bytes thực tế trong buffer để phát hiện đúng định dạng ảnh,
 * ngăn chặn tệp độc hại hoặc giả mạo phần mở rộng / header Content-Type.
 */
export function detectRealImageMime(buffer: Buffer): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: ".png" };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: ".webp" };
  }

  return null;
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType: string
): Promise<{ storageKey: string; publicUrl: string; size: number; detectedMime: string }> {
  await ensureMediaDir();

  // 1. Kiểm tra kích thước tệp
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Kích thước tệp vượt quá giới hạn tối đa 5MB (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`
    );
  }

  // 2. Kiểm tra Magic Bytes để phát hiện MIME thực tế
  const detected = detectRealImageMime(buffer);
  if (!detected) {
    throw new Error(
      "Nội dung nhị phân không hợp lệ hoặc bị giả mạo. Chỉ chấp nhận định dạng ảnh JPEG, PNG, WEBP thực tế."
    );
  }

  // 3. Đối chiếu MIME khai báo với MIME phát hiện thực tế
  if (declaredMimeType && declaredMimeType !== detected.mime) {
    throw new Error(
      `Định dạng tệp khai báo (${declaredMimeType}) không khớp với định dạng thực tế (${detected.mime}). Phát hiện giả mạo phần mở rộng.`
    );
  }

  // 4. Sinh tên ngẫu nhiên an toàn qua UUID
  const uniqueId = crypto.randomUUID();
  const safeFilename = `${uniqueId}${detected.ext}`;
  const filePath = path.join(MEDIA_DIR, safeFilename);

  // 5. Ngăn chặn Path Traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(MEDIA_DIR))) {
    throw new Error("Phát hiện lỗi an toàn đường dẫn (Path Traversal).");
  }

  // 6. Ghi vào vùng lưu trữ riêng tư data/media/
  await fs.writeFile(filePath, buffer);

  return {
    storageKey: safeFilename,
    publicUrl: `/api/media/${safeFilename}`,
    size: buffer.length,
    detectedMime: detected.mime,
  };
}

export async function getMediaAssets(params?: { lessonId?: string; take?: number; skip?: number }) {
  const where: any = {};
  if (params?.lessonId) {
    where.lessonId = params.lessonId;
  }

  const [total, images] = await Promise.all([
    prisma.lessonImage.count({ where }),
    prisma.lessonImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params?.take || 50,
      skip: params?.skip || 0,
      include: {
        lesson: {
          select: { id: true, title: true, slug: true, publishStatus: true },
        },
      },
    }),
  ]);

  return {
    total,
    images: images.map((img) => ({
      id: img.id,
      storageKey: img.storageKey,
      url: `/api/media/${img.storageKey}`,
      altText: img.altText,
      caption: img.caption,
      lessonId: img.lessonId,
      lessonTitle: img.lesson.title,
      publishStatus: img.lesson.publishStatus,
      createdAt: img.createdAt,
    })),
  };
}
