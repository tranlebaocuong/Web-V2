"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo.admin@sentrang.gdpt.vn");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || "Đăng nhập không thành công.");
        setLoading(false);
        return;
      }

      // Login success -> redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-md mb-3">
          <Image
            src="/brand/logo.png"
            alt="Logo Tủ Sách Áo Lam"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#176B4A]">
          TỦ SÁCH ÁO LAM
        </h1>
        <p className="mt-1 text-sm text-[#536B61]">
          Đăng nhập hệ thống biên tập và quản trị học liệu GĐPT
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E3E1D8] rounded-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#536B61] mb-1.5"
              >
                Tài khoản Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#536B61]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sentrang.gdpt.vn"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-sm text-[#24352E] placeholder-[#8C7658]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B4A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#536B61] mb-1.5"
              >
                Mật khẩu
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#536B61]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-sm text-[#24352E] placeholder-[#8C7658]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B4A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#176B4A] hover:bg-[#12553A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176B4A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập Quản trị</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#E3E1D8] pt-4 text-center">
            <p className="text-xs text-[#536B61]">
              Hệ thống bảo vệ nội bộ. Không hỗ trợ đăng ký tài khoản tự do.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
