-- ============================================================
-- 기본 14개 부품 카테고리 시드 함수
-- 스키마: ai_server_composer
-- 테넌트 생성 시 호출: SELECT ai_server_composer.seed_default_categories('tenant-uuid');
-- ============================================================

CREATE OR REPLACE FUNCTION ai_server_composer.seed_default_categories(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_server_composer.part_categories (tenant_id, name, display_name, "group", spec_fields, is_default) VALUES

  -- 서버 부품 (11개)
  (p_tenant_id, 'cpu', 'CPU', 'server_parts',
   '[{"key":"cores","label":"코어 수","type":"number"},{"key":"threads","label":"스레드 수","type":"number"},{"key":"base_clock_ghz","label":"기본 클럭(GHz)","type":"number"},{"key":"boost_clock_ghz","label":"부스트 클럭(GHz)","type":"number"},{"key":"socket","label":"소켓","type":"text"},{"key":"tdp_w","label":"TDP(W)","type":"number"},{"key":"memory_type","label":"메모리 타입","type":"select","options":["DDR4","DDR5"]},{"key":"max_memory_gb","label":"최대 메모리(GB)","type":"number"},{"key":"max_memory_speed_mhz","label":"최대 메모리 속도(MHz)","type":"number"},{"key":"pcie_version","label":"PCIe 버전","type":"text"},{"key":"architecture","label":"아키텍처","type":"text"},{"key":"memory_channels","label":"메모리 채널","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'memory', '메모리', 'server_parts',
   '[{"key":"type","label":"타입","type":"select","options":["DDR4","DDR5"]},{"key":"module_type","label":"모듈","type":"select","options":["RDIMM","LRDIMM"]},{"key":"capacity_gb","label":"용량(GB)","type":"number"},{"key":"speed_mhz","label":"속도(MHz)","type":"number"},{"key":"ecc","label":"ECC","type":"select","options":["true","false"]},{"key":"rank","label":"랭크","type":"text"}]'::jsonb, true),

  (p_tenant_id, 'ssd', 'SSD', 'server_parts',
   '[{"key":"capacity_gb","label":"용량(GB)","type":"number"},{"key":"interface","label":"인터페이스","type":"select","options":["NVMe","SATA","SAS"]},{"key":"pcie_gen","label":"PCIe 세대","type":"text"},{"key":"form_factor","label":"폼팩터","type":"text"},{"key":"seq_read_mbps","label":"순차 읽기(MB/s)","type":"number"},{"key":"seq_write_mbps","label":"순차 쓰기(MB/s)","type":"number"},{"key":"dwpd","label":"DWPD","type":"number"},{"key":"tbw","label":"TBW","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'hdd', 'HDD', 'server_parts',
   '[{"key":"capacity_tb","label":"용량(TB)","type":"number"},{"key":"interface","label":"인터페이스","type":"select","options":["SATA","SAS"]},{"key":"rpm","label":"RPM","type":"number"},{"key":"cache_mb","label":"캐시(MB)","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'nic', 'NIC', 'server_parts',
   '[{"key":"speed_gbps","label":"속도(Gbps)","type":"number"},{"key":"port_count","label":"포트 수","type":"number"},{"key":"bus_interface","label":"버스 인터페이스","type":"text"},{"key":"form_factor","label":"폼팩터","type":"text"},{"key":"max_power_w","label":"최대 전력(W)","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'raid', 'RAID 컨트롤러', 'server_parts',
   '[{"key":"raid_levels","label":"RAID 레벨","type":"text"},{"key":"supported_interfaces","label":"지원 인터페이스","type":"text"},{"key":"max_drives","label":"최대 드라이브","type":"number"},{"key":"cache_mb","label":"캐시(MB)","type":"number"},{"key":"battery_backup","label":"배터리 백업","type":"select","options":["true","false"]},{"key":"power_w","label":"소비 전력(W)","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'gpu', 'GPU', 'server_parts',
   '[{"key":"vram_gb","label":"VRAM(GB)","type":"number"},{"key":"memory_type","label":"메모리 타입","type":"text"},{"key":"tdp_w","label":"TDP(W)","type":"number"},{"key":"pcie_version","label":"PCIe 버전","type":"text"},{"key":"form_factor","label":"폼팩터","type":"text"},{"key":"architecture","label":"아키텍처","type":"text"}]'::jsonb, true),

  (p_tenant_id, 'psu', 'PSU', 'server_parts',
   '[{"key":"capacity_w","label":"용량(W)","type":"number"},{"key":"efficiency","label":"효율","type":"text"},{"key":"redundancy","label":"이중화","type":"select","options":["1+1","2+1","2+2"]},{"key":"form_factor","label":"폼팩터","type":"text"}]'::jsonb, true),

  (p_tenant_id, 'motherboard', '메인보드', 'server_parts',
   '[{"key":"socket","label":"소켓","type":"text"},{"key":"memory_slots","label":"메모리 슬롯","type":"number"},{"key":"memory_type","label":"메모리 타입","type":"select","options":["DDR4","DDR5"]},{"key":"storage_interfaces","label":"스토리지 인터페이스","type":"text"},{"key":"pcie_slots","label":"PCIe 슬롯","type":"number"},{"key":"form_factor","label":"폼팩터","type":"text"}]'::jsonb, true),

  (p_tenant_id, 'chassis', '섀시', 'server_parts',
   '[{"key":"form_factor","label":"폼팩터","type":"text"},{"key":"u_size","label":"U 사이즈","type":"number"},{"key":"max_drive_bays","label":"최대 드라이브 베이","type":"number"},{"key":"gpu_support","label":"GPU 지원","type":"text"},{"key":"max_psu","label":"최대 PSU 수","type":"number"}]'::jsonb, true),

  (p_tenant_id, 'hba', 'HBA', 'server_parts',
   '[{"key":"port_count","label":"포트 수","type":"number"},{"key":"interface","label":"인터페이스","type":"text"},{"key":"speed_gbps","label":"속도(Gbps)","type":"number"}]'::jsonb, true),

  -- 네트워크·인프라 (3개)
  (p_tenant_id, 'switch', '스위치', 'network_infra',
   '[{"key":"port_count","label":"포트 수","type":"number"},{"key":"speed_gbps","label":"속도(Gbps)","type":"number"},{"key":"managed_type","label":"관리 타입","type":"select","options":["managed","unmanaged","smart"]},{"key":"stackable","label":"스태커블","type":"select","options":["true","false"]}]'::jsonb, true),

  (p_tenant_id, 'transceiver', '광 트랜시버', 'network_infra',
   '[{"key":"type","label":"타입","type":"text"},{"key":"speed_gbps","label":"속도(Gbps)","type":"number"},{"key":"reach_km","label":"도달 거리(km)","type":"number"},{"key":"wavelength","label":"파장","type":"text"}]'::jsonb, true),

  (p_tenant_id, 'cable', '케이블', 'network_infra',
   '[{"key":"type","label":"타입","type":"text"},{"key":"length_m","label":"길이(m)","type":"number"},{"key":"connector","label":"커넥터","type":"text"},{"key":"category","label":"카테고리","type":"text"}]'::jsonb, true);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
