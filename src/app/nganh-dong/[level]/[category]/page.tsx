import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Compass,
  Music,
  Clock,
  Layers,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicLessons } from "@/lib/dal/lessons";

interface PageProps {
  params: Promise<{
    level: string;
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

const LEVEL_NAMES: Record<string, string> = {
  "mo-mat": "Mở Mắt",
  "canh-mem": "Cánh Mềm",
  "chan-cung": "Chân Cứng",
  "tung-bay": "Tung Bay",
};

const CATEGORIES = [
  { id: "phat-phap", name: "Phật pháp – Tinh thần – Lịch sử", shortName: "Phật pháp" },
  { id: "hoat-dong-thanh-nien", name: "Hoạt động Thanh niên và Xã hội", shortName: "HĐ Thanh niên" },
  { id: "van-nghe", name: "Văn nghệ", shortName: "Văn nghệ" },
];

export async function generateMetadata({ params }: PageProps) {
  const { level, category } = await params;
  const levelName = LEVEL_NAMES[level];
  const catObj = CATEGORIES.find((c) => c.id === category);

  if (!levelName || !catObj) {
    return { title: "Không tìm thấy lĩnh vực | Tủ Sách Áo Lam" };
  }

  return {
    title: `${catObj.name} — Bậc ${levelName} | Tủ Sách Áo Lam`,
    description: `Danh sách bài học lĩnh vực ${catObj.name} Bậc ${levelName} Ngành Đồng Gia Đình Phật Tử Việt Nam.`,
  };
}

export default async function CategoryLessonsPage({ params, searchParams }: PageProps) {
  const { level: levelSlug, category: categorySlug } = await params;
  const { page: pageQuery } = await searchParams;

  const levelName = LEVEL_NAMES[levelSlug];
  const catObj = CATEGORIES.find((c) => c.id === categorySlug);

  if (!levelName || !catObj) {
    notFound();
  }

  const currentPage = Math.max(1, parseInt(pageQuery || "1", 10) || 1);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // Lấy danh sách bài học đã xuất bản từ DAL
  let result: {
    items: import("@/lib/dal/lessons").PublicLessonSummaryItem[];
    total: number;
    totalPages: number;
  } = { items: [], total: 0, totalPages: 1 };
  try {
    result = await getPublicLessons({
      level: levelSlug,
      category: categorySlug,
      page: currentPage,
      limit,
      skip,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
  }

  const { items, total, totalPages } = result;

  const createPageUrl = (pageNumber: number) => {
    return `/nganh-dong/${levelSlug}/${categorySlug}?page=${pageNumber}`;
  };

  return (
    <div className="py-8 lg:py-12 space-y-8">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Ngành Đồng", href: "/nganh-dong" },
            { label: `Bậc ${levelName}`, href: `/nganh-dong/${levelSlug}` },
            { label: catObj.name },
          ]}
          className="mb-6"
        />

        {/* Header Lĩnh vực */}
        <div className="rounded-[20px] bg-white border border-[#E3E1D8] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E3E1D8]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Ngành Đồng</Badge>
                <Badge variant="secondary">Bậc {levelName}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#176B4A] tracking-tight">
                {catObj.name}
              </h1>
            </div>

            <div className="text-xs sm:text-sm text-[#536B61] bg-[#F8F7F2] px-3.5 py-2 rounded-[10px] border border-[#E3E1D8] shrink-0">
              Tổng số bài xuất bản: <strong className="text-[#176B4A]">{total} bài</strong>
            </div>
          </div>

          {/* Quick Tabs chuyển đổi giữa 3 Lĩnh vực */}
          <div className="flex items-center gap-2 pt-4 overflow-x-auto">
            <span className="text-xs font-semibold text-[#536B61] mr-1 shrink-0 hidden sm:inline">
              Chuyển lĩnh vực:
            </span>
            {CATEGORIES.map((c) => {
              const isActive = c.id === categorySlug;
              return (
                <Link
                  key={c.id}
                  href={`/nganh-dong/${levelSlug}/${c.id}`}
                  className={`px-3 py-1.5 rounded-[8px] text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    isActive
                      ? "bg-[#176B4A] text-white font-semibold shadow-2xs"
                      : "text-[#536B61] hover:text-[#24352E] hover:bg-black/5"
                  }`}
                >
                  {c.shortName}
                </Link>
              );
            })}
          </div>
        </div>

        {/* DANH SÁCH BÀI HỌC HOẶC TRẠNG THÁI RỖNG */}
        {items.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 text-xs text-[#536B61]">
              <span>Danh sách sắp xếp theo thứ tự giáo trình chuẩn (Thứ tự tăng dần)</span>
              <span>Trang {currentPage} / {totalPages}</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {items.map((lesson: any) => (
                <div
                  key={lesson.id}
                  className="rounded-[14px] border border-[#E3E1D8] bg-white p-5 hover:border-[#176B4A] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-[#176B4A] bg-[#EBF4F0] px-2 py-0.5 rounded-sm">
                        Bài {lesson.sequence}
                      </span>
                      <span className="text-[#536B61] font-mono">
                        {lesson.id}
                      </span>
                    </div>

                    <Link href={`/bai-hoc/${lesson.slug}`}>
                      <h3 className="text-base sm:text-lg font-bold text-[#24352E] group-hover:text-[#176B4A] transition-colors line-clamp-2">
                        {lesson.title}
                      </h3>
                    </Link>

                    {lesson.summary && (
                      <p className="text-xs sm:text-sm text-[#536B61] line-clamp-2 leading-relaxed">
                        {lesson.summary}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    <Link href={`/bai-hoc/${lesson.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-[#176B4A] group-hover:text-white transition-all gap-1.5"
                      >
                        <span>Đọc bài</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân trang */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              createPageUrl={createPageUrl}
            />
          </div>
        ) : (
          /* TRẠNG THÁI RỖNG (EMPTY STATE KHI CHƯA XUẤT BẢN) */
          <EmptyState
            icon="book"
            title="Học liệu đang trong quá trình biên tập chuẩn hóa"
            description="Các bài học thuộc lĩnh vực này đang được Hội đồng Biên tập đối chiếu kỹ lưỡng với giáo trình gốc của BHD Trung Ương GĐPT Việt Nam và sẽ sớm được công bố chính thức tại đây."
            actionText={`Quay lại Bậc ${levelName}`}
            actionHref={`/nganh-dong/${levelSlug}`}
          />
        )}
      </Container>
    </div>
  );
}
