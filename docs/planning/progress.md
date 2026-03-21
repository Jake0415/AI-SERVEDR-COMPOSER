# AI-SERVER-COMPOSER 기획/개발 진행 상황

## 현재 단계

> **현재**: Phase 1~12 완료 — Task 070-B/070-C (서버 구성 위저드) 미완성

## 기획 단계

| 단계 | 설명 | 상태 |
|------|------|------|
| Stage 1 | 시장 리서치 & 사업성 검토 | ✅ 완료 |
| Stage 1.5 | 서비스 관점 심층 분석 (SaaS 설계) | ✅ 완료 |
| Stage 1.6 | 부품 DB 구축 전략 (크롤링/가상데이터) | ✅ 완료 |
| Stage 2 | PRD 작성 | ✅ 완료 |
| Stage 2.x | PRD 개선 (계정/역할/카테고리/RFP이력) | ✅ 완료 |
| Stage 3 | PRD 기술 검증 | ✅ 개발 과정에서 검증됨 |
| Stage 4 | 아키텍처 결정 | ✅ 확정 (Drizzle ORM, JWT 인증, LangGraph.js, Docker) |
| Stage 5 | ROADMAP 생성 | ✅ 완료 |

## 개발 단계

| Phase | 설명 | Task 수 | 상태 |
|-------|------|---------|------|
| Phase 1 | 애플리케이션 골격 구축 | 4 | ✅ 완료 |
| Phase 2 | UI/UX 완성 (더미 데이터) | 8 | ✅ 완료 |
| Phase 3 | 핵심 기능 구현 | 16 | ✅ 완료 |
| Phase 3.5 | 서버 조립 견적 고도화 | 9 | ✅ 완료 |
| Phase 4 | 고급 기능 및 최적화 | 4 | ✅ 완료 |
| Phase 5 | 견적 생성 시나리오 통합 | 7 | ✅ 완료 |
| Phase 6 | 운영 고도화 및 외부 연동 | 14 | ✅ 완료 |
| Phase 7 | RFP 기반 서버 구성 위저드 | 3 | ⚠️ 070-B/C 미완성 |
| Phase 8 | AI 프롬프트 관리 | 1 | ✅ 완료 |
| Phase 9 | IT 인프라 코드 체계 | 4 | ✅ 완료 |
| Phase 10 | LangChain/LangGraph AI 대화 | 5 | ✅ 완료 |
| Phase 11 | UX 개선 및 버그 수정 | 3 | ✅ 완료 |
| Phase 12 | RFP-견적 통합 | 3 | ✅ 완료 |

## 주요 통계

- 기능 요구사항: 53개 (F001~F052, F035 통합 제외)
- 페이지: 30+개
- 데이터 테이블: 28개
- 부품 카테고리: 14개 (기본) + 동적 추가/삭제
- 개발 Task: 81개 (12 Phase)
- 완료율: 79/81 = ~98%

## 산출물

- `docs/PRD.md` — AI-SERVER-COMPOSER PRD (53개 기능 요구사항)
- `docs/ROADMAP.md` — 개발 로드맵 (74개 Task, 10 Phase)
- `docs/parts-db-analysis-report.md` — 부품 DB 구축 전략 리포트
- `tasks/` — 개별 Task 상세 명세

## 다음 단계

1. Task 070-B 완성: 서버 구성 위저드 — 자동↔수동 전환 로직 + 호환성 실시간 검증 UI
2. Task 070-C 완성: 전략 비교 테이블 + AI 추천 연동 + 최종 견적 확정→quotation-history 연결
3. 테스트 커버리지 확보 (목표 80%)

## 의사결정 기록

1. **사내 전용 솔루션**: SaaS가 아닌 사내 전용으로 결정 (외부 가입 불필요)
2. **슈퍼어드민 기반 계정 체계**: 최초 설치 시 슈퍼어드민 → 관리자/멤버 추가 구조
3. **부품 카테고리 동적 관리**: 기본 14개 + 사용자 정의 카테고리 추가/삭제
4. **멀티테넌시 + RLS**: PostgreSQL RLS + AES-256 원가 암호화
5. **제품명**: AI-SERVER-COMPOSER (RFP 기반 인프라 견적서 산출)
6. **ORM 전환**: Supabase 클라이언트 → Drizzle ORM + PostgreSQL 직접 연결 (pg 드라이버)
7. **인증 방식**: Supabase Auth → JWT 기반 자체 인증 (jose 라이브러리)
8. **AI 프레임워크**: OpenAI 직접 호출 → LangChain.js/LangGraph.js 기반 (멀티턴 대화 상태 관리)
9. **배포 방식**: Vercel → Docker self-host (docker-compose)
10. **코드 체계**: equipment_codes (3단계) + part_codes (2단계) 이중 코드 시스템
