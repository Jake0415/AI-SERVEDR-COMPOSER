// ============================================================
// SlotTracker — 메모리/PCIe/드라이브 슬롯 할당 추적
// ============================================================

import type { SlotTrackerState, SlotAllocation } from "@/lib/types/assembly";

export class SlotTracker {
  private state: SlotTrackerState;

  constructor(specs: {
    memorySlots: number;
    pcieSlots: number;
    driveBays25: number;
    driveBays35: number;
  }) {
    this.state = {
      memorySlots: new Array(specs.memorySlots).fill(null),
      pcieSlots: new Array(specs.pcieSlots).fill(null),
      driveBays25: new Array(specs.driveBays25).fill(null),
      driveBays35: new Array(specs.driveBays35).fill(null),
      totalMemorySlots: specs.memorySlots,
      totalPcieSlots: specs.pcieSlots,
      totalDriveBays25: specs.driveBays25,
      totalDriveBays35: specs.driveBays35,
    };
  }

  getState(): SlotTrackerState {
    return { ...this.state };
  }

  // --- 메모리 ---

  allocateMemory(slotIndex: number, partId: string, partName: string): boolean {
    if (slotIndex < 0 || slotIndex >= this.state.totalMemorySlots) return false;
    if (this.state.memorySlots[slotIndex] !== null) return false;
    this.state.memorySlots[slotIndex] = { slotIndex, partId, partName };
    return true;
  }

  freeMemory(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.state.totalMemorySlots) return false;
    this.state.memorySlots[slotIndex] = null;
    return true;
  }

  getUsedMemorySlots(): number {
    return this.state.memorySlots.filter((s) => s !== null).length;
  }

  getFreeMemorySlots(): number {
    return this.state.totalMemorySlots - this.getUsedMemorySlots();
  }

  // --- PCIe ---

  allocatePcie(slotIndex: number, partId: string, partName: string): boolean {
    if (slotIndex < 0 || slotIndex >= this.state.totalPcieSlots) return false;
    if (this.state.pcieSlots[slotIndex] !== null) return false;
    this.state.pcieSlots[slotIndex] = { slotIndex, partId, partName };
    return true;
  }

  freePcie(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.state.totalPcieSlots) return false;
    this.state.pcieSlots[slotIndex] = null;
    return true;
  }

  getUsedPcieSlots(): number {
    return this.state.pcieSlots.filter((s) => s !== null).length;
  }

  // --- 드라이브 베이 ---

  allocateDrive(bayType: "2.5" | "3.5", bayIndex: number, partId: string, partName: string): boolean {
    const bays = bayType === "2.5" ? this.state.driveBays25 : this.state.driveBays35;
    const total = bayType === "2.5" ? this.state.totalDriveBays25 : this.state.totalDriveBays35;
    if (bayIndex < 0 || bayIndex >= total) return false;
    if (bays[bayIndex] !== null) return false;
    bays[bayIndex] = { slotIndex: bayIndex, partId, partName };
    return true;
  }

  getUsedDriveBays(bayType: "2.5" | "3.5"): number {
    const bays = bayType === "2.5" ? this.state.driveBays25 : this.state.driveBays35;
    return bays.filter((b) => b !== null).length;
  }

  // --- 전체 리셋 ---

  reset(): void {
    this.state.memorySlots.fill(null);
    this.state.pcieSlots.fill(null);
    this.state.driveBays25.fill(null);
    this.state.driveBays35.fill(null);
  }
}
