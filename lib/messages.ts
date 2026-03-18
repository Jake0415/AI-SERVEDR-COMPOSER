// ============================================================
// 한국어 폼 유효성 메시지 & UI 메시지 통합
// ============================================================

export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field}은(는) 필수입니다.`,
  minLength: (field: string, min: number) => `${field}은(는) ${min}자 이상이어야 합니다.`,
  maxLength: (field: string, max: number) => `${field}은(는) ${max}자 이내로 입력하세요.`,
  email: "유효한 이메일 주소를 입력하세요.",
  number: (field: string) => `${field}은(는) 숫자만 입력할 수 있습니다.`,
  positive: (field: string) => `${field}은(는) 0보다 커야 합니다.`,
  min: (field: string, min: number) => `${field}은(는) ${min} 이상이어야 합니다.`,
  max: (field: string, max: number) => `${field}은(는) ${max} 이하여야 합니다.`,
  duplicate: (field: string) => `이미 등록된 ${field}입니다.`,
  notFound: (resource: string) => `${resource}을(를) 찾을 수 없습니다.`,
} as const;

export const TOAST_MESSAGES = {
  // 성공
  saved: "저장되었습니다.",
  deleted: "삭제되었습니다.",
  created: "등록되었습니다.",
  updated: "수정되었습니다.",
  uploaded: "업로드되었습니다.",
  published: "발행되었습니다.",
  approved: "승인되었습니다.",

  // 실패
  saveFailed: "저장에 실패했습니다.",
  deleteFailed: "삭제에 실패했습니다.",
  loadFailed: "데이터를 불러오는데 실패했습니다.",
  uploadFailed: "업로드에 실패했습니다.",
  unauthorized: "로그인이 필요합니다.",
  forbidden: "권한이 없습니다.",
  serverError: "서버 오류가 발생했습니다.",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "슈퍼어드민",
  admin: "관리자",
  member: "멤버",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  review: "검토중",
  approved: "승인됨",
  published: "발행됨",
  won: "낙찰",
  lost: "실주",
  pending: "대기",
  expired: "만료",
};
