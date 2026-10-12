import { prisma } from "../prisma";

export interface PublicLevel {
  id: string;
  branchId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface PublicLevelOverview {
  level: {
    id: string;
    branchId: string;
    name: string;
    slug: string;
    description: string | null;
  };
  source: {
    id: string;
    title: string;
    publicationYear: number | null;
    pageCount: number | null;
    publicationNote: string | null;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    lessonCount: number;
  }>;
  lessonCount: number;
}

export async function getPublicLevels(branchId?: string): Promise<PublicLevel[]> {
  const levels = await prisma.studyLevel.findMany({
    where: branchId ? { branchId } : undefined,
    select: {
      id: true,
      branchId: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return levels;
}

export async function getPublicLevelOverview(
  levelId: string
): Promise<PublicLevelOverview | null> {
  const level = await prisma.studyLevel.findUnique({
    where: { id: levelId },
    include: {
      sources: {
        select: {
          id: true,
          title: true,
          publicationYear: true,
          pageCount: true,
          publicationNote: true,
        },
        take: 1,
      },
    },
  });

  if (!level) {
    return null;
  }

  // Lấy danh sách categories
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Đếm bài học đã published và ready cho từng category trong level này
  const categoryStats = await Promise.all(
    categories.map(async (cat) => {
      const count = await prisma.lesson.count({
        where: {
          levelId,
          categoryId: cat.id,
          publishStatus: "published",
          contentStatus: "ready",
        },
      });
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        lessonCount: count,
      };
    })
  );

  const totalPublishedLessonCount = categoryStats.reduce(
    (acc, curr) => acc + curr.lessonCount,
    0
  );

  const primarySource = level.sources[0]
    ? {
        id: level.sources[0].id,
        title: level.sources[0].title,
        publicationYear: level.sources[0].publicationYear,
        pageCount: level.sources[0].pageCount,
        publicationNote: level.sources[0].publicationNote,
      }
    : null;

  return {
    level: {
      id: level.id,
      branchId: level.branchId,
      name: level.name,
      slug: level.slug,
      description: level.description,
    },
    source: primarySource,
    categories: categoryStats,
    lessonCount: totalPublishedLessonCount,
  };
}
