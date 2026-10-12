import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { apiSuccess } from "@/lib/api-response";
import { getDashboardStats } from "@/lib/dal/admin/dashboard";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const stats = await getDashboardStats();
  return apiSuccess(stats);
}
