import { prisma } from "../prisma";

export interface PublicBranch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface PublicBranchDetail extends PublicBranch {
  levelsCount: number;
}

export async function getPublicBranches(): Promise<PublicBranch[]> {
  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return branches;
}

export async function getPublicBranchBySlug(
  slug: string
): Promise<PublicBranchDetail | null> {
  const branch = await prisma.branch.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          levels: true,
        },
      },
    },
  });

  if (!branch) {
    return null;
  }

  return {
    id: branch.id,
    name: branch.name,
    slug: branch.slug,
    description: branch.description,
    levelsCount: branch._count.levels,
  };
}
