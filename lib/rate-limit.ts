// ============================================================
// 간단한 인메모리 Rate Limiter
// 프로덕션에서는 Upstash Redis 기반으로 교체 권장
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 주기적으로 만료 엔트리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 300000);

interface RateLimitConfig {
  /** 허용 요청 수 */
  limit: number;
  /** 윈도우 시간 (ms) */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/** Rate Limit 체크 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 },
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 새 윈도우 시작
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** API 라우트용 Rate Limit 설정 프리셋 */
export const RATE_LIMITS = {
  /** 일반 API: 60 req/min */
  api: { limit: 60, windowMs: 60000 },
  /** 인증: 10 req/min */
  auth: { limit: 10, windowMs: 60000 },
  /** 파일 업로드: 5 req/min */
  upload: { limit: 5, windowMs: 60000 },
  /** AI 생성: 10 req/min */
  ai: { limit: 10, windowMs: 60000 },
} as const;
