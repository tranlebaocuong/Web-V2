/**
 * Rate Limiter phòng thủ Brute-force đăng nhập quản trị
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 phút
const LOCKOUT_MS = 15 * 60 * 1000; // Khóa 15 phút nếu vượt quá ngưỡng

export function checkLoginRateLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (now > entry.resetAt) {
    loginAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else {
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.resetAt = now + LOCKOUT_MS;
    }
  }
}

export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}

// Dọn dẹp bộ nhớ định kỳ
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginAttempts.entries()) {
      if (now > entry.resetAt) {
        loginAttempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}
