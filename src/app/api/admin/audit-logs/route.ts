import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiPaginated, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return apiPaginated(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: log.actor ? { email: log.actor.email, role: log.actor.role } : null,
      })),
      {
        page,
        limit,
        total,
        totalPages,
      }
    );
  } catch (err: any) {
    console.error("Fetch audit logs failed:", err);
    return apiError("SERVER_ERROR", "Lỗi máy chủ khi lấy nhật ký kiểm toán.", 500);
  }
}
