"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Layers,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actor: { email: string; role: string } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const limit = 25;

  async function fetchLogs(currentPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", limit.toString());
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Lỗi nạp nhật ký kiểm toán.");
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
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
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entityType]);

  function getActionBadge(act: string) {
    if (act.includes("PUBLISH") && !act.includes("UNPUBLISH")) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
          {act}
        </span>
      );
    }
    if (act.includes("UNPUBLISH")) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-100 text-amber-800">
          {act}
        </span>
      );
    }
    if (act.includes("READY")) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-100 text-blue-800">
          {act}
        </span>
      );
    }
    if (act.includes("UPDATE")) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-100 text-purple-800">
          {act}
        </span>
      );
    }
    if (act.includes("AUTH")) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-stone-200 text-stone-800">
          {act}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#EAE8E0] text-[#24352E]">
        {act}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24352E]">
            Nhật ký Hoạt động Quản trị (Audit Trail)
          </h1>
          <p className="text-sm text-[#536B61] mt-1">
            Ghi nhận toàn diện lịch sử xác thực, biên tập nội dung, duyệt bài và thay đổi trạng thái.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#536B61] hover:text-[#24352E] shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3E1D8] shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C7658]" />
          <span className="font-semibold text-[#24352E]">Lọc theo hành động:</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
          >
            <option value="">Tất cả hành động</option>
            <option value="LESSON_UPDATE_CONTENT">LESSON_UPDATE_CONTENT (Lưu bản nháp)</option>
            <option value="LESSON_MARK_READY">LESSON_MARK_READY (Đánh dấu sẵn sàng)</option>
            <option value="LESSON_PUBLISH">LESSON_PUBLISH (Xuất bản)</option>
            <option value="LESSON_UNPUBLISH">LESSON_UNPUBLISH (Hủy xuất bản)</option>
            <option value="MEDIA_UPLOAD">MEDIA_UPLOAD (Tải ảnh)</option>
            <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS (Đăng nhập)</option>
            <option value="AUTH_LOGOUT">AUTH_LOGOUT (Đăng xuất)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#24352E]">Đối tượng:</span>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
          >
            <option value="">Tất cả đối tượng</option>
            <option value="lesson">Bài học (lesson)</option>
            <option value="media">Hình ảnh (media)</option>
            <option value="auth">Tài khoản (auth)</option>
          </select>
        </div>

        {(action || entityType) && (
          <button
            onClick={() => {
              setAction("");
              setEntityType("");
              setPage(1);
            }}
            className="text-xs text-[#8B2626] hover:underline font-medium"
          >
            Bỏ lọc
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E3E1D8] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#536B61] mt-2">Đang nạp nhật ký kiểm toán...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#536B61]">
            <History className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p>Không có bản ghi kiểm toán nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] border-b border-[#E3E1D8] text-[#536B61]">
                <tr>
                  <th className="py-3 px-4 font-semibold w-36">Thời gian</th>
                  <th className="py-3 px-4 font-semibold w-48">Tài khoản thực hiện</th>
                  <th className="py-3 px-4 font-semibold w-48">Hành động</th>
                  <th className="py-3 px-3 font-semibold w-24">Đối tượng</th>
                  <th className="py-3 px-4 font-semibold w-32">Mã đối tượng</th>
                  <th className="py-3 px-4 font-semibold">Chi tiết Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E1D8]">
                {logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString("vi-VN");
                  return (
                    <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#536B61] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#24352E]">
                        {log.actor ? log.actor.email : "Hệ thống"}
                      </td>
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-[#536B61]">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#176B4A] font-semibold">
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 text-[#536B61]">
                        {log.metadata ? (
                          <pre className="font-mono text-[10px] bg-[#FAF9F5] p-1.5 rounded border border-[#E3E1D8] max-h-16 overflow-y-auto whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-stone-400 italic">—</span>
                        )}
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
            Hiển thị <span className="font-semibold text-[#24352E]">{logs.length}</span> /{" "}
            <span className="font-semibold text-[#24352E]">{total}</span> hoạt động
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
                    fetchLogs(prev);
                  }
                }}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#D5D3C8] bg-white hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (page < totalPages) {
                    const next = page + 1;
                    setPage(next);
                    fetchLogs(next);
                  }
                }}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#D5D3C8] bg-white hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed"
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
