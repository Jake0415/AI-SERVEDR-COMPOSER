# Task 083: LangChain.js 패키지 설치 + DB 스키마 확장

## 상태: [ ] 미완료

## 목표
LangChain.js/LangGraph.js 패키지 설치 및 AI 대화 시스템을 위한 DB 테이블 3개 추가

## 관련 기능
- F026 (AI 대화형 견적 생성) 인프라 기반
- F051 (AI 대화 세션 관리)
- F052 (LLM 호출 비용/토큰 추적)

## 구현 단계

### 1. 패키지 설치
```bash
npm install @langchain/core @langchain/openai @langchain/langgraph @langchain/langgraph-checkpoint-postgres
```

### 2. next.config.ts 수정
- `serverExternalPackages`에 `@langchain/langgraph-checkpoint-postgres` 추가

### 3. DB 테이블 추가 (`lib/db/schema.ts`)

#### A. ai_chat_sessions (대화 세션)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | 세션 ID |
| tenant_id | uuid FK | 테넌트 |
| user_id | uuid FK | 사용자 |
| customer_id | uuid FK nullable | 거래처 |
| thread_id | text | LangGraph thread_id |
| mode | text | free / guide |
| status | text | active / completed / abandoned |
| final_specs | jsonb | ParsedServerConfig[] |
| quotation_id | uuid nullable | 생성된 견적 연결 |
| message_count | integer | 메시지 수 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

#### B. ai_chat_messages (메시지 이력)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | 메시지 ID |
| session_id | uuid FK | 세션 참조 |
| role | text | user / assistant / system |
| content | text | 메시지 내용 |
| specs | jsonb nullable | 해당 턴에서 추출된 사양 |
| token_count | integer nullable | 토큰 수 |
| created_at | timestamp | 생성일 |

#### C. llm_api_calls (LLM 호출 로그)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | 로그 ID |
| tenant_id | uuid FK | 테넌트 |
| user_id | uuid FK nullable | 사용자 |
| session_id | uuid FK nullable | 대화 세션 (nullable) |
| prompt_slug | text | 프롬프트 식별자 |
| model_name | text | 사용 모델명 |
| prompt_tokens | integer | 입력 토큰 |
| completion_tokens | integer | 출력 토큰 |
| total_tokens | integer | 총 토큰 |
| estimated_cost | numeric | 추정 비용 (USD) |
| latency_ms | integer | 응답 시간 |
| request_summary | text nullable | 입력 요약 |
| response_summary | text nullable | 출력 요약 |
| status | text | success / error |
| error_message | text nullable | 에러 메시지 |
| created_at | timestamp | 생성일 |

### 4. Drizzle 마이그레이션
```bash
npx drizzle-kit push --force
```

## 수정 파일
- `package.json`
- `next.config.ts`
- `lib/db/schema.ts`

## 수락 기준
- [ ] 4개 LangChain 패키지 설치 완료
- [ ] next.config.ts serverExternalPackages 업데이트
- [ ] 3개 테이블 DB에 생성 확인
- [ ] npm run build 성공
