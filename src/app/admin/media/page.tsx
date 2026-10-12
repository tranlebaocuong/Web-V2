"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface MediaAsset {
  id: string;
  storageKey: string;
  url: string;
  altText: string | null;
  caption: string | null;
  lessonId: string | null;
  lessonTitle?: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Upload Form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");

  async function fetchMedia() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (!res.ok) throw new Error("Lỗi nạp thư viện hình ảnh.");
      const json = await res.json();
      if (json.success) {
        setAssets(json.data.images || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMedia();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError("Vui lòng chọn một tệp hình ảnh để tải lên.");
      return;
    }

    // Client-side quick validation
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selectedFile.type)) {
      setError("Định dạng không hợp lệ. Chỉ chấp nhận JPEG, PNG, WEBP.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Dung lượng tệp vượt quá giới hạn tối đa 5MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (lessonId.trim()) formData.append("lessonId", lessonId.trim());
      if (altText.trim()) formData.append("altText", altText.trim());
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Tải ảnh lên thất bại.");
        return;
      }

      setSuccess(`Đã tải ảnh lên thành công: ${json.data.url}`);
      setSelectedFile(null);
      setAltText("");
      setCaption("");
      setLessonId("");
      fetchMedia();
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setUploading(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedKey(url);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24352E]">
            Thư viện Tài sản Hình ảnh
          </h1>
          <p className="text-sm text-[#536B61] mt-1">
            Quản lý và tải lên an toàn các hình ảnh minh họa cho 156 bài học Ngành Đồng.
          </p>
        </div>
        <button
          onClick={fetchMedia}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#536B61] hover:text-[#24352E] shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3E1D8] shadow-xs">
        <h2 className="text-base font-bold text-[#24352E] mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#176B4A]" />
          <span>Tải lên hình ảnh mới</span>
        </h2>
        <p className="text-xs text-[#536B61] mb-5">
          Quy chuẩn bảo mật: Giới hạn tối đa 5MB, hỗ trợ JPEG, PNG, WEBP. Tên tệp được sinh ngẫu nhiên an toàn qua UUID.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#536B61] mb-1.5">
                Chọn tệp hình ảnh (Tối đa 5MB) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-[#536B61] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#176B4A]/10 file:text-[#176B4A] hover:file:bg-[#176B4A]/20 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#536B61] mb-1.5">
                Gán với mã bài học (Tùy chọn)
              </label>
              <input
                type="text"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                placeholder="vd: D-MM-A-01"
                className="w-full p-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#536B61] mb-1.5">
                Mô tả văn bản thay thế (Alt Text)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Mô tả hình ảnh cho người khiếm thị..."
                className="w-full p-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#536B61] mb-1.5">
                Chú thích hiển thị (Caption)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Chú thích in nghiêng dưới ảnh..."
                className="w-full p-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B4A]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#176B4A] hover:bg-[#12553A] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-40 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải lên và xử lý...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh lên thư viện</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Media Assets Gallery Grid */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3E1D8] shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#24352E]">
            Danh mục tài sản ({assets.length} hình ảnh)
          </h2>
          <span className="text-xs text-[#536B61]">Nhấp để sao chép đường dẫn sử dụng trong bài</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#536B61] mt-2">Đang nạp ảnh...</span>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-[#536B61] text-xs">
            <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p>Chưa có hình ảnh nào được tải lên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-[#FAF9F5] border border-[#E3E1D8] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#176B4A]/50 transition-colors"
              >
                <div className="h-40 bg-[#EAE8E0] flex items-center justify-center overflow-hidden relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.altText || "Ảnh học liệu"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full text-[#24352E] shadow-sm hover:scale-110 transition-transform"
                      title="Xem ảnh gốc"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="text-[11px] font-mono text-[#536B61] truncate">
                    {asset.storageKey}
                  </div>

                  {asset.lessonId && (
                    <div className="text-[10px] font-semibold text-[#176B4A]">
                      Bài: {asset.lessonId}
                    </div>
                  )}

                  {asset.caption && (
                    <p className="text-[11px] text-[#24352E] line-clamp-1 italic">
                      {asset.caption}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#E3E1D8] flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(asset.url)}
                      className="flex items-center gap-1 px-2 py-1 bg-white border border-[#D5D3C8] rounded-lg text-[10px] font-semibold text-[#24352E] hover:bg-[#176B4A] hover:text-white transition-colors"
                    >
                      {copiedKey === asset.url ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép URL</span>
                        </>
                      )}
                    </button>
                    <span className="text-[9px] text-[#536B61]">
                      {new Date(asset.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
