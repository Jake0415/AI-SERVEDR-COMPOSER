"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  QuotationDraft,
  RecommendationText,
  GenerateQuotationResponse,
} from "@/lib/types";
import type { CompatibilityIssue } from "@/lib/types/compatibility";

/** 금액 포매팅 */
function formatPrice(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** 견적안 탭 내부 컨텐츠 */
function QuotationTabContent({
  draft,
  recommendation,
}: {
  draft: QuotationDraft;
  recommendation: RecommendationText;
}) {
  return (
    <div className="space-y-6">
      {/* AI 추천 설명 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            AI 추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{recommendation.summary}</p>
          {recommendation.pros.length > 0 && (
            <div>
              <p className="font-medium text-green-600">장점</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {recommendation.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.cons.length > 0 && (
            <div>
              <p className="font-medium text-red-600">단점</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {recommendation.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 서버 구성별 부품 테이블 */}
      {draft.configs.map((config, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{config.config_name}</h4>
            <Badge variant="secondary">x{config.quantity}</Badge>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리</TableHead>
                  <TableHead>모델명</TableHead>
                  <TableHead className="text-center">수량</TableHead>
                  <TableHead className="text-right">공급가(원)</TableHead>
                  <TableHead className="text-right">마진율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.parts.map((part, pidx) => {
                  const marginRate =
                    part.unit_supply_price > 0
                      ? (
                          ((part.unit_supply_price - part.unit_cost_price) /
                            part.unit_supply_price) *
                          100
                        ).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow key={pidx}>
                      <TableCell className="text-sm">{part.category}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {part.model_name}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({part.manufacturer})
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatPrice(part.unit_supply_price)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {marginRate}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            소계: 원가 {formatPrice(config.subtotal_cost)}원 / 공급가{" "}
            {formatPrice(config.subtotal_supply)}원 / 마진{" "}
            {formatPrice(config.subtotal_margin)}원 ({config.margin_rate.toFixed(1)}%)
          </div>
        </div>
      ))}

      {/* 하단 요약 */}
      <Separator />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 원가</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_cost)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 공급가</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_supply)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 마진</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_margin)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">마진율</p>
            <p className="text-lg font-bold">{draft.margin_rate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QuotationPage() {
  const searchParams = useSearchParams();
  const rfpId = searchParams.get("rfp_id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateQuotationResponse | null>(null);
  const [warnings, setWarnings] = useState<CompatibilityIssue[]>([]);

  // 견적 생성 요청
  const handleGenerate = useCallback(async () => {
    if (!rfpId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quotation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfp_id: rfpId, customer_id: "" }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message ?? "견적 생성에 실패했습니다.");
        return;
      }

      setResult(json.data);
      setWarnings(json.data.compatibility_warnings ?? []);
    } catch {
      setError("견적 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [rfpId]);

  // rfpId가 있으면 자동 생성 시도
  useEffect(() => {
    if (rfpId && !result && !loading) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId]);

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">견적 생성</h2>
          <p className="text-muted-foreground">
            RFP 기반 3가지 견적안 자동 생성 (수익성 / 규격 충족 / 성능 향상)
          </p>
        </div>
        {rfpId && !loading && (
          <Button onClick={handleGenerate} disabled={loading}>
            견적 재생성
          </Button>
        )}
      </div>

      {/* RFP 미선택 */}
      {!rfpId && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              RFP를 먼저 업로드하세요.{" "}
              <a href="/rfp" className="text-primary underline">
                RFP 업로드 페이지로 이동
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AI가 최적의 부품 조합을 분석하고 있습니다...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 호환성 경고 */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <Badge variant="destructive" className="mr-2">
                  {w.error_level === "block" ? "차단" : "경고"}
                </Badge>
                {w.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 견적 결과 — 3가지 탭 */}
      {result && (
        <Tabs defaultValue="profitability">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profitability">수익성 중심</TabsTrigger>
            <TabsTrigger value="spec_match">규격 충족</TabsTrigger>
            <TabsTrigger value="performance">성능 향상</TabsTrigger>
          </TabsList>

          <TabsContent value="profitability" className="mt-4">
            <QuotationTabContent
              draft={result.quotations.profitability}
              recommendation={result.ai_recommendations.profitability}
            />
          </TabsContent>

          <TabsContent value="spec_match" className="mt-4">
            <QuotationTabContent
              draft={result.quotations.spec_match}
              recommendation={result.ai_recommendations.spec_match}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <QuotationTabContent
              draft={result.quotations.performance}
              recommendation={result.ai_recommendations.performance}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
