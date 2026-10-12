import { NextResponse } from "next/server";
import { getAdminSessionFromCookies, getAdminSessionFromRequest, isSessionRevoked, SessionUser } from "./session";
import { prisma } from "@/lib/prisma";

export type AuthResult =
  | { authorized: true; user: SessionUser }
  | { authorized: false; response: NextResponse };

export async function requireAdminAuth(req?: Request): Promise<AuthResult> {
  // 1. CSRF Protection for state-changing HTTP requests
  if (req && ["POST", "PATCH", "DELETE", "PUT"].includes(req.method.toUpperCase())) {
    const secFetchSite = req.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "CSRF_DETECTED",
              message: "Yêu cầu bị từ chối do vi phạm quy tắc an toàn CSRF (cross-site request).",
            },
          },
          { status: 403 }
        ),
      };
    }

    const host = req.headers.get("host");
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    // Kiểm tra Origin nếu có
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return {
            authorized: false,
            response: NextResponse.json(
              {
                success: false,
                error: {
                  code: "CSRF_DETECTED",
                  message: "Nguồn gốc yêu cầu (Origin) không khớp với máy chủ tiếp nhận.",
                },
              },
              { status: 403 }
            ),
          };
        }
      } catch {
        return {
          authorized: false,
          response: NextResponse.json(
            {
              success: false,
              error: {
                code: "CSRF_DETECTED",
                message: "Header Origin không hợp lệ.",
              },
            },
            { status: 403 }
          ),
        };
      }
    } else if (referer && host) {
      // Khi không có Origin, kiểm tra fallback sang Referer
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) {
          return {
            authorized: false,
            response: NextResponse.json(
              {
                success: false,
                error: {
                  code: "CSRF_DETECTED",
                  message: "Nguồn tham chiếu (Referer) không khớp với máy chủ tiếp nhận.",
                },
              },
              { status: 403 }
            ),
          };
        }
      } catch {
        return {
          authorized: false,
          response: NextResponse.json(
            {
              success: false,
              error: {
                code: "CSRF_DETECTED",
                message: "Header Referer không hợp lệ.",
              },
            },
            { status: 403 }
          ),
        };
      }
    }
  }

  // 2. Token & Session Extraction
  let user: SessionUser | null = null;
  if (req) {
    user = getAdminSessionFromRequest(req);
  }

  if (!user) {
    user = await getAdminSessionFromCookies();
  }

  if (!user || user.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Bạn chưa đăng nhập hoặc không có quyền quản trị viên.",
          },
        },
        { status: 401 }
      ),
    };
  }

  // 3. Server-Side Session Revocation: Kiểm tra token có bị thu hồi / đăng xuất hay không
  if (user.sessionId) {
    const revoked = await isSessionRevoked(user.sessionId);
    if (revoked) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "SESSION_REVOKED",
              message: "Phiên đăng nhập đã bị thu hồi hoặc đã đăng xuất. Vui lòng đăng nhập lại.",
            },
          },
          { status: 401 }
        ),
      };
    }
  }

  // 4. Database Check: Xác minh tài khoản còn tồn tại và đang hoạt động (isActive)
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== "admin") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "ACCOUNT_INACTIVE",
              message: "Tài khoản quản trị không tồn tại hoặc đã bị khóa hoạt động.",
            },
          },
          { status: 401 }
        ),
      };
    }
  } catch (err) {
    console.error("Database user verification error:", err);
  }

  return { authorized: true, user };
}
