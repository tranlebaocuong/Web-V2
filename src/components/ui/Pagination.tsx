import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  createPageUrl?: (page: number) => string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  createPageUrl,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Compute page numbers to display
  const pages: (number | string)[] = [];
  const delta = 1; // Show current +/- 1 page

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const renderPageItem = (p: number | string, index: number) => {
    if (typeof p === "string") {
      return (
        <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-[#536B61]/60 select-none">
          …
        </span>
      );
    }

    const isCurrent = p === currentPage;
    const baseClass =
      "min-w-[40px] h-[40px] flex items-center justify-center rounded-[10px] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]";
    const activeClass = isCurrent
      ? "bg-[#176B4A] text-white font-semibold shadow-xs"
      : "text-[#24352E] hover:bg-black/5 hover:text-[#176B4A]";

    if (createPageUrl) {
      return (
        <Link
          key={p}
          href={createPageUrl(p)}
          className={`${baseClass} ${activeClass}`}
          aria-current={isCurrent ? "page" : undefined}
          aria-label={`Trang ${p}`}
        >
          {p}
        </Link>
      );
    }

    return (
      <button
        key={p}
        type="button"
        onClick={() => onPageChange?.(p)}
        className={`${baseClass} ${activeClass}`}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={`Trang ${p}`}
      >
        {p}
      </button>
    );
  };

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  const btnNavClass = (disabled: boolean) =>
    `min-h-[40px] px-3 flex items-center gap-1 rounded-[10px] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
      disabled
        ? "text-[#536B61]/40 cursor-not-allowed"
        : "text-[#24352E] hover:bg-black/5 hover:text-[#176B4A]"
    }`;

  return (
    <nav
      aria-label="Điều hướng phân trang"
      className={`flex items-center justify-center gap-1 sm:gap-2 my-8 ${className}`}
    >
      {/* Nút Trước */}
      {createPageUrl ? (
        hasPrev ? (
          <Link
            href={createPageUrl(prevPage)}
            className={btnNavClass(false)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </Link>
        ) : (
          <span className={btnNavClass(true)} aria-hidden="true">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </span>
        )
      ) : (
        <button
          type="button"
          onClick={() => onPageChange?.(prevPage)}
          disabled={!hasPrev}
          className={btnNavClass(!hasPrev)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>
      )}

      {/* Danh sách trang */}
      <div className="flex items-center gap-1">{pages.map(renderPageItem)}</div>

      {/* Nút Sau */}
      {createPageUrl ? (
        hasNext ? (
          <Link
            href={createPageUrl(nextPage)}
            className={btnNavClass(false)}
            aria-label="Trang kế tiếp"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className={btnNavClass(true)} aria-hidden="true">
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        )
      ) : (
        <button
          type="button"
          onClick={() => onPageChange?.(nextPage)}
          disabled={!hasNext}
          className={btnNavClass(!hasNext)}
          aria-label="Trang kế tiếp"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
}
