// ============================================================
// 로깅 유틸리티 — 민감 데이터 자동 마스킹
// ============================================================

const SENSITIVE_KEYS = new Set([
  "password", "cost_price", "costPrice", "cost_price_encrypted",
  "token", "secret", "api_key", "apiKey", "encryption_key",
  "authorization", "cookie", "session",
]);

/** 객체에서 민감 필드를 마스킹한 복사본 반환 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = "***MASKED***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

type LogLevel = "info" | "warn" | "error";

/** 구조화된 로그 출력 (JSON) */
export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: maskSensitiveData(context) } : {}),
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      // info는 프로덕션에서 비활성화 가능
      if (process.env.NODE_ENV !== "production") {
        console.log(JSON.stringify(entry));
      }
      break;
  }
}
