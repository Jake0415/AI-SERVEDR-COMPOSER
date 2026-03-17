export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">AI-SERVER-COMPOSER</h1>
          <p className="text-muted-foreground">초기 설정 — 슈퍼어드민 계정 생성</p>
        </div>
        <div className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            F010, F011 — 슈퍼어드민 계정 + 테넌트 생성 폼이 여기에 구현됩니다.
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• 이메일 / 비밀번호</li>
            <li>• 이름 / 전화번호 / 부서명</li>
            <li>• 회사명 / 사업자등록번호</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
