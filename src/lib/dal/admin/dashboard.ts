import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalLessons,
    publishedLessons,
    draftLessons,
    hiddenLessons,
    rawExtractedLessons,
    editingLessons,
    readyLessons,
    levels,
    categories,
    recentAuditLogs,
    totalImages,
  ] = await Promise.all([
    prisma.lesson.count({ where: { deletedAt: null } }),
    prisma.lesson.count({ where: { deletedAt: null, publishStatus: "published" } }),
    prisma.lesson.count({ where: { deletedAt: null, publishStatus: "draft" } }),
    prisma.lesson.count({ where: { deletedAt: null, publishStatus: "hidden" } }),
    prisma.lesson.count({ where: { deletedAt: null, contentStatus: "raw_extracted" } }),
    prisma.lesson.count({ where: { deletedAt: null, contentStatus: "editing" } }),
    prisma.lesson.count({ where: { deletedAt: null, contentStatus: "ready" } }),
    prisma.studyLevel.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { lessons: true },
        },
        lessons: {
          select: {
            publishStatus: true,
            contentStatus: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { lessons: true },
        },
        lessons: {
          select: {
            publishStatus: true,
            contentStatus: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, email: true },
        },
      },
    }),
    prisma.lessonImage.count(),
  ]);

  const levelStats = levels.map((lvl) => ({
    id: lvl.id,
    name: lvl.name,
    slug: lvl.slug,
    total: lvl._count.lessons,
    published: lvl.lessons.filter((l) => l.publishStatus === "published").length,
    ready: lvl.lessons.filter((l) => l.contentStatus === "ready").length,
    editing: lvl.lessons.filter((l) => l.contentStatus === "editing").length,
    raw: lvl.lessons.filter((l) => l.contentStatus === "raw_extracted").length,
  }));

  const categoryStats = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    total: cat._count.lessons,
    published: cat.lessons.filter((l) => l.publishStatus === "published").length,
    ready: cat.lessons.filter((l) => l.contentStatus === "ready").length,
  }));

  return {
    overview: {
      totalLessons,
      publishedLessons,
      draftLessons,
      hiddenLessons,
      rawExtractedLessons,
      editingLessons,
      readyLessons,
      totalImages,
    },
    levels: levelStats,
    categories: categoryStats,
    recentAuditLogs,
  };
}
