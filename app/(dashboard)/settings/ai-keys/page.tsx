"use client";

// ============================================================
// AI Key 관리 페이지 — OpenAI API Key 등록 및 모델 설정
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Key, TestTube, Save, Loader2, ShieldCheck, Info } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── 타입 정의 ──────────────────────────────────────────────

interface AiSettings {
  hasApiKey: boolean;
  maskedKey: string | null;
  model: string;
  hasEnvKey: boolean;
}

// ── 모델 옵션 ──────────────────────────────────────────────

const models = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
];

// ── 메인 컴포넌트 ──────────────────────────────────────────

export default function AiKeysPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [testing, setTesting] = useState(false);

  // ── 설정 불러오기 ────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (!res.ok) throw new Error("설정을 불러오는데 실패했습니다.");
      const json = await res.json();
      const data: AiSettings = json.data ?? json;
      setSettings(data);
      setSelectedModel(data.model || "gpt-4o");
    } catch {
      toast.error("AI 설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── API Key 저장 ─────────────────────────────────────────

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error("API Key를 입력해주세요.");
      return;
    }
    setSavingKey(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKeyInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "Key 저장에 실패했습니다.");
      }
      toast.success("API Key가 저장되었습니다.");
      setApiKeyInput("");
      await fetchSettings();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Key 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setSavingKey(false);
    }
  };

  // ── 모델 저장 ────────────────────────────────────────────

  const handleSaveModel = async () => {
    setSavingModel(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiModel: selectedModel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "모델 저장에 실패했습니다.");
      }
      toast.success("모델 설정이 저장되었습니다.");
      await fetchSettings();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "모델 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setSavingModel(false);
    }
  };

  // ── 연결 테스트 ──────────────────────────────────────────

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/ai/test", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.error?.message ?? "연결 테스트에 실패했습니다."
        );
      }
      toast.success("OpenAI 연결 테스트 성공!");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "연결 테스트에 실패했습니다.";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  // ── 상태 배지 렌더링 ────────────────────────────────────

  function renderStatusBadge() {
    if (!settings) return null;
    if (settings.hasApiKey) {
      return (
        <Badge className="bg-green-600 hover:bg-green-600 text-white">
          DB Key 설정됨
        </Badge>
      );
    }
    if (settings.hasEnvKey) {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
          환경변수 설정됨
        </Badge>
      );
    }
    return <Badge variant="destructive">미설정</Badge>;
  }

  // ── 로딩 상태 ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── 렌더링 ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">AI Key 관리</h1>
        <p className="text-muted-foreground">
          OpenAI API Key와 모델을 설정합니다.
        </p>
      </div>

      {/* OpenAI API Key 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Key className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">OpenAI API Key</CardTitle>
              <CardDescription>
                API Key를 등록하면 AI 기능을 사용할 수 있습니다.
              </CardDescription>
            </div>
            {renderStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 현재 상태 */}
          {settings?.hasApiKey && settings.maskedKey && (
            <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
              <span className="text-muted-foreground">현재 등록된 Key: </span>
              <code className="font-mono">{settings.maskedKey}</code>
            </div>
          )}

          {/* Key 입력 */}
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {settings?.hasApiKey ? "새 API Key" : "API Key"}
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-proj-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveKey} disabled={savingKey}>
              {savingKey ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              저장
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || (!settings?.hasApiKey && !settings?.hasEnvKey)}
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              연결 테스트
            </Button>
          </div>

          {/* 안내 메시지 */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>API Key는 AES-256-GCM으로 암호화되어 안전하게 저장됩니다.</span>
          </div>
        </CardContent>
      </Card>

      {/* 모델 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">모델 설정</CardTitle>
          <CardDescription>
            AI 기능에 사용할 OpenAI 모델을 선택합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-select">모델</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full max-w-xs" id="model-select">
                <SelectValue placeholder="모델 선택" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSaveModel}
            disabled={savingModel || selectedModel === settings?.model}
          >
            {savingModel ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            저장
          </Button>
        </CardContent>
      </Card>

      {/* 환경변수 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">환경변수 상태</CardTitle>
          <CardDescription>
            서버 환경변수에 설정된 API Key 상태를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <code className="text-sm font-mono">OPENAI_API_KEY</code>
            {settings?.hasEnvKey ? (
              <Badge className="bg-green-600 hover:bg-green-600 text-white">
                설정됨
              </Badge>
            ) : (
              <Badge variant="destructive">미설정</Badge>
            )}
          </div>

          {settings?.hasApiKey && settings?.hasEnvKey && (
            <div className="flex items-start gap-2 rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>DB에 등록된 Key가 환경변수보다 우선 사용됩니다.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
