"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, FileText, Save, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

export default function RfpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;

  const [rfp, setRfp] = useState<RfpDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);

  const fetchRfp = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfp/${rfpId}`);
      const json = await res.json();
      if (json.success) {
        setRfp(json.data);
        setJsonText(JSON.stringify(json.data.parsedRequirements, null, 2));
      }
    } catch {
      /* fetch error — keep loading false */
    } finally {
      setLoading(false);
    }
  }, [rfpId]);

  useEffect(() => {
    fetchRfp();
  }, [fetchRfp]);

  /** JSON 저장 */
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
      const res = await fetch(`/api/rfp/${rfpId}/requirements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: parsed }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("요구사항이 저장되었습니다.");
      await fetchRfp();
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /** 장비 매칭 실행 */
  const handleMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch(`/api/rfp/${rfpId}/match`, { method: "POST" });
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

  /* ── 로딩 / 에러 상태 ── */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        RFP를 찾을 수 없습니다.
      </div>
    );
  }

  /* ── equipment_list 추출 ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = rfp.parsedRequirements as Record<string, any> | null;
  const equipmentList: EquipmentItem[] = parsed
    ? Array.isArray(parsed)
      ? (parsed as EquipmentItem[])
      : ((parsed.equipment_list as EquipmentItem[]) ??
        (parsed.configs as EquipmentItem[]) ??
        [])
    : [];

  return (
    <div className="space-y-6">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로
          </Button>
          <h2 className="text-2xl font-bold mt-2">RFP 분석 결과</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {rfp.fileName}
            <Badge
              variant={rfp.status === "parsed" ? "default" : "secondary"}
            >
              {rfp.status}
            </Badge>
          </p>
        </div>
        <Button
          onClick={handleMatch}
          disabled={matching || !rfp.parsedRequirements}
        >
          {matching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              매칭 중...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              장비 매칭 실행
            </>
          )}
        </Button>
      </div>

      {/* ── 탭: 요약 / JSON ── */}
      <Tabs defaultValue="pretty">
        <TabsList>
          <TabsTrigger value="pretty">요약 보기</TabsTrigger>
          <TabsTrigger value="json">JSON 편집</TabsTrigger>
        </TabsList>

        {/* 요약 보기 */}
        <TabsContent value="pretty" className="space-y-4">
          {/* 프로젝트 정보 */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(parsed && !Array.isArray(parsed) && (parsed as Record<string, string>).project_name) ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">프로젝트</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{String(parsed.project_name)}</p>
                <p className="text-sm text-muted-foreground">
                  총{" "}
                  {String(parsed.total_equipment_count ?? equipmentList.length)}
                  개 장비
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* 공통 요건 */}
          {parsed && !Array.isArray(parsed) && parsed.common_requirements && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">공통 요건</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {Object.entries(parsed.common_requirements as Record<string, unknown>).map(([k, v]) => {
                  if (!v || (Array.isArray(v) && v.length === 0)) return null;
                  const label: Record<string, string> = { server_type: "서버 타입", processor: "프로세서", memory_spec: "메모리", disk_spec: "디스크", network_base: "네트워크", raid: "RAID", power: "전원", management: "관리", security: "보안", warranty_years: "보증(년)", recommended_vendors: "권고 제조사", constraints: "제약사항", notes: "기타" };
                  const display = Array.isArray(v) ? (v as string[]).join(", ") : String(v);
                  return <p key={k}><span className="font-medium text-foreground">{label[k] ?? k}:</span> {display}</p>;
                })}
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
                          <span className="font-medium">{String(equip.name ?? `장비 ${idx + 1}`)}</span>
                        </div>
                        <Badge variant="secondary">x{String(equip.quantity ?? 1)}</Badge>
                      </div>
                      {equip.purpose && <p className="text-sm text-muted-foreground mb-2">용도: {String(equip.purpose)}</p>}

                      {req && (() => {
                        const desc = (obj: unknown): string => {
                          if (!obj) return "";
                          const o = obj as Record<string, unknown>;
                          return o.description ? String(o.description) : JSON.stringify(obj);
                        };
                        const netDesc = (arr: unknown): string => {
                          if (!Array.isArray(arr)) return JSON.stringify(arr);
                          return (arr as Record<string, unknown>[]).map(n => n.description ? String(n.description) : `${String(n.speed ?? "")} ${String(n.type ?? "")} x${String(n.ports ?? "")}`).join(", ");
                        };
                        return (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {req.cpu ? <p><span className="font-medium">CPU:</span> {desc(req.cpu)}</p> : null}
                          {req.memory ? <p><span className="font-medium">메모리:</span> {desc(req.memory)}</p> : null}
                          {req.storage ? <p><span className="font-medium">스토리지:</span> {Array.isArray(req.storage) ? (req.storage as Record<string,unknown>[]).map(s => s.description ? String(s.description) : JSON.stringify(s)).join(", ") : JSON.stringify(req.storage)}</p> : null}
                          {req.network ? <p><span className="font-medium">네트워크:</span> {netDesc(req.network)}</p> : null}
                          {req.hba ? <p><span className="font-medium">HBA:</span> {desc(req.hba)}</p> : null}
                          {req.power ? <p><span className="font-medium">전원:</span> {desc(req.power)}</p> : null}
                          {req.os ? <p><span className="font-medium">OS:</span> {String(req.os as string)}</p> : null}
                          {req.form_factor ? <p><span className="font-medium">폼팩터:</span> {String(req.form_factor as string)}</p> : null}

                          {/* 스토리지 capacity */}
                          {req.capacity ? (() => {
                            const cap = req.capacity as Record<string,unknown>;
                            const capDesc: string = cap.description ? String(cap.description).substring(0, 200) : `${String(cap.usable_tb ?? "?")}TB, ${String(cap.controller ?? "")}, Cache ${String(cap.cache_gb ?? "?")}GB, ${String(cap.drive_type ?? "")}`;
                            return (
                              <div className="mt-1 pt-1 border-t">
                                <p className="font-medium text-foreground">용량/컨트롤러:</p>
                                <p>{capDesc}</p>
                              </div>
                            );
                          })() : null}

                          {/* custom_specs */}
                          {req.custom_specs && typeof req.custom_specs === "object" ? (() => {
                            const specs = req.custom_specs as Record<string, unknown>;
                            return (
                              <div className="mt-1 pt-1 border-t">
                                <p className="font-medium text-foreground">상세 스펙:</p>
                                {Object.entries(specs).map(([k, v]) => {
                                  if (!v || (Array.isArray(v) && (v as unknown[]).length === 0) || v === "") return null;
                                  const d: string = Array.isArray(v) ? (v as unknown[]).map(String).join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
                                  return <p key={k}><span className="font-medium">{k}:</span> {d}</p>;
                                })}
                              </div>
                            );
                          })() : null}

                          {/* 제약사항/권장사항 */}
                          {Array.isArray(req.constraints) && (req.constraints as string[]).length > 0 ? (
                            <p className="mt-1 text-destructive"><span className="font-medium">제약:</span> {(req.constraints as string[]).join(", ")}</p>
                          ) : null}
                          {Array.isArray(req.recommendations) && (req.recommendations as string[]).length > 0 ? (
                            <p className="mt-1 text-blue-600"><span className="font-medium">권장:</span> {(req.recommendations as string[]).join(", ")}</p>
                          ) : null}
                        </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              분석 결과가 없습니다.
            </p>
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
          {jsonError && (
            <p className="text-sm text-destructive">{jsonError}</p>
          )}
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

      {/* ── 매칭 결과 ── */}
      {matches && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">장비 매칭 결과</h3>
          {matches.map((m, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {String(m.equipment_name)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  서버 파트 {(m.matched_parts ?? []).length}건 / IT 장비{" "}
                  {(m.matched_equipment ?? []).length}건
                </p>
                <div className="text-xs space-y-1">
                  {(m.matched_parts ?? []).slice(0, 3).map((p, pi) => (
                    <div
                      key={pi}
                      className="flex justify-between border-b pb-1"
                    >
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
      )}
    </div>
  );
}
