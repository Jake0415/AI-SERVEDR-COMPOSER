import { Suspense } from "react";
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
  Building2,
  Settings,
  Menu,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/actions";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["super_admin", "admin", "member"] },
  { href: "/rfp", label: "RFP 업로드", icon: FileText, roles: ["super_admin", "admin", "member"] },
  { href: "/quotation", label: "견적 생성", icon: Calculator, roles: ["super_admin", "admin", "member"] },
  { href: "/quotation-history", label: "견적 이력", icon: ClipboardList, roles: ["super_admin", "admin", "member"] },
  { href: "/bid-history", label: "낙찰 이력", icon: TrendingUp, roles: ["super_admin", "admin", "member"] },
  { href: "/parts", label: "판매 장비 관리", icon: Wrench, roles: ["super_admin", "admin"] },
  { href: "/customers", label: "거래처 관리", icon: Building2, roles: ["super_admin", "admin", "member"] },
  { href: "/users", label: "사용자 관리", icon: Users, roles: ["super_admin"] },
  { href: "/settings", label: "설정", icon: Settings, roles: ["super_admin", "admin"] },
];

function SidebarContent({
  visibleMenuItems,
  userName,
  userEmail,
}: {
  visibleMenuItems: typeof menuItems;
  userName: string;
  userEmail: string;
}) {
  return (
    <>
      <div className="p-6 border-b">
        <h1 className="font-bold text-lg">AI-SERVER-COMPOSER</h1>
        <p className="text-xs text-muted-foreground">RFP 기반 인프라 견적서 산출</p>
      </div>
      <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="메인 메뉴">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <div className="px-3 py-1">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </form>
      </div>
    </>
  );
}

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
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col shrink-0">
        <SidebarContent
          visibleMenuItems={visibleMenuItems}
          userName={user.name}
          userEmail={user.email}
        />
      </aside>

      {/* 모바일 헤더 + Sheet 사이드바 */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center gap-3 p-4 border-b bg-background">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SidebarContent
                visibleMenuItems={visibleMenuItems}
                userName={user.name}
                userEmail={user.email}
              />
            </SheetContent>
          </Sheet>
          <h1 className="font-bold text-sm">AI-SERVER-COMPOSER</h1>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-4 md:p-8 bg-background overflow-auto">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
