export default function BidHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">낙찰 이력</h2>
        <p className="text-muted-foreground">F009 — 낙찰률, 평균 마진율, 경쟁력 분석 대시보드</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">전체 낙찰률</p>
          <p className="text-2xl font-bold">--%</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">평균 마진율</p>
          <p className="text-2xl font-bold">--%</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">총 견적 건수</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">월별 추이 차트 + 실패 사유 분포 — Task 011에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
