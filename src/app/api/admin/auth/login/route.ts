import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/dal/admin/audit";
import { checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from "@/lib/auth/rate-limiter";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Thông tin đăng nhập không hợp lệ.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;

    // 1. Kiểm tra giới hạn tần suất đăng nhập (Brute-force protection)
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: `Bạn đã thử đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds || 900} giây.`,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": `${rateCheck.retryAfterSeconds || 900}`,
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu không chính xác.",
          },
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu không chính xác.",
          },
        },
        { status: 401 }
      );
    }

    // Đăng nhập thành công -> Xóa bộ đếm số lần thất bại
    clearLoginRateLimit(rateLimitKey);

    // Tạo JWT token phiên làm việc
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Ghi nhật ký đăng nhập thành công
    await logAudit({
      actorId: user.id,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "user",
      entityId: user.id,
      metadata: { email: user.email, role: user.role, ip },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });

    // Thiết lập HttpOnly Cookie bảo mật cao
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        req.headers.get("x-forwarded-proto") === "https",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 86400, // 7 ngày
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi hệ thống khi xử lý đăng nhập.",
        },
      },
      { status: 500 }
    );
  }
}
