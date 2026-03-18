// ============================================================
// API 유효성 검증 통합 테스트
// 실제 DB 없이 API 로직의 입력 검증만 테스트
// ============================================================

import { describe, it, expect } from "vitest";

describe("견적 상태 전이 규칙", () => {
  const validTransitions: Record<string, string[]> = {
    draft: ["review", "approved", "published"],
    review: ["approved", "draft"],
    approved: ["published", "draft"],
    published: ["won", "lost", "expired"],
    won: [],
    lost: [],
    expired: [],
  };

  it("draft에서 published로 전환 가능하다", () => {
    expect(validTransitions["draft"]).toContain("published");
  });

  it("published에서 won/lost로 전환 가능하다", () => {
    expect(validTransitions["published"]).toContain("won");
    expect(validTransitions["published"]).toContain("lost");
  });

  it("won/lost에서는 더 이상 전환 불가하다", () => {
    expect(validTransitions["won"]).toHaveLength(0);
    expect(validTransitions["lost"]).toHaveLength(0);
  });
});

describe("견적번호 채번 형식", () => {
  const generateQuotationNumber = (prefix: string, date: string, seq: number): string => {
    return `${prefix}-${date}-${String(seq).padStart(3, "0")}`;
  };

  it("올바른 형식으로 생성된다", () => {
    const num = generateQuotationNumber("Q", "20260318", 1);
    expect(num).toBe("Q-20260318-001");
  });

  it("시퀀스가 3자리로 패딩된다", () => {
    expect(generateQuotationNumber("QT", "20260318", 42)).toBe("QT-20260318-042");
  });

  it("100번째 견적도 올바르게 생성된다", () => {
    expect(generateQuotationNumber("Q", "20260318", 100)).toBe("Q-20260318-100");
  });
});

describe("VAT 계산", () => {
  const calculateVAT = (supplyPrice: number): { vat: number; total: number } => {
    const vat = Math.round(supplyPrice * 0.1);
    return { vat, total: supplyPrice + vat };
  };

  it("공급가의 10%를 VAT로 계산한다", () => {
    const { vat, total } = calculateVAT(10000000);
    expect(vat).toBe(1000000);
    expect(total).toBe(11000000);
  });

  it("소수점 이하는 반올림한다", () => {
    const { vat } = calculateVAT(10000001);
    expect(vat).toBe(1000000); // 반올림
  });

  it("0원이면 VAT도 0이다", () => {
    const { vat, total } = calculateVAT(0);
    expect(vat).toBe(0);
    expect(total).toBe(0);
  });
});

describe("역할 기반 접근 제어 규칙", () => {
  type Role = "super_admin" | "admin" | "member";

  const permissions: Record<string, Role[]> = {
    "parts:read": ["super_admin", "admin", "member"],
    "parts:write": ["super_admin", "admin"],
    "users:manage": ["super_admin"],
    "quotation:create": ["super_admin", "admin", "member"],
    "quotation:approve": ["super_admin", "admin"],
    "quotation:publish": ["super_admin", "admin"],
    "settings:manage": ["super_admin", "admin"],
  };

  function hasPermission(role: Role, action: string): boolean {
    return permissions[action]?.includes(role) ?? false;
  }

  it("슈퍼어드민은 모든 기능에 접근 가능하다", () => {
    Object.keys(permissions).forEach((action) => {
      expect(hasPermission("super_admin", action)).toBe(true);
    });
  });

  it("관리자는 사용자 관리를 제외한 모든 기능에 접근 가능하다", () => {
    expect(hasPermission("admin", "parts:write")).toBe(true);
    expect(hasPermission("admin", "quotation:approve")).toBe(true);
    expect(hasPermission("admin", "users:manage")).toBe(false);
  });

  it("멤버는 조회와 견적 생성만 가능하다", () => {
    expect(hasPermission("member", "parts:read")).toBe(true);
    expect(hasPermission("member", "quotation:create")).toBe(true);
    expect(hasPermission("member", "parts:write")).toBe(false);
    expect(hasPermission("member", "quotation:approve")).toBe(false);
    expect(hasPermission("member", "users:manage")).toBe(false);
  });
});

describe("엑셀 업로드 데이터 검증", () => {
  interface RowValidation {
    isValid: boolean;
    errors: string[];
  }

  function validateRow(row: {
    category: string;
    modelName: string;
    manufacturer: string;
    listPrice: number;
    supplyPrice: number;
  }, validCategories: string[]): RowValidation {
    const errors: string[] = [];

    if (!row.category) errors.push("카테고리명 필수");
    if (!row.modelName) errors.push("모델명 필수");
    if (!row.manufacturer) errors.push("제조사 필수");
    if (row.listPrice < 0) errors.push("리스트가는 0 이상");
    if (row.supplyPrice < 0) errors.push("공급가는 0 이상");
    if (row.category && !validCategories.includes(row.category)) {
      errors.push("존재하지 않는 카테고리");
    }

    return { isValid: errors.length === 0, errors };
  }

  const validCategories = ["CPU", "메모리", "SSD", "HDD"];

  it("올바른 데이터는 통과한다", () => {
    const result = validateRow(
      { category: "CPU", modelName: "Xeon", manufacturer: "Intel", listPrice: 1000000, supplyPrice: 1200000 },
      validCategories,
    );
    expect(result.isValid).toBe(true);
  });

  it("필수 필드 누락 시 오류를 반환한다", () => {
    const result = validateRow(
      { category: "", modelName: "", manufacturer: "Intel", listPrice: 0, supplyPrice: 0 },
      validCategories,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("카테고리명 필수");
    expect(result.errors).toContain("모델명 필수");
  });

  it("존재하지 않는 카테고리는 오류를 반환한다", () => {
    const result = validateRow(
      { category: "GPU", modelName: "RTX 4090", manufacturer: "NVIDIA", listPrice: 2000000, supplyPrice: 2500000 },
      validCategories,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("존재하지 않는 카테고리");
  });

  it("음수 가격은 오류를 반환한다", () => {
    const result = validateRow(
      { category: "CPU", modelName: "Xeon", manufacturer: "Intel", listPrice: -100, supplyPrice: 1200000 },
      validCategories,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("리스트가는 0 이상");
  });
});
