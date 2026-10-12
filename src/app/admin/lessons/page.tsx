"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  BookOpen,
  Edit3,
  CheckCircle2,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  sequence: number;
  levelId: string;
  levelName: string;
  categoryId: string;
  categoryName: string;
  sourceId: string;
  sourceTitle: string;
  contentStatus: "raw_extracted" | "editing" | "ready";
  publishStatus: "draft" | "published" | "hidden";
  version: number;
  summary: string | null;
  publishedAt: string | null;
  updatedAt: string;
  hasEditedContent: boolean;
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [contentStatus, setContentStatus] = useState("");
  const [publishStatus, setPublishStatus] = useState("");

  const limit = 20;

  async function fetchLessons(currentPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", limit.toString());
      if (search.trim()) params.set("search", search.trim());
      if (levelId) params.set("levelId", levelId);
      if (categoryId) params.set("categoryId", categoryId);
      if (contentStatus) params.set("contentStatus", contentStatus);
      if (publishStatus) params.set("publishStatus", publishStatus);

      const res = await fetch(`/api/admin/lessons?${params.toString()}`);
      if (!res.ok) throw new Error("Lỗi khi tải danh sách bài học");
      const json = await res.json();
      if (json.success) {
        setLessons(json.data || []);
        if (json.meta) {
          setTotal(json.meta.total || 0);
          setTotalPages(json.meta.totalPages || 1);
          setPage(json.meta.page || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLessons(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, categoryId, contentStatus, publishStatus]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchLessons(1);
  }

  function handleResetFilters() {
    setSearch("");
    setLevelId("");
    setCategoryId("");
    setContentStatus("");
    setPublishStatus("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24352E]">
            Quản lý Học liệu Ngành Đồng
          </h1>
          <p className="text-sm text-[#536B61] mt-1">
            Danh sách 156 bài học giáo trình, theo dõi tiến độ biên tập và xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLessons(page)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#536B61] hover:text-[#24352E] hover:bg-[#FAF9F5] shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E1D8] shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7658] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mã bài học (vd: D-MM-A-01, Quy y Tam Bảo)..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-sm text-[#24352E] placeholder-[#8C7658]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B4A] transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#176B4A] text-white text-sm font-semibold rounded-xl hover:bg-[#12553A] transition-colors"
          >
            Tìm kiếm
          </button>
          {(search || levelId || categoryId || contentStatus || publishStatus) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-medium text-[#8B2626] hover:bg-red-50 rounded-xl transition-colors"
            >
              Đặt lại
            </button>
          )}
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E3E1D8]/60 text-xs">
          <div>
            <label className="block font-semibold text-[#536B61] mb-1">Bậc học</label>
            <select
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-[#24352E] focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
            >
              <option value="">Tất cả 4 bậc</option>
              <option value="mo-mat">Bậc Mở Mắt</option>
              <option value="canh-mem">Bậc Cánh Mềm</option>
              <option value="chan-cung">Bậc Chân Cứng</option>
              <option value="tung-bay">Bậc Tung Bay</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#536B61] mb-1">Lĩnh vực</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-[#24352E] focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
            >
              <option value="">Tất cả 3 lĩnh vực</option>
              <option value="phat-phap">Phật Pháp</option>
              <option value="hoat-dong-thanh-nien">Hoạt Động Thanh Niên</option>
              <option value="van-nghe">Văn Nghệ</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#536B61] mb-1">Tiến độ nội dung</label>
            <select
              value={contentStatus}
              onChange={(e) => setContentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-[#24352E] focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="raw_extracted">Thô (raw_extracted)</option>
              <option value="editing">Đang sửa (editing)</option>
              <option value="ready">Sẵn sàng (ready)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#536B61] mb-1">Xuất bản</label>
            <select
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-[#24352E] focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
            >
              <option value="">Tất cả</option>
              <option value="draft">Bản nháp (draft)</option>
              <option value="published">Đã xuất bản (published)</option>
              <option value="hidden">Ẩn (hidden)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson List Table */}
      <div className="bg-white rounded-2xl border border-[#E3E1D8] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-[#536B61] mt-3">Đang nạp dữ liệu bài học...</span>
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-[#8C7658]/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#24352E]">Không tìm thấy bài học phù hợp</h3>
            <p className="text-xs text-[#536B61] mt-1">Hãy thử nới lỏng bộ lọc tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] border-b border-[#E3E1D8] text-[#536B61]">
                <tr>
                  <th className="py-3 px-4 font-semibold w-28">Mã bài</th>
                  <th className="py-3 px-4 font-semibold">Tên bài học</th>
                  <th className="py-3 px-4 font-semibold w-32">Bậc học</th>
                  <th className="py-3 px-4 font-semibold w-36">Lĩnh vực</th>
                  <th className="py-3 px-3 font-semibold text-center w-16">Thứ tự</th>
                  <th className="py-3 px-3 font-semibold text-center w-32">Nội dung</th>
                  <th className="py-3 px-3 font-semibold text-center w-28">Xuất bản</th>
                  <th className="py-3 px-3 font-semibold text-center w-16">Bản</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E1D8]">
                {lessons.map((lesson) => {
                  return (
                    <tr key={lesson.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#176B4A]">
                        {lesson.id}
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/lessons/${lesson.id}`}
                          className="font-semibold text-sm text-[#24352E] hover:text-[#176B4A] transition-colors line-clamp-1"
                        >
                          {lesson.title}
                        </Link>
                        {lesson.summary && (
                          <p className="text-[11px] text-[#536B61] line-clamp-1 mt-0.5">
                            {lesson.summary}
                          </p>
                        )}
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4 text-[#24352E] font-medium whitespace-nowrap">
                        {lesson.levelName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#536B61] whitespace-nowrap">
                        {lesson.categoryName}
                      </td>

                      {/* Sequence */}
                      <td className="py-3 px-3 text-center font-mono text-[#536B61]">
                        #{lesson.sequence}
                      </td>

                      {/* Content Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {lesson.contentStatus === "ready" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Sẵn sàng
                          </span>
                        ) : lesson.contentStatus === "editing" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <Edit3 className="w-3 h-3" />
                            Đang sửa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                            <Clock className="w-3 h-3" />
                            Thô PDF
                          </span>
                        )}
                      </td>

                      {/* Publish Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {lesson.publishStatus === "published" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Đã xuất bản
                          </span>
                        ) : lesson.publishStatus === "hidden" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Bản nháp
                          </span>
                        )}
                      </td>

                      {/* Version */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-[#536B61]">
                        v{lesson.version}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/lessons/${lesson.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#FAF9F5] hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-xs font-semibold text-[#176B4A] transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Biên tập</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#FAF9F5] border-t border-[#E3E1D8] flex items-center justify-between text-xs text-[#536B61]">
          <div>
            Hiển thị <span className="font-semibold text-[#24352E]">{lessons.length}</span> /{" "}
            <span className="font-semibold text-[#24352E]">{total}</span> bài học
          </div>

          <div className="flex items-center gap-2">
            <span>
              Trang <span className="font-semibold text-[#24352E]">{page}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (page > 1) {
                    const prev = page - 1;
                    setPage(prev);
                    fetchLessons(prev);
                  }
                }}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#D5D3C8] bg-white hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (page < totalPages) {
                    const next = page + 1;
                    setPage(next);
                    fetchLessons(next);
                  }
                }}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#D5D3C8] bg-white hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
