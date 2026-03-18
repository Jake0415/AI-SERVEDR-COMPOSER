import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Calculator,
  ClipboardList,
  TrendingUp,
  Users,
  LogOut,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/actions";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["super_admin", "admin", "member"] },
  { href: "/parts", label: "부품 관리", icon: Wrench, roles: ["super_admin", "admin"] },
  { href: "/rfp", label: "RFP 업로드", icon: FileText, roles: ["super_admin", "admin", "member"] },
  { href: "/quotation", label: "견적 생성", icon: Calculator, roles: ["super_admin", "admin", "member"] },
  { href: "/quotation-history", label: "견적 이력", icon: ClipboardList, roles: ["super_admin", "admin", "member"] },
  { href: "/bid-history", label: "낙찰 이력", icon: TrendingUp, roles: ["super_admin", "admin", "member"] },
  { href: "/users", label: "사용자 관리", icon: Users, roles: ["super_admin"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="font-bold text-lg">AI-SERVER-COMPOSER</h1>
          <p className="text-xs text-muted-foreground">RFP 기반 인프라 견적서 산출</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <div className="px-3 py-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </form>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
