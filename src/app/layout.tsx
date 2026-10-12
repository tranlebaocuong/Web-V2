import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "@/styles/globals.css";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { Footer } from "@/components/layout/Footer";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sentrang.gdptvietnam.org";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
    template: "%s | Tủ Sách Áo Lam",
  },
  description:
    "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất dành cho Huynh trưởng và Đoàn sinh Gia Đình Phật Tử Việt Nam. Tra cứu và học tập trực tiếp theo giáo trình chuẩn mực.",
  keywords: [
    "Gia Đình Phật Tử",
    "GĐPT",
    "Tủ Sách Áo Lam",
    "Tu học",
    "Ngành Đồng",
    "Phật pháp",
    "Tinh thần",
    "Chuyên môn",
    "Mở Mắt",
    "Cánh Buồm",
    "Tung Bay",
    "Chân Trời",
  ],
  authors: [{ name: "Ban Hướng Dẫn GĐPT Việt Nam" }],
  creator: "Gia Đình Phật Tử Việt Nam",
  publisher: "Tủ Sách Áo Lam — GĐPT Việt Nam",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/brand/logo.png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: baseUrl,
    siteName: "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
    title: "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
    description:
      "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất dành cho Huynh trưởng và Đoàn sinh Gia Đình Phật Tử Việt Nam.",
    images: [
      {
        url: "/brand/logo.png",
        width: 1024,
        height: 1024,
        alt: "Logo Tủ Sách Áo Lam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất",
    description:
      "Tủ Sách Áo Lam — Nơi tìm kiếm tài liệu tu học mới nhất dành cho Huynh trưởng và Đoàn sinh.",
    images: ["/brand/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="flex min-h-screen flex-col font-sans bg-[#F8F7F2] text-[#24352E] antialiased">
        <GlobalHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
