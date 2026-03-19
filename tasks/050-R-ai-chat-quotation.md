# Task 050-R: AI 대화형 견적 통합 (F026 재정의)

## 상태: 완료

## 관련 Feature
- F026: AI 대화형 견적 생성 (자연어 + 가이드 셀링 통합)

## 의존성
- Task 074 (견적 생성 허브 페이지)

## 배경
기존 Task 050(자연어 견적)과 Task 059(가이드 셀링)을 하나의 통합 채팅 인터페이스로 합친다.

## 설명
사용자가 AI와 대화하여 서버 사양을 결정하고 견적을 생성하는 통합 채팅 UI를 구현한다.

### 두 가지 진입 모드

**자유 입력 모드 (기존 Task 050)**
- 사용자가 자연어로 직접 사양 입력: "웹서버 3대, 64GB 메모리, SSD 1TB..."
- LLM이 즉시 파싱하여 사양 추출
- 부족한 정보 자동 감지 → 추가 질문

**가이드 모드 (기존 Task 059)**
- "어떤 용도의 서버가 필요한가요?" 같은 구조화된 질문으로 시작
- LLM이 용도(웹/DB/AI/VDI/HPC)에 맞는 단계별 질문 생성
- 워크로드 분석 기반 최적 사양 결정 (하드코딩 대신 LLM 동적 생성)

### 공통 출력
두 모드 모두 최종적으로 `ParsedServerConfig[]`를 생성하여 기존 매칭 엔진(`lib/quotation/matching-engine.ts`)에 전달한다.

## 수정/신규 파일

### 신규
- `app/(dashboard)/quotation/chat/page.tsx` — 통합 채팅 UI
- `app/api/quotation/chat/route.ts` — 대화형 API (기존 chat-quotation 강화)
- `app/api/quotation/chat/confirm/route.ts` — 대화 결과 → 견적 생성
- `lib/ai/natural-language-parser.ts` — 자연어 → ParsedServerConfig 변환
- `lib/ai/guide-selling-prompts.ts` — 가이드 모드 시스템 프롬프트

### 삭제 대상 (이관 후)
- `app/(dashboard)/chat-quotation/` — 기존 자연어 견적 페이지
- `app/(dashboard)/guide-selling/` — 기존 가이드 셀링 페이지
- `app/api/chat-quotation/` — 기존 API

### 재사용
- `lib/ai/openai-client.ts` — OpenAI 래퍼
- `lib/quotation/matching-engine.ts` — 부품 매칭 엔진
- `lib/ai/recommendation-explainer.ts` — 추천 설명 생성
- `lib/types/ai.ts` — ParsedServerConfig 인터페이스

## 채팅 UI 설계

```
┌─────────────────────────────────────────────────┐
│ AI 대화형 견적                                   │
│                                                  │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ 자유 입력    │  │ 가이드 모드   │              │
│ └──────────────┘  └──────────────┘              │
│                                                  │
│ ┌─────────────────────┐  ┌──────────────────┐   │
│ │ 채팅 메시지 영역     │  │ 사양 요약 패널   │   │
│ │                     │  │                  │   │
│ │ AI: 어떤 용도의...   │  │ 서버 1: 웹서버   │   │
│ │ 사용자: 웹서버 3대   │  │  CPU: 32코어     │   │
│ │ AI: 동시 접속자는?   │  │  메모리: 64GB    │   │
│ │ ...                 │  │  SSD: 1TB x 2    │   │
│ │                     │  │                  │   │
│ └─────────────────────┘  │ [견적 생성 →]    │   │
│                          └──────────────────┘   │
│ ┌─────────────────────────────────────────────┐ │
│ │ 메시지 입력...                      [전송] │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## API 설계

### POST /api/quotation/chat
```typescript
// Request
{
  message: string;
  history: ChatMessage[];
  mode: "free" | "guide";
  currentSpecs?: Partial<ParsedServerConfig>[]; // 실시간 사양 업데이트
}

// Response
{
  reply: string;
  updatedSpecs?: ParsedServerConfig[];
  isComplete: boolean; // 사양 결정 완료 여부
  suggestedQuestions?: string[]; // 가이드 모드용 제안 질문
}
```

### POST /api/quotation/chat/confirm
```typescript
// Request
{
  specs: ParsedServerConfig[];
  customerId?: string;
}

// Response — 기존 POST /api/quotation/generate와 동일 포맷
```

## 구현 단계

- [ ] Step 1: `/quotation/chat` 페이지 UI 구현 (채팅 + 사양 패널)
- [ ] Step 2: 가이드 모드 시스템 프롬프트 설계 (`lib/ai/guide-selling-prompts.ts`)
- [ ] Step 3: 자연어 파싱 엔진 구현 (`lib/ai/natural-language-parser.ts`)
- [ ] Step 4: 대화형 API 구현 (`/api/quotation/chat`)
- [ ] Step 5: 사양 확정 → 견적 생성 연동 (`/api/quotation/chat/confirm`)
- [ ] Step 6: 기존 chat-quotation, guide-selling 코드 이관 및 삭제
- [ ] Step 7: 빌드 및 테스트

## 수락 기준
- [ ] 자유 입력 모드에서 자연어 사양 입력 시 AI가 파싱하여 사양 패널에 표시
- [ ] 가이드 모드에서 용도별 단계적 질문이 진행됨
- [ ] 사양 확정 후 "견적 생성" 클릭 시 3가지 견적안이 생성됨
- [ ] ParsedServerConfig[] → 기존 매칭 엔진 연동 정상 동작
- [ ] 기존 /chat-quotation, /guide-selling 라우트 제거됨
- [ ] 빌드 에러 없음
