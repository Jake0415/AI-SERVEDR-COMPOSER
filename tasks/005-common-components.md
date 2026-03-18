# Task 005: 공통 컴포넌트 라이브러리 구현

## 상태
- [x] ✅ 완료

## 개요
shadcn/ui 기반 공통 컴포넌트를 설치 및 커스터마이징하고, 사이드바 네비게이션, 데이터 테이블, 통계 카드 등
재사용 가능한 레이아웃/UI 컴포넌트를 구현합니다. 더미 데이터 생성 유틸리티도 함께 작성합니다.

## 관련 PRD 기능
- [F001] 부품 관리
- [F003] RFP 업로드
- [F005] 견적 생성
- [F009] 낙찰 이력
- [F012] 대시보드

## 관련 파일
- `components/ui/` — shadcn/ui 컴포넌트
- `components/layout/sidebar.tsx` — 사이드바 네비게이션
- `components/layout/page-header.tsx` — 페이지 헤더
- `components/common/data-table.tsx` — 데이터 테이블
- `components/common/stat-card.tsx` — 통계 카드
- `components/common/file-upload.tsx` — 파일 업로드
- `components/common/empty-state.tsx` — 빈 상태 컴포넌트
- `components/common/loading-state.tsx` — 로딩 상태 컴포넌트
- `components/common/error-state.tsx` — 에러 상태 컴포넌트
- `components/charts/` — Recharts 래퍼 컴포넌트
- `lib/mock-data.ts` — 더미 데이터

## 수락 기준
- [ ] shadcn/ui 기본 컴포넌트가 설치되고 정상 렌더링됨
- [ ] 사이드바 네비게이션이 역할별 메뉴 필터링을 지원함
- [ ] 데이터 테이블이 정렬, 검색, 페이지네이션을 지원함
- [ ] 통계 카드, 파일 업로드, 상태 컴포넌트가 구현됨
- [ ] Recharts 래퍼 컴포넌트가 구현됨
- [ ] 더미 데이터가 모든 데이터 모델에 대해 생성됨

## 구현 단계
- [ ] shadcn/ui 컴포넌트 설치 (Button, Input, Select, Table, Dialog, Sheet, Tabs, Card, Badge, Toast)
- [ ] Form 관련 컴포넌트 설치 (Form, FormField, Label, Textarea)
- [ ] 사이드바 네비게이션 컴포넌트 구현 (역할별 메뉴 필터링)
- [ ] 페이지 헤더 컴포넌트 구현 (제목, 설명, 액션 버튼)
- [ ] 데이터 테이블 컴포넌트 구현 (정렬, 검색, 페이지네이션)
- [ ] 통계 카드 컴포넌트 구현 (숫자, 라벨, 아이콘, 변화율)
- [ ] 파일 업로드 컴포넌트 구현 (드래그앤드롭, 진행률 표시)
- [ ] 빈 상태 / 로딩 상태 / 에러 상태 컴포넌트 구현
- [ ] Recharts 래퍼 컴포넌트 구현 (원형, 라인, 바 차트)
- [ ] 더미 데이터 생성 유틸리티 작성 (모든 데이터 모델에 대한 목업 데이터)

## 테스트 체크리스트
- [ ] 모든 shadcn/ui 컴포넌트 렌더링 확인
- [ ] 사이드바 역할별 메뉴 표시 정상 동작
- [ ] 데이터 테이블 정렬/검색/페이지네이션 동작 확인
- [ ] 차트 컴포넌트 더미 데이터로 렌더링 확인

## 참고사항
Phase 2의 첫 번째 작업으로, 이후 모든 페이지 UI 구현에서 이 컴포넌트들을 재사용합니다.
shadcn/ui는 New York 스타일, Lucide 아이콘을 사용합니다.
