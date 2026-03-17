export default function QuotationHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">견적 이력</h2>
        <p className="text-muted-foreground">F007, F008 — 견적서 출력(PDF/Excel), 낙찰 결과 기록</p>
      </div>
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">견적 목록 테이블 (날짜, RFP명, 견적안 유형, 총액, 상태) — Task 011에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
