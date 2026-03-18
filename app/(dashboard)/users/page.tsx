import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

/** 역할 Badge */
function roleBadge(role: string) {
  switch (role) {
    case "super_admin":
      return <Badge variant="destructive">슈퍼어드민</Badge>;
    case "admin":
      return <Badge>관리자</Badge>;
    case "member":
      return <Badge variant="secondary">멤버</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  // super_admin만 접근 가능
  if (currentUser.role !== "super_admin") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">사용자 관리</h2>
        </div>
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            슈퍼어드민 권한이 필요합니다. 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    );
  }

  // 같은 tenantId의 사용자 조회
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.tenantId, currentUser.tenantId));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <p className="text-muted-foreground">
          조직 내 사용자 목록을 관리합니다. (총 {userList.length}명)
        </p>
      </div>

      {userList.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">등록된 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.name}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.department}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
