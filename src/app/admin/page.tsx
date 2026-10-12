"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Clock,
  Image as ImageIcon,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Shield,
  Layers,
} from "lucide-react";

interface DashboardData {
  overview: {
    totalLessons: number;
    publishedLessons: number;
    draftLessons: number;
    hiddenLessons: number;
    rawExtractedLessons: number;
    editingLessons: number;
    readyLessons: number;
    totalImages: number;
  };
  levels: Array<{
    id: string;
    name: string;
    slug: string;
    total: number;
    published: number;
    ready: number;
    editing: number;
    raw: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    total: number;
    published: number;
    ready: number;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    metadata: any;
    actor: { id: string; email: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard/stats");
        if (!res.ok) throw new Error("Không thể tải thống kê bảng điều khiển.");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Lỗi lấy dữ liệu.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-[#536B61] mt-3">Đang cập nhật số liệu học liệu...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-base">Lỗi tải dữ liệu Dashboard</h2>
        </div>
        <p className="mt-2 text-sm">{error || "Không có dữ liệu thống kê."}</p>
      </div>
    );
  }

  const { overview, levels, categories, recentAuditLogs } = data;

  return (
    <div className="space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24352E]">
            Bảng điều khiển Học vụ
          </h1>
          <p className="text-sm text-[#536B61] mt-1">
            Tổng quan tiến độ số hóa và biên tập 156 bài học Ngành Đồng — Gia Đình Phật Tử Việt Nam.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/lessons"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B4A] text-white rounded-xl text-sm font-semibold hover:bg-[#12553A] shadow-xs transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Quản lý 156 bài học</span>
          </Link>
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#24352E] border border-[#D5D3C8] rounded-xl text-sm font-semibold hover:bg-[#FAF9F5] shadow-xs transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#8C7658]" />
            <span>Thư viện ảnh</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Lessons */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Tổng số bài</span>
            <div className="p-2 bg-[#176B4A]/10 rounded-xl text-[#176B4A]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#24352E]">{overview.totalLessons}</div>
            <span className="text-[11px] text-[#536B61]">Giáo trình Ngành Đồng</span>
          </div>
        </div>

        {/* Card 2: Published Lessons */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Đã xuất bản</span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-700">{overview.publishedLessons}</div>
            <span className="text-[11px] text-[#536B61]">Hiển thị công khai</span>
          </div>
        </div>

        {/* Card 3: Draft Lessons */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Bản nháp</span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-700">{overview.draftLessons}</div>
            <span className="text-[11px] text-[#536B61]">Chưa công khai</span>
          </div>
        </div>

        {/* Card 4: Ready for Publish */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Sẵn sàng duyệt</span>
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-blue-700">{overview.readyLessons}</div>
            <span className="text-[11px] text-[#536B61]">Đã đủ chuẩn xuất bản</span>
          </div>
        </div>

        {/* Card 5: Raw Extracted */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Dữ liệu thô</span>
            <div className="p-2 bg-stone-100 rounded-xl text-stone-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#8C7658]">{overview.rawExtractedLessons}</div>
            <span className="text-[11px] text-[#536B61]">Chờ biên tập viên</span>
          </div>
        </div>

        {/* Card 6: Media Images */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#536B61]">Tài nguyên ảnh</span>
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-purple-700">{overview.totalImages}</div>
            <span className="text-[11px] text-[#536B61]">Đã lưu trữ nội bộ</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Levels Breakdown & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): 4 Levels Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E3E1D8] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#24352E]">Tiến độ 4 Bậc tu học Ngành Đồng</h2>
              <p className="text-xs text-[#536B61]">Trạng thái biên tập và xuất bản theo phân cấp học vụ</p>
            </div>
            <Link
              href="/admin/lessons"
              className="text-xs font-semibold text-[#176B4A] hover:underline flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {levels.map((lvl) => {
              const readyPct = Math.round((lvl.ready / lvl.total) * 100);
              const pubPct = Math.round((lvl.published / lvl.total) * 100);
              return (
                <div key={lvl.id} className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E3E1D8]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#176B4A]" />
                      <span className="font-bold text-sm text-[#24352E]">{lvl.name}</span>
                      <span className="text-xs font-medium text-[#536B61]">({lvl.total} bài)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-700 font-semibold">{lvl.published} xuất bản</span>
                      <span className="text-blue-700 font-medium">{lvl.ready} sẵn sàng</span>
                      <span className="text-stone-500">{lvl.raw} thô</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3 w-full bg-[#EAE8E0] h-2.5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(lvl.published / lvl.total) * 100}%` }}
                      className="bg-emerald-600 h-full"
                      title={`Đã xuất bản: ${lvl.published}`}
                    />
                    <div
                      style={{ width: `${(lvl.ready / lvl.total) * 100}%` }}
                      className="bg-blue-500 h-full"
                      title={`Sẵn sàng: ${lvl.ready}`}
                    />
                    <div
                      style={{ width: `${(lvl.editing / lvl.total) * 100}%` }}
                      className="bg-amber-400 h-full"
                      title={`Đang sửa: ${lvl.editing}`}
                    />
                    <div
                      style={{ width: `${(lvl.raw / lvl.total) * 100}%` }}
                      className="bg-stone-300 h-full"
                      title={`Bài thô: ${lvl.raw}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 span): Categories & Quick Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E3E1D8] shadow-xs">
            <h2 className="text-lg font-bold text-[#24352E] mb-1">3 Lĩnh vực giáo trình</h2>
            <p className="text-xs text-[#536B61] mb-4">Cơ cấu bài học theo chuyên môn</p>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E3E1D8] flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#24352E]">{cat.name}</div>
                    <div className="text-xs text-[#536B61] mt-0.5">{cat.total} bài học</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md bg-[#176B4A]/10 text-[#176B4A] text-xs font-semibold">
                      {cat.published}/{cat.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E3E1D8]">
            <div className="flex items-center gap-2 text-[#176B4A]">
              <Shield className="w-5 h-5" />
              <h3 className="font-bold text-sm">Chính sách bảo toàn Master Data</h3>
            </div>
            <p className="mt-2 text-xs text-[#536B61] leading-relaxed">
              Dữ liệu thô gốc trích xuất từ 4 tập giáo trình PDF luôn được bảo vệ bất biến trong bảng <code className="text-[#176B4A] font-mono">lesson_raw_contents</code>. Toàn bộ thao tác biên tập được lưu độc lập vào bảng <code className="text-[#176B4A] font-mono">lesson_contents</code> kèm lịch sử phiên bản <code className="text-[#176B4A] font-mono">lesson_revisions</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3E1D8] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#24352E]">Hoạt động quản trị gần đây</h2>
            <p className="text-xs text-[#536B61]">Nhật ký vết kiểm toán của biên tập viên và quản trị viên</p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-[#176B4A] hover:underline flex items-center gap-1"
          >
            <span>Toàn bộ nhật ký</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#536B61]">
            Chưa có ghi nhận hoạt động nào gần đây.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E3E1D8] text-[#536B61]">
                  <th className="py-2.5 font-semibold">Thời gian</th>
                  <th className="py-2.5 font-semibold">Người thực hiện</th>
                  <th className="py-2.5 font-semibold">Hành động</th>
                  <th className="py-2.5 font-semibold">Đối tượng</th>
                  <th className="py-2.5 font-semibold">Mã đối tượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E1D8]">
                {recentAuditLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString("vi-VN");
                  return (
                    <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-2.5 text-[#536B61] whitespace-nowrap">{dateStr}</td>
                      <td className="py-2.5 font-medium text-[#24352E]">
                        {log.actor ? log.actor.email : "Hệ thống"}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-[#EAE8E0] text-[#24352E]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#536B61] uppercase">{log.entityType}</td>
                      <td className="py-2.5 font-mono text-[#176B4A] font-medium">{log.entityId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
