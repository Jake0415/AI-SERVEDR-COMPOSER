export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">대시보드</h2>
        <p className="text-muted-foreground">F012 — 최근 견적, 진행 건수, 낙찰률 요약</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">진행 중</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">완료</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">낙찰</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">월간 낙찰률</p>
          <p className="text-2xl font-bold">--%</p>
        </div>
      </div>
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">최근 견적 목록 (최신 5건) — Task 007에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
