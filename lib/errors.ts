// ============================================================
// 공통 에러 핸들링 유틸리티
// ============================================================

import type { ApiResponse } from "@/lib/types";

/** 애플리케이션 에러 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** API 에러 응답 생성 */
export function createErrorResponse<T>(
  code: string,
  message: string,
): ApiResponse<T> {
  return { success: false, error: { code, message } };
}

/** 에러를 API 응답 형식으로 변환 */
export function handleApiError(error: unknown): {
  body: ApiResponse<never>;
  status: number;
} {
  if (error instanceof AppError) {
    return {
      body: createErrorResponse(error.code, error.message),
      status: error.status,
    };
  }

  const message =
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
  return {
    body: createErrorResponse("INTERNAL_ERROR", message),
    status: 500,
  };
}
