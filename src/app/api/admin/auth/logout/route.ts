import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getAdminSessionFromRequest, revokeSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/dal/admin/audit";

export async function POST(req: Request) {
  const user = getAdminSessionFromRequest(req);
  if (user) {
    if (user.sessionId) {
      await revokeSession(user.sessionId);
    }
    await logAudit({
      actorId: user.userId,
      action: "AUTH_LOGOUT",
      entityType: "user",
      entityId: user.userId,
      metadata: { email: user.email, sessionId: user.sessionId },
    });
  }

  const response = NextResponse.json({
    success: true,
    data: { message: "Đăng xuất thành công." },
  });

  // Xóa cookie phiên
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      req.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
