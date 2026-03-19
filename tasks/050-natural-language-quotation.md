# Task 050: 자연어 견적 생성

> ⚠️ **이 Task는 Task 050-R(AI 대화형 견적 통합)로 교체되었습니다.** Task 059(가이드 셀링)과 통합되어 `/quotation/chat`에서 자유 입력 + 가이드 모드를 제공합니다. 상세 내용은 `050-R-ai-chat-quotation.md`를 참조하세요.

## 개요

RFP 문서 없이 채팅 인터페이스를 통해 자연어로 서버 사양을 입력하면 AI가 요구사항을 파싱하여 즉시 견적안을 생성합니다. "메모리 64GB SSD 1TB 서버 3대"와 같은 자연어 입력을 구조화된 요구사항으로 변환하고, 기존 견적 생성 엔진(F005)과 연동하여 3가지 견적안을 제공합니다. 부족한 정보는 대화형 추가 질문으로 구체화합니다.

## 관련 기능

- **F026**: 자연어 견적 생성 — 채팅 기반 빠른 견적
- **F005**: 3가지 견적안 자동 생성 — 견적 생성 엔진 재사용
- **F004**: RFP AI 파싱 — 파싱 결과 포맷 호환

## 현재 상태

- 견적 생성 엔진(Task 017)이 RFP 파싱 결과 기반으로 동작
- OpenAI GPT-4o 연동 인프라 구축됨
- 자연어 입력을 RFP 파싱 결과 포맷으로 변환하는 기능 없음

## 수락 기준

- [ ] 채팅 UI에서 자연어로 서버 사양 입력 가능
- [ ] AI가 자연어를 파싱하여 구조화된 요구사항(parsed_requirements 포맷)으로 변환
- [ ] 부족한 정보(CPU 미지정, 용도 불명 등) 시 AI가 추가 질문 생성
- [ ] 변환된 요구사항으로 기존 견적 생성 엔진 연동하여 3가지 견적안 생성
- [ ] 자연어 견적 대화 이력 저장 및 조회 가능
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 채팅 UI 컴포넌트 구현

- [ ] 채팅 메시지 입력 영역 (텍스트 입력 + 전송 버튼)
- [ ] 대화 이력 표시 영역 (사용자 메시지 / AI 응답 구분)
- [ ] AI 응답 로딩 상태 표시 (타이핑 애니메이션)
- [ ] 대화 초기화/새 대화 시작 버튼
- [ ] 반응형 레이아웃 (모바일/데스크톱)

**관련 파일:**
- `app/(dashboard)/chat-quotation/page.tsx` (신규)
- `components/chat/chat-interface.tsx` (신규)
- `components/chat/chat-message.tsx` (신규)

### Step 2: 자연어 파싱 엔진 구현

- [ ] OpenAI GPT-4o 기반 자연어 → 서버 사양 추출 프롬프트 설계
- [ ] 자연어 입력에서 추출할 항목: 서버 대수, CPU 사양, 메모리 용량, 스토리지 유형/용량, 네트워크, 용도
- [ ] 추출 결과를 기존 `parsed_requirements` JSON 포맷으로 변환
- [ ] 부족 정보 감지 및 추가 질문 생성 로직
- [ ] 다국어 입력 지원 (한국어 자연어 처리)

**관련 파일:**
- `lib/ai/natural-language-parser.ts` (신규)
- `app/api/chat-quotation/parse/route.ts` (신규)

### Step 3: 대화형 요구사항 구체화

- [ ] AI 추가 질문 → 사용자 응답 → 요구사항 갱신 루프
- [ ] 요구사항 확정 시 "견적 생성" 버튼 활성화
- [ ] 대화 중 요구사항 요약 패널 표시 (실시간 업데이트)
- [ ] 요구사항 수동 수정 기능 (파싱 결과 인라인 편집)

**관련 파일:**
- `lib/ai/conversation-manager.ts` (신규)
- `components/chat/requirements-summary.tsx` (신규)

### Step 4: 견적 생성 엔진 연동

- [ ] 확정된 요구사항으로 기존 `POST /api/quotation/generate` 호출
- [ ] 3가지 견적안 결과를 채팅 UI 내에서 표시
- [ ] 견적안 선택 후 견적 생성 페이지로 이동 (상세 편집)
- [ ] 자연어 견적 이력을 `rfp_documents`에 저장 (source: 'chat' 구분)

**관련 파일:**
- `app/api/chat-quotation/generate/route.ts` (신규)
- `components/chat/quotation-result.tsx` (신규)

### Step 5: 대화 이력 관리

- [ ] 채팅 대화 이력 DB 저장 (`chat_sessions`, `chat_messages` 테이블)
- [ ] 이전 대화 목록 사이드바 표시
- [ ] 이전 대화에서 재견적 생성 가능

**관련 파일:**
- `app/api/chat-quotation/history/route.ts` (신규)

### Step 6: 검증 및 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 다양한 자연어 입력에 대한 파싱 정확도 검증
- [ ] 대화형 추가 질문 시나리오 테스트

---

## 관련 파일

- `app/(dashboard)/chat-quotation/page.tsx` — 자연어 견적 페이지 (신규)
- `components/chat/chat-interface.tsx` — 채팅 UI 컴포넌트 (신규)
- `components/chat/chat-message.tsx` — 채팅 메시지 컴포넌트 (신규)
- `components/chat/requirements-summary.tsx` — 요구사항 요약 패널 (신규)
- `components/chat/quotation-result.tsx` — 견적 결과 표시 (신규)
- `lib/ai/natural-language-parser.ts` — 자연어 파싱 엔진 (신규)
- `lib/ai/conversation-manager.ts` — 대화 관리 로직 (신규)
- `app/api/chat-quotation/parse/route.ts` — 자연어 파싱 API (신규)
- `app/api/chat-quotation/generate/route.ts` — 견적 생성 API (신규)
- `app/api/chat-quotation/history/route.ts` — 대화 이력 API (신규)

## 테스트 체크리스트

- [ ] "메모리 64GB SSD 1TB 서버 3대" 입력 시 서버 3대, 메모리 64GB, SSD 1TB가 추출됨
- [ ] "AI 학습용 GPU 서버" 입력 시 GPU 관련 추가 질문이 생성됨
- [ ] CPU 미지정 시 "CPU 사양을 알려주세요" 추가 질문 생성
- [ ] 요구사항 확정 후 3가지 견적안이 정상 생성됨
- [ ] 대화 이력이 저장되고 이전 대화에서 재견적 가능
- [ ] 한국어 자연어 입력이 정상 파싱됨
