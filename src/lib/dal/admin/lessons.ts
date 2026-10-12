import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/auth/session";
import { logAudit } from "./audit";
import { LessonContentJson } from "@/types/editor";

export interface AdminLessonFilterParams {
  search?: string;
  levelId?: string;
  categoryId?: string;
  contentStatus?: string;
  publishStatus?: string;
  page?: number;
  limit?: number;
}

export async function getAdminLessons(params: AdminLessonFilterParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: any = {
    deletedAt: null,
  };

  if (params.levelId) {
    whereClause.levelId = params.levelId;
  }

  if (params.categoryId) {
    whereClause.categoryId = params.categoryId;
  }

  if (params.contentStatus) {
    whereClause.contentStatus = params.contentStatus;
  }

  if (params.publishStatus) {
    whereClause.publishStatus = params.publishStatus;
  }

  if (params.search && params.search.trim() !== "") {
    const searchTrimmed = params.search.trim();
    whereClause.OR = [
      { id: { contains: searchTrimmed, mode: "insensitive" } },
      { title: { contains: searchTrimmed, mode: "insensitive" } },
      { slug: { contains: searchTrimmed, mode: "insensitive" } },
    ];
  }

  const [total, lessons] = await Promise.all([
    prisma.lesson.count({ where: whereClause }),
    prisma.lesson.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [
        { level: { sortOrder: "asc" } },
        { category: { sortOrder: "asc" } },
        { sequence: "asc" },
      ],
      include: {
        level: {
          select: { id: true, name: true, slug: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        source: {
          select: { id: true, title: true },
        },
        content: {
          select: { updatedAt: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      sequence: l.sequence,
      levelId: l.levelId,
      levelName: l.level.name,
      categoryId: l.categoryId,
      categoryName: l.category.name,
      sourceId: l.sourceId,
      sourceTitle: l.source.title,
      contentStatus: l.contentStatus,
      publishStatus: l.publishStatus,
      version: l.version,
      summary: l.summary,
      publishedAt: l.publishedAt,
      updatedAt: l.updatedAt,
      hasEditedContent: !!l.content,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getAdminLessonDetail(id: string) {
  const lesson = await prisma.lesson.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      deletedAt: null,
    },
    include: {
      level: true,
      category: true,
      source: true,
      rawContent: true,
      content: {
        include: {
          editor: {
            select: { id: true, email: true },
          },
        },
      },
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 20,
        include: {
          editor: {
            select: { id: true, email: true },
          },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return lesson;
}

export interface UpdateContentResult {
  success: boolean;
  conflict?: boolean;
  notFound?: boolean;
  currentVersion?: number;
  lesson?: any;
  error?: string;
}

export async function updateAdminLessonContent(
  id: string,
  data: {
    version: number;
    summary?: string | null;
    contentJson: LessonContentJson;
  },
  user: SessionUser
): Promise<UpdateContentResult> {
  const current = await prisma.lesson.findUnique({
    where: { id },
    include: { content: true },
  });

  if (!current) {
    return { success: false, notFound: true, error: "Bài học không tồn tại." };
  }

  // Optimistic concurrency control check
  if (current.version !== data.version) {
    return {
      success: false,
      conflict: true,
      currentVersion: current.version,
      error: `Xung đột sửa đổi: Bài học hiện ở phiên bản ${current.version}, nhưng bạn đang gửi phiên bản ${data.version}. Vui lòng tải lại trang để nạp nội dung mới nhất.`,
    };
  }

  const nextVersion = current.version + 1;
  const newContentStatus = "editing";

  // Perform transaction: update lesson version, update/create content, create revision, log audit
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create revision snapshot
    const revision = await tx.lessonRevision.create({
      data: {
        lessonId: id,
        revisionNumber: current.version,
        snapshotJson: data.contentJson as any,
        editedById: user.userId,
      },
    });

    // 2. Upsert lesson_contents (NEVER touching lesson_raw_contents)
    const content = await tx.lessonContent.upsert({
      where: { lessonId: id },
      create: {
        lessonId: id,
        contentJson: data.contentJson as any,
        schemaVersion: 1,
        editedById: user.userId,
      },
      update: {
        contentJson: data.contentJson as any,
        editedById: user.userId,
      },
    });

    // 3. Update lesson version, summary, contentStatus
    const updatedLesson = await tx.lesson.update({
      where: { id },
      data: {
        version: nextVersion,
        contentStatus: newContentStatus,
        summary: data.summary !== undefined ? data.summary : current.summary,
      },
    });

    return { updatedLesson, content, revision };
  });

  await logAudit({
    actorId: user.userId,
    action: "LESSON_UPDATE_CONTENT",
    entityType: "lesson",
    entityId: id,
    metadata: {
      previousVersion: current.version,
      newVersion: nextVersion,
      contentStatus: newContentStatus,
      blocksCount: data.contentJson.blocks?.length || 0,
    },
  });

  return {
    success: true,
    lesson: {
      ...result.updatedLesson,
      content: result.content,
    },
  };
}

export async function markLessonReady(id: string, user: SessionUser) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { content: true },
  });

  if (!lesson) {
    return { success: false, notFound: true, error: "Bài học không tồn tại." };
  }

  const blocks = (lesson.content?.contentJson as any)?.blocks;
  if (!lesson.content || !Array.isArray(blocks) || blocks.length === 0) {
    return {
      success: false,
      error: "Bài học chưa có khối nội dung nào. Không thể đánh dấu sẵn sàng.",
    };
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      contentStatus: "ready",
    },
  });

  await logAudit({
    actorId: user.userId,
    action: "LESSON_MARK_READY",
    entityType: "lesson",
    entityId: id,
    metadata: {
      previousStatus: lesson.contentStatus,
      newStatus: "ready",
    },
  });

  return { success: true, lesson: updated };
}

export async function publishLesson(id: string, user: SessionUser) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!lesson) {
    return { success: false, notFound: true, error: "Bài học không tồn tại." };
  }

  // Strict business rule: Only ready lessons can be published
  if (lesson.contentStatus !== "ready") {
    return {
      success: false,
      error: `Chỉ được phép xuất bản bài học khi nội dung đã ở trạng thái Sẵn sàng (ready). Hiện tại bài học đang ở trạng thái "${lesson.contentStatus}". Vui lòng hoàn thiện nội dung và đánh dấu Sẵn sàng trước khi xuất bản.`,
    };
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      publishStatus: "published",
      publishedAt: new Date(),
    },
  });

  await logAudit({
    actorId: user.userId,
    action: "LESSON_PUBLISH",
    entityType: "lesson",
    entityId: id,
    metadata: {
      previousPublishStatus: lesson.publishStatus,
      newPublishStatus: "published",
    },
  });

  return { success: true, lesson: updated };
}

export async function unpublishLesson(id: string, user: SessionUser) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!lesson) {
    return { success: false, notFound: true, error: "Bài học không tồn tại." };
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      publishStatus: "draft",
      publishedAt: null,
    },
  });

  await logAudit({
    actorId: user.userId,
    action: "LESSON_UNPUBLISH",
    entityType: "lesson",
    entityId: id,
    metadata: {
      previousPublishStatus: lesson.publishStatus,
      newPublishStatus: "draft",
    },
  });

  return { success: true, lesson: updated };
}
