"use client";

import React from "react";
import { Filter, X } from "lucide-react";

interface SearchFiltersProps {
  selectedLevel: string;
  selectedCategory: string;
  onSelectLevel: (levelId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function SearchFilters({
  selectedLevel,
  selectedCategory,
  onSelectLevel,
  onSelectCategory,
  onClearAll,
  className = "",
}: SearchFiltersProps) {
  const levels = [
    { id: "", name: "Tất cả các bậc" },
    { id: "mo-mat", name: "Bậc Mở Mắt" },
    { id: "canh-mem", name: "Bậc Cánh Mềm" },
    { id: "chan-cung", name: "Bậc Chân Cứng" },
    { id: "tung-bay", name: "Bậc Tung Bay" },
  ];

  const categories = [
    { id: "", name: "Tất cả lĩnh vực" },
    { id: "phat-phap", name: "Phật pháp" },
    { id: "hoat-dong-thanh-nien", name: "HĐ Thanh niên" },
    { id: "van-nghe", name: "Văn nghệ" },
  ];

  const hasActiveFilters = Boolean(selectedLevel || selectedCategory);

  return (
    <div className={`flex flex-col gap-3 py-2 ${className}`}>
      {/* Row 1: BẬC TU HỌC */}
      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        <span className="text-xs font-semibold text-[#536B61] uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#176B4A]" />
          Bậc học:
        </span>
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(lvl.id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
                isSelected
                  ? "bg-[#176B4A] text-white shadow-xs font-semibold"
                  : "bg-white border border-[#E3E1D8] text-[#536B61] hover:text-[#24352E] hover:border-[#176B4A]/50"
              }`}
            >
              {lvl.name}
            </button>
          );
        })}
      </div>

      {/* Row 2: LĨNH VỰC TU HỌC */}
      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        <span className="text-xs font-semibold text-[#536B61] uppercase tracking-wider mr-2 shrink-0">
          Lĩnh vực:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
                isSelected
                  ? "bg-[#345E88] text-white shadow-xs font-semibold"
                  : "bg-white border border-[#E3E1D8] text-[#536B61] hover:text-[#24352E] hover:border-[#345E88]/50"
              }`}
            >
              {cat.name}
            </button>
          );
        })}

        {hasActiveFilters && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-[#8C6D2C] hover:text-[#D4AD69] font-medium ml-2 px-2 py-1 rounded-sm hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}
