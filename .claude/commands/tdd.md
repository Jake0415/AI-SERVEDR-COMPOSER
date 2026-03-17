# /tdd - 테스트 주도 개발

TDD (Test-Driven Development) 사이클로 기능을 구현합니다.

## 입력

구현할 기능: $ARGUMENTS

## 사전 확인

먼저 테스트 프레임워크가 설치되어 있는지 확인합니다:

```bash
cat package.json | grep -E "vitest|jest"
```

설치되어 있지 않으면 사용자에게 안내합니다:

```
⚠️ 테스트 프레임워크가 설치되어 있지 않습니다.
Vitest 설치를 권장합니다:
  npm install -D vitest @testing-library/react @testing-library/jest-dom
```

## TDD 사이클

### 🔴 RED: 실패하는 테스트 작성

1. 구현할 기능의 기대 동작을 정의
2. 테스트 파일 생성 (`*.test.ts` / `*.test.tsx`)
3. 테스트 실행하여 **반드시 실패하는지 확인**

```bash
npx vitest run [테스트파일]
```

### 🟢 GREEN: 최소 구현

1. 테스트를 통과하는 **최소한의 코드**만 작성
2. 완벽한 코드가 아니어도 됨 — 테스트 통과가 목표
3. 테스트 실행하여 통과 확인

```bash
npx vitest run [테스트파일]
```

### 🔵 REFACTOR: 리팩터링

1. 코드 품질 개선 (중복 제거, 명명 개선, 구조 정리)
2. 테스트가 계속 통과하는지 확인
3. CLAUDE.md 코딩 규칙 준수 여부 확인

```bash
npx vitest run [테스트파일]
```

### 🔄 반복

다음 기능 요구사항에 대해 RED → GREEN → REFACTOR 반복

## 커버리지 기준

- 일반 코드: **최소 80%**
- 금융 계산, 인증, 보안 코드: **100%**

## 출력 형식

각 사이클마다:

```
=== TDD 사이클 [N] ===
단계: 🔴 RED | 🟢 GREEN | 🔵 REFACTOR
테스트: [테스트 설명]
상태: 실패 → 통과 → 리팩터링 완료
=====================
```
