"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useColorTheme, COLOR_THEMES } from "@/hooks/use-color-theme";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  const modes = [
    { value: "light", label: "라이트", icon: Sun },
    { value: "dark", label: "다크", icon: Moon },
    { value: "system", label: "시스템", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">테마 설정</h1>
        <p className="text-muted-foreground">색상 테마와 라이트/다크 모드를 설정합니다.</p>
      </div>

      {/* 라이트/다크 모드 */}
      <Card>
        <CardHeader>
          <CardTitle>모드</CardTitle>
          <CardDescription>라이트, 다크 또는 시스템 설정을 따릅니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {modes.map((m) => (
              <Button
                key={m.value}
                variant={theme === m.value ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setTheme(m.value)}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 색상 테마 */}
      <Card>
        <CardHeader>
          <CardTitle>색상 테마</CardTitle>
          <CardDescription>UI 전체의 주요 색상을 변경합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {COLOR_THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => setColorTheme(t.name)}
                className="group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:scale-105"
                style={{
                  borderColor: colorTheme === t.name ? t.color : "var(--border)",
                }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: t.color }}
                >
                  {colorTheme === t.name && (
                    <Check className="h-5 w-5 text-white" />
                  )}
                </div>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      <Card>
        <CardHeader>
          <CardTitle>미리보기</CardTitle>
          <CardDescription>선택한 테마가 적용된 UI 요소들입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary 버튼</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" title="primary" />
            <div className="h-8 w-8 rounded-full bg-secondary" title="secondary" />
            <div className="h-8 w-8 rounded-full bg-accent" title="accent" />
            <div className="h-8 w-8 rounded-full bg-muted" title="muted" />
            <div className="h-8 w-8 rounded-full bg-destructive" title="destructive" />
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">카드 미리보기</p>
            <p className="text-sm text-muted-foreground">
              이 카드는 현재 선택한 색상 테마가 적용된 모습입니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
