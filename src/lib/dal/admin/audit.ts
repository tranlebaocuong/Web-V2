import { prisma } from "@/lib/prisma";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}

export async function getRecentAuditLogs(limit = 20) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
