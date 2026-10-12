import type { Metadata } from "next";
import { AdminClientLayout } from "@/components/admin/AdminClientLayout";

export const metadata: Metadata = {
  title: "Quản Trị Học Vụ | Tủ Sách Áo Lam — GĐPT",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
