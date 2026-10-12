import React from "react";
import { searchPublicLessons } from "@/lib/dal/search";
import { SearchPageView } from "@/components/search/SearchPageView";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    level?: string;
    category?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  if (q && q.trim()) {
    return {
      title: `Tìm kiếm: "${q.trim()}" | Tủ Sách Áo Lam`,
      description: `Kết quả tìm kiếm bài học theo từ khóa "${q.trim()}" trong Tủ Sách Áo Lam.`,
    };
  }

  return {
    title: "Tra cứu bài học | Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
    description: "Công cụ tìm kiếm thông minh có dấu và không dấu trong 156 bài học giáo trình GĐPT.",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, level, category, page } = await searchParams;

  const cleanQ = (q || "").trim();
  const cleanLevel = (level || "").trim();
  const cleanCategory = (category || "").trim();
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  let results: {
    items: import("@/lib/dal/search").SearchHitItem[];
    total: number;
    totalPages: number;
  } = {
    items: [],
    total: 0,
    totalPages: 1,
  };

  if (cleanQ) {
    try {
      results = await searchPublicLessons({
        q: cleanQ,
        level: cleanLevel || undefined,
        category: cleanCategory || undefined,
        page: currentPage,
        limit,
        skip,
      });
    } catch (error) {
      console.error("Search error in SearchPage:", error);
    }
  }

  return (
    <SearchPageView
      query={cleanQ}
      level={cleanLevel}
      category={cleanCategory}
      currentPage={currentPage}
      results={results}
    />
  );
}
