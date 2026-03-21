# Task 099: 엑셀 sessionStorage → DB 전환

## 목표
엑셀 파싱 결과를 sessionStorage 대신 DB에 저장하여 페이지 이탈 시에도 유지

## 상세
- 엑셀 파싱 후 draft 자동 생성 (source="excel", source_data에 파싱 결과)
- 결과 페이지에서 sessionStorage 대신 draft source_data에서 로드
- sessionStorage 의존 코드 제거

## 수락 기준
- [ ] 엑셀 업로드 후 페이지 이탈 → 재개 가능
- [ ] sessionStorage 코드 제거
- [ ] 기존 흐름과 동일한 결과
