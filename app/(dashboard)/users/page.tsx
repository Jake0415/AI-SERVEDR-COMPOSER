export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <p className="text-muted-foreground">F013 — 슈퍼어드민 전용: 관리자/멤버 추가, 역할 관리</p>
      </div>
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">사용자 목록 테이블 (이름, 이메일, 부서, 역할, 가입일) — Task 012에서 UI 구현 예정</p>
      </div>
    </div>
  );
}
