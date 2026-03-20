# Task 087: 대화형 UI 컴포넌트 + AI 사용량 대시보드

## 상태: [ ] 미완료

## 의존성: Task 086 (멀티턴 대화 API)

## 목표
현재 309줄 단일 파일 채팅 페이지를 재사용 가능한 컴포넌트로 분리.
AI 사용량(토큰/비용) 대시보드 페이지 추가.

## 관련 기능
- F053 (대화형 UI 컴포넌트)
- F052 (LLM 비용/토큰 추적 대시보드)

## 구현 단계

### 1. ChatInput (`components/chat/chat-input.tsx`)
- shadcn Textarea 기반 (다중 줄 입력)
- Shift+Enter: 줄바꿈 / Enter: 전송
- 전송 버튼 (Send 아이콘)
- disabled 상태 (AI 응답 대기 중)
- 입력 길이 제한 표시

### 2. ChatMessage (`components/chat/chat-message.tsx`)
- Props: role, content, timestamp, specs?, tokenCount?
- user: 우측 정렬, 파란색 배경
- assistant: 좌측 정렬, Bot 아바타 + 회색 배경
- specs 있으면 사양 요약 카드 인라인 표시
- tokenCount 있으면 작은 뱃지 표시

### 3. ChatMessageList (`components/chat/chat-message-list.tsx`)
- ScrollArea 기반 메시지 목록
- 자동 스크롤 (신규 메시지 시 하단으로)
- 타이핑 인디케이터 (AI 응답 대기 중 ... 애니메이션)
- 빈 상태: 안내 메시지 + 예시 질문 버튼

### 4. SpecsSidebar (`components/chat/specs-sidebar.tsx`)
- 현재까지 추출된 서버 사양 실시간 표시
- CPU/메모리/스토리지/GPU 카테고리별 카드
- 누락 항목 빨간색 표시
- isComplete 시 "사양 확정" 버튼 표시

### 5. SessionList (`components/chat/session-list.tsx`)
- 이전 대화 세션 목록 (API: GET /api/quotation/chat/sessions)
- 세션 클릭 → 대화 복원
- 상태 뱃지 (진행중/완료/폐기)
- 삭제 버튼

### 6. TokenUsageBadge (`components/chat/token-usage-badge.tsx`)
- 현재 세션의 누적 토큰 사용량
- 추정 비용 표시 (소수점 4자리)
- 아이콘 + 작은 텍스트

### 7. 채팅 페이지 리팩터링 (`app/(dashboard)/quotation/chat/page.tsx`)
- 기존 309줄 → 컴포넌트 조합 구조로 변경
- 레이아웃: 좌측 SessionList + 중앙 ChatMessageList+ChatInput + 우측 SpecsSidebar
- 신규 API 연동 (/api/quotation/chat)
- 세션 복원 기능 (threadId 기반)

### 8. AI 사용량 대시보드 (`app/(dashboard)/settings/ai-usage/page.tsx`)
- API 연동: GET /api/ai-usage
- 기간 선택 (일/주/월)
- 토큰 사용량 차트 (일별 추이)
- 모델별 비용 breakdown (파이 차트)
- 프롬프트별 호출 빈도 (바 차트)
- 사용자별 사용량 top 5 테이블
- 설정 메뉴에 "AI 사용량" 링크 추가

## 생성 파일
- `components/chat/chat-input.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/chat-message-list.tsx`
- `components/chat/specs-sidebar.tsx`
- `components/chat/session-list.tsx`
- `components/chat/token-usage-badge.tsx`
- `app/(dashboard)/settings/ai-usage/page.tsx`

## 수정 파일
- `app/(dashboard)/quotation/chat/page.tsx` (전면 리팩터링)
- `app/(dashboard)/settings/page.tsx` (AI 사용량 링크 추가)
- `app/(dashboard)/layout.tsx` (사이드바 메뉴 필요시)

## 수락 기준
- [ ] Textarea 입력 + Shift+Enter 줄바꿈 동작
- [ ] 메시지 버블 정상 렌더링 (user/assistant 분기)
- [ ] 자동 스크롤 + 타이핑 인디케이터 동작
- [ ] 이전 세션 목록 표시 + 클릭 시 대화 복원
- [ ] 토큰 사용량 뱃지 실시간 업데이트
- [ ] AI 사용량 대시보드 데이터 표시
- [ ] npm run build 성공
- [ ] Playwright: 채팅 → 메시지 전송 → 응답 수신 → 새로고침 → 이력 복원
