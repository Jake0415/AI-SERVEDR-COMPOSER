export default function QuotationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">견적 생성</h2>
        <p className="text-muted-foreground">F005, F006 — 3가지 견적안 자동 생성 + 마진 시뮬레이션</p>
      </div>
      <div className="flex gap-2">
        <span className="px-4 py-2 rounded-md border bg-muted text-sm font-medium">수익성 중심</span>
        <span className="px-4 py-2 rounded-md border text-sm">규격 충족</span>
        <span className="px-4 py-2 rounded-md border text-sm">성능 향상</span>
      </div>
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">부품 구성 테이블 + 마진 슬라이더 — Task 010에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
