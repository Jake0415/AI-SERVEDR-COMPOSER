# /verify - 검증 파이프라인

코드 품질을 종합적으로 검증합니다. 각 단계를 순서대로 실행하고 결과를 리포트합니다.

## 검증 단계

다음 단계를 순서대로 실행하세요:

### 1. 빌드 확인

```bash
npm run build
```

### 2. TypeScript 타입 체크

```bash
npx tsc --noEmit
```

### 3. ESLint 린트 검사

```bash
npm run lint
```

### 4. 테스트 실행

package.json에 test 스크립트가 있으면 실행합니다. 없으면 "테스트 미설정"으로 건너뜁니다.

### 5. console.log 감사

```bash
grep -rn "console\.log" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null
```

프로덕션 코드에 console.log가 남아있으면 경고합니다.

### 6. TODO/FIXME 감사

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/ 2>/dev/null
```

미해결 TODO/FIXME 항목이 있으면 리포트합니다.

### 7. Git 상태 확인

```bash
git status
```

커밋되지 않은 변경사항을 확인합니다.

## 출력 형식

```
=== 검증 리포트 ===
1. 빌드:       ✅ 통과 | ❌ 실패
2. 타입 체크:   ✅ 통과 | ❌ 실패
3. 린트:       ✅ 통과 | ❌ 실패
4. 테스트:     ✅ 통과 | ❌ 실패 | ⏭️ 미설정
5. console.log: ✅ 없음 | ⚠️ N건 발견
6. TODO/FIXME:  ✅ 없음 | ⚠️ N건 발견
7. Git 상태:   ✅ 클린 | ⚠️ 변경사항 있음
==================
```

실패한 항목이 있으면 상세 오류 메시지를 함께 제공합니다.
