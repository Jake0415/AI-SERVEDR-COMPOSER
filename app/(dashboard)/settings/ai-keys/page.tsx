"use client";

// ============================================================
// AI 설정 페이지 — AIPROWRITER UI 패턴 기반 전면 재설계
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Bot, Sparkles, Check, Loader2, Key, Shield } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ── 타입 정의 ──────────────────────────────────────────────

type Provider = "openai" | "claude";

interface AiSettings {
  provider: Provider;
  openaiModel: string;
  claudeModel: string;
  hasOpenaiKey: boolean;
  hasClaudeKey: boolean;
  hasOpenaiEnvKey: boolean;
  hasClaudeEnvKey: boolean;
  openaiKeyMasked: string | null;
  claudeKeyMasked: string | null;
}

// ── 모델 옵션 ──────────────────────────────────────────────

const CLAUDE_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"];

// ── 메인 컴포넌트 ──────────────────────────────────────────

export default function AiKeysPage() {
  const [settings, setSettings] = useState<AiSettings>({
    provider: "openai",
    openaiModel: "gpt-4o",
    claudeModel: "claude-sonnet-4-6",
    hasOpenaiKey: false,
    hasClaudeKey: false,
    hasOpenaiEnvKey: false,
    hasClaudeEnvKey: false,
    openaiKeyMasked: null,
    claudeKeyMasked: null,
  });
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingClaude, setTestingClaude] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── 설정 불러오기 ────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (!res.ok) throw new Error("설정을 불러오는데 실패했습니다.");
      const json = await res.json();
      const data = json.data ?? json;
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      toast.error("AI 설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── 프로바이더 + 모델 저장 ─────────────────────────────

  const handleSaveProviderModel = async (updates: Partial<AiSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: next.provider,
          openaiModel: next.openaiModel,
          claudeModel: next.claudeModel,
        }),
      });
      if (!res.ok) throw new Error("설정 저장에 실패했습니다.");
      toast.success("설정이 저장되었습니다.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "설정 저장에 실패했습니다.");
      await fetchSettings();
    }
  };

  // ── API Key 저장 ───────────────────────────────────────

  const handleSaveKeys = async () => {
    if (!openaiKey.trim() && !claudeKey.trim()) {
      toast.error("저장할 API Key를 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (openaiKey.trim()) body.openaiApiKey = openaiKey.trim();
      if (claudeKey.trim()) body.claudeApiKey = claudeKey.trim();
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Key 저장에 실패했습니다.");
      toast.success("API Key가 저장되었습니다.");
      setOpenaiKey("");
      setClaudeKey("");
      await fetchSettings();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Key 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // ── 연결 테스트 ────────────────────────────────────────

  const handleTest = async (provider: Provider) => {
    const setTesting = provider === "claude" ? setTestingClaude : setTestingOpenai;
    setTesting(true);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "연결 테스트에 실패했습니다.");
      const label = provider === "claude" ? "Claude" : "OpenAI";
      toast.success(`${label} 연결 테스트 성공!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "연결 테스트에 실패했습니다.");
    } finally {
      setTesting(false);
    }
  };

  // ── 로딩 ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── 유틸: 키 상태 Badge ────────────────────────────────

  const keyBadge = (hasKey: boolean) =>
    hasKey ? (
      <Badge className="bg-green-600 hover:bg-green-600 text-white">API 키 설정됨</Badge>
    ) : (
      <Badge variant="destructive">미설정</Badge>
    );

  // ── 렌더링 ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">AI 설정</h1>
        <p className="text-muted-foreground">
          AI 프로바이더, 모델, API Key를 설정합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로바이더 선택</CardTitle>
          <CardDescription>사용할 AI 프로바이더를 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── 섹션 1: 프로바이더 선택 ─────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Claude 카드 */}
            <button
              type="button"
              onClick={() => handleSaveProviderModel({ provider: "claude" })}
              className={`relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                settings.provider === "claude"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              {settings.provider === "claude" && (
                <Check className="absolute right-3 top-3 h-5 w-5 text-primary" />
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Claude (Anthropic)</span>
                  {keyBadge(settings.hasClaudeKey || settings.hasClaudeEnvKey)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Claude Sonnet 4.6 기반, 한국어 이해도와 구조화된 JSON 출력에 강점.
              </p>
            </button>

            {/* GPT 카드 */}
            <button
              type="button"
              onClick={() => handleSaveProviderModel({ provider: "openai" })}
              className={`relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                settings.provider === "openai"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              {settings.provider === "openai" && (
                <Check className="absolute right-3 top-3 h-5 w-5 text-primary" />
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">GPT (OpenAI)</span>
                  {keyBadge(settings.hasOpenaiKey || settings.hasOpenaiEnvKey)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                GPT-4o 기반, 빠른 응답 속도, 비용 효율적.
              </p>
            </button>
          </div>

          {/* ── 섹션 2: 모델 선택 ──────────────────────── */}
          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">모델 선택</h3>

            {/* Claude 모델 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Claude (Anthropic)</Label>
                {settings.provider === "claude" && (
                  <Badge variant="outline" className="text-xs">활성</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CLAUDE_MODELS.map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={settings.claudeModel === m ? "default" : "outline"}
                    onClick={() => handleSaveProviderModel({ claudeModel: m })}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            {/* OpenAI 모델 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">GPT (OpenAI)</Label>
                {settings.provider === "openai" && (
                  <Badge variant="outline" className="text-xs">활성</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {OPENAI_MODELS.map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={settings.openaiModel === m ? "default" : "outline"}
                    onClick={() => handleSaveProviderModel({ openaiModel: m })}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 섹션 3: API 키 관리 ────────────────────── */}
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">API 키 관리</h3>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              API 키는 AES-256-GCM으로 암호화되어 DB에 저장됩니다.
            </p>

            {/* Claude API Key */}
            <div className="space-y-2">
              <Label htmlFor="claude-key">Claude API Key</Label>
              {settings.claudeKeyMasked && (
                <p className="text-xs font-mono text-muted-foreground">
                  현재: {settings.claudeKeyMasked}
                </p>
              )}
              <Input
                id="claude-key"
                type="password"
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              {settings.openaiKeyMasked && (
                <p className="text-xs font-mono text-muted-foreground">
                  현재: {settings.openaiKeyMasked}
                </p>
              )}
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                autoComplete="off"
              />
            </div>

            <Button onClick={handleSaveKeys} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              키 저장
            </Button>
          </div>

          {/* ── 섹션 4: 연결 테스트 ────────────────────── */}
          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">연결 테스트</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleTest("claude")}
                disabled={testingClaude || (!settings.hasClaudeKey && !settings.hasClaudeEnvKey)}
              >
                {testingClaude ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                Claude 연결 테스트
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTest("openai")}
                disabled={testingOpenai || (!settings.hasOpenaiKey && !settings.hasOpenaiEnvKey)}
              >
                {testingOpenai ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                OpenAI 연결 테스트
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
