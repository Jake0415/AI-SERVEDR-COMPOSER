"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Zap, Hash, Clock } from "lucide-react";

interface UsageSummary {
  total_calls: string;
  total_prompt_tokens: string;
  total_completion_tokens: string;
  total_tokens: string;
  total_cost: string;
  avg_latency: string;
}

interface ModelUsage {
  model_name: string;
  calls: string;
  tokens: string;
  cost: string;
}

interface PromptUsage {
  prompt_slug: string;
  calls: string;
  tokens: string;
}

export default function AIUsagePage() {
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [byModel, setByModel] = useState<ModelUsage[]>([]);
  const [byPrompt, setByPrompt] = useState<PromptUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-usage?period=${period}`);
      const json = await res.json();
      if (json.success) {
        setSummary(json.data.summary);
        setByModel(json.data.byModel);
        setByPrompt(json.data.byPrompt);
      }
    } catch {
      console.error("Failed to fetch AI usage");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (val: string | number) => Number(val).toLocaleString();
  const formatCost = (val: string | number) => `$${Number(val).toFixed(4)}`;

  const promptNames: Record<string, string> = {
    "rfp-analyzer": "RFP 분석",
    "chat-quotation": "대화형 견적",
    "recommendation": "추천 설명",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI 사용량</h2>
          <p className="text-muted-foreground">LLM API 호출 현황 및 비용을 확인합니다.</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="day">오늘</TabsTrigger>
            <TabsTrigger value="week">이번 주</TabsTrigger>
            <TabsTrigger value="month">이번 달</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : summary ? (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">총 호출</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatNumber(summary.total_calls)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">총 토큰</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatNumber(summary.total_tokens)}</p>
                <p className="text-xs text-muted-foreground">
                  입력 {formatNumber(summary.total_prompt_tokens)} / 출력 {formatNumber(summary.total_completion_tokens)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">추정 비용</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCost(summary.total_cost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round(Number(summary.avg_latency))}ms</p>
              </CardContent>
            </Card>
          </div>

          {/* 모델별 / 프롬프트별 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">모델별 사용량</CardTitle>
              </CardHeader>
              <CardContent>
                {byModel.length === 0 ? (
                  <p className="text-sm text-muted-foreground">데이터 없음</p>
                ) : (
                  <div className="space-y-3">
                    {byModel.map((m) => (
                      <div key={m.model_name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{m.model_name}</Badge>
                          <span className="text-sm text-muted-foreground">{formatNumber(m.calls)}회</span>
                        </div>
                        <span className="text-sm font-medium">{formatCost(m.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">프롬프트별 호출</CardTitle>
              </CardHeader>
              <CardContent>
                {byPrompt.length === 0 ? (
                  <p className="text-sm text-muted-foreground">데이터 없음</p>
                ) : (
                  <div className="space-y-3">
                    {byPrompt.map((p) => (
                      <div key={p.prompt_slug} className="flex items-center justify-between">
                        <span className="text-sm">{promptNames[p.prompt_slug] ?? p.prompt_slug}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{formatNumber(p.tokens)} 토큰</span>
                          <Badge variant="outline">{formatNumber(p.calls)}회</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
