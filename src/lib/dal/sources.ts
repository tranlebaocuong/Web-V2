import { prisma } from "../prisma";

export interface PublicSource {
  id: string;
  title: string;
  publicationYear: number | null;
  pageCount: number | null;
  publicationNote: string | null;
  branchId: string;
  levelId: string;
}

export async function getPublicSources(): Promise<PublicSource[]> {
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      title: true,
      publicationYear: true,
      pageCount: true,
      publicationNote: true,
      branchId: true,
      levelId: true,
    },
    orderBy: {
      publicationYear: "asc",
    },
  });

  return sources.map((s) => ({
    id: s.id,
    title: s.title,
    publicationYear: s.publicationYear,
    pageCount: s.pageCount,
    publicationNote: s.publicationNote,
    branchId: s.branchId,
    levelId: s.levelId,
  }));
}
