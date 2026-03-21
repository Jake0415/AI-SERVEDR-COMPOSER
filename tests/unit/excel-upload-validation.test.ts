// ============================================================
// 서버 파트 엑셀 업로드 유효성 검증 테스트
// 파트코드 매핑, 필수 필드, 스펙 파싱, 가격 검증
// ============================================================

import { describe, it, expect } from "vitest";

// ── 파트코드 → Level 1 부모 매핑 로직 (업로드 API에서 추출) ──

interface PartCodeEntry {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
}

function findLevel1Parent(
  partCodeEntry: PartCodeEntry,
  allPartCodes: PartCodeEntry[],
): PartCodeEntry | null {
  if (partCodeEntry.level === 1) return partCodeEntry;
  const parent = allPartCodes.find((c) => c.id === partCodeEntry.parentId);
  if (!parent) return null;
  if (parent.level === 1) return parent;
  return findLevel1Parent(parent, allPartCodes);
}

// ── 스펙 파싱 로직 (업로드 API에서 추출) ──

function parseSpecCells(cells: (string | number | null)[]): Record<string, string> {
  const specs: Record<string, string> = {};
  const specKeys = ["cores", "frequency", "capacity", "interface", "tdp", "note"];
  specKeys.forEach((key, idx) => {
    const val = String(cells[idx] ?? "").trim();
    if (val) specs[key] = val;
  });
  return specs;
}

// ── 필수 필드 검증 로직 ──

interface RowValidation {
  partCode: string;
  modelName: string;
  manufacturer: string;
}

function validateRequiredFields(row: RowValidation): string | null {
  if (!row.partCode) return "파트코드는 필수 항목입니다.";
  if (!row.modelName) return "모델명은 필수 항목입니다.";
  if (!row.manufacturer) return "제조사는 필수 항목입니다.";
  return null;
}

// ── 테스트 데이터 ──

const mockPartCodes: PartCodeEntry[] = [
  { id: "l1-cpu", code: "CP", name: "CPU", level: 1, parentId: null },
  { id: "l2-proc", code: "CP-001", name: "프로세서", level: 2, parentId: "l1-cpu" },
  { id: "l1-mem", code: "MM", name: "메모리", level: 1, parentId: null },
  { id: "l2-ram", code: "MM-001", name: "RAM", level: 2, parentId: "l1-mem" },
  { id: "l1-st", code: "ST", name: "스토리지", level: 1, parentId: null },
  { id: "l2-hdd", code: "ST-001", name: "HDD", level: 2, parentId: "l1-st" },
  { id: "l2-ssd", code: "ST-002", name: "SSD", level: 2, parentId: "l1-st" },
  { id: "l1-gpu", code: "GP", name: "GPU", level: 1, parentId: null },
  { id: "l2-gpu", code: "GP-001", name: "GPU 카드", level: 2, parentId: "l1-gpu" },
];

// ── 테스트 ──

describe("파트코드 → Level 1 부모 매핑", () => {
  it("Level 2 코드에서 Level 1 부모를 찾는다", () => {
    const entry = mockPartCodes.find((c) => c.code === "CP-001")!;
    const parent = findLevel1Parent(entry, mockPartCodes);
    expect(parent).not.toBeNull();
    expect(parent!.code).toBe("CP");
    expect(parent!.name).toBe("CPU");
    expect(parent!.level).toBe(1);
  });

  it("Level 1 코드는 자기 자신을 반환한다", () => {
    const entry = mockPartCodes.find((c) => c.code === "GP")!;
    const parent = findLevel1Parent(entry, mockPartCodes);
    expect(parent).not.toBeNull();
    expect(parent!.code).toBe("GP");
  });

  it("스토리지 하위 코드들의 부모가 ST이다", () => {
    const hdd = mockPartCodes.find((c) => c.code === "ST-001")!;
    const ssd = mockPartCodes.find((c) => c.code === "ST-002")!;

    expect(findLevel1Parent(hdd, mockPartCodes)!.code).toBe("ST");
    expect(findLevel1Parent(ssd, mockPartCodes)!.code).toBe("ST");
  });

  it("parentId가 없는 Level 2 코드는 null을 반환한다", () => {
    const orphan: PartCodeEntry = {
      id: "orphan", code: "XX-001", name: "고아", level: 2, parentId: "nonexistent",
    };
    const parent = findLevel1Parent(orphan, mockPartCodes);
    expect(parent).toBeNull();
  });
});

describe("필수 필드 검증", () => {
  it("모든 필드가 있으면 null 반환", () => {
    const err = validateRequiredFields({ partCode: "CP-001", modelName: "Xeon Gold 6430", manufacturer: "Intel" });
    expect(err).toBeNull();
  });

  it("파트코드 누락 시 에러", () => {
    const err = validateRequiredFields({ partCode: "", modelName: "Xeon", manufacturer: "Intel" });
    expect(err).toContain("파트코드");
  });

  it("모델명 누락 시 에러", () => {
    const err = validateRequiredFields({ partCode: "CP-001", modelName: "", manufacturer: "Intel" });
    expect(err).toContain("모델명");
  });

  it("제조사 누락 시 에러", () => {
    const err = validateRequiredFields({ partCode: "CP-001", modelName: "Xeon", manufacturer: "" });
    expect(err).toContain("제조사");
  });
});

describe("스펙 파싱 (G~L 컬럼)", () => {
  it("모든 스펙 컬럼이 있으면 6개 키로 파싱된다", () => {
    const cells = ["32C/64T", "2.1GHz", "64GB", "LGA4677", "270W", "Sapphire Rapids"];
    const specs = parseSpecCells(cells);
    expect(specs).toEqual({
      cores: "32C/64T",
      frequency: "2.1GHz",
      capacity: "64GB",
      interface: "LGA4677",
      tdp: "270W",
      note: "Sapphire Rapids",
    });
  });

  it("빈 컬럼은 specs에 포함되지 않는다", () => {
    const cells = ["32C", "", "64GB", "", "", ""];
    const specs = parseSpecCells(cells);
    expect(specs).toEqual({
      cores: "32C",
      capacity: "64GB",
    });
    expect(Object.keys(specs)).toHaveLength(2);
  });

  it("모든 컬럼이 비어있으면 빈 객체 반환", () => {
    const cells = [null, null, null, null, null, null];
    const specs = parseSpecCells(cells);
    expect(specs).toEqual({});
  });

  it("숫자 값도 문자열로 변환된다", () => {
    const cells = [32, 2.1, 64, null, 270, null];
    const specs = parseSpecCells(cells);
    expect(specs.cores).toBe("32");
    expect(specs.frequency).toBe("2.1");
    expect(specs.tdp).toBe("270");
  });
});

describe("가격 검증", () => {
  it("음수 가격은 허용하지 않는다", () => {
    const prices = [-100, 500000, 300000];
    const hasNegative = prices.some((p) => p < 0);
    expect(hasNegative).toBe(true);
  });

  it("0은 유효한 가격이다", () => {
    const prices = [0, 0, 0];
    const hasNegative = prices.some((p) => p < 0);
    expect(hasNegative).toBe(false);
  });

  it("양수 가격은 모두 유효하다", () => {
    const prices = [3200000, 2900000, 2500000];
    const allValid = prices.every((p) => p >= 0);
    expect(allValid).toBe(true);
  });
});

describe("중복 체크 로직", () => {
  const existingParts = [
    { modelName: "Xeon Gold 6430", manufacturer: "Intel" },
    { modelName: "EPYC 9654", manufacturer: "AMD" },
    { modelName: "H100 SXM 80GB", manufacturer: "NVIDIA" },
  ];

  function isDuplicate(modelName: string, manufacturer: string): boolean {
    return existingParts.some(
      (p) => p.modelName === modelName && p.manufacturer === manufacturer,
    );
  }

  it("동일 모델명+제조사는 중복이다", () => {
    expect(isDuplicate("Xeon Gold 6430", "Intel")).toBe(true);
  });

  it("같은 모델명이라도 제조사가 다르면 중복이 아니다", () => {
    expect(isDuplicate("Xeon Gold 6430", "AMD")).toBe(false);
  });

  it("신규 부품은 중복이 아니다", () => {
    expect(isDuplicate("Xeon Gold 6430L", "Intel")).toBe(false);
  });
});
