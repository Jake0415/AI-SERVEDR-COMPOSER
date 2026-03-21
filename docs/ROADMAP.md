# AI-SERVER-COMPOSER 개발 로드맵 — RFP 기반 인프라 견적서 산출

RFP 문서를 AI로 분석하여 인프라 부품을 자동 조합하고, 수익성/규격충족/성능향상 3가지 견적안을 산출하여 인프라 견적서 작성 시간과 비용을 혁신적으로 줄이는 사내 전용 솔루션

## 개요

AI-SERVER-COMPOSER는 서버/IT인프라를 조합하여 납품하는 사내 영업담당, 엔지니어, 관리자를 위한 RFP 기반 인프라 견적서 산출 솔루션으로 다음 기능을 제공합니다:

- **RFP AI 파싱**: PDF/HWP/DOCX 형식의 RFP 문서에서 서버 사양 요구사항을 AI로 자동 추출
- **3가지 견적안 자동 생성**: 수익성 중심안, 규격 충족안, 성능 향상안을 자동 생성하여 비교
- **마진 시뮬레이션**: 부품별 마진율 슬라이더 조절, 목표 마진 역산, 시나리오 비교
- **부품 DB 관리**: 14개 카테고리(서버부품 11 + 네트워크인프라 3) 기반 부품 및 가격 관리
- **낙찰 이력 분석**: 낙찰률, 평균 마진율, 카테고리별 성과 대시보드
- **멀티테넌시 & 역할 기반 접근 제어**: 슈퍼어드민/관리자/멤버 3단계 역할 관리

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `001-setup.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함**
- 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조

3. **작업 구현**

- 작업 파일의 명세서를 따름
- 기능과 기능성 구현
- 구현 완료 후 테스트 수행
- 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
- 구현 완료 후 E2E 테스트 실행
- 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

> 전체 라우트 구조, 타입 정의, 데이터베이스 스키마 설계를 통해 애플리케이션의 뼈대를 완성합니다.

- ✅ **Task 001: 프로젝트 라우트 구조 및 페이지 골격 생성** - 우선순위
  - Next.js App Router 기반 9개 페이지 라우트 구조 생성
    - `/` (루트 - 리디렉션 로직)
    - `/setup` (초기 설정 페이지 - F010, F011)
    - `/login` (로그인 페이지 - F010)
    - `/dashboard` (대시보드 - F012)
    - `/parts` (부품 관리 - F001, F002)
    - `/rfp` (RFP 업로드 - F003, F004)
    - `/quotation` (견적 생성 - F005, F006)
    - `/quotation-history` (견적 이력 - F007, F008)
    - `/bid-history` (낙찰 이력 - F009)
    - `/users` (사용자 관리 - F013)
  - 모든 페이지에 빈 껍데기 컴포넌트 생성 (페이지명, 설명 텍스트만 표시)
  - 인증 보호 레이아웃 골격 구현 (`(auth)` 그룹 라우트)
  - 사이드바 네비게이션 레이아웃 골격 구현 (역할별 메뉴 표시 구조)

- ✅ **Task 002: TypeScript 타입 정의 및 인터페이스 설계**
  - 9개 데이터 모델에 대한 TypeScript 인터페이스 정의
    - `Tenant`, `User`, `PartCategory`, `Part`, `PartPrice`
    - `RfpDocument`, `Quotation`, `QuotationItem`, `BidResult`
  - 사용자 역할 타입 정의 (`super_admin` / `admin` / `member`)
  - 부품 카테고리 그룹 타입 정의 (`server_parts` / `network_infra`)
  - 견적 유형 타입 정의 (`profitability` / `spec_match` / `performance`)
  - RFP 상태 타입 정의 (`uploaded` / `parsing` / `parsed` / `error`)
  - 견적 상태 타입 정의 (`draft` / `confirmed` / `won` / `lost`)
  - API 요청/응답 타입 정의
  - 폼 검증용 Zod 스키마 정의 (로그인, 초기설정, 부품등록, 사용자추가 등)

- ✅ **Task 003: 데이터베이스 스키마 설계 및 마이그레이션 파일 작성**
  - Supabase PostgreSQL 기반 9개 테이블 SQL 마이그레이션 작성
    - `tenants`, `users`, `part_categories`, `parts`, `part_prices`
    - `rfp_documents`, `quotations`, `quotation_items`, `bid_results`
  - RLS(Row Level Security) 정책 설계 (테넌트 격리)
  - 기본 14개 부품 카테고리 시드 데이터 작성
    - 서버 부품: CPU, 메모리, SSD, HDD, NIC, RAID, GPU, PSU, 메인보드, 섀시, HBA
    - 네트워크·인프라: 스위치, 광 트랜시버, 케이블
  - 외래 키 관계 및 인덱스 설계
  - `cost_price` 필드 AES-256 암호화 처리 방안 설계

- ✅ **Task 004: Supabase 클라이언트 및 유틸리티 설정**
  - Supabase 클라이언트 초기화 (`@supabase/ssr` 활용)
  - 서버 컴포넌트용 / 클라이언트 컴포넌트용 Supabase 클라이언트 분리
  - 미들웨어 기반 세션 관리 골격 구현
  - 환경 변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등)
  - 공통 에러 핸들링 유틸리티 작성

### Phase 2: UI/UX 완성 (더미 데이터 활용)

> 모든 페이지의 UI를 더미 데이터로 완성하여 전체 사용자 플로우를 검증합니다.

- ✅ **Task 005: 공통 컴포넌트 라이브러리 구현** - 우선순위
  - shadcn/ui 기반 공통 컴포넌트 설치 및 커스터마이징
    - Button, Input, Select, Table, Dialog, Sheet, Tabs, Card, Badge, Toast
    - Form 관련: Form, FormField, Label, Textarea
    - 차트 관련: Recharts 래퍼 컴포넌트 (원형, 라인, 바 차트)
  - 사이드바 네비게이션 컴포넌트 구현 (역할별 메뉴 필터링)
  - 페이지 헤더 컴포넌트 (제목, 설명, 액션 버튼)
  - 데이터 테이블 컴포넌트 (정렬, 검색, 페이지네이션)
  - 통계 카드 컴포넌트 (숫자, 라벨, 아이콘, 변화율)
  - 파일 업로드 컴포넌트 (드래그앤드롭, 진행률 표시)
  - 빈 상태 / 로딩 상태 / 에러 상태 컴포넌트
  - 더미 데이터 생성 유틸리티 작성 (모든 데이터 모델에 대한 목업 데이터)

- ✅ **Task 006: 초기 설정 및 로그인 페이지 UI 구현**
  - 초기 설정 페이지 UI (F010, F011)
    - 스텝 폼 구조: Step 1(슈퍼어드민 계정 정보) → Step 2(회사 정보) → 완료
    - 이메일/비밀번호/이름/전화번호/부서명 입력 폼
    - 회사명/사업자등록번호 입력 폼
    - 입력 유효성 검사 UI (React Hook Form + Zod 연동)
    - 성공/실패 피드백 UI
  - 로그인 페이지 UI (F010)
    - 이메일/비밀번호 입력 폼
    - 로그인 버튼 및 로딩 상태
    - 에러 메시지 표시 영역
  - 반응형 레이아웃 (모바일/태블릿/데스크톱)

- ✅ **Task 007: 대시보드 페이지 UI 구현**
  - 대시보드 레이아웃 (F012)
    - 상단 통계 카드: 진행 중 건수, 완료 건수, 낙찰 건수, 월간 낙찰률
    - 최근 견적 목록 테이블 (최신 5건, 더미 데이터)
    - 빠른 액션 버튼 영역
      - RFP 업로드 바로가기
      - 부품 관리 바로가기 (관리자 이상)
      - 사용자 관리 바로가기 (슈퍼어드민만)
  - 역할별 UI 분기 처리 (더미 역할 상태 활용)

- ✅ **Task 008: 부품 관리 페이지 UI 구현**
  - 부품 관리 페이지 레이아웃 (F001, F002)
    - 카테고리 탭/그룹 전환 UI (서버 부품 / 네트워크·인프라)
    - 부품 목록 데이터 테이블 (검색, 카테고리 필터, 페이지네이션)
    - 부품 추가/수정 모달 폼
      - 모델명, 제조사, 주요 사양 입력
      - 가격 4단계 입력: 리스트가, 시장가, 원가, 공급가
      - 마진 자동 계산 표시 (공급가 - 원가)
    - 카테고리 추가/삭제 UI
      - 카테고리명, 그룹, 스펙 필드 정의 폼
      - 삭제 시 하위 부품 존재 여부 경고
    - 부품 삭제 확인 다이얼로그
  - 멤버 역할 시 조회 전용 UI

- ✅ **Task 009: RFP 업로드 페이지 UI 구현**
  - RFP 업로드 페이지 레이아웃 (F003, F004)
    - RFP 이력 목록 테이블 (날짜, 파일명, 파싱 상태, 연결된 견적 수)
    - 파일 업로드 영역 (드래그앤드롭, PDF/HWP/DOCX 지원 표시)
    - AI 파싱 진행 상태 프로그레스 바
    - 파싱 결과 표시 영역
      - 추출된 요구사항 목록 (서버 대수, CPU, 메모리, 스토리지, 네트워크 등)
      - 수동 수정/보완 인라인 편집 기능
    - RFP 문서 삭제 기능
    - 기존 RFP 선택 시 파싱 결과 재표시
    - **견적 생성하기** 버튼

- ✅ **Task 010: 견적 생성 페이지 UI 구현**
  - 견적 생성 페이지 레이아웃 (F005, F006)
    - 3가지 견적안 탭 UI (수익성 중심 / 규격 충족 / 성능 향상)
    - 각 안별 부품 구성 테이블 (부품명, 수량, 원가, 공급가, 마진)
    - 마진 시뮬레이션 UI
      - 부품별 마진율 슬라이더 (실시간 값 변경)
      - 목표 마진 금액 입력 필드 + 역산 버튼
    - 견적안 간 총액/마진 비교 요약 카드
    - **견적 확정** 버튼

- ✅ **Task 011: 견적 이력 및 낙찰 이력 페이지 UI 구현**
  - 견적 이력 페이지 레이아웃 (F007, F008)
    - 견적 목록 테이블 (날짜, RFP명, 견적안 유형, 총액, 상태)
    - 견적 상세 보기 영역 (부품 구성, 가격 상세)
    - 견적서 출력 옵션 UI (나라장터 양식 / 자사 양식, PDF/Excel 선택)
    - 낙찰/실패 결과 입력 모달 (결과 선택, 사유 입력)
  - 낙찰 이력 페이지 레이아웃 (F009)
    - 전체 낙찰률 원형 차트
    - 월별 낙찰률 추이 라인 차트
    - 평균 마진율 통계 카드
    - 실패 사유 분포 바 차트
    - 기간 필터 (최근 1/3/6/12개월)

- ✅ **Task 012: 사용자 관리 페이지 UI 구현**
  - 사용자 관리 페이지 레이아웃 (F013)
    - 사용자 목록 테이블 (이름, 이메일, 부서, 역할, 가입일)
    - 사용자 추가 모달 폼 (이메일/비밀번호/이름/전화번호/부서명, 역할 선택)
    - 사용자 정보 수정/삭제 기능 UI
    - 역할별 권한 안내 표시 (admin/member 차이 설명)
  - 슈퍼어드민 전용 접근 제한 UI 처리

### Phase 3: 핵심 기능 구현

> 데이터베이스 연동, 인증 시스템, 핵심 비즈니스 로직을 구현하여 실제 동작하는 서비스로 완성합니다.

- ✅ **Task 013: Supabase 데이터베이스 구축 및 RLS 적용** - 우선순위
  - Supabase 프로젝트에 마이그레이션 SQL 실행
  - 9개 테이블 생성 및 외래 키/인덱스 적용
  - RLS 정책 적용 (테넌트별 데이터 격리)
    - 모든 테이블에 `tenant_id` 기반 RLS 정책
    - 역할별 CRUD 권한 분리
  - 기본 14개 부품 카테고리 시드 데이터 삽입
  - `cost_price` AES-256 암호화 함수 구현 (pgcrypto 확장)
  - 데이터베이스 연결 테스트

- ✅ **Task 014: 인증 시스템 구현 (F010, F011)**
  - Supabase Auth 기반 이메일/비밀번호 인증 구현
  - 초기 설정 플로우 구현
    - DB 사용자 0명 감지 → `/setup` 리디렉션 로직
    - 슈퍼어드민 계정 + 테넌트 동시 생성
    - 슈퍼어드민 역할 자동 부여
  - 로그인/로그아웃 기능 구현
  - Next.js 미들웨어 기반 인증 보호
    - 비인증 사용자 → `/login` 리디렉션
    - 인증 사용자 → 역할별 메뉴 접근 제어
  - 세션 관리 및 토큰 갱신
  - 인증 플로우 테스트

- ✅ **Task 015: 부품 DB 관리 API 및 기능 연동 (F001, F002)**
  - 부품 CRUD API 구현 (Next.js Route Handlers)
    - `POST /api/parts` - 부품 등록
    - `GET /api/parts` - 부품 목록 조회 (카테고리 필터, 검색, 페이지네이션)
    - `PUT /api/parts/[id]` - 부품 수정
    - `DELETE /api/parts/[id]` - 부품 삭제
  - 부품 가격 CRUD API 구현
    - 원가 암호화 저장/복호화 조회 처리
    - 마진 자동 계산 로직
  - 카테고리 관리 API 구현
    - `POST /api/categories` - 카테고리 추가
    - `DELETE /api/categories/[id]` - 카테고리 삭제 (하위 부품 0건 검증)
  - 부품 관리 페이지 더미 데이터를 실제 API 호출로 교체
  - 역할 기반 접근 제어 적용 (관리자 이상: CRUD, 멤버: 조회만)
  - API 통합 테스트

- ✅ **Task 015-1: 엑셀 일괄 업로드 API 구현 (F001 확장)**
  - 엑셀 템플릿 동적 생성 API (카테고리 드롭다운 포함)
  - 엑셀 파싱/검증/일괄 등록 API (중복 처리: skip/overwrite)
  - 업로드 시 가격 이력 자동 기록 (change_type: 'excel_upload')
  - 업로드 로그 및 오류 행 다운로드 API

- ✅ **Task 015-2: 가격 변동 이력 관리 API 구현 (F002 확장)**
  - 가격 수정 시 part_price_history 자동 INSERT
  - 부품별 가격 이력 조회 API (기간 필터)
  - 카테고리별 가격 추이 집계 API

- ✅ **Task 015-3: 자동 스냅샷 및 스케줄러 구현 (F002 확장)**
  - Vercel Cron Job 기반 일일 가격 스냅샷
  - 스냅샷 설정 관리 API (시간, 보관기간)
  - 수동 스냅샷 트리거

- ✅ **Task 015-4: 부품 엑셀 업로드 UI 및 가격 이력 UI 연동 (F001, F002)**
  - 부품 관리 페이지에 "엑셀 관리" 드롭다운 메뉴 추가 (템플릿 다운로드 / 엑셀 업로드)
  - 엑셀 업로드 Dialog: 드래그앤드롭 파일 선택, 중복 처리 옵션(덮어쓰기/건너뛰기)
  - 업로드 결과(성공/실패/오류 상세) 표시 UI
  - 부품별 가격 변동 이력 조회 Dialog 추가 (관리 컬럼 이력 버튼)
  - 기존 015-1/2/3 백엔드 API와 프론트엔드 완전 연동

- ✅ **Task 016: RFP 업로드 및 AI 파싱 구현 (F003, F004)**
  - RFP 파일 업로드 API 구현
    - Supabase Storage 활용 파일 저장
    - PDF/HWP/DOCX 파일 유효성 검증
    - `POST /api/rfp/upload` - 파일 업로드 및 RFP 레코드 생성
  - RFP 이력 관리 API
    - `GET /api/rfp` - RFP 목록 조회
    - `DELETE /api/rfp/[id]` - RFP 삭제
  - AI 파싱 엔진 구현
    - `pdf-parse`로 PDF 텍스트 추출
    - `mammoth`로 DOCX 텍스트 추출
    - HWP 파일 처리 방안 구현
    - OpenAI GPT-4o API 연동 - RFP 요구사항 추출 프롬프트 설계
    - 파싱 결과 JSON 구조화 및 저장
  - 파싱 상태 관리 (uploaded → parsing → parsed/error)
  - 추출 결과 수동 수정 API (`PUT /api/rfp/[id]/requirements`)
  - RFP 업로드 페이지 더미 데이터를 실제 API로 교체
  - AI 파싱 정확도 테스트

- ✅ **Task 017: 3가지 견적안 자동 생성 구현 (F005)**
  - 견적 생성 엔진 구현
    - RFP 파싱 결과 기반 부품 자동 매칭 로직
    - 수익성 중심안: 마진 최대화 부품 조합 알고리즘
    - 규격 충족안: RFP 요구사항 정확 매칭 알고리즘
    - 성능 향상안: 10~30% 업스펙 부품 조합 알고리즘
  - 견적 생성 API
    - `POST /api/quotation/generate` - 3가지 견적안 생성
    - `GET /api/quotation/[id]` - 견적 상세 조회
  - OpenAI GPT-4o 연동 - 부품 추천 및 조합 최적화
  - 견적 생성 페이지 더미 데이터를 실제 API로 교체
  - 견적 생성 로직 테스트

- ✅ **Task 018: 마진 시뮬레이션 및 견적 확정 구현 (F006)**
  - 마진 시뮬레이션 로직 구현
    - 부품별 마진율 실시간 계산 (클라이언트 사이드)
    - 목표 마진 금액 → 부품별 가격 역산 알고리즘
    - 견적안 간 총액/마진 비교 계산
  - 견적 확정 API
    - `PUT /api/quotation/[id]/confirm` - 견적 확정 (status: confirmed)
    - 견적 항목 저장 (quotation_items)
  - 마진 시뮬레이션 UI와 실제 계산 로직 연동
  - 시뮬레이션 정확도 테스트

- ✅ **Task 019: 견적서 출력 및 낙찰 결과 기록 구현 (F007, F008)**
  - 견적서 출력 기능 구현
    - jsPDF 기반 PDF 견적서 생성 (나라장터 양식 / 자사 양식)
    - ExcelJS 기반 Excel 견적서 생성
    - `GET /api/quotation/[id]/export` - 견적서 다운로드
  - 낙찰 결과 기록 API
    - `POST /api/bid-result` - 낙찰/실패 결과 및 사유 기록
    - `PUT /api/quotation/[id]/status` - 견적 상태 업데이트 (won/lost)
  - 견적 이력 페이지 더미 데이터를 실제 API로 교체
  - 견적서 출력 형식 검증 테스트

- ✅ **Task 020: 대시보드 및 낙찰 이력 대시보드 구현 (F009, F012)**
  - 대시보드 데이터 API
    - `GET /api/dashboard/summary` - 진행 중/완료/낙찰 건수, 월간 낙찰률
    - `GET /api/dashboard/recent-quotations` - 최근 견적 5건
  - 낙찰 이력 대시보드 API
    - `GET /api/bid-history/stats` - 전체 낙찰률, 평균 마진율
    - `GET /api/bid-history/trend` - 월별 낙찰률 추이
    - `GET /api/bid-history/failure-reasons` - 실패 사유 분포
  - Recharts 차트 컴포넌트에 실제 데이터 연동
  - 기간 필터 기능 구현 (1/3/6/12개월)
  - 역할별 데이터 필터링 (멤버: 본인 건만)
  - 대시보드 및 낙찰 이력 페이지 더미 데이터를 실제 API로 교체

- ✅ **Task 021: 사용자 관리 기능 구현 (F013)**
  - 사용자 관리 API
    - `POST /api/users` - 사용자 추가 (Supabase Auth 계정 생성 + users 테이블 삽입)
    - `GET /api/users` - 사용자 목록 조회
    - `PUT /api/users/[id]` - 사용자 정보 수정 (역할 변경 포함)
    - `DELETE /api/users/[id]` - 사용자 삭제
  - 슈퍼어드민 전용 접근 제어 미들웨어 적용
  - 사용자 관리 페이지 더미 데이터를 실제 API로 교체
  - 사용자 CRUD 테스트

- ✅ **Task 030: 설정 메뉴 — 카테고리 관리 기능**
  - 사이드바에 "설정" 메뉴 추가 (super_admin, admin 권한)
  - `/settings` 허브 페이지 (카테고리 관리, 향후 회사정보/알림설정 확장)
  - `/settings/categories` 카테고리 CRUD UI
    - 그룹별 탭 (server_parts / network_infra)
    - 카테고리 추가: displayName, name(slug), group, specFields 편집기
    - 카테고리 수정: displayName, group, specFields (name 고정)
    - 카테고리 삭제: isDefault 아니고 부품 0개일 때만 가능
  - 카테고리 API 확장: PUT/DELETE `/api/categories/[id]`, GET에 partCount 포함
  - 미들웨어 보호 경로에 `/settings` 추가

- ✅ **Task 031: 실판매 기록 DB 스키마 설계**
  - actual_sales, actual_sale_items 테이블 설계 및 마이그레이션
  - Drizzle ORM 스키마 정의, RLS 정책 적용

- ✅ **Task 032: 실판매 기록 입력 UI**
  - 견적 이력에서 won 견적의 실판매 기록 입력 화면
  - 견적 vs 실판매 비교 화면 (총액 비교 + 항목별 차이)

- ✅ **Task 033: 실판매 기록 API**
  - CRUD API + 통계 API
  - 견적 정확도 계산 로직

- ✅ **Task 034: 실판매 Excel 업로드**
  - Excel 파싱 및 견적 항목 자동 매핑
  - 매핑 확인 UI

- ✅ **Task 035: 실판매 분석 대시보드**
  - 낙찰 이력에 실판매 분석 탭 추가
  - 견적 정확도 추이, 마진 비교, 카테고리별 분석 차트

- ✅ **Task 022: 핵심 기능 통합 테스트**
  - 전체 사용자 플로우 E2E 테스트
    - 초기 설정 → 로그인 → 부품 등록 → RFP 업로드 → AI 파싱 → 견적 생성 → 견적 확정 → 견적서 출력 → 낙찰 기록
  - 역할별 접근 제어 테스트
    - 슈퍼어드민: 모든 기능 접근
    - 관리자: 사용자 관리 제외 모든 기능
    - 멤버: 본인 견적만, 부품 조회만
  - RLS 정책 검증 (테넌트 간 데이터 격리)
  - 에러 핸들링 및 엣지 케이스 테스트
    - 빈 부품 DB에서 견적 생성 시도
    - 잘못된 파일 형식 업로드
    - 동시 수정 충돌 처리
  - API 응답 시간 및 성능 기본 점검

### Phase 3.5: 서버 조립 견적 고도화

> 호환성 기반 서버 자동/수동 조립 엔진과 시각적 UI를 구현합니다.

- ✅ **Task 040: 베이스 서버 데이터 모델**
  - 메인보드/섀시 specs JSONB 확장 (슬롯, 베이, 채널 상세)
  - 기존 시드 데이터 확장

- ✅ **Task 041: 호환성 규칙 확장 (C013~C020)**
  - 신규 8개 규칙 추가 (슬롯 초과, DIMM 혼합 금지, 채널 불균등 등)
  - 총 20개 호환성 규칙 체계

- ✅ **Task 042: 자동 조립 엔진 고도화**
  - 9단계 파이프라인 (베이스 서버 매칭 → 슬롯 잔여 추적 → DIMM 최적 구성)
  - SlotTracker, DimmOptimizer 클래스

- ✅ **Task 043: 수동 조립 - 베이스/CPU 선택 UI**
  - 카드 비교 레이아웃, 소켓 자동 필터링

- ✅ **Task 044: 수동 조립 - 메모리 슬롯 시각화**
  - 채널별 슬롯 다이어그램, 호환 DIMM 필터링

- ✅ **Task 045: 수동 조립 - 스토리지 베이 시각화**
  - 행렬 레이아웃, 인터페이스별 필터링

- ✅ **Task 046: 수동 조립 - PCIe 슬롯 시각화**
  - Gen/Lane 표시, 카드 필터링

- ✅ **Task 047: 수동 조립 - 실시간 전원/견적 바**
  - TDP 프로그레스 바, 견적 실시간 업데이트

- ✅ **Task 048: 수동/자동 전환 통합**
  - 자동→수동 편집, 수동→AI 추천, 최종 견적 확정

### Phase 4: 고급 기능 및 최적화

> 사용자 경험 향상, 성능 최적화, 보안 강화 및 배포 준비를 진행합니다.

- ✅ **Task 023: 보안 강화 및 데이터 보호** - 우선순위
  - 원가 데이터 AES-256 암호화/복호화 완전 구현
  - API 요청 유효성 검증 강화 (Zod 서버 사이드 검증)
  - CSRF 방지 및 Rate Limiting 적용
  - 민감 데이터 로깅 방지
  - Supabase RLS 정책 보안 감사

- ✅ **Task 024: UX 개선 및 반응형 최적화**
  - 모바일 환경 사이드바 최적화 (Sheet 기반 모바일 메뉴)
  - 테이블 모바일 반응형 처리 (카드 뷰 전환)
  - 로딩 상태 개선 (스켈레톤 UI, Suspense 활용)
  - 토스트 알림 시스템 통합
  - 키보드 네비게이션 및 접근성(a11y) 개선
  - 한국어 폼 유효성 메시지 통일

- ✅ **Task 025: 성능 최적화**
  - Next.js 서버 컴포넌트 최적화 (불필요한 클라이언트 컴포넌트 제거)
  - 데이터 페칭 최적화 (캐싱 전략, ISR/SSG 적용 가능 영역)
  - 이미지 및 폰트 최적화
  - 번들 사이즈 분석 및 코드 스플리팅
  - 대량 부품 데이터 가상 스크롤링 적용
  - Supabase 쿼리 최적화 (인덱스 검토, N+1 방지)

- ✅ **Task 026: 배포 파이프라인 구축 및 프로덕션 배포**
  - Vercel 프로젝트 설정 (서울 리전 icn1)
  - 환경 변수 설정 (Supabase, OpenAI API 키 등)
  - CI/CD 파이프라인 구축 (빌드, 린트, 타입체크 자동화)
  - 프리뷰 배포 설정 (PR별 프리뷰 URL)
  - 에러 모니터링 설정 (Vercel Analytics 또는 Sentry)
  - 프로덕션 배포 및 스모크 테스트

### Phase 5: 견적 생성 시나리오 통합 및 영업 효율화

> 3가지 견적 생성 시나리오(RFP/엑셀/AI대화형) 통합 허브를 구축하고, 영업 현장의 효율을 극대화하는 기능을 구현합니다.

- ✅ **Task 074: 견적 생성 허브 페이지 (신규)** - 최우선
  - `/quotation` 페이지를 3가지 시나리오 선택 허브로 재설계
  - RFP 기반 / 엑셀 업로드 / AI 대화형 카드 + 템플릿 바로가기
  - 사이드바 메뉴 정리 (chat-quotation, guide-selling, 서버구성 별도 메뉴 제거)

- ✅ **Task 076: 견적 생성 거래처 선택 우선 흐름 (F020 연계)**
  - 견적 허브에서 거래처 선택을 필수 첫 단계로 추가 (CustomerSelector)
  - 하위 페이지(RFP/엑셀/채팅/결과/서버구성)에 거래처 배너 표시 (CustomerBanner)
  - 모든 견적 흐름에 `customer_id` URL 파라미터 전달
  - 결과 페이지 `customer_id` 빈 문자열 버그 수정

- ✅ **Task 050-R: AI 대화형 견적 통합 (F026 재정의)** - 우선순위
  - 기존 Task 050(자연어) + Task 059(가이드셀링) 통합
  - `/quotation/chat` 통합 UI (자유 입력 모드 + 가이드 모드)
  - LLM → ParsedServerConfig[] 구조화 응답 → sessionStorage 경유 → 매칭 엔진 연동
  - `/api/quotation/generate`가 `rfp_id` 또는 `specs` 직접 수신 가능하도록 확장

- ✅ **Task 075: 엑셀 업로드 견적 (F047, 신규)** - 우선순위
  - `/quotation/excel` 페이지 (업로드 UI + 실제 API 연동)
  - `/api/quotation/excel-template` 견적용 엑셀 템플릿 다운로드 API
  - `/api/quotation/excel-upload` 엑셀 파싱 → ParsedServerConfig[] 변환 API
  - 기존 매칭 엔진 연동 (sessionStorage 경유)

- ⚠️ ~~**Task 050: 자연어 견적 생성 (F026)**~~ → Task 050-R로 교체됨

- ✅ **Task 051: 견적 템플릿 관리 (F027)**
  - 템플릿 데이터 모델: `quotation_templates` 테이블 설계 (DB 마이그레이션)
  - 템플릿 CRUD API (`/api/templates`)
  - 템플릿 카테고리 분류 (웹서버, DB서버, AI서버, 스토리지 등)
  - 기존 견적에서 "템플릿으로 저장" 기능
  - 템플릿 기반 빠른 견적 생성
  - 팀 공유/개인 전용 템플릿 분리
  - `/templates` 라우트 UI 구현

- ✅ **Task 052: 딜 레지스트레이션 관리 (F028)**
  - 딜 레지스트레이션 데이터 모델: `deal_registrations` 테이블 설계
  - 벤더별(Dell/HPE/Lenovo/기타) 딜 등록 CRUD
  - 등록일/만료일/승인상태(pending/approved/rejected/expired) 관리
  - 추가 할인율 관리 및 견적 생성 시 자동 할인 반영
  - 만료 임박 알림 연동 (F016)
  - `/deal-registration` 라우트 UI 구현

- ✅ **Task 053: 견적 복제 및 변형 (F029)**
  - 견적 이력에서 "복제" 버튼 추가
  - 원본 견적의 전체 항목(quotation_items)을 새 견적으로 복사
  - 복제 후 편집 모드 진입 (부품 교체, 수량 변경, 마진 조정)
  - 원본 참조 링크 유지 (`parent_quotation_id` 활용 확장)
  - 복제 이력 추적

- ✅ **Task 054: 금액 기반 다단계 승인 워크플로우 (F030)**
  - 승인 규칙 데이터 모델: `approval_rules`, `approval_requests` 테이블 설계
  - 금액 구간별 승인 라인 설정 UI (슈퍼어드민)
  - 견적 확정 시 금액에 따른 자동 승인 라우팅
  - 승인 요청/승인/반려/조건부 승인 워크플로우 구현
  - 승인 이력 추적 및 감사 로그 연동 (F018)
  - 승인 대기 알림 연동 (F016)
  - `/approval` 라우트 UI 구현

### Phase 6: 운영 고도화 및 외부 연동

> 벤더 관리, AI 고도화, 외부 시스템 연동, 자산 관리 등 운영 효율과 비즈니스 확장을 위한 기능을 구현합니다.

- ✅ **Task 055: 벤더 프로모션/특별가 관리 (F031)**
  - 프로모션 데이터 모델: `vendor_promotions` 테이블 설계
  - 벤더별 프로모션 CRUD (기간 한정 할인, 번들 특가, 물량 할인)
  - 프로모션 기간/조건/할인율 설정
  - 견적 생성 시 적용 가능 프로모션 자동 탐지 및 알림
  - 프로모션 만료 알림 연동 (F016)
  - `/vendor-promotions` 라우트 UI 구현

- ✅ **Task 056: AI 가격 추천 (F032)**
  - 낙찰/실주 이력 데이터 분석 파이프라인 구축
  - OpenAI 기반 가격 추천 모델 프롬프트 설계
  - 경쟁사 예상 가격대 분석 로직
  - 낙찰 확률 예측 및 마진-낙찰률 트레이드오프 시각화
  - 견적 생성 페이지에 AI 추천 가격 패널 추가

- ✅ **Task 057: 견적서 이메일 직접 발송 (F033)**
  - 이메일 발송 서비스 연동 (Resend/SendGrid/Nodemailer)
  - 견적서 PDF 첨부 자동 생성
  - 거래처 담당자 이메일 자동 삽입 (F020 연동)
  - 발송 이력 추적 (`email_logs` 테이블)
  - 견적서 열람 확인 (읽음 추적 픽셀/링크)
  - 견적 이력 페이지에 "이메일 발송" 버튼 추가

- ✅ **Task 058: 부품 EOL/EOS 관리 (F034)**
  - 부품 테이블에 `eol_date`, `eos_date` 필드 추가
  - EOL/EOS 날짜 등록 및 관리 UI (부품 관리 페이지 확장)
  - EOL 임박 부품 대시보드 위젯 및 알림 (30/60/90일 전)
  - 견적 생성 시 EOL 부품 포함 경고 표시
  - 대체 부품 추천 로직 (동일 카테고리/상위 스펙)

- ⚠️ ~~**Task 059: 가이드 셀링 (F035)**~~ → Task 050-R(AI 대화형 견적)에 흡수됨

- ✅ **Task 060: 크로스셀/업셀 AI 추천 (F036)**
  - 견적 내용 기반 추가 판매 추천 엔진 (OpenAI 연동)
  - 추천 항목: 메모리 증설, SSD 추가, 유지보수 계약, 백업 솔루션 등
  - 견적 확정 시점 추천 패널 UI
  - 추천 수락/거절 추적 및 수락률 분석

- ✅ **Task 061: 납품 후 자산 추적 — 간이 ITAM (F037)**
  - 자산 데이터 모델: `assets`, `asset_maintenance_logs` 테이블 설계
  - 납품 완료 견적에서 자산 자동 생성
  - 시리얼번호, 설치 위치, 보증 만료일 관리
  - 보증 만료/유지보수 갱신 알림
  - 재구매 시점 추천
  - `/assets` 라우트 UI 구현

- ✅ **Task 062: 견적 비교 리포트 PDF (F038)**
  - 복수 견적 선택 UI (체크박스 기반)
  - 비교 리포트 데이터 구조화 (부품별, 가격별, 성능별)
  - jsPDF 기반 비교 리포트 PDF 생성
  - TCO(Total Cost of Ownership) 분석 로직
  - 추천안 하이라이트 표시

- ✅ **Task 063: 소프트웨어 라이선스 견적 (F039)**
  - 소프트웨어 라이선스 데이터 모델: `software_licenses` 테이블 설계
  - 라이선스 유형별 가격 모델 (영구/구독/볼륨, CPU/코어/사용자 기반)
  - 라이선스 등록/관리 UI
  - 견적 항목에 S/W 라이선스 추가 기능
  - 갱신일 관리 및 알림

- ✅ **Task 064: 유지보수/서비스 계약 견적 (F040)**
  - 서비스 계약 데이터 모델: `service_contracts` 테이블 설계
  - SLA 옵션별 가격 설정 (9x5 NBD, 24x7 4H 등)
  - 연간/다년 계약 할인 자동 계산
  - 견적 항목에 유지보수/서비스 추가 기능
  - 계약 만료 알림

- ✅ **Task 065: 나라장터 공고 자동 수집 (F041)**
  - 나라장터(G2B) 공공데이터 API 연동
  - 서버/인프라 관련 키워드 필터링 엔진
  - 공고 목록 조회/상세 UI
  - 입찰 마감일 알림
  - 공고에서 RFP 자동 연결 기능
  - `/g2b-notices` 라우트 UI 구현

- ✅ **Task 066: ERP 연동 (F042)**
  - ERP 연동 어댑터 인터페이스 설계 (SAP, 더존 추상화)
  - 견적 확정 → ERP 주문 자동 생성 연동
  - ERP 재고 조회 API 연동
  - 매출/매입 데이터 동기화
  - 연동 설정 UI (시스템 설정 페이지 확장)

- ✅ **Task 067: 리베이트/인센티브 추적 (F043)**
  - 리베이트 데이터 모델: `rebate_programs`, `rebate_progress` 테이블 설계
  - 벤더별 리베이트 프로그램 등록 (분기/연간, 목표 금액, 리베이트율)
  - 현재 달성률 실시간 추적
  - 예상 리베이트 금액 및 목표 달성 GAP 분석
  - `/rebates` 라우트 UI 구현

- ✅ **Task 068: 멀티 벤더 가격 비교 (F044)**
  - 벤더별 동일 사양 부품 매핑 데이터 모델
  - 벤더별 가격/납기/보증조건 비교 매트릭스 UI
  - 최적 벤더 추천 로직 (가격, 납기, 보증 가중치)
  - 견적 생성 시 벤더 비교 패널 추가

- ✅ **Task 069: AI 성과 분석 리포트 (F045)**
  - 월간/분기별 성과 데이터 집계 로직
  - OpenAI 기반 성과 분석 및 인사이트 생성
  - 낙찰률 추이, 마진 분석, 카테고리별 성과 차트
  - 개선 제안 및 다음 분기 예측
  - PDF 리포트 자동 생성
  - `/performance-report` 라우트 UI 구현

### Phase 7: RFP 기반 서버 구성 세부 조정 (시나리오 1 확장)

> 시나리오 1(RFP 기반 견적)의 하위 프로세스. 자동 생성된 견적안에서 서버별 부품을 수동으로 세부 조정하는 위저드. Task 074(견적 생성 허브) 의존.

- ✅ **Task 070-A: 서버 구성 시작 페이지 + RFP 연결 (2일)**
  - `/quotation/configure` 페이지 (RFP 서버 목록 카드 + 견적 비교 버튼)
  - RFP 페이지에 "서버 구성 시작" 링크 추가
  - 호환 부품 조회 API (`/api/assembly/compatible-parts`)
  - customer_id URL 파라미터 전달

- ⚠️ **Task 070-B: 서버 구성 6단계 위저드 통합 (부분 구현)**
  - ✅ `/quotation/configure/[rfpId]/[configIndex]` 위저드 페이지 UI 구현
  - ✅ 6단계 StepBar + 부품 카테고리별 선택 UI 존재
  - ⚠️ 자동→수동 전환 로직 부분 구현
  - ❌ 호환성 실시간 검증 UI 미완성

- ⚠️ **Task 070-C: 전략 비교 + 견적 확정 (미완성)**
  - ✅ `/quotation/configure/[rfpId]/compare` 비교 페이지 UI 스텁 존재
  - ❌ 3가지 전략 비교 테이블 미구현
  - ❌ AI 추천 텍스트 미연동
  - ❌ 최종 견적 확정 → quotation-history 연결 미완성

### Phase 8: AI 프롬프트 관리 시스템

- ✅ **Task 077: AI 프롬프트 관리 CRUD (완료)**
  - DB: `ai_prompts` 테이블 (20번째 테이블)
  - API: `/api/prompts` GET/POST, `/api/prompts/[id]` GET/PUT/DELETE
  - UI: `/settings/prompts` 프롬프트 목록/편집/복제/삭제
  - 기존 AI 모듈 3개 리팩터링: DB 프롬프트 우선, 폴백 상수 지원
  - 시드 데이터: 3개 시스템 프롬프트 (rfp-analyzer, chat-quotation, recommendation)

### Phase 9: IT 인프라 코드 체계 구축

- ✅ **Task 080: IT 인프라 코드 관리 시스템 (F048)**
  - DB: `equipment_codes` 테이블 (3단계 계층, self-referencing)
  - 코드 자동생성 규칙: 대분류(AA 영문2), 중분류(AA-NN 영문2+숫자2), 장비명(AA-NN-NNN 영문2+숫자2+숫자3)
  - 코드 생성 유틸: `lib/utils/code-generator.ts` (DB 중복 체크 후 발급)
  - API: `/api/equipment-codes` GET(트리)/POST, `/api/equipment-codes/[id]` PUT/DELETE
  - 시드: `test-document/IT_Infra_Code.xlsx` 기반 대분류 11 + 중분류 48 + 장비명 101개 코드 투입
  - UI: `/settings/codes` 트리뷰 관리 페이지 (추가/수정/삭제, 엑셀 import)
  - 부품 연동: `parts` 테이블에 `equipment_code_id` 필드 추가 (선택적)

- ✅ **Task 081: 서버 파트 코드 관리 시스템 (F049)**
  - DB: `part_codes` 테이블 (2단계 계층, self-referencing)
  - 코드 자동생성: 카테고리(AA), 부품명(AA-NNN)
  - API: `/api/part-codes` CRUD (트리 조회, 추가, 수정, 삭제)
  - 시드: Server_Part.xlsx 기반 카테고리 11 + 부품명 20 = 31개 코드 투입
  - UI: `/settings/part-codes` 트리뷰 관리 페이지

- ✅ **Task 082: 제품 관리 통합 — 2제품군 분리 UI + IT 인프라 장비 CRUD (F050)**
  - DB: `equipment_products`, `equipment_product_prices`, `equipment_price_history` 테이블 신설
  - DB: `parts` 테이블에 `part_code_id` nullable FK 추가
  - API: `/api/equipment-products` CRUD + 가격 이력
  - UI: 부품 관리 페이지 → 2탭 구조 리팩토링 (IT 인프라 장비 / 서버 파트)
  - UI: 대분류→중분류 캐스케이드 필터, 통합 제품 추가 Dialog
  - 컴포넌트 분리: equipment-tab, server-parts-tab, product-add-dialog, price-history-dialog

- ✅ **Task 082-A: 제품 테이블 스펙 컬럼 → 모델명 호버 툴팁**
  - "주요 스펙" 컬럼 제거 → 테이블 가독성 개선
  - 모델명 호버 시 shadcn Tooltip으로 상세 스펙 표시
  - IT 인프라 장비 탭 + 서버 파트 탭 양쪽 동일 적용

- ✅ **Task 082-B: IT 인프라 장비 엑셀 템플릿 + 대량 업로드**
  - 엑셀 템플릿 다운로드 API + 업로드 파싱 API
  - 장비코드 → UUID 자동 매핑, 스펙 컬럼 → jsonb 변환
  - equipment-tab에 엑셀 관리 DropdownMenu 추가
  - RFP 기반 샘플 데이터 16행 포함
  - `components/ui/tooltip.tsx` 신규 설치

- ✅ **Task 088: 서버 파트 엑셀 기능 개선 — IT 인프라 장비 방식 동일화**
  - 동적 생성 템플릿 → 정적 파일(`template-doc/Server-Parts-template.xlsx`)로 전환
  - 3시트 구조: "부품 데이터"(파트코드 기반), "코드 참조"(partCodes 목록), "안내"
  - 업로드 API: 카테고리명 매핑 → 파트코드 매핑으로 변경, partCodeId 설정
  - 원가 컬럼 제거 (보안: costPriceEncrypted는 별도 관리)
  - 41행 실제 서버 부품 테스트 데이터 포함 (CPU/메모리/SSD/HDD/GPU/NIC/RAID/PSU)

### Phase 10: LangChain.js + LangGraph.js 기반 AI 대화 시스템

> 현재 OpenAI 직접 호출 래퍼를 LangChain.js/LangGraph.js 기반으로 전환.
> 대화 이력 영구 저장, 멀티턴 상태 관리, LLM 비용 추적, 대화형 UI 컴포넌트 구현.
> **FastAPI 불필요 — Next.js 단일 서버로 충분 (Docker self-host, 타임아웃 무제한)**

- ✅ **Task 083: LangChain.js 패키지 설치 + DB 스키마 확장**
  - 패키지: `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`, `@langchain/langgraph-checkpoint-postgres`
  - `next.config.ts` serverExternalPackages 추가
  - DB 테이블 3개 추가:
    - `ai_chat_sessions` (대화 세션: tenantId, userId, customerId, threadId, mode, status, finalSpecs, quotationId)
    - `ai_chat_messages` (메시지 이력: sessionId FK, role, content, specs, tokenCount)
    - `llm_api_calls` (LLM 호출 로그: promptSlug, modelName, promptTokens, completionTokens, estimatedCost, latencyMs, status)
  - Drizzle migration 실행

- ✅ **Task 084: LangGraph 대화 그래프 구현**
  - `lib/ai/graph/state.ts` — QuotationChatState (messages, currentSpecs, mode, isComplete, reply, suggestedQuestions)
  - `lib/ai/graph/nodes/extract-specs.ts` — ChatOpenAI로 사양 추출 + 의도 파악 (1회 LLM 호출)
  - `lib/ai/graph/nodes/evaluate-completeness.ts` — 필수 사양 충족 판단 (로직만, LLM 불필요)
  - `lib/ai/graph/nodes/generate-reply.ts` — 응답 생성 + 가이드 질문 (1회 LLM 호출)
  - `lib/ai/graph/quotation-chat-graph.ts` — StateGraph 조립 (start→extract→evaluate→reply→END)
  - `lib/ai/graph/checkpointer.ts` — PostgreSQL 체크포인터 (thread_id별 대화 상태 자동 저장/복원)

- ✅ **Task 085: LLM 호출 로거 + OpenAI 클라이언트 개선**
  - `lib/ai/llm-logger.ts` — logLLMCall() 함수 (모든 호출을 DB에 자동 기록)
  - 모델별 토큰 가격 상수 (gpt-4o: $2.5/1M input, $10/1M output 등)
  - `lib/ai/openai-client.ts` 수정 — response.usage 반환 + logLLMCall 연동
  - 기존 rfp-analyzer.ts, recommendation-explainer.ts에 토큰 추적 추가

- ✅ **Task 086: 멀티턴 대화 API + 세션 관리 API**
  - `app/api/quotation/chat/route.ts` — LangGraph 기반 멀티턴 대화 (POST: message, threadId, mode, customerId)
  - `app/api/quotation/chat/sessions/route.ts` — 사용자 대화 세션 목록 (GET)
  - `app/api/quotation/chat/[sessionId]/route.ts` — 세션 상세 조회/삭제 (GET/DELETE)
  - `app/api/ai-usage/route.ts` — 테넌트별 AI 사용량 대시보드 데이터 (GET)
  - 기존 `/api/chat-quotation` deprecated 처리

- ✅ **Task 087: 대화형 UI 컴포넌트 + AI 사용량 대시보드**
  - `components/chat/chat-input.tsx` — Textarea + Shift+Enter + 전송 버튼
  - `components/chat/chat-message.tsx` — 메시지 버블 (user/assistant 분기, 아바타)
  - `components/chat/chat-message-list.tsx` — ScrollArea + 자동스크롤 + 타이핑 인디케이터
  - `components/chat/specs-sidebar.tsx` — 실시간 사양 요약 패널
  - `components/chat/session-list.tsx` — 이전 대화 세션 목록/복원
  - `components/chat/token-usage-badge.tsx` — 토큰 사용량 뱃지
  - `app/(dashboard)/quotation/chat/page.tsx` 리팩터링 (309줄 단일파일 → 컴포넌트 조합)
  - `app/(dashboard)/settings/ai-usage/page.tsx` — AI 사용량 대시보드 (토큰/비용/호출수 차트)

### Phase 11: UX 개선 및 버그 수정

> RFP 업로드 UX 개선, pdf-parse v2 호환성 수정, IT 인프라 장비 엑셀 기능 안정화

- ✅ **Task 088: pdf-parse v2 호환성 수정**
  - `lib/parsers/pdf-parser.ts` — PDFParse 클래스 API로 변경 (v1 함수 호출 → v2 클래스 인스턴스)
  - `next.config.ts` — `@napi-rs/canvas` serverExternalPackages 추가 (네이티브 모듈 번들링 제외)
  - "DOMMatrix is not defined" 에러 해결

- ✅ **Task 089: RFP 업로드 페이지 "작성 팁" 사이드바**
  - `app/(dashboard)/rfp/page.tsx` — 2컬럼 flex 레이아웃으로 변경
  - 우측 사이드바: 3개 팁 카드 (PDF 원본 사용/핵심 문서 선택/최신 버전 확인)
  - Badge variant로 필수(destructive)/권장(secondary) 구분
  - 접기/펼치기 토글 (ChevronRight/Left)
  - 반응형: lg 이상에서만 표시 (hidden lg:block)

- ✅ **Task 090: IT 인프라 장비 엑셀 관리 안정화**
  - 대분류 필터 SQL 에러 수정
  - 엑셀 템플릿 다운로드 파일명 통일
  - 정적 파일 서빙 방식으로 템플릿 제공

### Phase 12: RFP-견적 통합

> RFP 업로드를 견적 생성 허브로 통합, RFP-거래처 연결

- ✅ **Task 091: RFP-거래처 연결 DB 스키마**
  - rfp_documents에 customer_id 컬럼 추가
  - RFP 조회 API에 customer_id 필터링
  - RFP 업로드 API에 customer_id 저장

- ✅ **Task 092: 사이드바 메뉴 재구성**
  - RFP 업로드 독립 메뉴 제거
  - 견적 생성 허브에서 RFP 업로드 시작

- ✅ **Task 093: RFP 페이지 이동**
  - /rfp → /quotation/rfp 라우트 이동
  - 거래처별 RFP 이력 필터링

### Phase 13: LLM API Key 관리

> 설정 페이지에서 OpenAI API Key를 관리하고, DB에 암호화 저장

- ✅ **Task 094: ai_settings DB 스키마 + API**
  - ai_settings 테이블 추가
  - GET/PUT /api/settings/ai, POST /api/settings/ai/test
  - openai-client.ts에 DB Key 조회 우선순위 적용
  - 멀티 프로바이더(Claude/GPT) 지원: claude_model, claude_api_key 컬럼 추가, 연결 테스트 provider 분기

- ✅ **Task 095: AI Key 관리 설정 UI**
  - app/(dashboard)/settings/ai-keys/page.tsx
  - API Key 입력 (마스킹), 모델 선택, 연결 테스트
  - 설정 허브에 메뉴 카드 추가

- ✅ **Task 096: 보안 검증**
  - AES-256-GCM 암호화 로직 검증
  - 환경변수 폴백 동작 확인

### Phase 14: 견적 작성 중단/재개

> 견적 작성 중 중단하고 나중에 재개할 수 있는 기능

- ✅ **Task 097: quotations 테이블 확장 + Draft API**
  - source (rfp/excel/chat), source_data (JSONB) 컬럼 추가
  - POST /api/quotation/draft — 초안 자동 생성
  - PUT /api/quotation/[id]/draft — 초안 업데이트
  - GET /api/quotation?status=draft — 미완성 초안 목록

- ✅ **Task 098: 견적 허브 "작성 중인 견적" UI**
  - 견적 생성 허브에 draft 상태 견적 목록 섹션 추가
  - 재개 버튼 → 해당 경로(RFP/엑셀/대화)로 이동
  - 삭제 버튼으로 draft 정리

- ✅ **Task 099: 엑셀 sessionStorage → DB 전환**
  - 엑셀 파싱 결과를 sessionStorage 대신 draft.source_data에 저장
  - 결과 페이지에서 draft source_data에서 로드
  - 페이지 이탈 시에도 데이터 유지

- ✅ **Task 100: AI 대화 세션 재개 UI**
  - 활성 ai_chat_sessions 목록 표시
  - "이어하기" 버튼으로 기존 대화 threadId 재개
  - 세션 상태: active → completed/abandoned

- ⏳ **Task 101: 견적-RFP 연결 강화**
  - /api/quotation POST에 source 파라미터 저장
  - RFP 업로드 시 draft 자동 생성 + rfpId 연결
  - RFP 이력에 연결된 견적 수 표시

### 미완료 Task 요약

- Task 070-B: ⚠️ 부분 구현 (자동↔수동 전환, 호환성 검증 미완성)
- Task 070-C: ⚠️ 미완성 (3전략 비교, AI 추천 연동, 견적 확정)
- 완료율: 86/88 = ~98% (미완료 2건: Phase 7 위저드 070-B/070-C)
