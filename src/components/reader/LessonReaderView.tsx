"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Calendar, Bookmark } from "lucide-react";
import { PublicLessonDetail } from "@/lib/dal/lessons";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { ContentRenderer } from "./ContentRenderer";
import { TableOfContents } from "./TableOfContents";
import { ReadingToolbar, ReadingTheme } from "./ReadingToolbar";
import { LessonNeighbors } from "./LessonNeighbors";

interface LessonReaderViewProps {
  lesson: PublicLessonDetail;
}

export function LessonReaderView({ lesson }: LessonReaderViewProps) {
  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<ReadingTheme>("light");

  const getThemeClass = (currentTheme: ReadingTheme) => {
    switch (currentTheme) {
      case "sepia":
        return "reading-theme-sepia";
      case "dark":
        return "reading-theme-dark";
      default:
        return "reading-theme-light";
    }
  };

  return (
    <div className={`min-h-screen py-6 sm:py-10 transition-colors duration-200 ${getThemeClass(theme)}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. BREADCRUMB */}
        <Breadcrumb
          items={[
            { label: "Ngành Đồng", href: "/nganh-dong" },
            {
              label: lesson.level.name,
              href: `/nganh-dong/${lesson.level.id}`,
            },
            {
              label: lesson.category.name,
              href: `/nganh-dong/${lesson.level.id}/${lesson.category.id}`,
            },
            { label: lesson.title },
          ]}
        />

        {/* 2. READING TOOLBAR */}
        <ReadingToolbar
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* 3. BỐ CỤC CHÍNH (DESKTOP: 2 CỘT, MOBILE: 1 CỘT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* CỘT ĐỌC BÀI (720px - 740px) */}
          <main
            role="main"
            className="lg:col-span-8 xl:col-span-8 rounded-[20px] border border-[#E3E1D8] bg-white/90 p-6 sm:p-10 shadow-xs max-w-[740px] mx-auto w-full transition-colors"
          >
            {/* Header bài học */}
            <header className="pb-6 mb-6 border-b border-[#E3E1D8]">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="primary">{lesson.level.name}</Badge>
                <Badge variant="secondary">{lesson.category.name}</Badge>
                <span className="text-xs font-mono font-semibold text-[#536B61] bg-[#F8F7F2] px-2 py-0.5 rounded-sm border border-[#E3E1D8]">
                  {lesson.id}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#176B4A] tracking-tight leading-tight">
                {lesson.title}
              </h1>

              {/* Thông tin giáo trình & metadata */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-[#536B61] mt-4 pt-3 border-t border-[#E3E1D8]/60">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#176B4A]" />
                  <span>{lesson.source.title}</span>
                </div>
                {lesson.source.publicationYear > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#536B61]" />
                    <span>Năm XB: {lesson.source.publicationYear}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Mục lục bài học hiển thị cho màn hình Mobile */}
            <div className="lg:hidden">
              <TableOfContents toc={lesson.toc} isMobileDrawer />
            </div>

            {/* Nội dung bài học */}
            <ContentRenderer content={lesson.content} fontSize={fontSize} />

            {/* Hộp Thông tin nguồn giáo trình gốc */}
            <section
              aria-label="Thông tin giáo trình gốc"
              className="mt-12 p-4 sm:p-5 rounded-[14px] bg-[#F8F7F2] border border-[#E3E1D8] text-xs text-[#536B61] space-y-1.5"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#176B4A]">
                <Bookmark className="w-4 h-4" />
                <span>Nguồn tham chiếu giáo trình:</span>
              </div>
              <p className="leading-relaxed">
                Bài học thuộc <strong>{lesson.source.title}</strong>, do Ban Hướng Dẫn Trung Ương Gia Đình Phật Tử Việt Nam ban hành năm {lesson.source.publicationYear}. Toàn văn nội dung được số hóa chuẩn mực phục vụ Huynh trưởng và Đoàn sinh tu học.
              </p>
            </section>

            {/* Điều hướng Bài trước / Bài sau */}
            <LessonNeighbors
              previous={lesson.previous}
              next={lesson.next}
              categorySlug={lesson.category.id}
              levelSlug={lesson.level.id}
            />

            {/* Nút quay lại danh sách bài học */}
            <div className="mt-8 pt-6 border-t border-[#E3E1D8] text-center">
              <Link
                href={`/nganh-dong/${lesson.level.id}/${lesson.category.id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#176B4A] hover:text-[#12553A] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách bài học {lesson.category.name}</span>
              </Link>
            </div>
          </main>

          {/* CỘT MỤC LỤC BÀI HỌC (DESKTOP STICKY SIDEBAR) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4">
            <TableOfContents toc={lesson.toc} />
          </div>
        </div>
      </div>
    </div>
  );
}
