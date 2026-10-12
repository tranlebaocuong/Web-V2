"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  initialQuery = "",
  onSearch,
  placeholder = "Nhập tên bài học, chủ đề (ví dụ: Đức Phật Thích Ca, Huy hiệu hoa sen...)",
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    } else {
      // Default navigation to search page
      window.location.href = `/tim-kiem?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${className}`}
      role="search"
      aria-label="Tìm kiếm bài học"
    >
      <div className="flex items-center w-full rounded-[16px] border border-[#E3E1D8] bg-white p-2 shadow-xs focus-within:border-[#176B4A] focus-within:ring-2 focus-within:ring-[#176B4A]/20 transition-all">
        <Search className="w-5 h-5 text-[#536B61] ml-3 shrink-0" aria-hidden="true" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-[#24352E] placeholder:text-[#536B61]/60 focus:outline-hidden"
          aria-label="Từ khóa tìm kiếm"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#536B61] hover:text-[#24352E] hover:bg-black/5 transition-colors mr-1 focus-visible:outline-2 focus-visible:outline-[#176B4A]"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <Button
          type="submit"
          size="sm"
          variant="primary"
          className="shrink-0 min-h-[40px] px-4"
        >
          Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
