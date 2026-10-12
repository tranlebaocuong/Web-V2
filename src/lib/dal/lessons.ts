import { prisma } from "../prisma";
import { TocItem, LessonContentJson } from "@/types/editor";

export interface PublicLessonSummaryItem {
  id: string;
  title: string;
  slug: string;
  sequence: number;
  summary: string | null;
  level: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export interface PublicLessonNeighbor {
  id: string;
  title: string;
  slug: string;
  sequence: number;
}

export interface PublicLessonDetail {
  id: string;
  title: string;
  slug: string;
  level: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  content: LessonContentJson;
  toc: TocItem[];
  source: {
    title: string;
    publicationYear: number;
  };
  previous: PublicLessonNeighbor | null;
  next: PublicLessonNeighbor | null;
}

export interface GetPublicLessonsParams {
  branch?: string;
  level?: string;
  category?: string;
  q?: string;
  page: number;
  limit: number;
  skip: number;
}

export async function getPublicLessons(params: GetPublicLessonsParams): Promise<{
  items: PublicLessonSummaryItem[];
  total: number;
  totalPages: number;
}> {
  const { branch, level, category, q, limit, skip } = params;

  // Xây dựng điều kiện WHERE: BẮT BUỘC publishStatus = 'published' và contentStatus = 'ready'
  const where: any = {
    publishStatus: "published",
    contentStatus: "ready",
  };

  if (branch) {
    where.branchId = branch;
  }
  if (level) {
    where.levelId = level;
  }
  if (category) {
    where.categoryId = category;
  }

  // Nếu có q trong getPublicLessons, tìm kiếm đơn giản bằng title
  if (q && q.trim().length > 0) {
    where.title = {
      contains: q.trim(),
      mode: "insensitive",
    };
  }

  const [total, lessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        sequence: true,
        summary: true,
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { levelId: "asc" },
        { categoryId: "asc" },
        { sequence: "asc" },
      ],
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: lessons,
    total,
    totalPages,
  };
}

export async function getPublicLessonBySlug(
  slug: string
): Promise<PublicLessonDetail | null> {
  // Tìm kiếm bài học theo slug, BẮT BUỘC publishStatus = 'published' và contentStatus = 'ready'
  const lesson = await prisma.lesson.findFirst({
    where: {
      slug,
      publishStatus: "published",
      contentStatus: "ready",
    },
    include: {
      level: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      source: {
        select: {
          title: true,
          publicationYear: true,
        },
      },
      content: {
        select: {
          contentJson: true,
          schemaVersion: true,
        },
      },
    },
  });

  if (!lesson || !lesson.content) {
    return null;
  }

  const contentJson = lesson.content.contentJson as unknown as LessonContentJson;

  // Tạo Table of Contents (TOC) từ các blocks heading
  const toc: TocItem[] = [];
  if (Array.isArray(contentJson?.blocks)) {
    for (const block of contentJson.blocks) {
      if (block.type === "heading" && block.text) {
        toc.push({
          id: block.id,
          level: block.level,
          text: block.text,
        });
      }
    }
  }

  // Tìm bài trước (previous) và bài sau (next) trong cùng level và category
  // Chỉ tìm trong các bài đã published và ready
  const [previousLesson, nextLesson] = await Promise.all([
    prisma.lesson.findFirst({
      where: {
        levelId: lesson.levelId,
        categoryId: lesson.categoryId,
        sequence: { lt: lesson.sequence },
        publishStatus: "published",
        contentStatus: "ready",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sequence: true,
      },
      orderBy: { sequence: "desc" },
    }),
    prisma.lesson.findFirst({
      where: {
        levelId: lesson.levelId,
        categoryId: lesson.categoryId,
        sequence: { gt: lesson.sequence },
        publishStatus: "published",
        contentStatus: "ready",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sequence: true,
      },
      orderBy: { sequence: "asc" },
    }),
  ]);

  return {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    level: lesson.level,
    category: lesson.category,
    content: contentJson,
    toc,
    source: {
      title: lesson.source.title,
      publicationYear: lesson.source.publicationYear || 0,
    },
    previous: previousLesson,
    next: nextLesson,
  };
}
