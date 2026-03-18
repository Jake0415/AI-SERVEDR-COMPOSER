"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
      <p className="text-muted-foreground text-center max-w-md">
        페이지를 로드하는 중 문제가 발생했습니다. 다시 시도해주세요.
      </p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
