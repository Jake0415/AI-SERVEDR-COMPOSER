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
];
