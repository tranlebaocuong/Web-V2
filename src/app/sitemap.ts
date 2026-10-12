import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sentrang.gdptvietnam.org";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nganh-dong`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nganh-dong/mo-mat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nganh-dong/canh-buom`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nganh-dong/tung-bay`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nganh-dong/chan-troi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tim-kiem`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Các chuyên mục của 4 bậc
  const levels = ["mo-mat", "canh-buom", "tung-bay", "chan-troi"];
  const categories = ["phat-phap", "tinh-than", "chuyen-mon"];

  for (const lvl of levels) {
    for (const cat of categories) {
      staticRoutes.push({
        url: `${baseUrl}/nganh-dong/${lvl}/${cat}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  try {
    // Chỉ truy vấn các bài học có trạng thái published và ready
    const publishedLessons = await prisma.lesson.findMany({
      where: {
        publishStatus: "published",
        contentStatus: "ready",
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const lessonRoutes: MetadataRoute.Sitemap = publishedLessons.map((lesson) => ({
      url: `${baseUrl}/bai-hoc/${lesson.slug}`,
      lastModified: lesson.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...lessonRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    return staticRoutes;
  }
}
