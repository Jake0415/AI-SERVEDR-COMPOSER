// ============================================================
// 호환성 규칙 매트릭스 — 코드 기반 규칙 정의 (변경 빈도 낮음)
// ============================================================

import type { CompatibilityRule } from "@/lib/types/compatibility";

/**
 * 서버 부품 간 호환성 검증 규칙 12개
 * - block: 설치 불가 (반드시 해결 필요)
 * - warn: 비권장 (성능 저하 가능)
 */
export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  // C001: CPU ↔ 메인보드 소켓
  {
    id: "C001",
    source_category: "cpu",
    target_category: "motherboard",
    rule_type: "socket",
    source_field: "socket",
    target_field: "socket",
    match_type: "exact",
    error_level: "block",
    message_ko: "CPU 소켓 타입이 메인보드와 일치하지 않습니다.",
  },
  // C002: CPU ↔ 메모리 DDR 세대
  {
    id: "C002",
    source_category: "cpu",
    target_category: "memory",
    rule_type: "memory_type",
    source_field: "memory_type",
    target_field: "type",
    match_type: "exact",
    error_level: "block",
    message_ko: "CPU가 지원하는 메모리 타입(DDR 세대)이 일치하지 않습니다.",
  },
  // C003: CPU ↔ 메모리 속도
  {
    id: "C003",
    source_category: "cpu",
    target_category: "memory",
    rule_type: "memory_speed",
    source_field: "max_memory_speed_mhz",
    target_field: "speed_mhz",
    match_type: "gte",
    error_level: "warn",
    message_ko: "메모리 속도가 CPU 최대 지원 속도를 초과합니다. 다운클럭 되어 동작합니다.",
  },
  // C004: CPU 채널 ↔ 메인보드 슬롯
  {
    id: "C004",
    source_category: "cpu",
    target_category: "motherboard",
    rule_type: "memory_channels",
    source_field: "memory_channels",
    target_field: "memory_slots",
    match_type: "lte",
    error_level: "warn",
    message_ko: "메인보드 메모리 슬롯 수가 CPU 메모리 채널 수에 비해 부족할 수 있습니다.",
  },
  // C005: SSD 인터페이스 ↔ 메인보드
  {
    id: "C005",
    source_category: "ssd",
    target_category: "motherboard",
    rule_type: "interface",
    source_field: "interface",
    target_field: "storage_interfaces",
    match_type: "includes",
    error_level: "block",
    message_ko: "SSD 인터페이스를 메인보드가 지원하지 않습니다.",
  },
  // C006: SSD PCIe 세대 ↔ CPU
  {
    id: "C006",
    source_category: "ssd",
    target_category: "cpu",
    rule_type: "pcie_gen",
    source_field: "pcie_gen",
    target_field: "pcie_version",
    match_type: "lte",
    error_level: "warn",
    message_ko: "SSD의 PCIe 세대가 CPU보다 높아 대역폭이 제한됩니다.",
  },
  // C007: GPU PCIe ↔ CPU
  {
    id: "C007",
    source_category: "gpu",
    target_category: "cpu",
    rule_type: "pcie_gen",
    source_field: "pcie_version",
    target_field: "pcie_version",
    match_type: "lte",
    error_level: "warn",
    message_ko: "GPU의 PCIe 버전이 CPU보다 높아 대역폭이 제한됩니다.",
  },
  // C008: GPU 폼팩터 ↔ 섀시
  {
    id: "C008",
    source_category: "gpu",
    target_category: "chassis",
    rule_type: "form_factor",
    source_field: "form_factor",
    target_field: "gpu_support",
    match_type: "includes",
    error_level: "block",
    message_ko: "GPU 폼팩터를 섀시가 지원하지 않습니다. 물리적으로 장착 불가합니다.",
  },
  // C009: RAID 인터페이스 ↔ 스토리지
  {
    id: "C009",
    source_category: "raid",
    target_category: "hdd",
    rule_type: "interface",
    source_field: "supported_interfaces",
    target_field: "interface",
    match_type: "includes",
    error_level: "block",
    message_ko: "RAID 컨트롤러가 해당 스토리지 인터페이스를 지원하지 않습니다.",
  },
  // C010: 총 TDP ↔ PSU 용량
  {
    id: "C010",
    source_category: "_total_power",
    target_category: "psu",
    rule_type: "power",
    source_field: "recommended_psu_w",
    target_field: "capacity_w",
    match_type: "lte",
    error_level: "block",
    message_ko: "PSU 용량이 시스템 권장 전력보다 부족합니다.",
  },
  // C011: NIC 버스 ↔ 메인보드 PCIe 슬롯
  {
    id: "C011",
    source_category: "nic",
    target_category: "motherboard",
    rule_type: "pcie_slot",
    source_field: "bus_interface",
    target_field: "pcie_slots",
    match_type: "includes",
    error_level: "block",
    message_ko: "NIC를 장착할 수 있는 PCIe 슬롯이 메인보드에 없습니다.",
  },
  // C012: 총 메모리 ↔ CPU 최대 메모리
  {
    id: "C012",
    source_category: "_total_memory",
    target_category: "cpu",
    rule_type: "memory_capacity",
    source_field: "total_memory_gb",
    target_field: "max_memory_gb",
    match_type: "lte",
    error_level: "block",
    message_ko: "총 메모리 용량이 CPU 최대 지원 메모리를 초과합니다.",
  },

  // === Phase 3.5 추가 규칙 (C013~C020) ===

  // C013: 메모리 슬롯 초과
  {
    id: "C013",
    source_category: "_total_memory",
    target_category: "motherboard",
    rule_type: "slot_count",
    source_field: "dimm_count",
    target_field: "memory_slots",
    match_type: "lte",
    error_level: "block",
    message_ko: "메모리 모듈 수가 메인보드의 DIMM 슬롯 수를 초과합니다.",
  },
  // C014: PCIe 슬롯 초과
  {
    id: "C014",
    source_category: "_total_pcie",
    target_category: "motherboard",
    rule_type: "slot_count",
    source_field: "pcie_card_count",
    target_field: "pcie_slot_count",
    match_type: "lte",
    error_level: "block",
    message_ko: "PCIe 확장 카드 수가 메인보드의 PCIe 슬롯 수를 초과합니다.",
  },
  // C015: 드라이브 베이 초과
  {
    id: "C015",
    source_category: "_total_storage",
    target_category: "chassis",
    rule_type: "bay_count",
    source_field: "drive_count",
    target_field: "total_bays",
    match_type: "lte",
    error_level: "block",
    message_ko: "스토리지 드라이브 수가 섀시의 드라이브 베이 수를 초과합니다.",
  },
  // C016: 드라이브 폼팩터 불일치
  {
    id: "C016",
    source_category: "storage",
    target_category: "chassis",
    rule_type: "form_factor",
    source_field: "form_factor",
    target_field: "supported_form_factors",
    match_type: "contains",
    error_level: "block",
    message_ko: "드라이브 폼팩터가 섀시의 지원 베이와 맞지 않습니다.",
  },
  // C017: RDIMM/LRDIMM 혼합 금지
  {
    id: "C017",
    source_category: "memory",
    target_category: "memory",
    rule_type: "dimm_type",
    source_field: "dimm_type",
    target_field: "dimm_type",
    match_type: "exact",
    error_level: "block",
    message_ko: "서로 다른 DIMM 타입(RDIMM/LRDIMM)을 혼합하여 설치할 수 없습니다.",
  },
  // C018: 메모리 채널 불균등 경고
  {
    id: "C018",
    source_category: "_total_memory",
    target_category: "motherboard",
    rule_type: "channel_balance",
    source_field: "channel_distribution",
    target_field: "memory_channels",
    match_type: "balanced",
    error_level: "warn",
    message_ko: "메모리가 채널별로 균등하게 배치되지 않았습니다. 성능 저하가 발생할 수 있습니다.",
  },
  // C019: PSU 폼팩터 불일치
  {
    id: "C019",
    source_category: "psu",
    target_category: "chassis",
    rule_type: "form_factor",
    source_field: "form_factor",
    target_field: "psu_form_factor",
    match_type: "exact",
    error_level: "block",
    message_ko: "PSU 폼팩터가 섀시와 호환되지 않습니다.",
  },
  // C020: GPU 물리적 크기 제한
  {
    id: "C020",
    source_category: "gpu",
    target_category: "chassis",
    rule_type: "physical_size",
    source_field: "length_mm",
    target_field: "max_gpu_length_mm",
    match_type: "lte",
    error_level: "block",
    message_ko: "GPU 길이가 섀시의 최대 허용 GPU 길이를 초과합니다.",
  },
];
