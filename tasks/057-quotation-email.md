# Task 057: 견적서 이메일 직접 발송

## 개요

완성된 견적서를 시스템 내에서 직접 이메일로 발송합니다. 거래처 담당자 이메일을 자동으로 삽입하고, PDF 견적서를 첨부하며, 발송 이력을 추적합니다. 견적서 열람 확인(읽음 여부) 기능도 제공합니다.

## 관련 기능

- **F033**: 견적서 이메일 직접 발송
- **F007**: 견적서 발행 및 출력 — PDF 생성 연동
- **F020**: 거래처 관리 — 담당자 이메일 자동 삽입

## 현재 상태

- 견적서 PDF 생성 기능 구현됨 (F007)
- 거래처 담당자 이메일 관리 구현됨 (F020)
- 이메일 발송 기능 없음

## 수락 기준

- [ ] 견적 이력에서 "이메일 발송" 버튼으로 견적서 발송
- [ ] 거래처 담당자 이메일 자동 삽입
- [ ] PDF 견적서 자동 첨부
- [ ] 발송 이력 추적 (발송일시, 수신자, 상태)
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 이메일 발송 서비스 설정

- [ ] 이메일 서비스 선택 및 연동 (Resend 우선, SendGrid/Nodemailer 대안)
- [ ] 이메일 발송 유틸리티 구현
- [ ] 견적서 이메일 템플릿 HTML 작성 (회사 로고, 인사말, 견적 요약)
- [ ] 환경변수 설정 (API 키)

**관련 파일:**
- `lib/email/email-service.ts` (신규)
- `lib/email/templates/quotation-email.tsx` (신규)

### Step 2: 이메일 발송 API

- [ ] `POST /api/quotations/[id]/send-email` — 견적서 이메일 발송
  - 견적서 PDF 자동 생성 및 첨부
  - 거래처 담당자 이메일 조회 (customer_contacts)
  - 이메일 발송 및 결과 저장
- [ ] `email_logs` 테이블 설계 (발송 이력)

**관련 파일:**
- `app/api/quotations/[id]/send-email/route.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 3: 이메일 발송 UI

- [ ] 견적 이력 페이지에 "이메일 발송" 버튼 추가
- [ ] 발송 다이얼로그: 수신자 선택/추가, 제목 편집, 메시지 편집
- [ ] CC/BCC 추가 기능
- [ ] 발송 이력 표시 (해당 견적의 이메일 발송 기록)

**관련 파일:**
- `components/email/send-email-dialog.tsx` (신규)
- `components/email/email-history.tsx` (신규)

### Step 4: 열람 확인 기능

- [ ] 이메일 내 추적 픽셀 또는 확인 링크 삽입
- [ ] 열람 시 `email_logs` 상태 업데이트
- [ ] 발송 이력에 열람 상태 표시

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 이메일 발송 및 PDF 첨부 정상 동작 확인
- [ ] 발송 이력 저장 확인

---

## 관련 파일

- `lib/email/email-service.ts` — 이메일 서비스 (신규)
- `lib/email/templates/quotation-email.tsx` — 이메일 템플릿 (신규)
- `components/email/send-email-dialog.tsx` — 발송 다이얼로그 (신규)
- `components/email/email-history.tsx` — 발송 이력 (신규)
- `app/api/quotations/[id]/send-email/route.ts` — 이메일 발송 API (신규)

## 테스트 체크리스트

- [ ] 견적서 PDF가 이메일에 정상 첨부됨
- [ ] 거래처 담당자 이메일이 자동 삽입됨
- [ ] 발송 이력이 DB에 저장됨
- [ ] 수신자 추가/변경이 가능함
- [ ] 멤버 역할은 본인 견적만 이메일 발송 가능
