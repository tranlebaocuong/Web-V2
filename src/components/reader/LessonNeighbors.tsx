import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { PublicLessonNeighbor } from "@/lib/dal/lessons";

interface LessonNeighborsProps {
  previous: PublicLessonNeighbor | null;
  next: PublicLessonNeighbor | null;
  categorySlug?: string;
  levelSlug?: string;
  className?: string;
}

export function LessonNeighbors({
  previous,
  next,
  categorySlug,
  levelSlug,
  className = "",
}: LessonNeighborsProps) {
  if (!previous && !next) return null;

  return (
    <section
      aria-label="Điều hướng bài học kế tiếp"
      className={`border-t border-[#E3E1D8] pt-8 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}
    >
      {/* 1. BÀI TRƯỚC (PREVIOUS) */}
      {previous ? (
        <Link
          href={`/bai-hoc/${previous.slug}`}
          className="group flex flex-col p-4 sm:p-5 rounded-[14px] border border-[#E3E1D8] bg-white hover:border-[#176B4A] hover:bg-[#F8F7F2] transition-all shadow-xs min-h-[72px] focus-visible:outline-2 focus-visible:outline-[#176B4A]"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#536B61] group-hover:text-[#176B4A] mb-1">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>BÀI TRƯỚC • BÀI {previous.sequence}</span>
          </div>
          <span className="font-bold text-sm sm:text-base text-[#24352E] group-hover:text-[#176B4A] line-clamp-2 transition-colors">
            {previous.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" aria-hidden="true" />
      )}

      {/* 2. BÀI SAU (NEXT) */}
      {next ? (
        <Link
          href={`/bai-hoc/${next.slug}`}
          className="group flex flex-col sm:items-end text-left sm:text-right p-4 sm:p-5 rounded-[14px] border border-[#E3E1D8] bg-white hover:border-[#176B4A] hover:bg-[#F8F7F2] transition-all shadow-xs min-h-[72px] focus-visible:outline-2 focus-visible:outline-[#176B4A]"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#536B61] group-hover:text-[#176B4A] mb-1 sm:flex-row-reverse">
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span>BÀI KẾ TIẾP • BÀI {next.sequence}</span>
          </div>
          <span className="font-bold text-sm sm:text-base text-[#24352E] group-hover:text-[#176B4A] line-clamp-2 transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="p-4 sm:p-5 rounded-[14px] border border-dashed border-[#E3E1D8] bg-white/40 flex items-center justify-center text-xs text-[#536B61] italic text-center min-h-[72px]">
          <BookOpen className="w-4 h-4 mr-1.5 text-[#536B61]/60" />
          Đây là bài học cuối cùng trong chương này.
        </div>
      )}
    </section>
  );
}
