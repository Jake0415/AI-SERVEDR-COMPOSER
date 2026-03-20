---
id: "082-A"
title: "제품 테이블 — 주요 스펙 컬럼 제거 + 모델명 호버 툴팁"
priority: high
status: in-progress
phase: 3
features: ["F008", "F082"]
---

# Task 083: 제품 테이블 스펙 컬럼 → 호버 툴팁 전환

## 배경

서버 파트 탭의 "주요 스펙" 컬럼이 테이블 공간을 과도하게 차지하여 가독성이 떨어짐.
스펙 정보를 모델명 호버 시 툴팁으로 표시하도록 변경하고, IT 인프라 장비 탭에도 동일 적용.

## 수락 기준

- [ ] "주요 스펙" 컬럼이 서버 파트 테이블에서 제거됨
- [ ] 모델명에 마우스 호버 시 상세 스펙이 툴팁으로 표시됨
- [ ] 마우스를 치우면 툴팁이 자동으로 사라짐
- [ ] IT 인프라 장비 탭에도 동일한 호버 툴팁 적용됨
- [ ] shadcn/ui Tooltip 컴포넌트 사용
- [ ] 빌드 에러 없음

## 수정 파일

| 파일 | 작업 |
|------|------|
| `components/ui/tooltip.tsx` | shadcn tooltip 컴포넌트 설치 |
| `app/(dashboard)/parts/_components/server-parts-tab.tsx` | 스펙 컬럼 제거, 모델명 Tooltip 래핑 |
| `app/(dashboard)/parts/_components/equipment-tab.tsx` | 모델명 Tooltip 래핑 (동일 패턴) |

## 구현 상세

### 1. shadcn Tooltip 설치
```bash
npx shadcn@latest add tooltip
```

### 2. 서버 파트 탭 변경
- `<TableHead>주요 스펙</TableHead>` 제거
- 스펙 전용 `<TableCell>` 제거
- 모델명 셀에 `<Tooltip>` + `<TooltipTrigger>` + `<TooltipContent>` 래핑
- `formatSpecs()` 함수 제거
- colSpan 조정 (10→9, 9→8)

### 3. IT 인프라 장비 탭 동일 적용
- 모델명 셀에 동일한 Tooltip 패턴 적용
- equipment 데이터의 specs 필드 활용

## 검증
- `npm run build` 성공
- Playwright: 모델명 호버 → 툴팁 표시 확인
- Docker 배포 후 정상 동작
