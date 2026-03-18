# Task 059: 가이드 셀링

## 개요

용도별(웹서버, DB서버, AI/ML, VDI, HPC 등) 대화형 질문을 통해 비전문가도 최적 서버 구성을 추천받을 수 있는 가이드 셀링 기능을 구현합니다. 워크로드 유형, 동시 사용자 수, 데이터 규모 등의 질문에 답하면 자동으로 최적 부품 구성을 추천합니다.

## 관련 기능

- **F035**: 가이드 셀링 (용도별 추천)
- **F005**: 3가지 견적안 자동 생성 — 추천 결과에서 견적 생성
- **F023**: 자동 서버 조립 — 추천 구성 기반 조립

## 현재 상태

- 자동 서버 조립 엔진 구현됨 (Task 042)
- 용도별 추천 로직 없음
- 비전문가 대상 질문 기반 UI 없음

## 수락 기준

- [ ] 용도별 질문 트리 (웹서버, DB서버, AI/ML, VDI, HPC, 파일서버)
- [ ] 대화형 스텝 바이 스텝 질문 UI
- [ ] 워크로드 분석 기반 자동 부품 구성 추천
- [ ] 추천 결과에서 견적 생성 연동
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 용도별 질문 트리 설계

- [ ] 각 용도별 질문 구조 정의 (JSON):
  - 웹서버: 동시 접속자 수, 정적/동적 콘텐츠, SSL 필요 여부
  - DB서버: DB 엔진, 데이터 규모, 트랜잭션 빈도, 고가용성 필요
  - AI/ML: 학습/추론 용도, 모델 크기, GPU 필요 수량
  - VDI: 동시 사용자 수, 그래픽 요구 수준
  - HPC: 연산 유형, 노드 수, 인터커넥트 요구
  - 파일서버: 저장 용량, 접근 패턴, 백업 요구
- [ ] 질문 → 부품 구성 매핑 규칙 정의

**관련 파일:**
- `lib/guide-selling/question-trees.ts` (신규)
- `lib/guide-selling/workload-mapper.ts` (신규)

### Step 2: 가이드 셀링 UI

- [ ] `/guide-selling` 라우트 페이지 생성
- [ ] 용도 선택 카드 (아이콘 + 설명)
- [ ] 스텝 바이 스텝 질문 UI (프로그레스 바, 이전/다음)
- [ ] 각 질문에 대한 선택지 또는 입력 필드
- [ ] 질문 완료 후 추천 결과 요약 표시

**관련 파일:**
- `app/(dashboard)/guide-selling/page.tsx` (신규)
- `components/guide-selling/workload-selector.tsx` (신규)
- `components/guide-selling/question-step.tsx` (신규)
- `components/guide-selling/recommendation-result.tsx` (신규)

### Step 3: 워크로드 분석 및 부품 추천 엔진

- [ ] 질문 응답 기반 서버 사양 결정 로직
- [ ] 부품 DB에서 최적 부품 매칭
- [ ] 3가지 옵션 제공: 최소 사양 / 추천 사양 / 고성능 사양
- [ ] 추천 근거 텍스트 생성

**관련 파일:**
- `lib/guide-selling/recommendation-engine.ts` (신규)

### Step 4: 견적 생성 연동

- [ ] 추천 결과에서 "견적 생성" 버튼
- [ ] 추천 부품 구성을 견적 생성 페이지로 전달
- [ ] 마진 시뮬레이션 연동

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 각 용도별 질문 플로우 정상 동작 확인
- [ ] 추천 결과의 합리성 검증

---

## 관련 파일

- `app/(dashboard)/guide-selling/page.tsx` — 가이드 셀링 페이지 (신규)
- `components/guide-selling/workload-selector.tsx` — 워크로드 선택 (신규)
- `components/guide-selling/question-step.tsx` — 질문 스텝 (신규)
- `components/guide-selling/recommendation-result.tsx` — 추천 결과 (신규)
- `lib/guide-selling/question-trees.ts` — 질문 트리 (신규)
- `lib/guide-selling/workload-mapper.ts` — 워크로드 매핑 (신규)
- `lib/guide-selling/recommendation-engine.ts` — 추천 엔진 (신규)

## 테스트 체크리스트

- [ ] 웹서버 용도 선택 시 적절한 질문이 순서대로 표시됨
- [ ] AI/ML 용도 선택 시 GPU 관련 질문이 포함됨
- [ ] 질문 완료 후 3가지 옵션이 제안됨
- [ ] 추천 결과에서 견적 생성이 정상 연동됨
- [ ] 부품 DB에 해당 사양 부품이 없을 때 적절한 안내 표시
