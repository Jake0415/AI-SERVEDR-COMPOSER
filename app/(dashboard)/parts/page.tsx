export default function PartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">부품 관리</h2>
        <p className="text-muted-foreground">F001, F002 — 14개 카테고리 부품 등록/수정, 가격 관리</p>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <p className="text-sm text-muted-foreground">카테고리 탭 (서버 부품 / 네트워크·인프라)</p>
        <div className="flex gap-2 flex-wrap">
          {["CPU", "메모리", "SSD", "HDD", "NIC", "RAID", "GPU", "PSU", "메인보드", "섀시", "HBA", "스위치", "트랜시버", "케이블"].map((cat) => (
            <span key={cat} className="px-3 py-1 rounded-full border text-xs">{cat}</span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">부품 목록 테이블 + 추가/수정/삭제 — Task 008에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
