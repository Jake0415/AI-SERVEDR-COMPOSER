// ============================================================
// 에러 핸들링 유틸리티 단위 테스트
// ============================================================

import { describe, it, expect } from "vitest";
import { AppError, createErrorResponse, handleApiError } from "@/lib/errors";

describe("AppError", () => {
  it("코드, 메시지, 상태를 가진다", () => {
    const error = new AppError("NOT_FOUND", "리소스 없음", 404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("리소스 없음");
    expect(error.status).toBe(404);
    expect(error.name).toBe("AppError");
  });

  it("기본 상태코드는 500이다", () => {
    const error = new AppError("ERR", "에러");
    expect(error.status).toBe(500);
  });
});

describe("createErrorResponse", () => {
  it("표준 에러 응답 형식을 반환한다", () => {
    const response = createErrorResponse("BAD_REQUEST", "잘못된 요청");
    expect(response).toEqual({
      success: false,
      error: { code: "BAD_REQUEST", message: "잘못된 요청" },
    });
  });
});

describe("handleApiError", () => {
  it("AppError를 올바르게 변환한다", () => {
    const error = new AppError("FORBIDDEN", "접근 거부", 403);
    const { body, status } = handleApiError(error);

    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("FORBIDDEN");
  });

  it("일반 Error를 500으로 변환한다", () => {
    const error = new Error("알 수 없는 오류");
    const { body, status } = handleApiError(error);

    expect(status).toBe(500);
    expect(body.error?.code).toBe("INTERNAL_ERROR");
  });

  it("문자열 에러도 처리한다", () => {
    const { body, status } = handleApiError("something went wrong");
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});
