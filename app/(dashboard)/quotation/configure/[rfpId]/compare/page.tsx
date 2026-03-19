"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  GenerateQuotationResponse,
  QuotationDraft,
  RecommendationText,
  MatchedPart,
} from "@/lib/types/ai";

// --- 타입 정의 ---

type StrategyKey = "profitability" | "spec_match" | "performance";

interface Customer {
  id: string;
  companyName: string;
  businessNumber: string | null;
}

interface RfpDocument {
  id: string;
  fileName: string;
  status: string;
}

// --- 전략 메타 정보 ---

const STRATEGY_META: Record<
  StrategyKey,
  { label: string; icon: typeof TrendingUp; color: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  profitability: {
    label: "수익성 중심",
    icon: TrendingUp,
    color: "text-emerald-600",
    badgeVariant: "default",
  },
  spec_match: {
    label: "규격 충족",
    icon: Target,
    color: "text-blue-600",
    badgeVariant: "secondary",
  },
  performance: {
    label: "성능 향상",
    icon: Zap,
    color: "text-orange-600",
    badgeVariant: "outline",
  },
};

const STRATEGY_KEYS: StrategyKey[] = ["profitability", "spec_match", "performance"];

// --- 유틸리티 함수 ---

/** 원화 포맷 */
function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

/** 카테고리 한국어 라벨 */
function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    cpu: "CPU",
    motherboard: "메인보드",
    memory: "메모리",
    gpu: "GPU",
    ssd: "SSD",
    hdd: "HDD",
    raid: "RAID 컨트롤러",
    nic: "네트워크 카드",
    hba: "HBA",
    chassis: "섀시",
    psu: "파워서플라이",
  };
  return map[category] ?? category;
}

// --- 메인 컴포넌트 ---

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfpId = params.rfpId as string;
  const customerId = searchParams.get("customer_id") ?? "";

  // 상태
  const [rfpDoc, setRfpDoc] = useState<RfpDocument | null>(null);
  const [generatedData, setGeneratedData] = useState<GenerateQuotationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 견적 확정 Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey | null>(null);

  // 거래처 목록
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // 견적 확정 폼
  const [formCustomerId, setFormCustomerId] = useState(customerId);
  const [formDeliveryTerms, setFormDeliveryTerms] = useState("납품일로부터 2주 이내");
  const [formPaymentTerms, setFormPaymentTerms] = useState("납품 후 30일 이내");
  const [formValidityDays, setFormValidityDays] = useState("30");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // RFP 상세 조회
  const fetchRfpDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfp/${rfpId}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "RFP를 불러올 수 없습니다.");
        return null;
      }
      setRfpDoc(json.data);
      return json.data;
    } catch {
      setError("RFP 조회 중 오류가 발생했습니다.");
      return null;
    }
  }, [rfpId]);

  // 3가지 견적안 생성
  const generateQuotations = useCallback(async () => {
    try {
      const res = await fetch("/api/quotation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfp_id: rfpId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "견적 생성에 실패했습니다.");
        return;
      }
      setGeneratedData(json.data as GenerateQuotationResponse);
    } catch {
      setError("견적 생성 중 오류가 발생했습니다.");
    }
  }, [rfpId]);

  // 거래처 목록 조회
  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data as Customer[]);
      }
    } catch {
      // 조회 실패 시 빈 목록 유지
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // 페이지 로드 시 RFP 조회 → 견적 생성
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      const rfp = await fetchRfpDetail();
      if (rfp) {
        await generateQuotations();
      }
      setLoading(false);
    }
    init();
  }, [fetchRfpDetail, generateQuotations]);

  // "이 견적 선택" 클릭
  const handleSelectStrategy = (strategy: StrategyKey) => {
    setSelectedStrategy(strategy);
    setDialogOpen(true);
    fetchCustomers();
  };

  // 견적 확정 (저장)
  const handleConfirmQuotation = async () => {
    if (!selectedStrategy || !generatedData || !formCustomerId) {
      toast.error("거래처를 선택해주세요.");
      return;
    }

    const draft = generatedData.quotations[selectedStrategy];

    // 견적 항목 변환
    const items: {
      item_type: string;
      part_id: string;
      item_name: string;
      item_spec: string;
      quantity: number;
      unit: string;
      unit_cost_price: number;
      unit_supply_price: number;
      margin_rate: number;
    }[] = [];

    for (const config of draft.configs) {
      for (const part of config.parts) {
        items.push({
          item_type: "hardware",
          part_id: part.part_id,
          item_name: `[${config.config_name}] ${categoryLabel(part.category)} - ${part.model_name}`,
          item_spec: `${part.manufacturer} / ${Object.entries(part.specs).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
          quantity: part.quantity * config.quantity,
          unit: "EA",
          unit_cost_price: part.unit_cost_price,
          unit_supply_price: part.unit_supply_price,
          margin_rate:
            part.unit_supply_price > 0
              ? Math.round(
                  ((part.unit_supply_price - part.unit_cost_price) /
                    part.unit_supply_price) *
                    10000,
                ) / 100
              : 0,
        });
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_id: rfpId,
          customer_id: formCustomerId,
          quotation_type: selectedStrategy,
          items,
          total_cost: draft.total_cost,
          total_supply: draft.total_supply,
          validity_days: Number(formValidityDays) || 30,
          delivery_terms: formDeliveryTerms || null,
          payment_terms: formPaymentTerms || null,
          notes: formNotes || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "견적 저장에 실패했습니다.");
        return;
      }
      toast.success("견적서가 생성되었습니다.");
      router.push("/quotation-history");
    } catch {
      toast.error("견적 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // --- 로딩 상태 ---
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            AI가 3가지 견적안을 생성하고 있습니다...
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // --- 에러 상태 ---
  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/quotation/configure")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          서버 구성으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!generatedData) return null;

  const { quotations, ai_recommendations, compatibility_warnings } = generatedData;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/quotation/configure")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">전략 비교</h2>
          <p className="text-sm text-muted-foreground">
            {rfpDoc?.fileName && (
              <>
                RFP: <span className="font-medium text-foreground">{rfpDoc.fileName}</span>
                {" — "}
              </>
            )}
            3가지 전략의 견적안을 비교하고 최적의 견적을 선택하세요
          </p>
        </div>
      </div>

      {/* 호환성 경고 */}
      {compatibility_warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-3 dark:bg-yellow-950/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              호환성 주의사항
            </span>
          </div>
          <ul className="ml-6 text-xs text-yellow-700 dark:text-yellow-500 list-disc space-y-0.5">
            {compatibility_warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 비교 카드 (3열) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STRATEGY_KEYS.map((key) => {
          const meta = STRATEGY_META[key];
          const draft = quotations[key];
          const rec = ai_recommendations[key];
          const Icon = meta.icon;

          return (
            <CompareCard
              key={key}
              label={meta.label}
              icon={<Icon className={`h-5 w-5 ${meta.color}`} />}
              badgeVariant={meta.badgeVariant}
              draft={draft}
              recommendation={rec}
              onSelect={() => handleSelectStrategy(key)}
            />
          );
        })}
      </div>

      {/* 상세 탭 */}
      <Tabs defaultValue="profitability" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          {STRATEGY_KEYS.map((key) => (
            <TabsTrigger key={key} value={key} className="gap-1.5">
              {STRATEGY_META[key].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STRATEGY_KEYS.map((key) => (
          <TabsContent key={key} value={key} className="space-y-4 mt-4">
            <StrategyDetail
              draft={quotations[key]}
              recommendation={ai_recommendations[key]}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* 견적 확정 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              견적서 생성 — {selectedStrategy ? STRATEGY_META[selectedStrategy].label : ""}
            </DialogTitle>
            <DialogDescription>
              거래처와 조건을 입력한 후 견적서를 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 거래처 선택 */}
            <div className="space-y-2">
              <Label>거래처 *</Label>
              {customersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="거래처를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                        {c.businessNumber ? ` (${c.businessNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 납품조건 */}
            <div className="space-y-2">
              <Label>납품조건</Label>
              <Input
                value={formDeliveryTerms}
                onChange={(e) => setFormDeliveryTerms(e.target.value)}
                placeholder="예: 납품일로부터 2주 이내"
              />
            </div>

            {/* 결제조건 */}
            <div className="space-y-2">
              <Label>결제조건</Label>
              <Input
                value={formPaymentTerms}
                onChange={(e) => setFormPaymentTerms(e.target.value)}
                placeholder="예: 납품 후 30일 이내"
              />
            </div>

            {/* 유효기간 */}
            <div className="space-y-2">
              <Label>유효기간 (일)</Label>
              <Input
                type="number"
                value={formValidityDays}
                onChange={(e) => setFormValidityDays(e.target.value)}
                placeholder="30"
                min={1}
                max={365}
              />
            </div>

            {/* 비고 */}
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="추가 메모 (선택)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmQuotation}
              disabled={saving || !formCustomerId}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  견적서 생성 중...
                </>
              ) : (
                "견적서 생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- 비교 카드 컴포넌트 ---

interface CompareCardProps {
  label: string;
  icon: React.ReactNode;
  badgeVariant: "default" | "secondary" | "outline";
  draft: QuotationDraft;
  recommendation: RecommendationText;
  onSelect: () => void;
}

function CompareCard({
  label,
  icon,
  badgeVariant,
  draft,
  recommendation,
  onSelect,
}: CompareCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          <span>{label}</span>
          <Badge variant={badgeVariant} className="ml-auto text-xs">
            마진 {draft.margin_rate.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {/* 금액 요약 */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 공급가</span>
            <span className="font-semibold">{formatKRW(draft.total_supply)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 원가</span>
            <span>{formatKRW(draft.total_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">마진</span>
            <span className="text-emerald-600 font-medium">
              {formatKRW(draft.total_margin)}
            </span>
          </div>
        </div>

        {/* AI 요약 */}
        <p className="text-xs text-muted-foreground border-t pt-2">
          {recommendation.summary}
        </p>

        {/* 서버 구성 수 */}
        <div className="text-xs text-muted-foreground">
          {draft.configs.length}개 서버 구성 /{" "}
          {draft.configs.reduce(
            (sum, c) => sum + c.parts.length,
            0,
          )}
          개 부품
        </div>

        {/* 선택 버튼 */}
        <Button className="w-full mt-auto" onClick={onSelect}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          이 견적 선택
        </Button>
      </CardContent>
    </Card>
  );
}

// --- 전략 상세 컴포넌트 ---

interface StrategyDetailProps {
  draft: QuotationDraft;
  recommendation: RecommendationText;
}

function StrategyDetail({ draft, recommendation }: StrategyDetailProps) {
  return (
    <div className="space-y-4">
      {/* 서버별 구성 테이블 */}
      {draft.configs.map((config, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>
                {config.config_name}{" "}
                <Badge variant="secondary" className="ml-2">
                  x{config.quantity}대
                </Badge>
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                마진율 {config.margin_rate.toFixed(1)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">부품</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead className="text-center w-[60px]">수량</TableHead>
                  <TableHead className="text-right w-[120px]">단가</TableHead>
                  <TableHead className="text-right w-[120px]">소계</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.parts.map((part: MatchedPart, pidx: number) => (
                  <TableRow key={pidx}>
                    <TableCell className="text-xs font-medium">
                      {categoryLabel(part.category)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{part.model_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {part.manufacturer}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {part.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatKRW(part.unit_supply_price)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatKRW(part.unit_supply_price * part.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 소계 */}
            <div className="flex justify-end gap-6 mt-3 pt-3 border-t text-sm">
              <div>
                <span className="text-muted-foreground">원가 </span>
                <span>{formatKRW(config.subtotal_cost)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">공급가 </span>
                <span className="font-semibold">{formatKRW(config.subtotal_supply)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 합계 */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">총 원가: </span>
              <span>{formatKRW(draft.total_cost)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">총 공급가: </span>
              <span className="text-lg font-bold">{formatKRW(draft.total_supply)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">마진: </span>
              <span className="text-emerald-600 font-semibold">
                {formatKRW(draft.total_margin)} ({draft.margin_rate.toFixed(1)}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 추천 텍스트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            AI 추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{recommendation.summary}</p>

          {recommendation.pros.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-emerald-600 font-medium text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                장점
              </div>
              <ul className="ml-5 list-disc text-xs space-y-0.5 text-muted-foreground">
                {recommendation.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.cons.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-red-500 font-medium text-xs">
                <ThumbsDown className="h-3.5 w-3.5" />
                단점
              </div>
              <ul className="ml-5 list-disc text-xs space-y-0.5 text-muted-foreground">
                {recommendation.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.selling_points.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-blue-600 font-medium text-xs">
                <Lightbulb className="h-3.5 w-3.5" />
                제안 포인트
              </div>
              <ul className="ml-5 list-disc text-xs space-y-0.5 text-muted-foreground">
                {recommendation.selling_points.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
