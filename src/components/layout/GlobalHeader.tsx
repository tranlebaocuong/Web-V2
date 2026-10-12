"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "./MobileNav";

export function GlobalHeader() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E3E1D8] bg-[#F8F7F2]/90 backdrop-blur-md transition-colors">
        <Container className="flex items-center justify-between h-[60px] lg:h-[72px]">
          {/* Logo & Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[#176B4A] rounded-[8px]"
          >
            {/* Logo Thương hiệu Tủ Sách Áo Lam */}
            <div className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-[10px] overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/brand/logo.png"
                alt="Logo Tủ Sách Áo Lam"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg lg:text-xl tracking-tight text-[#176B4A] leading-none">
                TỦ SÁCH ÁO LAM
              </span>
              <span className="text-[11px] lg:text-xs font-medium text-[#536B61] tracking-wide mt-0.5">
                Nơi tìm kiếm tài liệu tu học mới nhất
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Điều hướng chính">
            <Link
              href="/"
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-[#24352E] hover:text-[#176B4A] hover:bg-black/5 transition-colors min-h-[44px] flex items-center"
            >
              Trang chủ
            </Link>
            <Link
              href="/nganh-dong"
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-[#24352E] hover:text-[#176B4A] hover:bg-black/5 transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#176B4A]" />
              Thư viện Ngành Đồng
            </Link>
            <Link
              href="/tim-kiem"
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-[#24352E] hover:text-[#176B4A] hover:bg-black/5 transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-[#345E88]" />
              Tra cứu
            </Link>
            <Link
              href="/gioi-thieu"
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-[#24352E] hover:text-[#176B4A] hover:bg-black/5 transition-colors min-h-[44px] flex items-center"
            >
              Giới thiệu
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileNavOpen}
              className="w-11 h-11 flex items-center justify-center rounded-[12px] text-[#24352E] hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#176B4A]"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
