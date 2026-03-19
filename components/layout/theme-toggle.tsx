"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useColorTheme, COLOR_THEMES } from "@/hooks/use-color-theme"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 전환</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">모드</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          시스템
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          <Palette className="mr-1 inline h-3 w-3" />
          색상 테마
        </DropdownMenuLabel>
        <div className="flex flex-wrap gap-1.5 px-2 py-1.5">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => setColorTheme(theme.name)}
              className="group relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: theme.color,
                borderColor: colorTheme === theme.name ? "var(--foreground)" : "transparent",
              }}
              title={theme.label}
            >
              {colorTheme === theme.name && (
                <span className="absolute h-2 w-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
