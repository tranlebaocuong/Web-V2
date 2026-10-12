import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "sentrang_admin_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "sen-trang-gdpt-vn-secure-auth-secret-key-2026-v1";

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

interface TokenPayload extends SessionUser {
  sid: string; // Session ID for revocation tracking
  exp: number; // Expiration timestamp in seconds
  iat: number; // Issued at timestamp in seconds
}

// Bộ đệm trong bộ nhớ cho danh sách phiên bị thu hồi (Fast In-Memory Cache)
const memoryRevocationCache = new Map<string, number>();

/**
 * Thu hồi phiên đăng nhập ở tầng server (Server-Side Session Revocation)
 * Lưu cả trong bộ đệm tiến trình lẫn PostgreSQL (bảng site_settings) để đồng bộ đa tiến trình / đa instance.
 */
export async function revokeSession(sessionId: string, expSeconds?: number): Promise<void> {
  if (!sessionId) return;
  const now = Math.floor(Date.now() / 1000);
  const expiry = expSeconds || now + 7 * 86400;

  // 1. Ghi nhận vào bộ đệm bộ nhớ tức thì
  memoryRevocationCache.set(sessionId, expiry);

  // 2. Lưu trữ phân tán vào cơ sở dữ liệu
  try {
    await prisma.siteSetting.upsert({
      where: { key: `revoked_token:${sessionId}` },
      update: {
        valueJson: { revokedAt: now, exp: expiry },
        updatedAt: new Date(),
      },
      create: {
        key: `revoked_token:${sessionId}`,
        valueJson: { revokedAt: now, exp: expiry },
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[Session] Error persisting token revocation to DB:", err);
  }
}

/**
 * Kiểm tra xem phiên đăng nhập đã bị thu hồi / đăng xuất hay chưa
 */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const now = Math.floor(Date.now() / 1000);

  // 1. Kiểm tra cache bộ nhớ trước (O(1) latency)
  const cachedExp = memoryRevocationCache.get(sessionId);
  if (cachedExp !== undefined) {
    if (cachedExp > now) {
      return true;
    } else {
      memoryRevocationCache.delete(sessionId);
    }
  }

  // 2. Kiểm tra database phân tán
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: `revoked_token:${sessionId}` },
    });
    if (record) {
      const data = record.valueJson as any;
      if (data?.exp && data.exp > now) {
        memoryRevocationCache.set(sessionId, data.exp);
        return true;
      }
    }
  } catch (err) {
    console.error("[Session] Error checking token revocation in DB:", err);
  }

  return false;
}

export function createSessionToken(user: SessionUser, expiresInSeconds = 7 * 86400): string {
  const now = Math.floor(Date.now() / 1000);
  const sid = user.sessionId || crypto.randomUUID();
  const payload: TokenPayload = {
    ...user,
    sid,
    sessionId: sid,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload: TokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token expired
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid || payload.sessionId,
    };
  } catch {
    return null;
  }
}

/**
 * Lấy phiên đăng nhập quản trị viên hiện tại từ Cookie trên Server Component hoặc Route Handler
 */
export async function getAdminSessionFromCookies(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Lấy phiên đăng nhập quản trị viên từ Request headers
 */
export function getAdminSessionFromRequest(req: Request): SessionUser | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookiesMap = parseCookies(cookieHeader);
  const token = cookiesMap[SESSION_COOKIE_NAME];
  if (!token) return null;

  return verifySessionToken(token);
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [name, ...value] = pair.trim().split("=");
    if (name) {
      result[name] = decodeURIComponent(value.join("="));
    }
  });
  return result;
}
