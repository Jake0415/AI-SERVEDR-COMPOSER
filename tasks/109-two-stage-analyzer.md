# Task 109: rfp-analyzer.ts 2단계 호출 리팩터링

## 상태: 진행 예정

## 구현 내용
- 1차 호출: 장비 목록 + 공통 요건 (maxTokens 4096)
- 2차 호출: 장비별 개별 호출 (장비당 maxTokens 4096)
- onProgress 콜백으로 진행 상황 전달
