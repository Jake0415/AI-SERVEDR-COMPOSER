"use client";

import { useCallback, useEffect, useState } from "react";

export const COLOR_THEMES = [
  { name: "neutral", label: "기본", color: "oklch(0.205 0 0)" },
  { name: "blue", label: "블루", color: "oklch(0.546 0.245 262.881)" },
  { name: "green", label: "그린", color: "oklch(0.596 0.145 163.225)" },
  { name: "violet", label: "바이올렛", color: "oklch(0.541 0.281 293.009)" },
  { name: "orange", label: "오렌지", color: "oklch(0.646 0.222 41.116)" },
  { name: "rose", label: "로즈", color: "oklch(0.585 0.22 17.383)" },
] as const;

export type ColorThemeName = (typeof COLOR_THEMES)[number]["name"];

const STORAGE_KEY = "color-theme";

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorThemeName>("neutral");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeName | null;
    if (saved && COLOR_THEMES.some((t) => t.name === saved)) {
      setColorThemeState(saved);
      applyTheme(saved);
    }
  }, []);

  const setColorTheme = useCallback((theme: ColorThemeName) => {
    setColorThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, []);

  return { colorTheme, setColorTheme, themes: COLOR_THEMES };
}

function applyTheme(theme: ColorThemeName) {
  const root = document.documentElement;
  if (theme === "neutral") {
    root.removeAttribute("data-color-theme");
  } else {
    root.setAttribute("data-color-theme", theme);
  }
}
