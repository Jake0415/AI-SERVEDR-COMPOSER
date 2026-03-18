// ============================================================
// 서버 조립 관련 타입 정의
// ============================================================

// --- 슬롯/베이 트래커 ---

export interface SlotAllocation {
  slotIndex: number;
  partId: string;
  partName: string;
}

export interface SlotTrackerState {
  memorySlots: (SlotAllocation | null)[];
  pcieSlots: (SlotAllocation | null)[];
  driveBays25: (SlotAllocation | null)[];
  driveBays35: (SlotAllocation | null)[];
  totalMemorySlots: number;
  totalPcieSlots: number;
  totalDriveBays25: number;
  totalDriveBays35: number;
}

// --- DIMM 최적화 ---

export interface DimmConfig {
  partId: string;
  partName: string;
  capacityGb: number;
  dimmType: "RDIMM" | "LRDIMM" | "UDIMM";
  speed: number;
  quantity: number;
}

export interface DimmOptimizationResult {
  configs: DimmConfig[];
  totalCapacityGb: number;
  channelsUsed: number;
  isBalanced: boolean;
  warnings: string[];
}

// --- 자동 조립 파이프라인 ---

export interface AssemblyPipelineInput {
  rfpRequirements: {
    cpu_cores?: number;
    memory_gb?: number;
    storage_tb?: number;
    gpu_count?: number;
    form_factor?: string;
  };
  strategy: "profitability" | "spec_match" | "performance";
  tenantId: string;
}

export interface AssemblyPipelineResult {
  baseServer: { chassisId: string; motherboardId: string } | null;
  cpu: { partId: string; quantity: number } | null;
  memory: DimmConfig[];
  storage: { partId: string; bayType: "2.5" | "3.5"; quantity: number }[];
  pcie: { partId: string; slotIndex: number }[];
  psu: { partId: string; quantity: number } | null;
  totalTdp: number;
  totalCost: number;
  totalSupply: number;
  compatibilityIssues: AssemblyCompatibilityIssue[];
}

export interface AssemblyCompatibilityIssue {
  ruleId: string;
  level: "block" | "warning";
  message: string;
  component?: string;
}

// --- 수동 조립 UI 상태 ---

export interface ManualAssemblyState {
  step: number;
  baseServer: { chassisId: string; motherboardId: string } | null;
  cpu: { partId: string; quantity: number } | null;
  memorySlots: (string | null)[];
  storageBays: { bay25: (string | null)[]; bay35: (string | null)[] };
  pcieSlots: (string | null)[];
  psu: { partId: string; quantity: number; redundancy: boolean } | null;
  mode: "auto" | "manual";
}

export const ASSEMBLY_STEPS = [
  { id: 1, label: "베이스 서버", icon: "server" },
  { id: 2, label: "CPU", icon: "cpu" },
  { id: 3, label: "메모리", icon: "memory-stick" },
  { id: 4, label: "스토리지", icon: "hard-drive" },
  { id: 5, label: "확장 카드", icon: "circuit-board" },
  { id: 6, label: "전원/견적", icon: "zap" },
] as const;
