import { prisma } from "../prisma";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return categories;
}
