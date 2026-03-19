# Task 076: 견적 생성 거래처 선택 우선 흐름

## 상태: 완료

## 관련 Feature

- F020: 거래처 관리 연계
- 견적 생성 시나리오 개선 (거래처 → 견적 방법 → 문서 업로드 순서)

## 의존성

- Task 074 (견적 생성 허브 페이지)
- Task 027 (거래처 관리 CRUD)

## 설명

견적 생성 흐름을 실무 시나리오에 맞게 개선한다. 기존에는 거래처 선택 없이 RFP/엑셀/대화형 견적 생성이 가능하고, 거래처는 최종 저장 시점에서만 요구되었다. 이를 **거래처 선택 → 견적 방식 선택 → 문서 업로드/입력** 순서로 변경하여, 의뢰 회사 정보를 먼저 입력하는 실무 프로세스를 반영한다.

## 신규 파일

- `components/quotation/customer-selector.tsx` — 거래처 검색/선택 Combobox + 신규 등록 Dialog
- `components/quotation/customer-banner.tsx` — 하위 페이지 상단 거래처 정보 배너

## 수정 대상 파일

- `app/(dashboard)/quotation/page.tsx` — Server→Client 변환, Step1 거래처 선택 + Step2 견적 방법 선택
- `app/(dashboard)/rfp/page.tsx` — CustomerBanner 추가, customer_id 전달, 미선택시 버튼 비활성화
- `app/(dashboard)/quotation/excel/page.tsx` — CustomerBanner 추가, customer_id 없으면 리다이렉트
- `app/(dashboard)/quotation/chat/page.tsx` — CustomerBanner 추가, customer_id 없으면 리다이렉트
- `app/(dashboard)/quotation/result/page.tsx` — CustomerBanner 추가, customer_id 빈 문자열 버그 수정
- `app/(dashboard)/quotation/configure/page.tsx` — customer_id 하위 네비게이션 전달

## 구현 단계

- [x] Step 1: CustomerSelector 컴포넌트 생성 (Popover + Command 조합, 검색/선택/신규등록)
- [x] Step 2: CustomerBanner 컴포넌트 생성 (거래처 정보 fetch + 배너 표시)
- [x] Step 3: 견적 허브 페이지 수정 (Step1 거래처 선택 → Step2 견적 방법 카드, 미선택시 비활성화)
- [x] Step 4: RFP 페이지 수정 (CustomerBanner + customer_id 전달 + 미선택시 버튼 disabled)
- [x] Step 5: 엑셀 업로드 페이지 수정 (CustomerBanner + customer_id 없으면 /quotation 리다이렉트)
- [x] Step 6: AI 대화형 견적 페이지 수정 (CustomerBanner + customer_id 없으면 리다이렉트)
- [x] Step 7: 견적 결과 페이지 수정 (CustomerBanner + customer_id 빈 문자열 버그 수정)
- [x] Step 8: 서버 구성 페이지 customer_id 전달
- [x] Step 9: 빌드 성공 확인

## 수락 기준

- [x] `/quotation` 접속 시 거래처 선택이 첫 번째 단계로 표시된다
- [x] 거래처 미선택 시 3가지 견적 카드가 비활성화(opacity-50, pointer-events-none)된다
- [x] 거래처 선택 후 카드 클릭 시 URL에 `customer_id` 파라미터가 포함된다
- [x] RFP/엑셀/채팅/결과 페이지에 CustomerBanner가 표시된다
- [x] 엑셀/채팅 페이지에 customer_id 없이 직접 접근 시 `/quotation`으로 리다이렉트된다
- [x] RFP 페이지에서 customer_id 없이 직접 접근 시 "견적 생성" 버튼이 비활성화된다
- [x] 결과 페이지에서 `POST /api/quotation/generate` 호출 시 실제 customerId가 전달된다
- [x] 빌드 에러 없음

## 네비게이션 흐름

```
/quotation (허브)
  ├── Step 1: 거래처 선택 (CustomerSelector)
  ├── Step 2: 견적 방법 선택 (거래처 선택 후 활성화)
  │   ├── /rfp?customer_id=xxx
  │   │   └── 견적 생성 → /quotation/result?rfp_id=yyy&customer_id=xxx
  │   ├── /quotation/excel?customer_id=xxx
  │   │   └── 견적 생성 → /quotation/result?customer_id=xxx
  │   └── /quotation/chat?customer_id=xxx
  │       └── 견적 생성 → /quotation/result?customer_id=xxx
  └── 최종 저장 → POST /api/quotation (customer_id 필수)
```
