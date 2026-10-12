import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Compass,
  Music,
  Info,
  Calendar,
  Layers,
  Sparkles,
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
import { getPublicLevelOverview } from "@/lib/dal/levels";

interface PageProps {
  params: Promise<{ level: string }>;
}

const LEVEL_CONFIGS: Record<
  string,
  {
    name: string;
    year: string;
    ageRange: string;
    description: string;
    totalCurriculum: number;
    sourceTitle: string;
    publicationYear: number;
    categories: Array<{
      id: string;
      name: string;
      curriculumCount: number;
      desc: string;
      icon: "lotus" | "compass" | "music";
    }>;
  }
> = {
  "mo-mat": {
    name: "Mở Mắt",
    year: "Năm thứ nhất",
    ageRange: "7–8 tuổi",
    description:
      "Giai đoạn khởi đầu của các em Oanh Vũ khi bước vào tổ chức Gia Đình Phật Tử. Rèn luyện sự kính ngưỡng đối với Tam Bảo, vâng lời cha mẹ và hòa thuận với anh chị em bạn bè.",
    totalCurriculum: 32,
    sourceTitle: "Tài liệu tu học ngành Đồng – Bậc Mở Mắt",
    publicationYear: 2016,
    categories: [
      {
        id: "phat-phap",
        name: "Phật pháp – Tinh thần – Lịch sử",
        curriculumCount: 12,
        desc: "Lịch sử Đức Phật Thích Ca (sơ sanh đến xuất gia), Em đến chùa, Huy hiệu Hoa Sen, Lục hòa gia đình.",
        icon: "lotus",
      },
      {
        id: "hoat-dong-thanh-nien",
        name: "Hoạt động Thanh niên và Xã hội",
        curriculumCount: 14,
        desc: "Gút dây cơ bản, dấu đi đường đơn giản, vệ sinh thân thể, an toàn giao thông và giao tiếp lễ độ.",
        icon: "compass",
      },
      {
        id: "van-nghe",
        name: "Văn nghệ",
        curriculumCount: 6,
        desc: "Bài ca Oanh Vũ, các bài hát sinh hoạt đoàn, trò chơi vòng tròn và thủ công xếp giấy.",
        icon: "music",
      },
    ],
  },
  "canh-mem": {
    name: "Cánh Mềm",
    year: "Năm thứ hai",
    ageRange: "8–9 tuổi",
    description:
      "Tập vỗ đôi cánh non nớt để vươn tới đức tính dũng cảm, thật thà. Bồi dưỡng nề nếp kỷ luật Đội Chúng và tình đoàn kết gắn bó keo sơn.",
    totalCurriculum: 38,
    sourceTitle: "Tài liệu tu học ngành Đồng – Bậc Cánh Mềm",
    publicationYear: 2016,
    categories: [
      {
        id: "phat-phap",
        name: "Phật pháp – Tinh thần – Lịch sử",
        curriculumCount: 12,
        desc: "Đức Phật thành đạo, Tam bảo, Tứ trọng ân, Lịch sử thành lập GĐPT và Châm ngôn Oanh Vũ.",
        icon: "lotus",
      },
      {
        id: "hoat-dong-thanh-nien",
        name: "Hoạt động Thanh niên và Xã hội",
        curriculumCount: 19,
        desc: "Kỹ năng nút dây mở rộng, mật thư sơ cấp, sơ cứu thương tích nhẹ, nếp sống văn minh và tinh thần tập thể.",
        icon: "compass",
      },
      {
        id: "van-nghe",
        name: "Văn nghệ",
        curriculumCount: 7,
        desc: "Hát bài ca chính thức, kịch bản ngắn giáo dục đạo đức, múa dân vũ và khéo tay hay làm.",
        icon: "music",
      },
    ],
  },
  "chan-cung": {
    name: "Chân Cứng",
    year: "Năm thứ ba",
    ageRange: "9–10 tuổi",
    description:
      "Rèn luyện ý chí, đức tính kiên trì và tự lập. Các em bắt đầu nhận trách nhiệm trong đàn Oanh Vũ và mở rộng tầm hiểu biết xã hội.",
    totalCurriculum: 41,
    sourceTitle: "Tài liệu tu học ngành Đồng – Bậc Chân Cứng",
    publicationYear: 2016,
    categories: [
      {
        id: "phat-phap",
        name: "Phật pháp – Tinh thần – Lịch sử",
        curriculumCount: 14,
        desc: "Đức Phật chuyển pháp luân, Ngũ giới, Thập thiện, Lịch sử Danh nhân Phật giáo và các ngày lễ lớn.",
        icon: "lotus",
      },
      {
        id: "hoat-dong-thanh-nien",
        name: "Hoạt động Thanh niên và Xã hội",
        curriculumCount: 20,
        desc: "Phương hướng và la bàn, truyền tin Morse sơ cấp, nấu ăn dã ngoại, phòng chống tai nạn thương tích.",
        icon: "compass",
      },
      {
        id: "van-nghe",
        name: "Văn nghệ",
        curriculumCount: 7,
        desc: "Hùng biện Oanh Vũ, kể chuyện tích Phật, hoạt cảnh đạo từ bi và trò chơi lớn trí tuệ.",
        icon: "music",
      },
    ],
  },
  "tung-bay": {
    name: "Tung Bay",
    year: "Năm thứ tư",
    ageRange: "10–12 tuổi",
    description:
      "Bậc học cao nhất của Ngành Đồng. Chuẩn bị vững vàng cả về đạo hạnh, kiến thức và kỹ năng để làm Đàn trưởng, Đàn phó và chuyển giao lên Ngành Thiếu.",
    totalCurriculum: 45,
    sourceTitle: "Tài liệu tu học ngành Đồng – Bậc Tung Bay",
    publicationYear: 2016,
    categories: [
      {
        id: "phat-phap",
        name: "Phật pháp – Tinh thần – Lịch sử",
        curriculumCount: 16,
        desc: "Đức Phật nhập Niết bàn, Bát chánh đạo sơ giải, Tinh thần Tự lực, Lược sử Phật giáo Việt Nam.",
        icon: "lotus",
      },
      {
        id: "hoat-dong-thanh-nien",
        name: "Hoạt động Thanh niên và Xã hội",
        curriculumCount: 22,
        desc: "Quản trị Đàn chúng, Morse và Semaphore hoàn chỉnh, kỹ năng dã ngoại nâng cao, hoạt động môi trường.",
        icon: "compass",
      },
      {
        id: "van-nghe",
        name: "Văn nghệ",
        curriculumCount: 7,
        desc: "Sáng tác bài hát sinh hoạt, dàn dựng kịch truyền thống Sen Trắng và làm báo tường tập thể.",
        icon: "music",
      },
    ],
  },
};

export async function generateMetadata({ params }: PageProps) {
  const { level: levelSlug } = await params;
  const config = LEVEL_CONFIGS[levelSlug];
  if (!config) return { title: "Không tìm thấy bậc học | Tủ Sách Áo Lam" };

  return {
    title: `Bậc ${config.name} (Ngành Đồng) | Tủ Sách Áo Lam`,
    description: `Chương trình tu học Bậc ${config.name} Ngành Đồng gồm ${config.totalCurriculum} bài học theo giáo trình chính thức BHD TƯ GĐPT VN.`,
  };
}

export default async function LevelPage({ params }: PageProps) {
  const { level: levelSlug } = await params;
  const config = LEVEL_CONFIGS[levelSlug];

  if (!config) {
    notFound();
  }

  // Lấy dữ liệu thống kê từ Data Access Layer
  let overview = null;
  try {
    overview = await getPublicLevelOverview(levelSlug);
  } catch {
    overview = null;
  }

  return (
    <div className="py-8 lg:py-12 space-y-10">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Ngành Đồng", href: "/nganh-dong" },
            { label: `Bậc ${config.name}` },
          ]}
          className="mb-6"
        />

        {/* Level Header Banner */}
        <div className="rounded-[20px] bg-white border border-[#E3E1D8] p-6 sm:p-10 shadow-xs relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">
                  {config.year} • {config.ageRange}
                </Badge>
                <Badge variant="accent">
                  {config.totalCurriculum} bài học giáo trình
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#176B4A] tracking-tight">
                Bậc {config.name}
              </h1>

              <p className="text-base text-[#536B61] leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Thông tin nguồn tài liệu chuẩn */}
            <div className="p-4 sm:p-5 rounded-[14px] bg-[#F8F7F2] border border-[#E3E1D8] max-w-sm shrink-0 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#176B4A] font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Nguồn Giáo trình Gốc</span>
              </div>
              <p className="font-semibold text-[#24352E]">
                {config.sourceTitle}
              </p>
              <div className="text-[#536B61] space-y-0.5">
                <p>Cơ quan: Ban Hướng Dẫn Trung Ương GĐPT Việt Nam</p>
                <p>Năm phát hành: {config.publicationYear}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 LĨNH VỰC TU HỌC */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E3E1D8]">
            <div>
              <span className="text-xs font-semibold text-[#176B4A] uppercase tracking-wider">
                Cấu trúc phân bổ
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#24352E]">
                Ba Lĩnh Vực Tu Học
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-[#536B61] font-medium hidden sm:inline">
              Chọn lĩnh vực để xem danh sách bài học
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.categories.map((cat) => {
              // Lấy số bài đã xuất bản từ DAL nếu có
              const liveCat = overview?.categories?.find((c) => c.id === cat.id);
              const publishedCount = liveCat?.lessonCount ?? 0;

              return (
                <Card
                  key={cat.id}
                  className="flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-[#176B4A]"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-[12px] bg-[#EBF4F0] text-[#176B4A] flex items-center justify-center mb-3">
                      {cat.icon === "compass" ? (
                        <Compass className="w-6 h-6" />
                      ) : cat.icon === "music" ? (
                        <Music className="w-6 h-6" />
                      ) : (
                        <Sparkles className="w-6 h-6" />
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-[#24352E]">
                      {cat.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#536B61] pt-1">
                      Giáo trình: <strong>{cat.curriculumCount} bài</strong>
                      {publishedCount > 0 && (
                        <span className="text-[#176B4A] font-semibold ml-2">
                          • {publishedCount} bài công khai
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-[#536B61] leading-relaxed">
                      {cat.desc}
                    </p>
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Link
                      href={`/nganh-dong/${levelSlug}/${cat.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between group"
                      >
                        <span>Danh sách bài học</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Thông báo tiến độ biên tập */}
        <div className="rounded-[14px] bg-[#EBF4F0] border border-[#176B4A]/20 p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[#176B4A] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#164332] space-y-1">
            <p className="font-bold">Quy chuẩn học liệu số hóa Tủ Sách Áo Lam:</p>
            <p className="leading-relaxed">
              Toàn bộ bài học được số hóa giữ nguyên thứ tự và cấu trúc nội dung từ giáo trình gốc BHD TƯ GĐPT VN. Các bài học đang được Hội đồng Biên tập hoàn thiện theo quy chuẩn 5 bước và xuất bản lần lượt phục vụ sinh hoạt đoàn.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
