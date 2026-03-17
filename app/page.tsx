import { redirect } from "next/navigation";

export default function RootPage() {
  // TODO: Task 014에서 DB 사용자 0명 체크 로직 구현
  // DB에 사용자 0명 → /setup, 아니면 → /login
  redirect("/login");
}
