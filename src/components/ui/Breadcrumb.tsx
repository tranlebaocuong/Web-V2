import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Đường dẫn liên kết" className={`flex items-center text-xs sm:text-sm text-[#536B61] ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center hover:text-[#176B4A] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A] rounded-xs"
            title="Về Trang chủ"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 shrink-0" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Trang chủ</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-[#536B61]/50 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  className="font-medium text-[#24352E] truncate max-w-[200px] sm:max-w-[340px]"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#176B4A] transition-colors truncate max-w-[150px] sm:max-w-[240px] focus-visible:outline-2 focus-visible:outline-[#176B4A] rounded-xs"
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
