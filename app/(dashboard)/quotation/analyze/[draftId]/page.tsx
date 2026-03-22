"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, FileText, Save, Search, ArrowLeft, Cpu, Package, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/* ── 타입 정의 ── */

interface DraftQuotation {
  id: string;
  rfpId: string | null;
  customerId: string;
  customerName?: string;
  quotationNumber: string;
  source: "rfp" | "excel" | "chat" | string | null;
  sourceData: unknown;
  status: string;
}

interface RfpDetail {
  id: string;
  fileName: string;
  status: string;
  parsedRequirements: unknown;
}

interface EquipmentItem {
  ecr_id?: string;
  category?: string;
  name?: string;
  quantity?: number;
  purpose?: string;
  requirements?: Record<string, unknown>;
  [key: string]: unknown;
}

interface MatchResult {
  equipment_name?: string;
  matched_parts?: MatchedPart[];
  matched_equipment?: unknown[];
  [key: string]: unknown;
}

interface MatchedPart {
  modelName?: string;
  manufacturer?: string;
  supplyPrice?: number;
  [key: string]: unknown;
}

/* ── 소스 라벨 매핑 ── */
const SOURCE_LABELS: Record<string, string> = {
  rfp: "RFP 기반",
  excel: "엑셀 업로드",
  chat: "AI 대화",
};

/* ── Pretty 값 렌더링 유틸 ── */
function pretty(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  const o = val as Record<string, unknown>;
  if (o.description) return String(o.description);
  if (Array.isArray(val)) {
    return (val as Record<string, unknown>[])
      .map((item) => {
        if (typeof item === "string") return item;
        const i = item as Record<string, unknown>;
        if (i.description) return String(i.description);
        if (i.speed && i.count) return `${String(i.speed)} x${String(i.count)}`;
        if (i.type && i.ports) return `${String(i.speed ?? "")} ${String(i.type)} x${String(i.ports)}`;
        return JSON.stringify(item);
      })
      .join(", ");
  }
  if (o.name) return String(o.name);
  return JSON.stringify(val);
}

/* ── 장비 목록 추출 헬퍼 ── */
function extractEquipmentList(data: unknown): EquipmentItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as EquipmentItem[];
  const obj = data as Record<string, unknown>;
  return (
    (obj.equipment_list as EquipmentItem[]) ??
    (obj.configs as EquipmentItem[]) ??
    []
  );
}

/* ══════════════════════════════════════════════════════════════
   AnalyzePage — /quotation/analyze/[draftId]
   ══════════════════════════════════════════════════════════════ */

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  /* ── 상태 ── */
  const [draft, setDraft] = useState<DraftQuotation | null>(null);
  const [rfp, setRfp] = useState<RfpDetail | null>(null);
  const [parsedData, setParsedData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);

  const [activeTab, setActiveTab] = useState("analysis");
  const [analyzing, setAnalyzing] = useState(false);

  /* ── 데이터 로드 ── */
  const fetchData = useCallback(async () => {
    try {
      // 1. draft quotation 조회
      const draftRes = await fetch(`/api/quotation/${draftId}`);
      const draftJson = await draftRes.json();
      if (!draftJson.success || !draftJson.data) {
        setLoading(false);
        return;
      }
      const draftData = draftJson.data as DraftQuotation;
      setDraft(draftData);

      // 2. source에 따라 분기
      if (draftData.rfpId) {
        // RFP 기반: rfp에서 parsedRequirements 로드
        const rfpRes = await fetch(`/api/rfp/${draftData.rfpId}`);
        const rfpJson = await rfpRes.json();
        if (rfpJson.success && rfpJson.data) {
          const rfpData = rfpJson.data as RfpDetail;
          setRfp(rfpData);
          setParsedData(rfpData.parsedRequirements);
          setJsonText(JSON.stringify(rfpData.parsedRequirements, null, 2));
        }
      } else if (draftData.sourceData) {
        // 엑셀/AI: sourceData에서 직접 로드
        setParsedData(draftData.sourceData);
        setJsonText(JSON.stringify(draftData.sourceData, null, 2));
      }
    } catch {
      // fetch error
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── JSON 저장 ── */
  const handleSaveJson = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setJsonError("유효하지 않은 JSON 형식입니다.");
      toast.error("JSON 형식이 올바르지 않습니다.");
      return;
    }

    setJsonError(null);
    setSaving(true);
    try {
      if (rfp) {
        // RFP 기반: rfp requirements 업데이트
        const res = await fetch(`/api/rfp/${rfp.id}/requirements`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirements: parsed }),
        });
        if (!res.ok) throw new Error("save failed");
      }
      setParsedData(parsed);
      toast.success("요구사항이 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 장비 매칭 ── */
  const handleMatch = async () => {
    if (!rfp) {
      toast.error("RFP 기반 견적만 매칭이 가능합니다.");
      return;
    }
    setMatching(true);
    try {
      const res = await fetch(`/api/rfp/${rfp.id}/match`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMatches(json.data.matches as MatchResult[]);
        toast.success("장비 매칭이 완료되었습니다.");
      } else {
        toast.error(json.error?.message ?? "매칭에 실패했습니다.");
      }
    } catch {
      toast.error("매칭 중 오류가 발생했습니다.");
    } finally {
      setMatching(false);
    }
  };

  /* ── 로딩 / 에러 ── */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        견적을 찾을 수 없습니다.
      </div>
    );
  }

  /* ── 파생 데이터 ── */
  const sourceLabel = SOURCE_LABELS[draft.source ?? ""] ?? (draft.source ?? "기타");
  const equipmentList = extractEquipmentList(parsedData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedObj = parsedData as Record<string, any> | null;

  return (
    <div className="space-y-6">
      {/* ── 상단 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/quotation")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            견적 허브
          </Button>
          <h2 className="text-2xl font-bold mt-2">견적 분석</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>거래처: {draft.customerName ?? "-"}</span>
            <span>|</span>
            <span>견적번호: {draft.quotationNumber}</span>
            <span>|</span>
            <Badge variant="outline">{sourceLabel}</Badge>
          </div>
        </div>
      </div>

      {/* ── 3탭 구조 ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analysis" className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            장비 분석
          </TabsTrigger>
          <TabsTrigger value="matching" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            장비 매칭
          </TabsTrigger>
          <TabsTrigger value="finalize" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            견적 확정
          </TabsTrigger>
        </TabsList>

        {/* ═══ 탭 1: 장비 분석 ═══ */}
        <TabsContent value="analysis" className="space-y-4">
          {/* RFP 파일 정보 */}
          {rfp && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{rfp.fileName}</span>
              <Badge variant={rfp.status === "parsed" ? "default" : "secondary"}>
                {rfp.status}
              </Badge>
            </div>
          )}

          {/* 내부 Pretty/JSON 탭 */}
          <Tabs defaultValue="pretty">
            <TabsList>
              <TabsTrigger value="pretty">요약 보기</TabsTrigger>
              <TabsTrigger value="json">JSON 편집</TabsTrigger>
            </TabsList>

            {/* 요약 보기 */}
            <TabsContent value="pretty" className="space-y-4">
              {/* 프로젝트 정보 */}
              {parsedObj && !Array.isArray(parsedObj) && parsedObj.project_name ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">프로젝트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{String(parsedObj.project_name)}</p>
                    <p className="text-sm text-muted-foreground">
                      총 {String(parsedObj.total_equipment_count ?? equipmentList.length)}개 장비
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* 공통 요건 */}
              {parsedObj && !Array.isArray(parsedObj) && parsedObj.common_requirements && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">공통 요건</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    {Object.entries(parsedObj.common_requirements as Record<string, unknown>).map(
                      ([k, v]) => {
                        if (!v || (Array.isArray(v) && v.length === 0)) return null;
                        const label: Record<string, string> = {
                          server_type: "서버 타입",
                          processor: "프로세서",
                          memory_spec: "메모리",
                          disk_spec: "디스크",
                          network_base: "네트워크",
                          raid: "RAID",
                          power: "전원",
                          management: "관리",
                          security: "보안",
                          warranty_years: "보증(년)",
                          recommended_vendors: "권고 제조사",
                          constraints: "제약사항",
                          notes: "기타",
                        };
                        const display = Array.isArray(v) ? (v as string[]).join(", ") : String(v);
                        return (
                          <p key={k}>
                            <span className="font-medium text-foreground">{label[k] ?? k}:</span>{" "}
                            {display}
                          </p>
                        );
                      },
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 장비 목록 */}
              {equipmentList.length > 0 ? (
                <div className="grid gap-3">
                  {equipmentList.map((equip, idx) => {
                    const key = equip.ecr_id ? `${String(equip.ecr_id)}-${idx}` : String(idx);
                    const req = equip.requirements as Record<string, unknown> | null;
                    return (
                      <Card key={key}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{String(equip.category ?? "기타")}</Badge>
                              <span className="font-medium">
                                {String(equip.name ?? `장비 ${idx + 1}`)}
                              </span>
                            </div>
                            <Badge variant="secondary">x{String(equip.quantity ?? 1)}</Badge>
                          </div>
                          {equip.purpose && (
                            <p className="text-sm text-muted-foreground mb-2">
                              용도: {String(equip.purpose)}
                            </p>
                          )}

                          {req && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {req.cpu ? (
                                <p>
                                  <span className="font-medium">CPU:</span> {pretty(req.cpu)}
                                </p>
                              ) : null}
                              {req.memory ? (
                                <p>
                                  <span className="font-medium">메모리:</span> {pretty(req.memory)}
                                </p>
                              ) : null}
                              {req.storage ? (
                                <p>
                                  <span className="font-medium">스토리지:</span>{" "}
                                  {pretty(req.storage)}
                                </p>
                              ) : null}
                              {req.network ? (
                                <p>
                                  <span className="font-medium">네트워크:</span>{" "}
                                  {pretty(req.network)}
                                </p>
                              ) : null}
                              {req.hba ? (
                                <p>
                                  <span className="font-medium">HBA:</span> {pretty(req.hba)}
                                </p>
                              ) : null}
                              {req.power ? (
                                <p>
                                  <span className="font-medium">전원:</span> {pretty(req.power)}
                                </p>
                              ) : null}
                              {req.os ? (
                                <p>
                                  <span className="font-medium">OS:</span> {pretty(req.os)}
                                </p>
                              ) : null}
                              {req.form_factor ? (
                                <p>
                                  <span className="font-medium">폼팩터:</span>{" "}
                                  {pretty(req.form_factor)}
                                </p>
                              ) : null}

                              {/* 스토리지 capacity */}
                              {req.capacity
                                ? (() => {
                                    const cap = req.capacity as Record<string, unknown>;
                                    const capDesc: string = cap.description
                                      ? String(cap.description).substring(0, 200)
                                      : `${String(cap.usable_tb ?? "?")}TB, ${String(cap.controller ?? "")}, Cache ${String(cap.cache_gb ?? "?")}GB, ${String(cap.drive_type ?? "")}`;
                                    return (
                                      <div className="mt-1 pt-1 border-t">
                                        <p className="font-medium text-foreground">
                                          용량/컨트롤러:
                                        </p>
                                        <p>{capDesc}</p>
                                      </div>
                                    );
                                  })()
                                : null}

                              {/* custom_specs */}
                              {req.custom_specs && typeof req.custom_specs === "object"
                                ? (() => {
                                    const specs = req.custom_specs as Record<string, unknown>;
                                    return (
                                      <div className="mt-1 pt-1 border-t">
                                        <p className="font-medium text-foreground">상세 스펙:</p>
                                        {Object.entries(specs).map(([k, v]) => {
                                          if (
                                            !v ||
                                            (Array.isArray(v) && (v as unknown[]).length === 0) ||
                                            v === ""
                                          )
                                            return null;
                                          let d: string;
                                          if (Array.isArray(v)) {
                                            d = (v as unknown[])
                                              .map((item) => {
                                                if (typeof item === "string") return item;
                                                const o = item as Record<string, unknown>;
                                                if (o.speed && o.count)
                                                  return `${String(o.speed)} x${String(o.count)}`;
                                                if (o.lcd_size)
                                                  return `LCD ${String(o.lcd_size)}, KVM ${String(o.kvm_ports ?? "")}포트`;
                                                return String(item);
                                              })
                                              .join(", ");
                                          } else if (typeof v === "object") {
                                            const o = v as Record<string, unknown>;
                                            if (o.lcd_size)
                                              d = `LCD ${String(o.lcd_size)}, KVM ${String(o.kvm_ports ?? "")}포트, USB ${String(o.usb_adapters ?? "")}EA`;
                                            else
                                              d = Object.entries(o)
                                                .map(([sk, sv]) => `${sk}: ${String(sv)}`)
                                                .join(", ");
                                          } else {
                                            d = String(v);
                                          }
                                          return (
                                            <p key={k}>
                                              <span className="font-medium">{k}:</span> {d}
                                            </p>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()
                                : null}

                              {/* 제약사항/권장사항 */}
                              {Array.isArray(req.constraints) &&
                              (req.constraints as string[]).length > 0 ? (
                                <p className="mt-1 text-destructive">
                                  <span className="font-medium">제약:</span>{" "}
                                  {(req.constraints as string[]).join(", ")}
                                </p>
                              ) : null}
                              {Array.isArray(req.recommendations) &&
                              (req.recommendations as string[]).length > 0 ? (
                                <p className="mt-1 text-blue-600">
                                  <span className="font-medium">권장:</span>{" "}
                                  {(req.recommendations as string[]).join(", ")}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">RFP 문서에서 장비 요구사항을 분석합니다</p>
                    <p className="text-sm text-muted-foreground">
                      분석은 2단계로 진행됩니다: 1차 장비 목록 추출 → 2차 장비별 상세 스펙 추출
                    </p>
                    <p className="text-xs text-muted-foreground">
                      약 30초~2분 소요됩니다.
                    </p>
                  </div>
                  {rfp && (
                    <Button
                      size="lg"
                      onClick={async () => {
                        setAnalyzing(true);
                        try {
                          const res = await fetch(`/api/rfp/${rfp.id}/analyze`, { method: "POST" });
                          const json = await res.json();
                          if (json.success) {
                            toast.success(`${json.data?.config_count ?? 0}개 장비가 추출되었습니다.`);
                            await fetchData();
                          } else {
                            toast.error(json.error?.message ?? "분석에 실패했습니다.");
                          }
                        } catch {
                          toast.error("AI 분석 중 오류가 발생했습니다.");
                        } finally {
                          setAnalyzing(false);
                        }
                      }}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI 분석 진행 중...</>
                      ) : (
                        <><Cpu className="h-4 w-4 mr-2" />AI 분석 시작</>
                      )}
                    </Button>
                  )}
                  {!rfp && (
                    <p className="text-sm text-muted-foreground">연결된 RFP 문서가 없습니다.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* JSON 편집 */}
            <TabsContent value="json" className="space-y-4">
              <textarea
                className={`w-full h-96 font-mono text-sm p-4 border rounded-lg bg-muted/30 resize-y ${
                  jsonError ? "border-destructive" : ""
                }`}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                }}
              />
              {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
              <Button onClick={handleSaveJson} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ 탭 2: 장비 매칭 ═══ */}
        <TabsContent value="matching" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">장비 매칭</h3>
              <p className="text-sm text-muted-foreground">
                분석된 장비 요구사항을 기반으로 적합한 부품/제품을 매칭합니다.
              </p>
            </div>
            <Button onClick={handleMatch} disabled={matching || !parsedData}>
              {matching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  매칭 중...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  매칭 실행
                </>
              )}
            </Button>
          </div>

          {/* 매칭 결과 */}
          {matches ? (
            <div className="space-y-4">
              {matches.map((m, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{String(m.equipment_name)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      서버 파트 {(m.matched_parts ?? []).length}건 / IT 장비{" "}
                      {(m.matched_equipment ?? []).length}건
                    </p>
                    <div className="text-xs space-y-1">
                      {(m.matched_parts ?? []).slice(0, 3).map((p, pi) => (
                        <div key={pi} className="flex justify-between border-b pb-1">
                          <span>
                            {String(p.modelName)} ({String(p.manufacturer)})
                          </span>
                          <span>
                            {p.supplyPrice
                              ? `${Number(p.supplyPrice).toLocaleString()}원`
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                매칭 실행 버튼을 클릭하여 장비 매칭을 시작하세요.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══ 탭 3: 견적 확정 ═══ */}
        <TabsContent value="finalize" className="space-y-4">
          <div className="border rounded-lg p-12 text-center">
            <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">견적 확정</h3>
            <p className="text-sm text-muted-foreground">
              이 기능은 현재 준비 중입니다. 향후 3가지 견적 타입(최저가/권장/프리미엄) 선택 기능이 제공됩니다.
            </p>
            <Button variant="outline" className="mt-4" disabled>
              준비 중
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
