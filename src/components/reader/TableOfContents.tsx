"use client";

import React, { useEffect, useState } from "react";
import { TocItem } from "@/types/editor";
import { List, ChevronDown, ChevronUp } from "lucide-react";

interface TableOfContentsProps {
  toc: TocItem[];
  className?: string;
  isMobileDrawer?: boolean;
}

export function TableOfContents({
  toc,
  className = "",
  isMobileDrawer = false,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!toc || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible heading
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (!toc || toc.length === 0) {
    return null;
  }

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      if (isMobileDrawer) {
        setMobileExpanded(false);
      }
    }
  };

  // Mobile Accordion view
  if (isMobileDrawer) {
    return (
      <div className={`rounded-[14px] border border-[#E3E1D8] bg-white p-3.5 mb-6 shadow-xs ${className}`}>
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          aria-expanded={mobileExpanded}
          className="w-full flex items-center justify-between text-left font-bold text-sm text-[#176B4A]"
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Mục lục bài học ({toc.length} mục)</span>
          </div>
          {mobileExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {mobileExpanded && (
          <nav aria-label="Mục lục bài học" className="mt-3 pt-3 border-t border-[#E3E1D8]/60">
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {toc.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li
                    key={item.id}
                    className={item.level === 3 ? "pl-4" : "pl-0"}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleScrollTo(e, item.id)}
                      className={`block py-1 px-2 rounded-[6px] transition-colors ${
                        isActive
                          ? "bg-[#EBF4F0] font-semibold text-[#176B4A]"
                          : "text-[#536B61] hover:text-[#24352E] hover:bg-black/5"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    );
  }

  // Desktop Sticky Sidebar view
  return (
    <aside
      aria-label="Mục lục bài học"
      className={`sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto rounded-[16px] border border-[#E3E1D8] bg-white/80 p-5 backdrop-blur-xs shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E3E1D8] text-[#176B4A]">
        <List className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Mục lục bài học</h3>
      </div>

      <nav>
        <ul className="space-y-1 text-sm">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={item.level === 3 ? "pl-3.5" : "pl-0"}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(e, item.id)}
                  className={`block py-1.5 px-2.5 rounded-[8px] transition-all leading-snug ${
                    isActive
                      ? "bg-[#EBF4F0] font-semibold text-[#176B4A] shadow-2xs"
                      : "text-[#536B61] hover:text-[#24352E] hover:bg-black/5"
                  }`}
                >
                  <span className="line-clamp-2">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
