"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  CircuitBoard,
  Zap,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { ParsedServerConfig } from "@/lib/types";
import { ASSEMBLY_STEPS } from "@/lib/types/assembly";

// ─── 타입 정의 ───

/** API에서 반환되는 부품 데이터 */
interface PartItem {
  id: string;
  modelName: string;
  manufacturer: string;
  specs: Record<string, unknown>;
  listPrice: number;
  marketPrice: number;
  supplyPrice: number;
}

/** 선택된 부품 (수량 포함) */
interface SelectedPart extends PartItem {
  quantity: number;
}

/** 위저드 전체 상태 */
interface WizardState {
  chassis: SelectedPart | null;
  motherboard: SelectedPart | null;
  cpu: SelectedPart | null;
  memory: SelectedPart | null;
  memoryQuantity: number;
  storageSsd: SelectedPart[];
  storageHdd: SelectedPart[];
  gpu: SelectedPart[];
  nic: SelectedPart[];
  raid: SelectedPart[];
  psu: SelectedPart | null;
}

const INITIAL_STATE: WizardState = {
  chassis: null,
  motherboard: null,
  cpu: null,
  memory: null,
  memoryQuantity: 1,
  storageSsd: [],
  storageHdd: [],
  gpu: [],
  nic: [],
  raid: [],
  psu: null,
};

// 스텝 아이콘 매핑
const STEP_ICONS = [Server, Cpu, MemoryStick, HardDrive, CircuitBoard, Zap];

// ─── 가격 포맷 ───
function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// ─── 메인 페이지 컴포넌트 ───

export default function WizardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rfpId = params.rfpId as string;
  const configIndex = Number(params.configIndex);
  const mode = searchParams.get("mode") ?? "manual";

  // RFP 데이터
  const [rfpConfig, setRfpConfig] = useState<ParsedServerConfig | null>(null);
  const [rfpLoading, setRfpLoading] = useState(true);

  // 위저드 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // 부품 목록 (현재 스텝)
  const [parts, setParts] = useState<PartItem[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  // ─── RFP 데이터 로드 ───
  useEffect(() => {
    async function loadRfp() {
      setRfpLoading(true);
      try {
        const res = await fetch(`/api/rfp/${rfpId}`);
        const json = await res.json();
        if (json.success && json.data?.parsedRequirements) {
          const configs = json.data.parsedRequirements as ParsedServerConfig[];
          if (configIndex >= 0 && configIndex < configs.length) {
            setRfpConfig(configs[configIndex]);
          } else {
            toast.error("서버 구성 인덱스가 올바르지 않습니다.");
          }
        } else {
          toast.error("RFP 데이터를 불러올 수 없습니다.");
        }
      } catch {
        toast.error("RFP 조회 중 오류가 발생했습니다.");
      } finally {
        setRfpLoading(false);
      }
    }
    loadRfp();
  }, [rfpId, configIndex]);

  // ─── 부품 조회 API 호출 ───
  const fetchParts = useCallback(
    async (category: string, filter?: string) => {
      setPartsLoading(true);
      try {
        let url = `/api/assembly/compatible-parts?category=${encodeURIComponent(category)}`;
        if (filter) {
          url += `&filter=${encodeURIComponent(filter)}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setParts(json.data ?? []);
        } else {
          setParts([]);
          toast.error(json.error?.message ?? "부품 목록을 불러올 수 없습니다.");
        }
      } catch {
        setParts([]);
      } finally {
        setPartsLoading(false);
      }
    },
    [],
  );

  // ─── 자동 구성 모드: 초기 로드 시 자동 부품 추천 ───
  useEffect(() => {
    if (mode !== "auto" || !rfpConfig || rfpLoading) return;

    async function autoFill() {
      try {
        // 섀시
        const chassisRes = await fetch("/api/assembly/compatible-parts?category=chassis");
        const chassisJson = await chassisRes.json();
        const chassisList: PartItem[] = chassisJson.success ? chassisJson.data : [];

        // 메인보드
        const mbRes = await fetch("/api/assembly/compatible-parts?category=motherboard");
        const mbJson = await mbRes.json();
        const mbList: PartItem[] = mbJson.success ? mbJson.data : [];

        // CPU
        const cpuRes = await fetch("/api/assembly/compatible-parts?category=cpu");
        const cpuJson = await cpuRes.json();
        const cpuList: PartItem[] = cpuJson.success ? cpuJson.data : [];

        // 메모리
        const memRes = await fetch("/api/assembly/compatible-parts?category=memory");
        const memJson = await memRes.json();
        const memList: PartItem[] = memJson.success ? memJson.data : [];

        // PSU
        const psuRes = await fetch("/api/assembly/compatible-parts?category=psu");
        const psuJson = await psuRes.json();
        const psuList: PartItem[] = psuJson.success ? psuJson.data : [];

        setState((prev) => ({
          ...prev,
          chassis: chassisList[0] ? { ...chassisList[0], quantity: 1 } : null,
          motherboard: mbList[0] ? { ...mbList[0], quantity: 1 } : null,
          cpu: cpuList[0] ? { ...cpuList[0], quantity: 1 } : null,
          memory: memList[0] ? { ...memList[0], quantity: 1 } : null,
          memoryQuantity: rfpConfig?.requirements.memory
            ? Math.max(1, Math.ceil((rfpConfig.requirements.memory.min_capacity_gb ?? 32) / 32))
            : 2,
          psu: psuList[0] ? { ...psuList[0], quantity: 1 } : null,
        }));

        toast.success("자동 구성이 완료되었습니다. 각 단계를 검토해주세요.");
      } catch {
        toast.error("자동 구성 중 오류가 발생했습니다.");
      }
    }

    autoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, rfpConfig, rfpLoading]);

  // ─── 스텝 변경 시 부품 로드 ───
  useEffect(() => {
    if (rfpLoading) return;

    switch (currentStep) {
      case 0: // 베이스 서버 - 섀시
        fetchParts("chassis");
        break;
      case 1: { // CPU
        const socket = state.motherboard?.specs?.socket;
        if (socket) {
          fetchParts("cpu", `socket:${socket}`);
        } else {
          fetchParts("cpu");
        }
        break;
      }
      case 2: { // 메모리
        const memType = rfpConfig?.requirements.memory?.type;
        if (memType) {
          fetchParts("memory", `type:${memType}`);
        } else {
          fetchParts("memory");
        }
        break;
      }
      case 3: // 스토리지 - 기본 SSD
        fetchParts("ssd");
        break;
      case 4: // 확장카드 - 기본 GPU
        fetchParts("gpu");
        break;
      case 5: // PSU
        fetchParts("psu");
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, rfpLoading]);

  // ─── 총 비용 계산 ───
  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSupply = 0;
    const items: { name: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

    if (state.chassis) {
      const sub = state.chassis.supplyPrice * state.chassis.quantity;
      items.push({ name: state.chassis.modelName, quantity: state.chassis.quantity, unitPrice: state.chassis.supplyPrice, subtotal: sub });
      totalCost += state.chassis.marketPrice * state.chassis.quantity;
      totalSupply += sub;
    }
    if (state.motherboard) {
      const sub = state.motherboard.supplyPrice * state.motherboard.quantity;
      items.push({ name: state.motherboard.modelName, quantity: state.motherboard.quantity, unitPrice: state.motherboard.supplyPrice, subtotal: sub });
      totalCost += state.motherboard.marketPrice * state.motherboard.quantity;
      totalSupply += sub;
    }
    if (state.cpu) {
      const sub = state.cpu.supplyPrice * state.cpu.quantity;
      items.push({ name: state.cpu.modelName, quantity: state.cpu.quantity, unitPrice: state.cpu.supplyPrice, subtotal: sub });
      totalCost += state.cpu.marketPrice * state.cpu.quantity;
      totalSupply += sub;
    }
    if (state.memory) {
      const sub = state.memory.supplyPrice * state.memoryQuantity;
      items.push({ name: state.memory.modelName, quantity: state.memoryQuantity, unitPrice: state.memory.supplyPrice, subtotal: sub });
      totalCost += state.memory.marketPrice * state.memoryQuantity;
      totalSupply += sub;
    }

    const addList = (list: SelectedPart[]) => {
      for (const p of list) {
        const sub = p.supplyPrice * p.quantity;
        items.push({ name: p.modelName, quantity: p.quantity, unitPrice: p.supplyPrice, subtotal: sub });
        totalCost += p.marketPrice * p.quantity;
        totalSupply += sub;
      }
    };
    addList(state.storageSsd);
    addList(state.storageHdd);
    addList(state.gpu);
    addList(state.nic);
    addList(state.raid);

    if (state.psu) {
      const sub = state.psu.supplyPrice * state.psu.quantity;
      items.push({ name: state.psu.modelName, quantity: state.psu.quantity, unitPrice: state.psu.supplyPrice, subtotal: sub });
      totalCost += state.psu.marketPrice * state.psu.quantity;
      totalSupply += sub;
    }

    const margin = totalSupply - totalCost;
    const marginRate = totalSupply > 0 ? (margin / totalSupply) * 100 : 0;

    return { items, totalCost, totalSupply, margin, marginRate };
  }, [state]);

  // ─── TDP 계산 ───
  const totalTdp = useMemo(() => {
    let tdp = 0;
    if (state.cpu?.specs?.tdp) tdp += Number(state.cpu.specs.tdp) * (state.cpu.quantity || 1);
    for (const g of state.gpu) {
      if (g.specs?.tdp) tdp += Number(g.specs.tdp) * (g.quantity || 1);
    }
    // 기본 시스템 전력 (메모리, 메인보드, 팬 등)
    tdp += 100;
    return tdp;
  }, [state.cpu, state.gpu]);

  // ─── 부품 선택 핸들러 ───
  const selectPart = (part: PartItem, field: keyof WizardState) => {
    setState((prev) => ({
      ...prev,
      [field]: { ...part, quantity: 1 },
    }));
  };

  const addToList = (part: PartItem, field: "storageSsd" | "storageHdd" | "gpu" | "nic" | "raid") => {
    setState((prev) => {
      const list = prev[field] as SelectedPart[];
      const existing = list.find((p) => p.id === part.id);
      if (existing) {
        return {
          ...prev,
          [field]: list.map((p) =>
            p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p,
          ),
        };
      }
      return {
        ...prev,
        [field]: [...list, { ...part, quantity: 1 }],
      };
    });
  };

  const removeFromList = (partId: string, field: "storageSsd" | "storageHdd" | "gpu" | "nic" | "raid") => {
    setState((prev) => {
      const list = prev[field] as SelectedPart[];
      const item = list.find((p) => p.id === partId);
      if (item && item.quantity > 1) {
        return {
          ...prev,
          [field]: list.map((p) =>
            p.id === partId ? { ...p, quantity: p.quantity - 1 } : p,
          ),
        };
      }
      return {
        ...prev,
        [field]: list.filter((p) => p.id !== partId),
      };
    });
  };

  // ─── 스텝 이동 ───
  const goNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── 구성 완료 ───
  const handleComplete = () => {
    toast.success("서버 구성이 완료되었습니다.");
    router.push(`/quotation/configure?rfp_id=${rfpId}`);
  };

  // ─── 메인보드 로드 (섀시 선택 후) ───
  const loadMotherboards = useCallback(() => {
    const formFactor = state.chassis?.specs?.form_factor;
    if (formFactor) {
      fetchParts("motherboard", `form_factor:${formFactor}`);
    } else {
      fetchParts("motherboard");
    }
  }, [state.chassis, fetchParts]);

  // ─── 로딩 상태 ───
  if (rfpLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rfpConfig) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">서버 구성 데이터를 찾을 수 없습니다.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/quotation/configure?rfp_id=${rfpId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/quotation/configure?rfp_id=${rfpId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">서버 구성 위저드</h2>
            <Badge variant={mode === "auto" ? "default" : "outline"}>
              {mode === "auto" ? "자동 구성" : "수동 구성"}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-10">
            {rfpConfig.config_name} (x{rfpConfig.quantity}대)
          </p>
        </div>
      </div>

      <Separator />

      {/* 스텝바 */}
      <StepBar currentStep={currentStep} onStepClick={setCurrentStep} state={state} />

      {/* RFP 요구사항 요약 */}
      <RfpRequirementsSummary config={rfpConfig} currentStep={currentStep} />

      {/* 스텝 콘텐츠 */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <Step1BaseServer
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            onSelectChassis={(part) => {
              selectPart(part, "chassis");
              // 메인보드 선택 초기화
              setState((prev) => ({ ...prev, motherboard: null }));
            }}
            onSelectMotherboard={(part) => selectPart(part, "motherboard")}
            onLoadMotherboards={loadMotherboards}
          />
        )}
        {currentStep === 1 && (
          <Step2Cpu
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            rfpConfig={rfpConfig}
            onSelect={(part) => selectPart(part, "cpu")}
          />
        )}
        {currentStep === 2 && (
          <Step3Memory
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            rfpConfig={rfpConfig}
            onSelect={(part) => selectPart(part, "memory")}
            onQuantityChange={(qty) => setState((prev) => ({ ...prev, memoryQuantity: qty }))}
          />
        )}
        {currentStep === 3 && (
          <Step4Storage
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            onAdd={addToList}
            onRemove={removeFromList}
            onFetchParts={fetchParts}
          />
        )}
        {currentStep === 4 && (
          <Step5Expansion
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            onAdd={addToList}
            onRemove={removeFromList}
            onFetchParts={fetchParts}
          />
        )}
        {currentStep === 5 && (
          <Step6PsuSummary
            state={state}
            parts={parts}
            partsLoading={partsLoading}
            totalTdp={totalTdp}
            totals={totals}
            onSelectPsu={(part) => selectPart(part, "psu")}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* 이전 / 다음 네비게이션 */}
      <Separator />
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} / {ASSEMBLY_STEPS.length}
        </span>
        {currentStep < 5 ? (
          <Button onClick={goNext} className="gap-1.5">
            다음
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="gap-1.5">
            <Check className="h-4 w-4" />
            구성 완료
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 스텝바 컴포넌트
// ============================================================

interface StepBarProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  state: WizardState;
}

function StepBar({ currentStep, onStepClick, state }: StepBarProps) {
  // 각 스텝 완료 여부 판별
  const isStepDone = (step: number): boolean => {
    switch (step) {
      case 0: return !!state.chassis && !!state.motherboard;
      case 1: return !!state.cpu;
      case 2: return !!state.memory;
      case 3: return state.storageSsd.length > 0 || state.storageHdd.length > 0;
      case 4: return true; // 확장카드는 선택사항
      case 5: return !!state.psu;
      default: return false;
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {ASSEMBLY_STEPS.map((step, idx) => {
        const Icon = STEP_ICONS[idx];
        const done = isStepDone(idx);
        const active = idx === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick(idx)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }
              `}
            >
              {done && !active ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {step.label}
            </button>
            {idx < ASSEMBLY_STEPS.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// RFP 요구사항 요약 (현재 스텝에 관련된 요구사항 표시)
// ============================================================

interface RfpRequirementsSummaryProps {
  config: ParsedServerConfig;
  currentStep: number;
}

function RfpRequirementsSummary({ config, currentStep }: RfpRequirementsSummaryProps) {
  const req = config.requirements;
  let content: React.ReactNode = null;

  switch (currentStep) {
    case 0:
      content = (
        <span>
          폼팩터 요구사항: {req.power?.redundancy ? "이중화 PSU 지원 필요" : "특별 요구사항 없음"}
        </span>
      );
      break;
    case 1:
      if (req.cpu) {
        content = (
          <span>
            CPU 요구: {req.cpu.min_cores ?? "-"}코어 이상
            {req.cpu.min_clock_ghz ? `, ${req.cpu.min_clock_ghz}GHz+` : ""}
            {req.cpu.socket_type ? ` (${req.cpu.socket_type})` : ""}
            {req.cpu.max_tdp_w ? `, TDP ${req.cpu.max_tdp_w}W 이하` : ""}
          </span>
        );
      }
      break;
    case 2:
      if (req.memory) {
        content = (
          <span>
            메모리 요구: {req.memory.min_capacity_gb}GB 이상
            {req.memory.type ? ` (${req.memory.type})` : ""}
            {req.memory.ecc ? ", ECC" : ""}
            {req.memory.min_speed_mhz ? `, ${req.memory.min_speed_mhz}MHz+` : ""}
          </span>
        );
      }
      break;
    case 3:
      if (req.storage && req.storage.items.length > 0) {
        content = (
          <span>
            스토리지 요구:{" "}
            {req.storage.items
              .map(
                (s) =>
                  `${s.interface_type ?? s.type} ${s.min_capacity_gb >= 1000 ? `${(s.min_capacity_gb / 1000).toFixed(1)}TB` : `${s.min_capacity_gb}GB`} x${s.quantity}`,
              )
              .join(", ")}
          </span>
        );
      }
      break;
    case 4:
      if (req.gpu) {
        content = (
          <span>
            GPU 요구: VRAM {req.gpu.min_vram_gb}GB x{req.gpu.min_count}
            {req.gpu.preferred_model ? ` (${req.gpu.preferred_model})` : ""}
          </span>
        );
      }
      break;
    case 5:
      if (req.power) {
        content = (
          <span>
            전원 요구: {req.power.redundancy ? "이중화" : "단일"}
            {req.power.min_wattage ? ` ${req.power.min_wattage}W 이상` : ""}
          </span>
        );
      }
      break;
  }

  if (!content) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300">
      <Info className="h-4 w-4 shrink-0" />
      {content}
    </div>
  );
}

// ============================================================
// 부품 카드 (공통)
// ============================================================

interface PartCardProps {
  part: PartItem;
  selected?: boolean;
  onSelect: () => void;
  badge?: React.ReactNode;
}

function PartCard({ part, selected, onSelect, badge }: PartCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}
      onClick={onSelect}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{part.modelName}</p>
            <p className="text-xs text-muted-foreground">{part.manufacturer}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">{formatPrice(part.supplyPrice)}</p>
            {badge}
          </div>
        </div>
        {/* 주요 스펙 표시 */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(part.specs).slice(0, 5).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="text-xs">
              {key}: {String(value)}
            </Badge>
          ))}
        </div>
        {selected && (
          <Badge className="mt-1">선택됨</Badge>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 부품 목록 (공통 로딩/빈 상태)
// ============================================================

function PartsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">부품 목록 로딩 중...</span>
    </div>
  );
}

function PartsEmpty() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-sm">등록된 부품이 없습니다.</p>
    </div>
  );
}

// ============================================================
// Step 1: 베이스 서버 (섀시 + 메인보드)
// ============================================================

interface Step1Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  onSelectChassis: (part: PartItem) => void;
  onSelectMotherboard: (part: PartItem) => void;
  onLoadMotherboards: () => void;
}

function Step1BaseServer({
  state,
  parts,
  partsLoading,
  onSelectChassis,
  onSelectMotherboard,
  onLoadMotherboards,
}: Step1Props) {
  const [subStep, setSubStep] = useState<"chassis" | "motherboard">(
    state.chassis ? "motherboard" : "chassis",
  );
  const [motherboards, setMotherboards] = useState<PartItem[]>([]);
  const [mbLoading, setMbLoading] = useState(false);

  // 섀시 선택 후 메인보드 로드
  const handleSelectChassis = (part: PartItem) => {
    onSelectChassis(part);
    setSubStep("motherboard");
    loadMotherboardsForChassis(part);
  };

  const loadMotherboardsForChassis = async (chassis: PartItem) => {
    setMbLoading(true);
    try {
      const ff = chassis.specs?.form_factor;
      let url = "/api/assembly/compatible-parts?category=motherboard";
      if (ff) url += `&filter=form_factor:${ff}`;
      const res = await fetch(url);
      const json = await res.json();
      setMotherboards(json.success ? json.data : []);
    } catch {
      setMotherboards([]);
    } finally {
      setMbLoading(false);
    }
  };

  // 이미 섀시가 선택된 상태에서 메인보드 로드
  useEffect(() => {
    if (state.chassis && subStep === "motherboard" && motherboards.length === 0) {
      loadMotherboardsForChassis(state.chassis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Tabs value={subStep} onValueChange={(v) => setSubStep(v as "chassis" | "motherboard")}>
        <TabsList>
          <TabsTrigger value="chassis">
            섀시
            {state.chassis && <Check className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="motherboard" disabled={!state.chassis}>
            메인보드
            {state.motherboard && <Check className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chassis" className="mt-4">
          {partsLoading ? (
            <PartsLoading />
          ) : parts.length === 0 ? (
            <PartsEmpty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  selected={state.chassis?.id === part.id}
                  onSelect={() => handleSelectChassis(part)}
                  badge={
                    part.specs?.form_factor ? (
                      <Badge variant="outline" className="text-xs">
                        {String(part.specs.form_factor)}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="motherboard" className="mt-4">
          {mbLoading ? (
            <PartsLoading />
          ) : motherboards.length === 0 ? (
            <PartsEmpty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {motherboards.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  selected={state.motherboard?.id === part.id}
                  onSelect={() => onSelectMotherboard(part)}
                  badge={
                    part.specs?.socket ? (
                      <Badge variant="outline" className="text-xs">
                        {String(part.specs.socket)}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Step 2: CPU
// ============================================================

interface Step2Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  rfpConfig: ParsedServerConfig;
  onSelect: (part: PartItem) => void;
}

function Step2Cpu({ state, parts, partsLoading, rfpConfig, onSelect }: Step2Props) {
  const requiredCores = rfpConfig.requirements.cpu?.min_cores;

  if (partsLoading) return <PartsLoading />;
  if (parts.length === 0) return <PartsEmpty />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">선택</TableHead>
            <TableHead>모델명</TableHead>
            <TableHead>제조사</TableHead>
            <TableHead className="text-center">코어</TableHead>
            <TableHead className="text-center">클럭</TableHead>
            <TableHead className="text-center">TDP</TableHead>
            <TableHead className="text-right">가격</TableHead>
            <TableHead className="text-center">요구충족</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => {
            const cores = Number(part.specs?.cores ?? 0);
            const clock = part.specs?.clock_ghz ?? part.specs?.clock ?? "-";
            const tdp = part.specs?.tdp ?? "-";
            const meetsCores = requiredCores ? cores >= requiredCores : true;

            return (
              <TableRow
                key={part.id}
                className={`cursor-pointer ${state.cpu?.id === part.id ? "bg-primary/5" : "hover:bg-muted/50"}`}
                onClick={() => onSelect(part)}
              >
                <TableCell>
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      state.cpu?.id === part.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {state.cpu?.id === part.id && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">{part.modelName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{part.manufacturer}</TableCell>
                <TableCell className="text-center text-sm">{cores || "-"}</TableCell>
                <TableCell className="text-center text-sm">{String(clock)}</TableCell>
                <TableCell className="text-center text-sm">{String(tdp)}W</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatPrice(part.supplyPrice)}
                </TableCell>
                <TableCell className="text-center">
                  {meetsCores ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      충족
                    </Badge>
                  ) : (
                    <Badge variant="destructive">미달</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================
// Step 3: 메모리
// ============================================================

interface Step3Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  rfpConfig: ParsedServerConfig;
  onSelect: (part: PartItem) => void;
  onQuantityChange: (qty: number) => void;
}

function Step3Memory({ state, parts, partsLoading, rfpConfig, onSelect, onQuantityChange }: Step3Props) {
  const requiredGb = rfpConfig.requirements.memory?.min_capacity_gb ?? 0;
  const maxSlots = Number(state.motherboard?.specs?.memory_slots ?? 16);

  if (partsLoading) return <PartsLoading />;
  if (parts.length === 0) return <PartsEmpty />;

  const selectedCapacity = Number(state.memory?.specs?.capacity_gb ?? 0) * state.memoryQuantity;

  return (
    <div className="space-y-4">
      {/* 용량 현황 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">RFP 요구 용량:</span>{" "}
              <span className="font-semibold">{requiredGb}GB</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">현재 선택:</span>{" "}
              <span className={`font-semibold ${selectedCapacity >= requiredGb ? "text-green-600" : "text-orange-600"}`}>
                {selectedCapacity}GB
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">슬롯:</span>{" "}
              <span className="font-semibold">{state.memoryQuantity} / {maxSlots}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 수량 조절 */}
      {state.memory && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">수량:</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(Math.max(1, state.memoryQuantity - 1))}
            disabled={state.memoryQuantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-semibold w-8 text-center">{state.memoryQuantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(Math.min(maxSlots, state.memoryQuantity + 1))}
            disabled={state.memoryQuantity >= maxSlots}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            (최대 {maxSlots}슬롯)
          </span>
        </div>
      )}

      {/* 부품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {parts.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            selected={state.memory?.id === part.id}
            onSelect={() => onSelect(part)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Step 4: 스토리지
// ============================================================

interface Step4Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  onAdd: (part: PartItem, field: "storageSsd" | "storageHdd") => void;
  onRemove: (partId: string, field: "storageSsd" | "storageHdd") => void;
  onFetchParts: (category: string, filter?: string) => void;
}

function Step4Storage({ state, parts, partsLoading, onAdd, onRemove, onFetchParts }: Step4Props) {
  const [tab, setTab] = useState<"ssd" | "hdd">("ssd");

  const handleTabChange = (value: string) => {
    const t = value as "ssd" | "hdd";
    setTab(t);
    onFetchParts(t);
  };

  const currentList = tab === "ssd" ? state.storageSsd : state.storageHdd;
  const field = tab === "ssd" ? "storageSsd" : "storageHdd";

  return (
    <div className="space-y-4">
      {/* 선택된 스토리지 요약 */}
      {(state.storageSsd.length > 0 || state.storageHdd.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">선택된 스토리지</p>
            <div className="space-y-1">
              {[...state.storageSsd, ...state.storageHdd].map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.modelName} x{p.quantity}</span>
                  <span className="font-medium">{formatPrice(p.supplyPrice * p.quantity)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="ssd">SSD</TabsTrigger>
          <TabsTrigger value="hdd">HDD</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {partsLoading ? (
            <PartsLoading />
          ) : parts.length === 0 ? (
            <PartsEmpty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parts.map((part) => {
                const inList = currentList.find((p) => p.id === part.id);
                return (
                  <Card key={part.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{part.modelName}</p>
                          <p className="text-xs text-muted-foreground">{part.manufacturer}</p>
                        </div>
                        <p className="font-semibold text-sm">{formatPrice(part.supplyPrice)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(part.specs).slice(0, 4).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => onAdd(part, field)}
                        >
                          <Plus className="h-3 w-3" />
                          추가
                        </Button>
                        {inList && (
                          <>
                            <span className="text-sm font-medium">x{inList.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-destructive"
                              onClick={() => onRemove(part.id, field)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Step 5: 확장 카드 (GPU / NIC / RAID)
// ============================================================

interface Step5Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  onAdd: (part: PartItem, field: "gpu" | "nic" | "raid") => void;
  onRemove: (partId: string, field: "gpu" | "nic" | "raid") => void;
  onFetchParts: (category: string, filter?: string) => void;
}

function Step5Expansion({ state, parts, partsLoading, onAdd, onRemove, onFetchParts }: Step5Props) {
  const [tab, setTab] = useState<"gpu" | "nic" | "raid">("gpu");

  const handleTabChange = (value: string) => {
    const t = value as "gpu" | "nic" | "raid";
    setTab(t);
    onFetchParts(t);
  };

  const currentList = tab === "gpu" ? state.gpu : tab === "nic" ? state.nic : state.raid;
  const totalPcieUsed = state.gpu.reduce((s, p) => s + p.quantity, 0)
    + state.nic.reduce((s, p) => s + p.quantity, 0)
    + state.raid.reduce((s, p) => s + p.quantity, 0);
  const maxPcie = Number(state.motherboard?.specs?.pcie_slots ?? 4);

  return (
    <div className="space-y-4">
      {/* PCIe 슬롯 현황 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">PCIe 슬롯 사용:</span>
            <span className={`font-semibold ${totalPcieUsed > maxPcie ? "text-destructive" : ""}`}>
              {totalPcieUsed} / {maxPcie}
            </span>
          </div>
          {totalPcieUsed > maxPcie && (
            <p className="text-xs text-destructive mt-1">슬롯 수를 초과했습니다!</p>
          )}
        </CardContent>
      </Card>

      {/* 선택된 확장카드 요약 */}
      {(state.gpu.length > 0 || state.nic.length > 0 || state.raid.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">선택된 확장 카드</p>
            <div className="space-y-1">
              {[...state.gpu, ...state.nic, ...state.raid].map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.modelName} x{p.quantity}</span>
                  <span className="font-medium">{formatPrice(p.supplyPrice * p.quantity)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="gpu">GPU</TabsTrigger>
          <TabsTrigger value="nic">NIC</TabsTrigger>
          <TabsTrigger value="raid">RAID</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {partsLoading ? (
            <PartsLoading />
          ) : parts.length === 0 ? (
            <PartsEmpty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parts.map((part) => {
                const inList = currentList.find((p) => p.id === part.id);
                return (
                  <Card key={part.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{part.modelName}</p>
                          <p className="text-xs text-muted-foreground">{part.manufacturer}</p>
                        </div>
                        <p className="font-semibold text-sm">{formatPrice(part.supplyPrice)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(part.specs).slice(0, 4).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => onAdd(part, tab)}
                          disabled={totalPcieUsed >= maxPcie && !inList}
                        >
                          <Plus className="h-3 w-3" />
                          추가
                        </Button>
                        {inList && (
                          <>
                            <span className="text-sm font-medium">x{inList.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-destructive"
                              onClick={() => onRemove(part.id, tab)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Step 6: PSU + 요약
// ============================================================

interface Step6Props {
  state: WizardState;
  parts: PartItem[];
  partsLoading: boolean;
  totalTdp: number;
  totals: {
    items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
    totalCost: number;
    totalSupply: number;
    margin: number;
    marginRate: number;
  };
  onSelectPsu: (part: PartItem) => void;
  onComplete: () => void;
}

function Step6PsuSummary({ state, parts, partsLoading, totalTdp, totals, onSelectPsu, onComplete }: Step6Props) {
  const recommendedWattage = Math.ceil(totalTdp * 1.2 / 100) * 100;

  return (
    <div className="space-y-6">
      {/* TDP 및 PSU 추천 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            전원 요구사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">총 예상 TDP:</span>
            <span className="font-semibold">{totalTdp}W</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">추천 PSU 용량 (20% 여유):</span>
            <span className="font-semibold text-primary">{recommendedWattage}W 이상</span>
          </div>
        </CardContent>
      </Card>

      {/* PSU 선택 */}
      <div>
        <h3 className="text-sm font-semibold mb-3">PSU 선택</h3>
        {partsLoading ? (
          <PartsLoading />
        ) : parts.length === 0 ? (
          <PartsEmpty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parts.map((part) => {
              const wattage = Number(part.specs?.wattage ?? 0);
              const sufficient = wattage >= recommendedWattage;
              return (
                <PartCard
                  key={part.id}
                  part={part}
                  selected={state.psu?.id === part.id}
                  onSelect={() => onSelectPsu(part)}
                  badge={
                    wattage > 0 ? (
                      <Badge
                        variant={sufficient ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {wattage}W {sufficient ? "" : "(부족)"}
                      </Badge>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* 전체 구성 요약 테이블 */}
      <div>
        <h3 className="text-sm font-semibold mb-3">전체 구성 요약</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>부품명</TableHead>
              <TableHead className="text-center">수량</TableHead>
              <TableHead className="text-right">단가</TableHead>
              <TableHead className="text-right">소계</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totals.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  선택된 부품이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              totals.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{item.name}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm">{formatPrice(item.unitPrice)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatPrice(item.subtotal)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 총계 */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">총 원가:</span>
            <span className="font-medium">{formatPrice(totals.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">총 공급가:</span>
            <span className="font-semibold text-lg">{formatPrice(totals.totalSupply)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">마진:</span>
            <span className={`font-semibold ${totals.margin >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatPrice(totals.margin)} ({totals.marginRate.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 구성 완료 버튼 */}
      <Button onClick={onComplete} className="w-full gap-2" size="lg">
        <Check className="h-4 w-4" />
        구성 완료
      </Button>
    </div>
  );
}
