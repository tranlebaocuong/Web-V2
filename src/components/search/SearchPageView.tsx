"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Sparkles, Filter, X, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "./SearchBar";
import { SearchFilters } from "./SearchFilters";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchHitItem } from "@/lib/dal/search";

interface SearchPageViewProps {
  query: string;
  level: string;
  category: string;
  currentPage: number;
  results: {
    items: SearchHitItem[];
    total: number;
    totalPages: number;
  };
}

const POPULAR_SUGGESTIONS = [
  "Lịch sử Đức Phật Thích Ca",
  "Huy hiệu Hoa Sen",
  "Em đến chùa",
  "Châm ngôn Oanh Vũ",
  "Gút dây",
  "Lục hòa",
  "Trầm Hương Đốt",
  "Vệ sinh thân thể",
];

export function SearchPageView({
  query,
  level,
  category,
  currentPage,
  results,
}: SearchPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchUrl = (paramsToUpdate: {
    q?: string;
    level?: string;
    category?: string;
    page?: number;
  }) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (paramsToUpdate.q !== undefined) {
      if (paramsToUpdate.q) nextParams.set("q", paramsToUpdate.q);
      else nextParams.delete("q");
      nextParams.delete("page"); // Reset page on new query
    }

    if (paramsToUpdate.level !== undefined) {
      if (paramsToUpdate.level) nextParams.set("level", paramsToUpdate.level);
      else nextParams.delete("level");
      nextParams.delete("page");
    }

    if (paramsToUpdate.category !== undefined) {
      if (paramsToUpdate.category) nextParams.set("category", paramsToUpdate.category);
      else nextParams.delete("category");
      nextParams.delete("page");
    }

    if (paramsToUpdate.page !== undefined) {
      if (paramsToUpdate.page > 1) nextParams.set("page", paramsToUpdate.page.toString());
      else nextParams.delete("page");
    }

    const nextUrl = `/tim-kiem${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
    router.push(nextUrl);
  };

  const handleSearchSubmit = (newQ: string) => {
    updateSearchUrl({ q: newQ });
  };

  const handleLevelSelect = (newLevel: string) => {
    updateSearchUrl({ level: newLevel });
  };

  const handleCategorySelect = (newCat: string) => {
    updateSearchUrl({ category: newCat });
  };

  const handleClearFilters = () => {
    updateSearchUrl({ level: "", category: "" });
  };

  const createPageUrl = (pageNumber: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (pageNumber > 1) nextParams.set("page", pageNumber.toString());
    else nextParams.delete("page");
    return `/tim-kiem${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
  };

  return (
    <div className="py-8 lg:py-12 space-y-8">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: "Tra cứu học liệu" }]}
          className="mb-6"
        />

        {/* Search Header Banner */}
        <div className="rounded-[20px] bg-white border border-[#E3E1D8] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary">
                <Search className="w-3 h-3 mr-1" />
                Tra cứu Tiếng Việt
              </Badge>
              <Badge variant="accent">Hỗ trợ có dấu & không dấu</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#176B4A] tracking-tight">
              Tìm kiếm Toàn Thư viện Tu học
            </h1>
            <p className="text-xs sm:text-sm text-[#536B61] leading-relaxed">
              Nhập tên bài học, nhân vật, sự kiện, kỹ năng chuyên môn hoặc từ khóa bất kỳ để tra cứu nhanh trong 156 bài học giáo trình.
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <SearchBar
            initialQuery={query}
            onSearch={handleSearchSubmit}
            placeholder="Nhập từ khóa tìm kiếm (ví dụ: Đức Phật Thích Ca, Huy hiệu hoa sen...)"
            autoFocus={!query}
          />

          {/* Bộ lọc Bậc học & Lĩnh vực */}
          <SearchFilters
            selectedLevel={level}
            selectedCategory={category}
            onSelectLevel={handleLevelSelect}
            onSelectCategory={handleCategorySelect}
            onClearAll={handleClearFilters}
          />
        </div>

        {/* NỘI DUNG KẾT QUẢ TÌM KIẾM */}
        {query ? (
          /* Khi đã nhập từ khóa */
          results.items.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-[#536B61]">
                <span>
                  Tìm thấy <strong className="text-[#176B4A]">{results.total}</strong> bài học phù hợp với từ khóa &ldquo;{query}&rdquo;
                </span>
                <span>
                  Trang {currentPage} / {results.totalPages}
                </span>
              </div>

              {/* Danh sách kết quả */}
              <div className="grid grid-cols-1 gap-3.5">
                {results.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[14px] border border-[#E3E1D8] bg-white p-5 hover:border-[#176B4A] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="primary">{item.level.name}</Badge>
                        <Badge variant="secondary">{item.category.name}</Badge>
                        <span className="text-[#536B61] font-mono">
                          {item.id} • Bài {item.sequence}
                        </span>
                      </div>

                      <Link href={`/bai-hoc/${item.slug}`}>
                        <h3 className="text-base sm:text-lg font-bold text-[#24352E] group-hover:text-[#176B4A] transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>

                      {item.summary && (
                        <p className="text-xs sm:text-sm text-[#536B61] line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center">
                      <Link href={`/bai-hoc/${item.slug}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:bg-[#176B4A] group-hover:text-white transition-all gap-1.5"
                        >
                          <span>Đọc bài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang */}
              <Pagination
                currentPage={currentPage}
                totalPages={results.totalPages}
                createPageUrl={createPageUrl}
              />
            </div>
          ) : (
            /* Không tìm thấy kết quả nào */
            <div className="space-y-8">
              <EmptyState
                icon="search"
                title="Không tìm thấy bài học phù hợp"
                description={`Không có bài học nào khớp với từ khóa "${query}"${
                  level || category ? " theo bộ lọc hiện tại" : ""
                }. Bạn hãy thử tìm kiếm với từ khóa ngắn hơn, bỏ dấu tiếng Việt hoặc xóa bộ lọc.`}
                actionText="Xóa bộ lọc & thử lại"
                onAction={() => updateSearchUrl({ q: "", level: "", category: "" })}
              />

              {/* Gợi ý từ khóa mẫu */}
              <div className="rounded-[16px] border border-[#E3E1D8] bg-white p-6 max-w-2xl mx-auto text-center space-y-3">
                <h4 className="text-xs font-bold text-[#176B4A] uppercase tracking-wider">
                  Gợi ý từ khóa thường gặp
                </h4>
                <div className="flex items-center justify-center flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((kw, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSearchSubmit(kw)}
                      className="px-3 py-1.5 rounded-full bg-[#F8F7F2] border border-[#E3E1D8] text-xs text-[#24352E] hover:border-[#176B4A] hover:text-[#176B4A] transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Trạng thái chưa nhập từ khóa (Initial State) */
          <div className="rounded-[16px] border border-[#E3E1D8] bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EBF4F0] text-[#176B4A] flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#24352E]">
              Khám phá Kho học liệu Tủ Sách Áo Lam
            </h3>
            <p className="text-xs sm:text-sm text-[#536B61] max-w-md mx-auto leading-relaxed">
              Bạn có thể nhập tên bài học ở ô phía trên hoặc chọn nhanh một trong các chủ đề gợi ý bên dưới để bắt đầu tra cứu:
            </p>

            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              {POPULAR_SUGGESTIONS.map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSearchSubmit(kw)}
                  className="px-3.5 py-2 rounded-full bg-[#F8F7F2] border border-[#E3E1D8] text-xs sm:text-sm text-[#24352E] hover:border-[#176B4A] hover:bg-[#EBF4F0] hover:text-[#176B4A] font-medium transition-all"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
