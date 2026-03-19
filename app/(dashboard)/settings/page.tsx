// ============================================================
// 설정 허브 페이지 — 하위 설정 메뉴 카드 목록
// ============================================================

import Link from "next/link";
import { FolderTree, Building2, Bell, Palette, KeyRound, BrainCircuit } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const settingsMenu = [
  {
    href: "/settings/categories",
    title: "카테고리 관리",
    description: "부품 카테고리 추가, 수정, 삭제 및 스펙 필드 관리",
    icon: FolderTree,
  },
  {
    href: "/settings/company",
    title: "회사 정보",
    description: "회사 기본 정보, 로고, 직인, 계좌 정보 관리",
    icon: Building2,
  },
  {
    href: "/settings/prompts",
    title: "AI 프롬프트 관리",
    description: "LLM 시스템 프롬프트 추가, 수정, 삭제 및 버전 관리",
    icon: BrainCircuit,
  },
  {
    href: "/settings/password",
    title: "비밀번호 변경",
    description: "현재 비밀번호를 확인하고 새 비밀번호로 변경",
    icon: KeyRound,
  },
  {
    href: "/settings/theme",
    title: "테마 설정",
    description: "색상 테마 및 라이트/다크 모드 설정",
    icon: Palette,
  },
  {
    href: "/settings",
    title: "알림 설정",
    description: "알림 수신 방법 및 주기 설정",
    icon: Bell,
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">시스템 설정을 관리합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsMenu.map((item) => {
          const content = (
            <Card
              key={item.title}
              className={
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-primary/50 transition-colors cursor-pointer"
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {item.title}
                      {item.disabled && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (준비중)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );

          if (item.disabled) {
            return <div key={item.title}>{content}</div>;
          }

          return (
            <Link key={item.title} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
