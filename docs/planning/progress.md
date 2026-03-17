# AI-SERVER-COMPOSER 기획 진행 상황

## 현재 단계

> **현재**: ROADMAP 생성 완료 — 개발 착수 대기

## 기획 단계

| 단계 | 설명 | 상태 |
|------|------|------|
| Stage 1 | 시장 리서치 & 사업성 검토 | ✅ 완료 |
| Stage 1.5 | 서비스 관점 심층 분석 (SaaS 설계) | ✅ 완료 |
| Stage 1.6 | 부품 DB 구축 전략 (크롤링/가상데이터) | ✅ 완료 |
| Stage 2 | PRD 작성 | ✅ 완료 |
| Stage 2.x | PRD 개선 (계정/역할/카테고리/RFP이력) | ✅ 완료 |
| Stage 3 | PRD 기술 검증 | ⏳ 미실행 |
| Stage 4 | 아키텍처 결정 | ⏳ 미실행 |
| Stage 5 | ROADMAP 생성 | ✅ 완료 |

## 주요 통계

- 기능 요구사항: 13개 (F001~F013)
- 페이지: 9개
- 데이터 테이블: 9개
- 부품 카테고리: 14개 (기본) + 동적 추가/삭제
- 개발 Task: 26개 (4 Phase)

## 산출물

- `docs/PRD.md` — AI-SERVER-COMPOSER MVP PRD
- `docs/ROADMAP.md` — 개발 로드맵 (26개 Task)
- `docs/parts-db-analysis-report.md` — 부품 DB 구축 전략 리포트

## 다음 단계

1. Task 001부터 개발 착수
2. 필요 시 `/prd-validate`로 PRD 기술 검증 (Stage 3)
3. 필요 시 `architect` 에이전트로 아키텍처 결정 (Stage 4)

## 의사결정 기록

1. **사내 전용 솔루션**: SaaS가 아닌 사내 전용으로 결정 (외부 가입 불필요)
2. **슈퍼어드민 기반 계정 체계**: 최초 설치 시 슈퍼어드민 → 관리자/멤버 추가 구조
3. **부품 카테고리 동적 관리**: 기본 14개 + 사용자 정의 카테고리 추가/삭제
4. **멀티테넌시 + RLS**: PostgreSQL RLS + AES-256 원가 암호화
5. **제품명**: AI-SERVER-COMPOSER (RFP 기반 인프라 견적서 산출)
