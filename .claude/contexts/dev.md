# 개발 모드 컨텍스트

현재 **활성 개발 모드**입니다. 기능 구현과 코드 변경에 집중합니다.

## 우선순위

1. **동작하게 만들기** — 먼저 기능이 작동하도록 구현
2. **올바르게 만들기** — 엣지 케이스 처리, 타입 안전성 확보
3. **깔끔하게 만들기** — 코드 정리, 중복 제거, 네이밍 개선

## 활성 도구

- **Edit, Write**: 코드 변경
- **Bash**: 빌드, 테스트, 개발 서버 실행
- **Grep, Glob, Read**: 기존 코드 탐색

## 자주 쓰는 명령어

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run lint         # 린트 검사
npx tsc --noEmit     # 타입 체크
```

## 체크리스트

코드 작성 시 항상 확인:

- [ ] TypeScript 타입 명시 (exported 함수)
- [ ] `any` 대신 `unknown` + 타입 가드
- [ ] Server Component 기본, `"use client"` 필요 시에만
- [ ] `cn()` 유틸리티로 클래스명 조합
- [ ] 사용자 대면 텍스트는 한국어
- [ ] console.log 제거
- [ ] CLAUDE.md 규칙 준수
