# CLAUDE.md

이 파일은 이 레포지토리에서 Claude Code (claude.ai/code)가 작업할 때 필요한 지침을 제공합니다.

## 개발 명령어

```bash
# Turbopack을 사용한 개발 서버 실행
npm run dev

# Turbopack을 사용한 프로덕션 빌드  
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# TypeScript 타입 체크
npx tsc --noEmit

# shadcn/ui 컴포넌트 추가
npx shadcn@latest add [component-name]
```

## 아키텍처 개요

이 프로젝트는 한국어를 지원하는 **Next.js v15 스타터 킷**으로, App Router 아키텍처를 사용하여 구축되었습니다. 주요 특징:

### TailwindCSS v4 설정
- **tailwind.config 파일 없음** - CSS 기반 설정 사용
- `app/globals.css`에 `@theme inline` 블록으로 스타일 정의
- 커스텀 다크 모드 variant: `@custom-variant dark (&:is(.dark *))`
- PostCSS는 `@tailwindcss/postcss` 플러그인만 사용하도록 설정
- 추가 애니메이션을 위한 `tw-animate-css` 사용
- 라이트/다크 테마 모두에 OKLCH 값을 사용하는 색상 시스템

### 컴포넌트 아키텍처
- **shadcn/ui 컴포넌트**: `components/ui/`에 위치 (New York 스타일, RSC 활성화, Lucide 아이콘)
- **레이아웃 컴포넌트**: `components/layout/`에 위치 (navbar, footer, theme-toggle)
- **프로바이더**: `components/providers/`에 위치 (테마 프로바이더 래퍼)
- **유틸리티 함수**: `lib/utils.ts`에 위치 (클래스 병합을 위한 cn 함수)
- **컴포넌트 설정**: 커스텀 별칭이 포함된 `components.json`을 통해 관리

### 테마 시스템
- 시스템 감지가 활성화된 `next-themes` 사용
- `attribute="class"` 및 `defaultTheme="system"`으로 설정된 ThemeProvider
- 한국어 라벨(라이트, 다크, 시스템)로 라이트/다크/시스템 옵션을 제공하는 테마 토글 컴포넌트
- 테마 지속성을 위해 루트 레이아웃에 `suppressHydrationWarning` 포함

### 레이아웃 구조
- 루트 레이아웃(`app/layout.tsx`)이 모든 페이지를 ThemeProvider로 감쌈
- 고정된 navbar와 footer, 메인 콘텐츠는 flex-1 컨테이너에 배치
- HTML에 한국어 설정(`lang="ko"`)
- CSS 변수를 사용하는 Geist 폰트(sans 및 mono)

### 스타일링 패턴
- 일관된 중앙 정렬을 위해 모든 컨테이너에 `mx-auto max-w-screen-2xl px-4` 사용
- OKLCH 색상 값으로 라이트/다크 모드 간 더 나은 지각적 균일성 제공
- `cn()` 유틸리티로 클래스 조합하는 shadcn/ui 패턴을 따르는 컴포넌트
- Border radius 시스템: 기본값 `10px`로 `--radius-sm`부터 `--radius-xl`까지

## 환경 설정

환경변수를 위해 `.env.example`을 `.env.local`로 복사하세요. 스타터 킷에는 일반적인 서비스(데이터베이스, 인증, API)에 대한 샘플 설정이 포함되어 있습니다.

## Import 별칭

- `@/components` → `./components`
- `@/lib` → `./lib`  
- `@/app` → `./app`
- `@/ui` → `./components/ui`
- `@/hooks` → `./hooks`
- `@/` → `./` (루트)

## 한국어 지원

이 프로젝트는 한국어를 위해 설정되었습니다:
- HTML lang 속성을 "ko"로 설정
- 한국어 라벨(라이트, 다크, 시스템)이 포함된 테마 토글
- 한국어 설명이 포함된 환경변수
- 한국어로 작성된 README 및 문서

---

## 코딩 스타일 규칙

### 일반 원칙

- **불변성**: 항상 새 객체를 생성하고, 기존 객체를 직접 변경하지 않음 (spread 연산자 활용)
- **파일 크기**: 200~400줄 권장, 최대 800줄
- **함수 길이**: 50줄 이내
- **중첩 깊이**: 최대 4단계
- **가독성**: 명확한 변수/함수명 사용, 약어 지양

### TypeScript 규칙

- `any` 사용 금지 → `unknown` + 타입 가드로 안전하게 처리
- `interface`: 확장 가능한 객체 형태에 사용
- `type`: 유니언, 인터섹션, 매핑 타입에 사용
- 문자열 리터럴 유니언을 `enum` 대신 선호
- 내보내는 함수, 공용 유틸리티, 클래스 공개 메서드에는 명시적 타입 지정
- `React.FC` 사용 지양, 일반 함수 컴포넌트 선호
- React Props는 `{ComponentName}Props` 인터페이스로 정의
- `console.log` 프로덕션 코드에 사용 금지
- 입력 검증: Zod 스키마 사용 권장
- 비동기 처리: async/await + try-catch 블록 사용

### API 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page: number; total: number };
}
```

### 커스텀 Hook 패턴

- Hook 이름은 `use` 접두사 필수
- 단일 책임 원칙 준수
- 반환 타입 명시적 정의

### Repository 패턴 (데이터 접근 추상화)

- `findAll`, `findById`, `create`, `update`, `delete` 메서드 구조
- 데이터 소스와 비즈니스 로직 분리

## 보안 규칙

- **시크릿 하드코딩 절대 금지**: API 키, 비밀번호, 토큰은 환경변수 또는 시크릿 매니저 사용
- `NEXT_PUBLIC_` 접두사는 진정 공개되어도 무방한 변수에만 사용
- 커밋 전 `.env.local`, 시크릿 파일 포함 여부 반드시 확인
- SQL 인젝션 방지: 파라미터화 쿼리 사용
- XSS 방지: 사용자 입력 HTML 새니타이징
- `dangerouslySetInnerHTML` 명시적 보안 검토 없이 사용 금지
- CSRF 보호 및 레이트 리미팅 적용
- 에러 메시지에 내부 구현 정보 노출 금지
- 서버 측에서 모든 사용자 입력 검증 (Server Actions, API Routes)

## 테스트 요구사항

- **최소 80% 테스트 커버리지** 목표
- **TDD 워크플로우**: 실패하는 테스트 먼저 작성 → 최소 구현 → 리팩터링
- 테스트 파일 명명: `*.test.ts` / `*.test.tsx` (소스 파일과 같은 위치에 배치)
- 유닛 테스트, 통합 테스트, E2E 테스트 구분하여 작성
- 금융 계산, 인증, 보안 관련 코드는 **100% 커버리지 필수**
- E2E 테스트 프레임워크: Playwright 권장
- 테스트 프레임워크: Vitest 권장

## Git 워크플로우

### 커밋 메시지 형식

프로젝트 기존 이모지 스타일을 따릅니다:

- 🚀 새 기능 (feat)
- 🔧 수정/설정 변경 (fix/chore)
- 📝 문서 (docs)
- 🎨 스타일/UI (style)
- ♻️ 리팩터링 (refactor)
- ✅ 테스트 (test)
- ⚡ 성능 (perf)

### PR 워크플로우

- PR 리뷰 시 최신 커밋만이 아닌 **전체 커밋 히스토리** 확인
- `git diff [base-branch]...HEAD`로 모든 변경사항 검토
- 새 브랜치 push 시 `-u` 플래그 사용
- 커밋 전 `/verify` 실행 권장

## Next.js 패턴

- **Server Components 기본**: `"use client"` 지시자는 필요한 경우에만 추가
- **데이터 페칭**: Server Component에서 직접 수행 (`useEffect` 지양)
- **라우트 세그먼트**: `loading.tsx`, `error.tsx` 적극 활용
- **메타데이터**: `generateMetadata` 또는 정적 `metadata` export 사용
- **이미지 최적화**: `next/image` 컴포넌트 활용
- **Server Actions**: 폼 처리와 데이터 변경에 활용
- **서버 전용 코드**: `server-only` 패키지로 보호

## 프로젝트 구조 규칙

- 새 기능 추가 시: `app/` 내 라우트 그룹 디렉토리 생성
- 공유 로직: `lib/`에 유틸리티, `hooks/`에 커스텀 Hook
- UI 컴포넌트: `components/ui/`에 shadcn/ui 컴포넌트
- 레이아웃: `components/layout/`에 공통 레이아웃
- 프로바이더: `components/providers/`에 Context Provider 래퍼
- 사용자 대면 텍스트는 한국어로 작성

## 개발 워크플로우

### 코드 수정 → 검증 → 보고 절차

1. **코드 수정**: 요청 사항 구현
2. **로컬 dev 서버 실행**: `npx next dev -p 3200`
3. **Playwright 검증** (MCP 사용):
4. **결과 보고**: 성공/실패 + 스크린샷 + 에러 메시지
5. **실패 시**: 에러 분석 → 수정 → 재검증 (자동 반복)
6. **성공 시**: git commit + push, Docker rebuild는 요청 시에만

### 환경 구분

| 용도 | 환경 | 접속 |
|------|------|------|
| 개발 + 테스트 | `npx next dev -p 3200` | `localhost:3200` |
| Docker 프로덕션 | `docker-compose` | `localhost:3200` |


