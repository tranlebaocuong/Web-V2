"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Globe,
  Archive,
  AlertTriangle,
  FileText,
  Eye,
  Columns,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  History,
  Upload,
  RefreshCw,
  Clock,
  Edit3,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { ContentBlock, LessonContentJson } from "@/types/editor";
import { ContentRenderer } from "@/components/reader/ContentRenderer";

interface RawPage {
  pdf_page?: number;
  raw_text?: string;
}

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [summary, setSummary] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);
  const [contentStatus, setContentStatus] = useState<string>("raw_extracted");
  const [publishStatus, setPublishStatus] = useState<string>("draft");

  // View Layout mode: 'split-3' | 'split-2-raw' | 'split-2-preview' | 'editor-only'
  const [viewMode, setViewMode] = useState<"split-3" | "editor-raw" | "editor-preview" | "editor-only">("split-3");
  const [showRevisions, setShowRevisions] = useState(false);

  // Status & Notifications
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "conflict"; text: string } | null>(null);

  async function fetchLessonData() {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) throw new Error("Không thể tải thông tin bài học.");
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        setLesson(data);
        setCurrentVersion(data.version);
        setContentStatus(data.contentStatus);
        setPublishStatus(data.publishStatus);
        setSummary(data.summary || "");

        // Initialize blocks from content or empty
        const initialBlocks = (data.content?.contentJson as LessonContentJson)?.blocks;
        if (Array.isArray(initialBlocks) && initialBlocks.length > 0) {
          setBlocks(initialBlocks);
        } else {
          // If no content yet, extract initial draft paragraph from raw content if available
          const rawPages: RawPage[] = (data.rawContent?.pagesJson as any) || [];
          if (rawPages.length > 0 && rawPages[0]?.raw_text) {
            setBlocks([
              {
                id: `heading-${Date.now()}`,
                type: "heading",
                level: 2,
                text: data.title,
              },
              {
                id: `para-${Date.now() + 1}`,
                type: "paragraph",
                text: rawPages[0].raw_text.substring(0, 300) + "...",
              },
            ]);
          } else {
            setBlocks([
              {
                id: `heading-${Date.now()}`,
                type: "heading",
                level: 2,
                text: data.title,
              },
              {
                id: `para-${Date.now() + 1}`,
                type: "paragraph",
                text: "",
              },
            ]);
          }
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Lỗi nạp bài học." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLessonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Block manipulations
  function handleAddBlock(type: "heading" | "paragraph" | "list" | "image" | "callout") {
    const id = `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let newBlock: ContentBlock;

    switch (type) {
      case "heading":
        newBlock = { id, type: "heading", level: 2, text: "" };
        break;
      case "paragraph":
        newBlock = { id, type: "paragraph", text: "" };
        break;
      case "list":
        newBlock = { id, type: "list", ordered: false, items: [""] };
        break;
      case "image":
        newBlock = { id, type: "image", url: "", caption: "", altText: "" };
        break;
      case "callout":
        newBlock = { id, type: "callout", variant: "info", title: "", text: "" };
        break;
    }

    setBlocks([...blocks, newBlock]);
  }

  function handleUpdateBlock(index: number, updated: ContentBlock) {
    const updatedBlocks = [...blocks];
    updatedBlocks[index] = updated;
    setBlocks(updatedBlocks);
  }

  function handleRemoveBlock(index: number) {
    const updated = blocks.filter((_, idx) => idx !== index);
    setBlocks(updated);
  }

  function handleMoveBlock(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  }

  // Save Draft (PATCH) with Optimistic Concurrency Control
  async function handleSaveDraft() {
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      version: currentVersion,
      summary: summary || null,
      contentJson: {
        version: 1,
        blocks,
      },
    };

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 409) {
        // Concurrency conflict
        setStatusMessage({
          type: "conflict",
          text: json.error?.message || "Xung đột sửa đổi đồng thời. Bài học đã được cập nhật bởi phiên khác.",
        });
        return;
      }

      if (!res.ok || !json.success) {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Lỗi lưu bản nháp.",
        });
        return;
      }

      // Success
      setCurrentVersion(json.data.version);
      setContentStatus(json.data.contentStatus);
      setStatusMessage({
        type: "success",
        text: `Đã lưu thành công bản nháp (Phiên bản v${json.data.version}).`,
      });
      // Refresh lesson details to get latest revisions
      const refreshed = await fetch(`/api/admin/lessons/${lessonId}`).then((r) => r.json());
      if (refreshed.success) setLesson(refreshed.data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Không thể kết nối đến máy chủ." });
    } finally {
      setSaving(false);
    }
  }

  // Mark Ready (POST)
  async function handleMarkReady() {
    setSaving(true);
    setStatusMessage(null);

    try {
      // First save current draft
      await handleSaveDraft();

      const res = await fetch(`/api/admin/lessons/${lessonId}/mark-ready`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Không thể chuyển sang trạng thái Sẵn sàng.",
        });
        return;
      }

      setContentStatus("ready");
      setStatusMessage({
        type: "success",
        text: "Bài học đã được đánh dấu SẴN SÀNG xuất bản.",
      });
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi thực hiện thao tác." });
    } finally {
      setSaving(false);
    }
  }

  // Publish (POST)
  async function handlePublish() {
    if (contentStatus !== "ready") {
      setStatusMessage({
        type: "error",
        text: "Chỉ được phép xuất bản khi bài học ở trạng thái Sẵn sàng (ready). Vui lòng kiểm tra lại nội dung và bấm 'Đánh dấu Sẵn sàng' trước.",
      });
      return;
    }

    setPublishing(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/publish`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Lỗi xuất bản bài học.",
        });
        return;
      }

      setPublishStatus("published");
      setStatusMessage({
        type: "success",
        text: "Bài học đã được XUẤT BẢN công khai thành công!",
      });
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối khi xuất bản." });
    } finally {
      setPublishing(false);
    }
  }

  // Unpublish (POST)
  async function handleUnpublish() {
    setPublishing(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/unpublish`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Lỗi thu hồi xuất bản.",
        });
        return;
      }

      setPublishStatus("draft");
      setStatusMessage({
        type: "success",
        text: "Đã thu hồi bài học về trạng thái Bản nháp (draft).",
      });
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối." });
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-[#536B61] mt-3">Đang mở trình biên tập bài học...</span>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <h2 className="font-semibold text-base">Không tìm thấy bài học</h2>
        <p className="mt-2 text-sm">Mã bài học không tồn tại trong hệ thống.</p>
        <Link href="/admin/lessons" className="mt-4 inline-block text-xs font-semibold underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const rawPages: RawPage[] = (lesson.rawContent?.pagesJson as any) || [];

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-[#E3E1D8]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#536B61] mb-1">
            <Link href="/admin/lessons" className="hover:text-[#176B4A] flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quản lý bài học</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-[#176B4A] font-bold">{lesson.id}</span>
            <span>/</span>
            <span className="truncate max-w-[200px]">{lesson.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24352E]">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAE8E0] text-[#24352E] font-mono">
                v{currentVersion}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#176B4A]/10 text-[#176B4A]">
                {lesson.level?.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                {lesson.category?.name}
              </span>
              {contentStatus === "ready" ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  Sẵn sàng duyệt
                </span>
              ) : contentStatus === "editing" ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Đang biên tập
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                  Bản thô PDF
                </span>
              )}
              {publishStatus === "published" ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Đã xuất bản
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-700">
                  Bản nháp
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F5] hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#176B4A] shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu bản nháp"}</span>
          </button>

          {/* Mark Ready */}
          <button
            onClick={handleMarkReady}
            disabled={saving || contentStatus === "ready"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl text-xs font-semibold text-blue-700 shadow-xs disabled:opacity-40 transition-colors"
            title="Đánh dấu nội dung đã biên tập đạt chuẩn sẵn sàng xuất bản"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đánh dấu Sẵn sàng</span>
          </button>

          {/* Publish or Unpublish */}
          {publishStatus === "published" ? (
            <button
              onClick={handleUnpublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-300 rounded-xl text-xs font-semibold text-amber-800 shadow-xs disabled:opacity-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Thu hồi về Nháp</span>
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || contentStatus !== "ready"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                contentStatus === "ready"
                  ? "bg-[#176B4A] hover:bg-[#12553A] text-white"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
              title={
                contentStatus !== "ready"
                  ? "Chỉ được phép xuất bản khi bài học ở trạng thái Sẵn sàng (ready)"
                  : "Xuất bản bài học lên thư viện công khai"
              }
            >
              <Globe className="w-4 h-4" />
              <span>Xuất bản công khai</span>
            </button>
          )}

          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowRevisions(!showRevisions)}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-[#D5D3C8] rounded-xl text-xs font-medium text-[#536B61] hover:text-[#24352E] transition-colors"
            title="Lịch sử phiên bản sửa đổi"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch sử ({lesson.revisions?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Status Notifications & Conflict Alerts */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
            statusMessage.type === "conflict"
              ? "bg-amber-50 border border-amber-300 text-amber-900"
              : statusMessage.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "conflict" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : statusMessage.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          {statusMessage.type === "conflict" && (
            <button
              onClick={() => fetchLessonData()}
              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nạp bản mới nhất</span>
            </button>
          )}
        </div>
      )}

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between text-xs text-[#536B61] bg-white p-2 rounded-xl border border-[#E3E1D8]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#24352E]">Bố cục làm việc:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("split-3")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === "split-3" ? "bg-[#176B4A] text-white" : "hover:bg-[#FAF9F5]"
              }`}
            >
              3 Cột (Bản thô + Biên tập + Xem trước)
            </button>
            <button
              onClick={() => setViewMode("editor-preview")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === "editor-preview" ? "bg-[#176B4A] text-white" : "hover:bg-[#FAF9F5]"
              }`}
            >
              Biên tập + Xem trước
            </button>
            <button
              onClick={() => setViewMode("editor-raw")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === "editor-raw" ? "bg-[#176B4A] text-white" : "hover:bg-[#FAF9F5]"
              }`}
            >
              Biên tập + Bản thô PDF
            </button>
            <button
              onClick={() => setViewMode("editor-only")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === "editor-only" ? "bg-[#176B4A] text-white" : "hover:bg-[#FAF9F5]"
              }`}
            >
              Chỉ Biên tập
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <span>{blocks.length} khối nội dung</span>
          <span>{summary.length} ký tự tóm tắt</span>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div
        className={`grid gap-4 ${
          viewMode === "split-3"
            ? "grid-cols-1 lg:grid-cols-12"
            : viewMode === "editor-preview" || viewMode === "editor-raw"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* COLUMN 1: RAW PDF REFERENCE (Visible in split-3 and editor-raw) */}
        {(viewMode === "split-3" || viewMode === "editor-raw") && (
          <div
            className={`${
              viewMode === "split-3" ? "lg:col-span-3" : ""
            } bg-white rounded-2xl border border-[#E3E1D8] shadow-xs flex flex-col h-[750px] overflow-hidden`}
          >
            <div className="p-3.5 bg-[#FAF9F5] border-b border-[#E3E1D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C7658]" />
                <span className="font-bold text-xs text-[#24352E]">Văn bản thô PDF gốc</span>
              </div>
              <span className="text-[10px] font-mono text-[#536B61] bg-[#EAE8E0] px-2 py-0.5 rounded">
                Bất biến
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono bg-[#FCFCFA] text-[#333]">
              {rawPages.length === 0 ? (
                <div className="text-stone-400 italic text-center py-10">Không có dữ liệu thô.</div>
              ) : (
                rawPages.map((pg, idx) => (
                  <div key={idx} className="p-3 bg-white border border-[#E3E1D8] rounded-xl shadow-2xs">
                    <div className="text-[10px] font-bold text-[#176B4A] mb-1.5 flex items-center justify-between">
                      <span>TRANG GIÁO TRÌNH #{pg.pdf_page || idx + 1}</span>
                      <button
                        onClick={() => {
                          if (pg.raw_text) {
                            handleAddBlock("paragraph");
                            // append
                          }
                        }}
                        className="text-[10px] text-[#536B61] hover:text-[#176B4A]"
                        title="Tạo đoạn văn từ trang này"
                      >
                        + Tạo khối
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-[#24352E]/90 text-[11px] font-sans">
                      {pg.raw_text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COLUMN 2: BLOCK EDITOR (Always visible) */}
        <div
          className={`${
            viewMode === "split-3"
              ? "lg:col-span-5"
              : viewMode === "editor-preview" || viewMode === "editor-raw"
              ? ""
              : "max-w-4xl mx-auto w-full"
          } bg-white rounded-2xl border border-[#E3E1D8] shadow-xs flex flex-col h-[750px] overflow-hidden`}
        >
          {/* Editor Header & Add Toolbar */}
          <div className="p-3 bg-[#FAF9F5] border-b border-[#E3E1D8] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#176B4A]" />
              <span className="font-bold text-xs text-[#24352E]">Khối nội dung ({blocks.length})</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => handleAddBlock("paragraph")}
                className="px-2 py-1 bg-white hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-[11px] font-semibold text-[#24352E] transition-colors"
              >
                + Đoạn văn
              </button>
              <button
                onClick={() => handleAddBlock("heading")}
                className="px-2 py-1 bg-white hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-[11px] font-semibold text-[#24352E] transition-colors"
              >
                + Tiêu đề
              </button>
              <button
                onClick={() => handleAddBlock("list")}
                className="px-2 py-1 bg-white hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-[11px] font-semibold text-[#24352E] transition-colors"
              >
                + Danh sách
              </button>
              <button
                onClick={() => handleAddBlock("callout")}
                className="px-2 py-1 bg-white hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-[11px] font-semibold text-[#24352E] transition-colors"
              >
                + Ghi chú
              </button>
              <button
                onClick={() => handleAddBlock("image")}
                className="px-2 py-1 bg-white hover:bg-[#176B4A] hover:text-white border border-[#D5D3C8] rounded-lg text-[11px] font-semibold text-[#24352E] transition-colors"
              >
                + Ảnh
              </button>
            </div>
          </div>

          {/* Block Editor Content Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Lesson Summary Input */}
            <div className="p-3 bg-[#FAF9F5] border border-[#E3E1D8] rounded-xl space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#536B61]">
                Tóm tắt bài học (Summary)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nhập 1-2 câu tóm lược cốt lõi nội dung bài học..."
                rows={2}
                className="w-full p-2 text-xs bg-white border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
              />
            </div>

            {/* Content Blocks List */}
            {blocks.length === 0 ? (
              <div className="py-16 text-center text-[#536B61] text-xs">
                Chưa có khối nội dung nào. Nhấp các nút trên thanh công cụ để thêm nội dung.
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id || index}
                  className="p-3.5 bg-white border border-[#E3E1D8] rounded-xl shadow-2xs space-y-2.5 relative group hover:border-[#176B4A]/50 transition-colors"
                >
                  {/* Block Control Header */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E3E1D8]/60">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EAE8E0] text-[10px] font-bold text-[#24352E] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-bold uppercase tracking-wider text-[10px] text-[#176B4A]">
                        {block.type === "heading"
                          ? `Tiêu đề (H${block.level})`
                          : block.type === "paragraph"
                          ? "Đoạn văn"
                          : block.type === "list"
                          ? block.ordered
                            ? "Danh sách số"
                            : "Danh sách chấm"
                          : block.type === "callout"
                          ? `Hộp lưu ý (${block.variant || "info"})`
                          : "Hình ảnh"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveBlock(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[#FAF9F5] disabled:opacity-20 text-[#536B61]"
                        title="Di chuyển lên"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveBlock(index, "down")}
                        disabled={index === blocks.length - 1}
                        className="p-1 rounded hover:bg-[#FAF9F5] disabled:opacity-20 text-[#536B61]"
                        title="Di chuyển xuống"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveBlock(index)}
                        className="p-1 rounded hover:bg-red-50 text-red-600 ml-1"
                        title="Xóa khối này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Block Editor Inputs by Type */}
                  {block.type === "heading" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] font-semibold text-[#536B61]">Cấp độ:</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateBlock(index, { ...block, level: 2 })}
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              block.level === 2
                                ? "bg-[#176B4A] text-white"
                                : "bg-[#FAF9F5] border border-[#D5D3C8]"
                            }`}
                          >
                            H2 (Mục chính)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBlock(index, { ...block, level: 3 })}
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              block.level === 3
                                ? "bg-[#176B4A] text-white"
                                : "bg-[#FAF9F5] border border-[#D5D3C8]"
                            }`}
                          >
                            H3 (Mục phụ)
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={block.text}
                        onChange={(e) => handleUpdateBlock(index, { ...block, text: e.target.value })}
                        placeholder="Tiêu đề đề mục..."
                        className="w-full p-2 text-sm font-semibold text-[#24352E] bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
                      />
                    </div>
                  )}

                  {block.type === "paragraph" && (
                    <div>
                      <textarea
                        value={block.text}
                        onChange={(e) => handleUpdateBlock(index, { ...block, text: e.target.value })}
                        placeholder="Nội dung đoạn văn..."
                        rows={4}
                        className="w-full p-2.5 text-xs text-[#24352E] leading-relaxed bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
                      />
                    </div>
                  )}

                  {block.type === "list" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#536B61]">
                          <input
                            type="checkbox"
                            checked={block.ordered}
                            onChange={(e) =>
                              handleUpdateBlock(index, { ...block, ordered: e.target.checked })
                            }
                            className="rounded text-[#176B4A]"
                          />
                          <span>Đánh số thứ tự (1, 2, 3...)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...block.items, ""];
                            handleUpdateBlock(index, { ...block, items: newItems });
                          }}
                          className="text-[11px] font-semibold text-[#176B4A] hover:underline"
                        >
                          + Thêm dòng
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {block.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-[#536B61] w-4 text-center">
                              {block.ordered ? `${itemIdx + 1}.` : "•"}
                            </span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...block.items];
                                newItems[itemIdx] = e.target.value;
                                handleUpdateBlock(index, { ...block, items: newItems });
                              }}
                              placeholder={`Ý thứ ${itemIdx + 1}...`}
                              className="flex-1 p-1.5 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-md focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
                            />
                            {block.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                                  handleUpdateBlock(index, { ...block, items: newItems });
                                }}
                                className="text-stone-400 hover:text-red-500 text-xs px-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === "callout" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-[11px] font-semibold text-[#536B61]">Loại:</label>
                        <select
                          value={block.variant || "info"}
                          onChange={(e) =>
                            handleUpdateBlock(index, {
                              ...block,
                              variant: e.target.value as any,
                            })
                          }
                          className="px-2 py-1 bg-[#FAF9F5] border border-[#D5D3C8] rounded text-xs"
                        >
                          <option value="info">Thông tin / Nhắc nhở</option>
                          <option value="quote">Trích dẫn / Pháp cú</option>
                          <option value="warning">Lưu ý / Chú ý</option>
                          <option value="success">Thành tựu / Ghi nhớ</option>
                        </select>
                        <input
                          type="text"
                          value={block.title || ""}
                          onChange={(e) => handleUpdateBlock(index, { ...block, title: e.target.value })}
                          placeholder="Tiêu đề hộp ghi chú (tùy chọn)..."
                          className="flex-1 p-1 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded"
                        />
                      </div>
                      <textarea
                        value={block.text}
                        onChange={(e) => handleUpdateBlock(index, { ...block, text: e.target.value })}
                        placeholder="Nội dung lưu ý..."
                        rows={2}
                        className="w-full p-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
                      />
                    </div>
                  )}

                  {block.type === "image" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#536B61]">URL ảnh</label>
                          <input
                            type="text"
                            value={block.url || ""}
                            onChange={(e) => handleUpdateBlock(index, { ...block, url: e.target.value })}
                            placeholder="/uploads/... hoặc https://..."
                            className="w-full p-1.5 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#536B61]">Chú thích (Caption)</label>
                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) => handleUpdateBlock(index, { ...block, caption: e.target.value })}
                            placeholder="Chú thích dưới ảnh..."
                            className="w-full p-1.5 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#536B61]">Mô tả văn bản thay thế (Alt text)</label>
                        <input
                          type="text"
                          value={block.altText || ""}
                          onChange={(e) => handleUpdateBlock(index, { ...block, altText: e.target.value })}
                          placeholder="Mô tả nội dung ảnh phục vụ tiếp cận..."
                          className="w-full p-1.5 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: LIVE READER PREVIEW (Visible in split-3 and editor-preview) */}
        {(viewMode === "split-3" || viewMode === "editor-preview") && (
          <div
            className={`${
              viewMode === "split-3" ? "lg:col-span-4" : ""
            } bg-white rounded-2xl border border-[#E3E1D8] shadow-xs flex flex-col h-[750px] overflow-hidden`}
          >
            <div className="p-3.5 bg-[#FAF9F5] border-b border-[#E3E1D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#176B4A]" />
                <span className="font-bold text-xs text-[#24352E]">Xem trước độc giả (Live Preview)</span>
              </div>
              <span className="text-[10px] text-[#536B61]">Chuẩn Typography GĐPT</span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-[#F8F7F2]">
              <div className="max-w-prose mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-[#E3E1D8] shadow-xs">
                <div className="mb-4 pb-3 border-b border-[#E3E1D8]/60">
                  <span className="text-xs font-mono font-bold text-[#176B4A]">{lesson.id}</span>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#24352E] mt-1">{lesson.title}</h1>
                  {summary && (
                    <p className="mt-2 text-xs italic text-[#536B61] leading-relaxed border-l-2 border-[#176B4A] pl-2.5">
                      {summary}
                    </p>
                  )}
                </div>

                <ContentRenderer
                  content={{
                    version: 1,
                    blocks,
                  }}
                  fontSize={16}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revisions Drawer / Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E3E1D8]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#176B4A]" />
                  <h2 className="text-base font-bold text-[#24352E]">Lịch sử phiên bản sửa đổi</h2>
                </div>
                <button
                  onClick={() => setShowRevisions(false)}
                  className="p-1 rounded-lg text-[#536B61] hover:bg-black/5"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(!lesson.revisions || lesson.revisions.length === 0) ? (
                  <div className="text-center py-12 text-xs text-[#536B61]">
                    Chưa có bản ghi lịch sử sửa đổi nào.
                  </div>
                ) : (
                  lesson.revisions.map((rev: any) => {
                    const revDate = new Date(rev.createdAt).toLocaleString("vi-VN");
                    const blockCount = (rev.snapshotJson?.blocks as any[])?.length || 0;
                    return (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-xl border border-[#E3E1D8] bg-[#FAF9F5] hover:border-[#176B4A] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#176B4A]">
                            Phiên bản v{rev.revisionNumber}
                          </span>
                          <span className="text-[10px] text-[#536B61]">{revDate}</span>
                        </div>
                        <div className="text-xs text-[#536B61] mt-1">
                          Người sửa: <span className="text-[#24352E] font-medium">{rev.editor?.email || "Hệ thống"}</span>
                        </div>
                        <div className="text-[11px] text-[#536B61] mt-0.5">
                          Số khối nội dung: <span className="font-semibold">{blockCount}</span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn nạp lại nội dung từ phiên bản v${rev.revisionNumber}?`)) {
                                if (Array.isArray(rev.snapshotJson?.blocks)) {
                                  setBlocks(rev.snapshotJson.blocks);
                                  setShowRevisions(false);
                                  setStatusMessage({
                                    type: "success",
                                    text: `Đã nạp nội dung từ phiên bản v${rev.revisionNumber}. Hãy bấm 'Lưu bản nháp' để tạo bản sửa mới.`,
                                  });
                                }
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#176B4A] bg-white border border-[#D5D3C8] rounded-lg hover:bg-[#176B4A] hover:text-white transition-colors"
                          >
                            Khôi phục bản này
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E3E1D8] text-center text-xs text-[#536B61]">
              Hệ thống tự động chụp ảnh snapshot mỗi lần lưu bản nháp.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
