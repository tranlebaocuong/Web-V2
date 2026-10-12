import React from "react";
import { notFound } from "next/navigation";
import { getPublicLessonBySlug } from "@/lib/dal/lessons";
import { LessonReaderView } from "@/components/reader/LessonReaderView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const lesson = await getPublicLessonBySlug(slug);

  if (!lesson) {
    return {
      title: "Bài học không tìm thấy | Tủ Sách Áo Lam",
      description: "Bài học không tồn tại hoặc chưa được xuất bản chính thức.",
    };
  }

  return {
    title: `${lesson.title} — ${lesson.level.name} | Tủ Sách Áo Lam`,
    description: `Bài học ${lesson.title} thuộc ${lesson.category.name}, ${lesson.level.name} Ngành Đồng Gia Đình Phật Tử Việt Nam.`,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = await getPublicLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return <LessonReaderView lesson={lesson} />;
}
