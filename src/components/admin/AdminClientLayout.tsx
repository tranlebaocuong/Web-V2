"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Image as ImageIcon,
  History,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

export function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setCurrentUser(data.data.user);
          } else {
            router.replace("/admin/login");
          }
        } else {
          router.replace("/admin/login");
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, isLoginPage, router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/admin/login");
    }
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#176B4A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#536B61]">Đang tải quản trị...</span>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
    { href: "/admin/lessons", label: "Quản lý bài học", icon: BookOpen, exact: false },
    { href: "/admin/media", label: "Thư viện hình ảnh", icon: ImageIcon, exact: false },
    { href: "/admin/audit-logs", label: "Nhật ký hoạt động", icon: History, exact: false },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col font-sans text-[#24352E]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E3E1D8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Image
                  src="/brand/logo.png"
                  alt="Logo Tủ Sách Áo Lam"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-[#176B4A] tracking-tight leading-none">
                  TỦ SÁCH ÁO LAM
                </span>
                <span className="text-[10px] font-semibold text-[#8C7658] uppercase tracking-wider mt-0.5">
                  Cổng Quản Trị Học Vụ
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#E3E1D8]">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#176B4A]/10 text-[#176B4A] font-semibold"
                        : "text-[#536B61] hover:text-[#24352E] hover:bg-black/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#536B61] hover:text-[#176B4A] hover:bg-[#F8F7F2] border border-[#E3E1D8] transition-colors"
            >
              <span>Xem trang đọc</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EAE8E0] text-xs font-medium text-[#24352E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B4A]" />
                <span className="max-w-[150px] truncate">{currentUser.email}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8B2626] hover:bg-[#8B2626]/10 border border-[#8B2626]/20 transition-colors"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#24352E] hover:bg-black/5"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E3E1D8] bg-white px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-[#176B4A]/10 text-[#176B4A] font-semibold"
                      : "text-[#536B61] hover:text-[#24352E] hover:bg-black/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#E3E1D8]">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#536B61]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở trang đọc công khai</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
