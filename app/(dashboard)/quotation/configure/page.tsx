"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  MonitorSpeaker,
  Loader2,
  ArrowLeft,
  Wand2,
  Wrench,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { ParsedServerConfig } from "@/lib/types";

/** RFP 문서 데이터 */
interface RfpDocument {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  parsedRequirements: ParsedServerConfig[] | null;
}

/** RFP 목록 항목 (선택 화면용) */
interface RfpListItem {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  parsedRequirements: ParsedServerConfig[] | null;
}

/** 서버 카드별 구성 상태 */
type ConfigStatus = "pending" | "configured";

export default function ConfigurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rfpId = searchParams.get("rfp_id");
  const customerId = searchParams.get("customer_id") ?? "";

  // RFP 상세 데이터
  const [rfpDoc, setRfpDoc] = useState<RfpDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RFP 목록 (rfp_id 없을 때)
  const [rfpList, setRfpList] = useState<RfpListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // 각 서버 구성 상태 (인덱스 → 상태)
  const [configStatuses, setConfigStatuses] = useState<
    Record<number, ConfigStatus>
  >({});

  // RFP 상세 조회
  const fetchRfpDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/${id}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "RFP를 불러올 수 없습니다.");
        return;
      }
      setRfpDoc(json.data);
    } catch {
      setError("RFP 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // RFP 목록 조회
  const fetchRfpList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/rfp");
      const json = await res.json();
      if (json.success) {
        // 파싱 완료된 RFP만 필터링
        const parsed = (json.data as RfpListItem[]).filter(
          (r) => r.status === "parsed" && r.parsedRequirements
        );
        setRfpList(parsed);
      }
    } catch {
      // 조회 실패 시 빈 목록 유지
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rfpId) {
      fetchRfpDetail(rfpId);
    } else {
      fetchRfpList();
    }
  }, [rfpId, fetchRfpDetail, fetchRfpList]);

  // RFP 선택 → URL 갱신
  const handleSelectRfp = (id: string) => {
    router.push(`/quotation/configure?rfp_id=${id}&customer_id=${customerId}`);
  };

  // 자동 구성 → 위저드로 이동 (auto 모드)
  const handleAutoConfig = (configIndex: number) => {
    router.push(`/quotation/configure/${rfpId}/${configIndex}?mode=auto&customer_id=${customerId}`);
  };

  // 수동 구성 → 위저드로 이동 (manual 모드)
  const handleManualConfig = (configIndex: number) => {
    router.push(`/quotation/configure/${rfpId}/${configIndex}?mode=manual&customer_id=${customerId}`);
  };

  // ─── rfp_id 없을 때: RFP 선택 화면 ───
  if (!rfpId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">서버 구성</h2>
          <p className="text-muted-foreground">
            서버를 구성할 RFP를 선택하세요. 파싱 완료된 RFP만 표시됩니다.
          </p>
        </div>

        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : rfpList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground">
                파싱 완료된 RFP가 없습니다.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/rfp")}
              >
                RFP 업로드하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rfpList.map((rfp) => {
              const configCount = rfp.parsedRequirements?.length ?? 0;
              return (
                <Card
                  key={rfp.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleSelectRfp(rfp.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 shrink-0" />
                      {rfp.fileName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {new Date(rfp.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                      <Badge variant="secondary">
                        {configCount}개 서버 구성
                      </Badge>
                    </div>
                    <Button size="sm" className="w-full">
                      이 RFP로 서버 구성
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── rfp_id 있을 때: 서버 구성 카드 표시 ───

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/quotation/configure")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          RFP 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!rfpDoc) {
    return null;
  }

  const configs = rfpDoc.parsedRequirements ?? [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/quotation/configure")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">서버 구성</h2>
          </div>
          <p className="text-muted-foreground ml-10">
            RFP: <span className="font-medium text-foreground">{rfpDoc.fileName}</span>
            {" "}({configs.length}개 서버 구성)
          </p>
        </div>
        <Button
          onClick={() => router.push(`/quotation/configure/${rfpId}/compare?customer_id=${customerId}`)}
        >
          견적 비교 및 확정
        </Button>
      </div>

      <Separator />

      {/* 서버 구성 카드 그리드 */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground">
              이 RFP에서 추출된 서버 구성이 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.map((config, idx) => {
            const status = configStatuses[idx] ?? "pending";
            return (
              <ServerConfigCard
                key={idx}
                config={config}
                index={idx}
                status={status}
                onAutoConfig={() => handleAutoConfig(idx)}
                onManualConfig={() => handleManualConfig(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 서버 구성 카드 컴포넌트 ───

interface ServerConfigCardProps {
  config: ParsedServerConfig;
  index: number;
  status: ConfigStatus;
  onAutoConfig: () => void;
  onManualConfig: () => void;
}

function ServerConfigCard({
  config,
  index,
  status,
  onAutoConfig,
  onManualConfig,
}: ServerConfigCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-5 w-5 text-primary" />
          <span className="flex-1">{config.config_name}</span>
          <Badge variant="secondary" className="ml-auto">
            x{config.quantity}대
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 사양 목록 */}
        <div className="space-y-1.5 text-sm">
          {config.requirements.cpu && (
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">CPU:</span>
              <span>
                {config.requirements.cpu.min_cores}코어 이상
                {config.requirements.cpu.min_clock_ghz
                  ? `, ${config.requirements.cpu.min_clock_ghz}GHz+`
                  : ""}
                {config.requirements.cpu.socket_type
                  ? ` (${config.requirements.cpu.socket_type})`
                  : ""}
              </span>
            </div>
          )}

          {config.requirements.memory && (
            <div className="flex items-center gap-2">
              <MemoryStick className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">메모리:</span>
              <span>
                {config.requirements.memory.min_capacity_gb}GB 이상
                {config.requirements.memory.type
                  ? ` (${config.requirements.memory.type})`
                  : ""}
                {config.requirements.memory.ecc ? ", ECC" : ""}
              </span>
            </div>
          )}

          {config.requirements.gpu && (
            <div className="flex items-center gap-2">
              <MonitorSpeaker className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">GPU:</span>
              <span>
                VRAM {config.requirements.gpu.min_vram_gb}GB x
                {config.requirements.gpu.min_count}
                {config.requirements.gpu.preferred_model
                  ? ` (${config.requirements.gpu.preferred_model})`
                  : ""}
              </span>
            </div>
          )}

          {config.requirements.storage && config.requirements.storage.items.length > 0 && (
            <div className="flex items-center gap-2">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">스토리지:</span>
              <span>
                {config.requirements.storage.items
                  .map(
                    (s) =>
                      `${s.interface_type ?? s.type} ${s.min_capacity_gb >= 1000 ? `${(s.min_capacity_gb / 1000).toFixed(1)}TB` : `${s.min_capacity_gb}GB`} x${s.quantity}`
                  )
                  .join(", ")}
              </span>
            </div>
          )}

          {config.requirements.network && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              네트워크: {config.requirements.network.min_speed_gbps}Gbps
              {config.requirements.network.port_count
                ? ` x${config.requirements.network.port_count}포트`
                : ""}
            </div>
          )}

          {config.requirements.power && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              전원: {config.requirements.power.redundancy ? "이중화" : "단일"}
              {config.requirements.power.min_wattage
                ? ` ${config.requirements.power.min_wattage}W+`
                : ""}
            </div>
          )}
        </div>

        {/* 참고 사항 */}
        {config.notes.length > 0 && (
          <p className="text-xs text-muted-foreground border-t pt-2">
            참고: {config.notes.join(", ")}
          </p>
        )}

        <Separator />

        {/* 액션 버튼 + 상태 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onAutoConfig}
            className="gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" />
            자동 구성
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onManualConfig}
            className="gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5" />
            수동 구성
          </Button>
          <div className="ml-auto flex items-center gap-1.5 text-sm">
            {status === "pending" ? (
              <>
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">미구성</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600">구성완료</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
