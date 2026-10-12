"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, BookOpen, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // AT-UI-09: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl flex flex-col z-50 p-6 animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-center justify-between pb-6 border-b border-[#E3E1D8]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-[8px] overflow-hidden shrink-0 shadow-xs">
              <Image
                src="/brand/logo.png"
                alt="Logo Tủ Sách Áo Lam"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg text-[#176B4A]">TỦ SÁCH ÁO LAM</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="w-11 h-11 flex items-center justify-center rounded-[12px] text-[#536B61] hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col space-y-2">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-medium text-[#24352E] hover:bg-[#EBF4F0] hover:text-[#176B4A] transition-colors min-h-[44px]"
          >
            Trang chủ
          </Link>
          <Link
            href="/nganh-dong"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-medium text-[#24352E] hover:bg-[#EBF4F0] hover:text-[#176B4A] transition-colors min-h-[44px]"
          >
            <BookOpen className="w-5 h-5 text-[#176B4A]" />
            Thư viện Ngành Đồng
          </Link>
          <Link
            href="/tim-kiem"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-medium text-[#24352E] hover:bg-[#EBF4F0] hover:text-[#176B4A] transition-colors min-h-[44px]"
          >
            <Search className="w-5 h-5 text-[#345E88]" />
            Tra cứu học liệu
          </Link>
          <Link
            href="/gioi-thieu"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-medium text-[#24352E] hover:bg-[#EBF4F0] hover:text-[#176B4A] transition-colors min-h-[44px]"
          >
            <Info className="w-5 h-5 text-[#D4AD69]" />
            Giới thiệu dự án
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-[#E3E1D8] text-xs text-[#536B61] leading-relaxed">
          Tủ sách tu học điện tử dành cho Huynh trưởng & Đoàn sinh GĐPT.
        </div>
      </div>
    </div>
  );
}
