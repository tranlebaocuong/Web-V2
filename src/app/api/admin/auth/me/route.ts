import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return apiSuccess({
    user: user || auth.user,
  });
}
