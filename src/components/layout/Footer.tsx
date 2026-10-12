"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="w-full border-t border-[#E3E1D8] bg-[#F8F7F2] py-12 mt-auto">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#E3E1D8]">
          {/* Cột 1: Giới thiệu */}
          <div className="space-y-3">
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
              <span className="font-bold text-base text-[#176B4A]">
                TỦ SÁCH ÁO LAM
              </span>
            </div>
            <p className="text-xs text-[#536B61] leading-relaxed">
              Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất dành cho Huynh trưởng và Đoàn sinh Gia Đình Phật Tử Việt Nam. Nền tảng số hóa hỗ trợ tìm kiếm và học tập thuận tiện theo giáo trình chuẩn mực.
            </p>
          </div>

          {/* Cột 2: Danh mục */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#24352E]">Ngành Đồng — 4 Bậc tu học</h4>
            <ul className="text-xs text-[#536B61] space-y-2">
              <li>
                <Link href="/thu-vien/nganh-dong/mo-mat" className="hover:text-[#176B4A] transition-colors">
                  Bậc Mở Mắt (32 bài học)
                </Link>
              </li>
              <li>
                <Link href="/thu-vien/nganh-dong/canh-mem" className="hover:text-[#176B4A] transition-colors">
                  Bậc Cánh Mềm (38 bài học)
                </Link>
              </li>
              <li>
                <Link href="/thu-vien/nganh-dong/chan-cung" className="hover:text-[#176B4A] transition-colors">
                  Bậc Chân Cứng (41 bài học)
                </Link>
              </li>
              <li>
                <Link href="/thu-vien/nganh-dong/tung-bay" className="hover:text-[#176B4A] transition-colors">
                  Bậc Tung Bay (45 bài học)
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Lưu ý học vụ */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#24352E]">Lưu ý tài liệu tu học</h4>
            <p className="text-xs text-[#536B61] leading-relaxed">
              Các bài học được biên tập trên cơ sở tài liệu tu học Ngành Đồng. Thư viện bảo tồn nguyên vẹn thứ tự và ý nghĩa của giáo trình truyền thống nhằm phục vụ mục đích tu học nội bộ.
            </p>
          </div>
        </div>

        {/* Bản quyền & ghi chú chân trang */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#536B61] gap-4">
          <p>© 2026 Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center space-x-6">
            <Link href="/gioi-thieu" className="hover:text-[#176B4A] transition-colors">
              Về dự án
            </Link>
            <Link href="/tim-kiem" className="hover:text-[#176B4A] transition-colors">
              Tra cứu
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
