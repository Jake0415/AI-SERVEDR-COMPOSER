# Task 075: 엑셀 업로드 견적 (F047)

## 상태: 완료

## 관련 Feature
- F047: 엑셀 업로드 견적 생성

## 의존성
- Task 074 (견적 생성 허브 페이지)

## 설명
엑셀 파일로 서버 구성을 입력하여 견적을 생성하는 기능을 구현한다. 기존 부품 엑셀 업로드(Task 015-1, F001)와 별도 — 부품 DB 등록이 아닌 **견적 생성** 목적이다.

## 부품 엑셀 업로드와의 차이점

| 구분 | 부품 엑셀 업로드 (F001) | 견적 엑셀 업로드 (F047) |
|------|------------------------|------------------------|
| 목적 | 부품 DB에 부품+가격 등록 | 서버 구성을 입력하여 견적 생성 |
| 입력 | 부품 카테고리, 모델명, 제조사, 4가지 가격 | 서버명, 수량, 필요 사양(CPU/메모리/스토리지 등) |
| 출력 | parts + part_prices 테이블 INSERT | ParsedServerConfig[] → 견적 생성 엔진 |
| API | `/api/parts/excel-upload` | `/api/quotation/excel-upload` |

## 신규 파일

- `app/(dashboard)/quotation/excel/page.tsx` — 엑셀 견적 업로드 페이지
- `app/api/quotation/excel-template/route.ts` — 견적용 엑셀 템플릿 다운로드
- `app/api/quotation/excel-upload/route.ts` — 엑셀 업로드 + 파싱
- `lib/services/quotation-excel-parser.ts` — 엑셀 → ParsedServerConfig[] 변환

## 재사용
- ExcelJS (이미 `package.json`에 설치됨)
- `lib/quotation/matching-engine.ts` — 부품 매칭 엔진
- `lib/types/ai.ts` — ParsedServerConfig 인터페이스
- `app/api/parts/excel-upload/route.ts` — 엑셀 업로드 패턴 참조

## 엑셀 템플릿 구조

### 시트 1: 서버 구성 (servers) — 필수

| 열 | 설명 | 예시 | 필수 |
|----|------|------|------|
| A: 서버명 | 서버 용도/이름 | "웹 서버" | Y |
| B: 수량 | 서버 대수 | 3 | Y |
| C: CPU 코어 수 | 최소 코어 수 | 32 | N |
| D: CPU 모델 | 선호 CPU 모델명 | "Xeon Gold 6330" | N |
| E: 메모리(GB) | 최소 메모리 용량 | 256 | Y |
| F: 메모리 타입 | DDR4/DDR5 | "DDR5" | N |
| G: SSD 용량(GB) | SSD 1개당 용량 | 1920 | N |
| H: SSD 수량 | SSD 개수 | 4 | N |
| I: HDD 용량(GB) | HDD 1개당 용량 | 4000 | N |
| J: HDD 수량 | HDD 개수 | 0 | N |
| K: GPU 모델 | GPU 모델명 | "A100 80GB" | N |
| L: GPU 수량 | GPU 개수 | 2 | N |
| M: 네트워크(Gbps) | 최소 네트워크 속도 | 10 | N |
| N: RAID 레벨 | RAID 구성 | "RAID10" | N |
| O: 전원 이중화 | 1+1 PSU 여부 | "Y" | N |
| P: 비고 | 추가 참고사항 | "고가용성 필요" | N |

### 시트 2: 상세 부품 지정 (detailed_parts) — 선택

특정 부품을 직접 지정하고 싶을 때 사용한다.

| 열 | 설명 | 예시 |
|----|------|------|
| A: 서버명 | 시트1의 서버명과 매칭 | "웹 서버" |
| B: 카테고리 | 부품 카테고리 | "cpu", "memory", "ssd" |
| C: 모델명 | 정확한 부품 모델명 | "Xeon Gold 6330" |
| D: 제조사 | 제조사 | "Intel" |
| E: 수량 | 개수 | 2 |
| F: 단가(공급가) | 희망 공급가 | 1500000 |

## 업로드 → 견적 생성 플로우

```
1. 사용자가 엑셀 템플릿 다운로드 (GET /api/quotation/excel-template)
2. 템플릿 작성 후 업로드 (POST /api/quotation/excel-upload)
3. ExcelJS로 파싱
4. 시트1: 서버 구성 → ParsedServerConfig[] 변환
   - 각 행을 ServerRequirements 구조로 매핑
   - 누락된 필드는 null 처리
5. 시트2 존재 시: 상세 부품 → 부품 DB 매칭
   - model_name + manufacturer로 parts 테이블 검색
   - 매칭 실패 시 유사 부품 추천 목록 반환
6. 파싱 결과를 프론트엔드에 반환 (확인/수정 단계)
7. 사용자 확인 후 → POST /api/quotation/generate 호출
8. 3가지 견적안 생성 → 결과 표시
```

## 페이지 UI 설계

```
엑셀 업로드 견적

1. 템플릿 다운로드
   [📥 견적용 엑셀 템플릿 다운로드]

2. 엑셀 파일 업로드
   ┌─────────────────────────────────┐
   │  📊 엑셀 파일을 드래그하여      │
   │     놓거나 클릭하여 선택하세요   │
   │                                 │
   │  지원 형식: .xlsx, .xls         │
   └─────────────────────────────────┘

3. 파싱 결과 확인/수정
   ┌─────────────────────────────────┐
   │ 서버 구성 요약                   │
   │ ┌──────┬──────┬───────┬──────┐ │
   │ │ 서버명│ 수량 │ CPU   │메모리│ │
   │ ├──────┼──────┼───────┼──────┤ │
   │ │웹서버 │ 3   │32코어 │64GB  │ │
   │ │DB서버 │ 2   │64코어 │256GB │ │
   │ └──────┴──────┴───────┴──────┘ │
   │                                 │
   │ [수정] [견적 생성 →]            │
   └─────────────────────────────────┘
```

## 구현 단계

- [ ] Step 1: 엑셀 템플릿 생성 API (`/api/quotation/excel-template`)
- [ ] Step 2: 엑셀 파싱 서비스 (`lib/services/quotation-excel-parser.ts`)
- [ ] Step 3: 엑셀 업로드 API (`/api/quotation/excel-upload`)
- [ ] Step 4: `/quotation/excel` 페이지 UI (업로드 + 파싱 결과 표시)
- [ ] Step 5: 파싱 결과 → 기존 매칭 엔진 연동
- [ ] Step 6: 빌드 및 테스트

## 수락 기준
- [ ] 엑셀 템플릿 다운로드 시 올바른 구조의 .xlsx 파일이 생성됨
- [ ] 엑셀 업로드 시 서버 구성이 정확히 파싱됨
- [ ] 파싱 결과가 ParsedServerConfig[]로 변환되어 표시됨
- [ ] "견적 생성" 클릭 시 기존 매칭 엔진으로 3가지 견적안 생성됨
- [ ] 시트2(상세 부품 지정) 있을 때 부품 DB 매칭 정상 동작
- [ ] 빌드 에러 없음
