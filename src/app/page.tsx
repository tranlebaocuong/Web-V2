import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Heart,
  Feather,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/search/SearchBar";

export const metadata = {
  title: "Trang chủ | Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
  description:
    "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất dành cho Huynh trưởng và Đoàn sinh Gia Đình Phật Tử Việt Nam. Chương trình chuẩn hóa 4 bậc Ngành Đồng với 156 bài học.",
};

export default function HomePage() {
  const levels = [
    {
      id: "mo-mat",
      name: "Bậc Mở Mắt",
      ageRange: "7–8 tuổi (Năm 1)",
      lessonCount: 32,
      desc: "Những bước đầu làm quen Tam Bảo, châm ngôn Oanh Vũ và nề nếp gia đình, lễ kính Phật và kính trọng người lớn.",
      categoryBreakdown: "12 Phật pháp • 14 HĐ Thanh niên • 6 Văn nghệ",
      colorBorder: "hover:border-[#176B4A]",
      badgeVariant: "primary" as const,
      route: "/nganh-dong/mo-mat",
    },
    {
      id: "canh-mem",
      name: "Bậc Cánh Mềm",
      ageRange: "8–9 tuổi (Năm 2)",
      lessonCount: 38,
      desc: "Bồi dưỡng nề nếp kỷ luật, tinh thần đoàn kết, kỹ năng sinh hoạt ngoài trời và đức tính thật thà, hòa thuận.",
      categoryBreakdown: "12 Phật pháp • 19 HĐ Thanh niên • 7 Văn nghệ",
      colorBorder: "hover:border-[#345E88]",
      badgeVariant: "secondary" as const,
      route: "/nganh-dong/canh-mem",
    },
    {
      id: "chan-cung",
      name: "Bậc Chân Cứng",
      ageRange: "9–10 tuổi (Năm 3)",
      lessonCount: 41,
      desc: "Rèn luyện nghị lực, tính tự lập, mở rộng kiến thức xã hội, tìm hiểu sâu hơn về lịch sử Đức Phật và tổ chức GĐPT.",
      categoryBreakdown: "14 Phật pháp • 20 HĐ Thanh niên • 7 Văn nghệ",
      colorBorder: "hover:border-[#D4AD69]",
      badgeVariant: "accent" as const,
      route: "/nganh-dong/chan-cung",
    },
    {
      id: "tung-bay",
      name: "Bậc Tung Bay",
      ageRange: "10–12 tuổi (Năm 4)",
      lessonCount: 45,
      desc: "Bậc học hoàn thiện của Ngành Đồng. Chuẩn bị hành trang chuyển giao lên Ngành Thiếu, tinh tấn đạo hạnh và kỹ năng lãnh đạo Đội Chúng.",
      categoryBreakdown: "16 Phật pháp • 22 HĐ Thanh niên • 7 Văn nghệ",
      colorBorder: "hover:border-[#176B4A]",
      badgeVariant: "primary" as const,
      route: "/nganh-dong/tung-bay",
    },
  ];

  const coreValues = [
    {
      icon: <BookOpen className="w-6 h-6 text-[#176B4A]" />,
      title: "Trung thực với Giáo trình gốc",
      desc: "Bảo tồn nguyên vẹn hệ thống 156 bài học, cấu trúc phân tiết và thứ tự giáo trình tu học BHD Trung ương GĐPT Việt Nam.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#345E88]" />,
      title: "Quy chuẩn Biên tập & Kiểm định",
      desc: "Mọi bài học đều qua quy trình biên tập 5 bước, loại bỏ hoàn toàn mã OCR rác và xác minh nguồn tài liệu chính thống.",
    },
    {
      icon: <Compass className="w-6 h-6 text-[#D4AD69]" />,
      title: "Trải nghiệm Đọc Thanh tịnh",
      desc: "Giao diện phong cách AC tối giản, không quảng cáo, điều chỉnh cỡ chữ linh hoạt và hỗ trợ chế độ đọc dịu mắt.",
    },
  ];

  return (
    <div className="flex flex-col space-y-16 lg:space-y-24 py-8 lg:py-14">
      {/* 1. HERO SECTION */}
      <section aria-labelledby="hero-heading">
        <Container className="text-center flex flex-col items-center">
          <Badge variant="accent" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-[#8C6D2C]" />
            Chương trình Tu học Ngành Đồng — 156 Bài học
          </Badge>

          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#176B4A] tracking-tight max-w-3xl leading-tight"
          >
            Tủ Sách Áo Lam
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#536B61] max-w-2xl leading-relaxed">
            Nơi tìm kiếm tài liệu tu học mới nhất phục vụ Huynh trưởng và Đoàn sinh Gia Đình Phật Tử Việt Nam. Giữ nguyên vẹn cấu trúc giáo trình, hỗ trợ tra cứu và đọc bài thuận tiện trên mọi thiết bị.
          </p>

          {/* Quick Search */}
          <div className="mt-8 w-full max-w-[700px] relative">
            <SearchBar placeholder="Nhập tên bài học, chủ đề (ví dụ: Đức Phật Thích Ca, Huy hiệu hoa sen, Lục hòa...)" />
            <div className="flex items-center justify-between mt-2.5 px-2 text-xs text-[#536B61]/80">
              <span>💡 Tìm kiếm tiếng Việt có dấu hoặc không dấu.</span>
              <Link
                href="/tim-kiem"
                className="hover:text-[#176B4A] hover:underline font-medium"
              >
                Tra cứu nâng cao →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. BỐN BẬC TU HỌC NGÀNH ĐỒNG */}
      <section aria-labelledby="levels-heading">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E3E1D8]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-[#176B4A]" />
                <span className="text-xs font-semibold text-[#176B4A] uppercase tracking-wider">
                  Chương trình chuẩn
                </span>
              </div>
              <h2 id="levels-heading" className="text-2xl sm:text-3xl font-bold text-[#24352E]">
                Bốn Bậc Tu học Ngành Đồng
              </h2>
            </div>
            <Link
              href="/nganh-dong"
              className="mt-3 sm:mt-0 text-sm font-semibold text-[#176B4A] hover:text-[#12553A] flex items-center gap-1 group"
            >
              Xem tổng quan Ngành Đồng
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Lưới 4 Bậc */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {levels.map((lvl) => (
              <Card
                key={lvl.id}
                className={`flex flex-col justify-between transition-all duration-200 hover:shadow-md ${lvl.colorBorder}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={lvl.badgeVariant}>
                      {lvl.ageRange}
                    </Badge>
                    <span className="text-xs font-bold text-[#536B61]">
                      {lvl.lessonCount} bài
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-[#24352E]">
                    {lvl.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#176B4A] font-medium mt-1">
                    {lvl.categoryBreakdown}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-[#536B61] leading-relaxed">
                    {lvl.desc}
                  </p>
                </CardContent>

                <CardFooter className="pt-2">
                  <Link href={lvl.route} className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-between group">
                      <span>Vào bậc học</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. TÔN CHỈ & GIÁ TRỊ CỐT LÕI */}
      <section aria-labelledby="values-heading" className="bg-white/60 border-y border-[#E3E1D8] py-14">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="values-heading" className="text-2xl sm:text-3xl font-bold text-[#24352E]">
              Tôn chỉ Số hóa & Tu học
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#536B61] leading-relaxed">
              Dự án Tủ Sách Áo Lam được kiến tạo nhằm phụng sự tổ chức Gia Đình Phật Tử Việt Nam, mang học liệu tu học đến gần hơn với mỗi Huynh trưởng và Đoàn sinh trong thời đại số.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-6 rounded-[16px] bg-[#F8F7F2]/80 border border-[#E3E1D8]/80 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-[14px] bg-white border border-[#E3E1D8] flex items-center justify-center mb-4 shadow-xs">
                  {val.icon}
                </div>
                <h3 className="text-lg font-bold text-[#24352E] mb-2">{val.title}</h3>
                <p className="text-sm text-[#536B61] leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>

          {/* Banner dẫn vào Ngành Đồng */}
          <div className="mt-12 rounded-[20px] bg-[#176B4A] text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide">
                <Feather className="w-3.5 h-3.5" />
                Ngành Oanh Vũ
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">
                Bắt đầu hành trình tu học cùng Ngành Đồng
              </h3>
              <p className="text-sm text-white/80 max-w-xl">
                Khám phá tổng quan về lứa tuổi Oanh Vũ, bài ca ngành, châm ngôn Hòa - Thuận và chương trình tu học qua bốn bậc Mở Mắt, Cánh Mềm, Chân Cứng, Tung Bay.
              </p>
            </div>
            <Link href="/nganh-dong" className="shrink-0">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#176B4A] hover:bg-[#F8F7F2] font-bold border-none"
              >
                Khám phá Ngành Đồng
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
