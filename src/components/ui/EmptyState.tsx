import React from "react";
import Link from "next/link";
import { BookOpen, Search, ArrowLeft } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: "book" | "search" | "lotus";
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "book",
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-[16px] border border-[#E3E1D8] bg-white/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6 max-w-2xl mx-auto shadow-xs ${className}`}
    >
      {/* Icon Circle */}
      <div className="w-16 h-16 rounded-full bg-[#EBF4F0] flex items-center justify-center text-[#176B4A] mb-4">
        {icon === "search" ? (
          <Search className="w-8 h-8 text-[#345E88]" aria-hidden="true" />
        ) : icon === "lotus" ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-[#176B4A]"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="M12 3c-3 4-7 8-7 13a7 7 0 0 0 7 5" />
            <path d="M12 3c3 4 7 8 7 13a7 7 0 0 1-7 5" />
            <path d="M12 10c-2 2-4 5-4 8a4 4 0 0 0 4 3" />
            <path d="M12 10c2 2 4 5 4 8a4 4 0 0 1-4 3" />
          </svg>
        ) : (
          <BookOpen className="w-8 h-8 text-[#176B4A]" aria-hidden="true" />
        )}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-[#24352E] mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-[#536B61] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionText && (
        <div>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {actionText}
              </Button>
            </Link>
          ) : onAction ? (
            <Button variant="outline" size="sm" onClick={onAction} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {actionText}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
