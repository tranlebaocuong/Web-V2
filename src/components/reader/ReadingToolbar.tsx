"use client";

import React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Sun, Moon, BookOpen } from "lucide-react";

export type ReadingTheme = "light" | "sepia" | "dark";

interface ReadingToolbarProps {
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  theme: ReadingTheme;
  onThemeChange: (theme: ReadingTheme) => void;
  className?: string;
}

export function ReadingToolbar({
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  className = "",
}: ReadingToolbarProps) {
  const MIN_SIZE = 15;
  const MAX_SIZE = 23;
  const DEFAULT_SIZE = 18;

  const handleDecrease = () => {
    if (fontSize > MIN_SIZE) {
      onFontSizeChange(Math.max(MIN_SIZE, fontSize - 1));
    }
  };

  const handleIncrease = () => {
    if (fontSize < MAX_SIZE) {
      onFontSizeChange(Math.min(MAX_SIZE, fontSize + 1));
    }
  };

  const handleReset = () => {
    onFontSizeChange(DEFAULT_SIZE);
  };

  return (
    <div
      role="toolbar"
      aria-label="Thanh công cụ tùy chỉnh đọc"
      className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-[14px] border border-[#E3E1D8] bg-white/90 backdrop-blur-xs shadow-xs text-xs sm:text-sm ${className}`}
    >
      {/* 1. ĐIỀU CHỈNH CỠ CHỮ */}
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-[#536B61] font-medium hidden sm:inline mr-1">Cỡ chữ:</span>
        
        {/* Nút Giảm */}
        <button
          type="button"
          onClick={handleDecrease}
          disabled={fontSize <= MIN_SIZE}
          aria-label="Giảm cỡ chữ"
          className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-[8px] border border-[#E3E1D8] text-[#24352E] hover:bg-black/5 active:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Chỉ số cỡ chữ hiện tại */}
        <span className="w-12 text-center font-bold text-[#176B4A] select-none text-xs sm:text-sm">
          {fontSize}px
        </span>

        {/* Nút Tăng */}
        <button
          type="button"
          onClick={handleIncrease}
          disabled={fontSize >= MAX_SIZE}
          aria-label="Tăng cỡ chữ"
          className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-[8px] border border-[#E3E1D8] text-[#24352E] hover:bg-black/5 active:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Nút Mặc định (Reset về 18px) */}
        {fontSize !== DEFAULT_SIZE && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Đặt lại cỡ chữ 18px"
            title="Đặt lại 18px"
            className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-[8px] text-[#536B61] hover:text-[#176B4A] hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. CHẾ ĐỘ NỀN ĐỌC (LIGHT / SEPIA / DARK) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-[#536B61] font-medium hidden sm:inline mr-1">Chế độ nền:</span>

        {/* Sáng (Warm Cream) */}
        <button
          type="button"
          onClick={() => onThemeChange("light")}
          aria-pressed={theme === "light"}
          className={`h-10 sm:h-9 px-3 flex items-center gap-1.5 rounded-[8px] border text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
            theme === "light"
              ? "bg-[#F8F7F2] border-[#176B4A] text-[#176B4A] font-bold shadow-2xs"
              : "bg-white border-[#E3E1D8] text-[#536B61] hover:bg-[#F8F7F2]"
          }`}
          title="Nền sáng tự nhiên"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Sáng</span>
        </button>

        {/* Giấy ngà (Warm Sepia) */}
        <button
          type="button"
          onClick={() => onThemeChange("sepia")}
          aria-pressed={theme === "sepia"}
          className={`h-10 sm:h-9 px-3 flex items-center gap-1.5 rounded-[8px] border text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
            theme === "sepia"
              ? "bg-[#F5F0E4] border-[#D4AD69] text-[#8C6D2C] font-bold shadow-2xs"
              : "bg-[#FBF6EC] border-[#E3E1D8] text-[#536B61] hover:bg-[#F5F0E4]"
          }`}
          title="Nền giấy ngà ấm áp"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Giấy ngà</span>
        </button>

        {/* Dịu mắt (Soft Dark) */}
        <button
          type="button"
          onClick={() => onThemeChange("dark")}
          aria-pressed={theme === "dark"}
          className={`h-10 sm:h-9 px-3 flex items-center gap-1.5 rounded-[8px] border text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#176B4A] ${
            theme === "dark"
              ? "bg-[#1A2420] border-[#176B4A] text-[#71C5A0] font-bold shadow-2xs"
              : "bg-[#24352E] border-[#24352E] text-[#D8E2DC] hover:bg-[#1A2420]"
          }`}
          title="Nền dịu mắt ban đêm"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dịu mắt</span>
        </button>
      </div>
    </div>
  );
}
