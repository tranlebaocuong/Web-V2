import React from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Heart,
  Feather,
  Smile,
  ShieldCheck,
  Compass,
  Music,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";

export const metadata = {
  title: "Ngành Đồng (Oanh Vũ) | Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
  description:
    "Tổng quan chương trình tu học Ngành Đồng Gia Đình Phật Tử Việt Nam gồm 4 bậc: Mở Mắt, Cánh Mềm, Chân Cứng, Tung Bay.",
};

export default function NganhDongPage() {
  const levels = [
    {
      id: "mo-mat",
      name: "Bậc Mở Mắt",
      year: "Năm thứ nhất",
      ageRange: "7–8 tuổi",
      lessonCount: 32,
      desc: "Những bước đầu tiên chim non mở mắt nhìn ánh sáng đạo lành. Các em làm quen với Tam Bảo, châm ngôn Oanh Vũ và nề nếp kính trên nhường dưới.",
      breakdown: [
        { label: "Phật pháp", count: 12 },
        { label: "HĐ Thanh niên", count: 14 },
        { label: "Văn nghệ", count: 6 },
      ],
      route: "/nganh-dong/mo-mat",
      colorBorder: "hover:border-[#176B4A]",
      badgeVariant: "primary" as const,
    },
    {
      id: "canh-mem",
      name: "Bậc Cánh Mềm",
      year: "Năm thứ hai",
      ageRange: "8–9 tuổi",
      lessonCount: 38,
      desc: "Đôi cánh non nớt bắt đầu tập vỗ. Rèn luyện đức tính thật thà, nề nếp kỷ luật, tinh thần đoàn kết, các gút dây cơ bản và sinh hoạt ngoài trời.",
      breakdown: [
        { label: "Phật pháp", count: 12 },
        { label: "HĐ Thanh niên", count: 19 },
        { label: "Văn nghệ", count: 7 },
      ],
      route: "/nganh-dong/canh-mem",
      colorBorder: "hover:border-[#345E88]",
      badgeVariant: "secondary" as const,
    },
    {
      id: "chan-cung",
      name: "Bậc Chân Cứng",
      year: "Năm thứ ba",
      ageRange: "9–10 tuổi",
      lessonCount: 41,
      desc: "Đôi chân vững vàng trên cành cây. Các em rèn luyện tính tự lập, tính kiên trì, mở rộng kiến thức xã hội, tìm hiểu ý nghĩa huy hiệu hoa sen và lịch sử tổ chức.",
      breakdown: [
        { label: "Phật pháp", count: 14 },
        { label: "HĐ Thanh niên", count: 20 },
        { label: "Văn nghệ", count: 7 },
      ],
      route: "/nganh-dong/chan-cung",
      colorBorder: "hover:border-[#D4AD69]",
      badgeVariant: "accent" as const,
    },
    {
      id: "tung-bay",
      name: "Bậc Tung Bay",
      year: "Năm thứ tư",
      ageRange: "10–12 tuổi",
      lessonCount: 45,
      desc: "Đôi cánh đã cứng cáp, sẵn sàng tung bay vào bầu trời cao rộng. Bậc học cao nhất của Ngành Đồng chuẩn bị chuyển giao lên Ngành Thiếu.",
      breakdown: [
        { label: "Phật pháp", count: 16 },
        { label: "HĐ Thanh niên", count: 22 },
        { label: "Văn nghệ", count: 7 },
      ],
      route: "/nganh-dong/tung-bay",
      colorBorder: "hover:border-[#176B4A]",
      badgeVariant: "primary" as const,
    },
  ];

  const laws = [
    {
      number: "1",
      text: "Em tưởng nhớ Phật.",
      explain: "Ghi nhớ công ơn Đức Từ Phụ, noi gương Ngài từ bi, thương người và muôn loài.",
    },
    {
      number: "2",
      text: "Em kính trọng cha mẹ và thuận thảo với anh chị em.",
      explain: "Hiếu thảo với cha mẹ trong gia đình, hòa thuận yêu thương bạn bè và đoàn sinh.",
    },
    {
      number: "3",
      text: "Em thương người và vật.",
      explain: "Không làm tổn hại loài vật, biết giúp đỡ mọi người gặp hoàn cảnh khó khăn.",
    },
  ];

  return (
    <div className="py-8 lg:py-12 space-y-12">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: "Ngành Đồng" }]}
          className="mb-6"
        />

        {/* Header Ngành Đồng */}
        <div className="rounded-[20px] bg-white border border-[#E3E1D8] p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary">
                <Feather className="w-3.5 h-3.5 mr-1" />
                Độ tuổi 7 — 12 tuổi
              </Badge>
              <Badge variant="accent">Châm ngôn: HÒA — THUẬN</Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#176B4A] tracking-tight">
              Chương trình Tu học Ngành Đồng
            </h1>

            <p className="text-base sm:text-lg text-[#536B61] leading-relaxed">
              Ngành Đồng (Oanh Vũ) là lứa tuổi mầm non trong sáng của Gia Đình Phật Tử Việt Nam. Mục đích giáo dục là huân tập hạt giống Bồ đề, rèn luyện nề nếp hiếu thuận, hòa nhã và chuẩn bị nhân cách lương thiện cho các em từ thuở ấu thơ.
            </p>
          </div>
        </div>

        {/* 3 Điều Luật & Châm ngôn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
          {laws.map((law) => (
            <div
              key={law.number}
              className="rounded-[16px] bg-[#F8F7F2] border border-[#E3E1D8] p-6 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="w-8 h-8 rounded-full bg-[#176B4A] text-white font-bold flex items-center justify-center text-sm mb-3">
                  {law.number}
                </span>
                <h3 className="font-bold text-base sm:text-lg text-[#24352E] mb-2">
                  {law.text}
                </h3>
                <p className="text-sm text-[#536B61] leading-relaxed">
                  {law.explain}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Danh sách 4 Bậc Tu học */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E3E1D8]">
            <div>
              <span className="text-xs font-semibold text-[#176B4A] uppercase tracking-wider">
                Lộ trình 4 năm
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#24352E]">
                Bốn Bậc Tu học Chuẩn mực
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-[#536B61] font-medium hidden sm:inline">
              Tổng cộng 156 bài học giáo trình
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {levels.map((lvl) => (
              <Card
                key={lvl.id}
                className={`flex flex-col justify-between transition-all duration-200 hover:shadow-md ${lvl.colorBorder}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={lvl.badgeVariant}>
                      {lvl.year} • {lvl.ageRange}
                    </Badge>
                    <span className="text-xs font-bold text-[#176B4A]">
                      {lvl.lessonCount} bài học
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-[#24352E]">
                    {lvl.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-[#536B61] leading-relaxed">
                    {lvl.desc}
                  </p>

                  {/* Phân bổ 3 lĩnh vực */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E3E1D8]/60 text-center">
                    {lvl.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[8px] bg-[#F8F7F2] border border-[#E3E1D8]/60 text-xs"
                      >
                        <span className="font-bold text-[#24352E] block">
                          {item.count} bài
                        </span>
                        <span className="text-[#536B61] truncate block">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Link href={lvl.route} className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-between group">
                      <span>Vào chương trình Bậc {lvl.name}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
