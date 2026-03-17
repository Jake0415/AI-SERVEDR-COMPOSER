# 서비스 기획 모드 컨텍스트

현재 **서비스 기획 모드**입니다. 분석과 문서화에 집중하며, 코드 작성은 자제합니다.

## 핵심 원칙

### Reconnaissance-then-Action (분석 우선)

먼저 충분히 분석하고, 그 다음에 행동합니다:

1. **조사** — 시장, 경쟁, 사용자 데이터 수집
2. **분석** — 패턴 식별, SWOT, 기회 평가
3. **설계** — 요구사항 정의, 사용자 스토리, PRD
4. **검증** — 기술 타당성, 리스크, 의존성 확인
5. **실행** — (기획 모드에서는 수행하지 않음)

### Progressive Disclosure (점진적 구체화)

핵심 개요에서 시작하여 점진적으로 상세화합니다:

```
Level 1: 한 줄 요약 (엘리베이터 피치)
   ↓
Level 2: 핵심 개요 (Executive Summary, 3-5줄)
   ↓
Level 3: 상세 사양 (기능 요구사항, 사용자 스토리)
   ↓
Level 4: 기술 명세 (파일 구조, 데이터 모델, API)
```

## 활성 도구

- **WebSearch, WebFetch**: 시장 데이터, 경쟁사 정보, 트렌드 조사
- **Read, Grep, Glob**: 프로젝트 내 기존 코드/문서 탐색
- **Bash** (읽기 전용): `git log`, `npm list` 등 프로젝트 상태 확인

## 자제 도구

- **Edit, Write**: 기획 문서 외 코드 변경 자제
- **Bash** (변경 명령): `npm install`, `git commit` 등 자제

## 기획 워크플로우

단계별로 진행합니다. 모든 단계가 필수는 아니며, 필요한 단계만 선택합니다.

1. `/research-market [시장]` — 시장 규모, 성장률, 트렌드 조사
2. `/analyze-service [서비스]` — 특정 서비스 경쟁/사용자/SWOT 분석 (service-analyst 에이전트)
3. `/prd-generate [아이디어]` — PRD 작성 (prd-generator 에이전트) → `docs/PRD.md`
4. `/prd-validate [경로]` — PRD 기술 검증 (prd-validator 에이전트, opus)
5. `development-planner` 에이전트 — ROADMAP.md 생성 → `docs/ROADMAP.md`
6. `/plan [기능]` — 개별 기능 구현 계획 (planner 에이전트)
7. `architect` 에이전트 — 아키텍처 결정이 필요할 때 (ADR 작성)
8. `/update-roadmap` — 작업 완료 시 ROADMAP.md 진행상황 업데이트

## 기획 산출물 체크리스트

기획 완료 시 다음을 확인합니다:

- [ ] 문제 정의가 명확한가?
- [ ] 타겟 사용자가 구체적인가?
- [ ] 경쟁 분석이 충분한가?
- [ ] 사용자 스토리가 작성되었는가?
- [ ] 기능 요구사항이 MoSCoW로 우선순위화되었는가?
- [ ] 성공 지표(KPI)가 정의되었는가?
- [ ] 기술 타당성이 검토되었는가?
- [ ] 리스크와 완화 전략이 있는가?
