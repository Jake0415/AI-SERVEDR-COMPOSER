export default function RfpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">RFP 업로드</h2>
        <p className="text-muted-foreground">F003, F004 — RFP 문서 업로드, 이력 관리, AI 파싱</p>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <p className="text-sm text-muted-foreground">RFP 이력 목록 — Task 009에서 UI 구현 예정</p>
      </div>
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <p className="text-muted-foreground">PDF, HWP, DOCX 파일을 드래그앤드롭하세요</p>
        <p className="text-xs text-muted-foreground mt-2">AI가 서버 사양 요구사항을 자동 추출합니다</p>
      </div>
    </div>
  );
}
