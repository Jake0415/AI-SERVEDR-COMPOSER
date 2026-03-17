# 서버 부품 DB 구축 전략 분석 리포트

> 작성일: 2026-03-17
> 목적: 서버/IT인프라 견적 SaaS를 위한 부품 DB 구축 전략 수립

---

## 1. 크롤링 대상 사이트 조사

### 1.1 서버 완제품 & 부품 스펙

#### Dell Technologies (PowerEdge 시리즈)
- **URL**: `https://www.dell.com/en-us/shop/dell-poweredge-servers/sc/servers`
- **제품 페이지 패턴**: `/en-us/shop/dell-poweredge-[model]/spd/poweredge-[model]/[sku]`
- **크롤링 가능성**: **낮음** - 403 차단 확인됨. Cloudflare/Bot 보호 적용. 동적 렌더링(React SPA).
- **수집 가능 데이터**: 모델명, CPU 옵션, 메모리 슬롯, 스토리지 베이, 폼팩터, 전원
- **대안**: Dell API(Partner Direct) 또는 PDF 스펙시트 파싱
- **법적 리스크**: 상업적 크롤링 제한 (ToS 위반 가능)

#### HPE (ProLiant 시리즈)
- **URL**: `https://buy.hpe.com/us/en/servers-systems/proliant-servers/c/702702`
- **제품 페이지 패턴**: `/us/en/compute/proliant-[type]-servers/proliant-[model]-[gen]-server/p/[sku]`
- **크롤링 가능성**: **낮음** - 403 차단 확인. Bot 보호 활성화.
- **수집 가능 데이터**: 모델명, QuickSpecs (PDF), 구성 옵션
- **대안**: HPE QuickSpecs PDF 다운로드 후 파싱, HPE Product Bulletin
- **법적 리스크**: 중간 (공개 스펙시트는 활용 가능)

#### Lenovo (ThinkSystem 시리즈)
- **URL**: `https://www.lenovo.com/us/en/servers-storage/servers/`
- **크롤링 가능성**: **낮음** - 동적 렌더링, 제품 데이터가 API 호출로 로드
- **수집 가능 데이터**: 모델명, 기본 스펙, 구성 옵션
- **대안**: Lenovo PSREF (Product Specifications Reference) 사이트 활용
- **법적 리스크**: 중간

#### Supermicro
- **URL**: `https://www.supermicro.com/en/products/`
- **제품 카테고리**: GPU 서버, 랙 서버, 블레이드 서버, 스토리지 서버
- **크롤링 가능성**: **중간** - 일부 404 반환되나 정적 페이지 존재
- **수집 가능 데이터**: 모델명, 마더보드 스펙, CPU/메모리 지원, 폼팩터
- **대안**: Supermicro Product Matrix (공개 PDF)
- **법적 리스크**: 낮음 (공개 스펙)

### 1.2 CPU/프로세서

#### Intel Xeon
- **URL**: `https://www.intel.com/content/www/us/en/products/details/processors/xeon.html`
- **개별 제품 패턴**: `/content/www/us/en/products/sku/[SKU번호]/[모델명]/specifications.html`
- **크롤링 가능성**: **높음** - ARK 사이트에 구조화된 데이터 제공
- **수집 가능 데이터**:
  - 제품명, 출시일, 총 코어수 (4~128코어)
  - 최대 터보 클럭 (최대 5.7GHz), 베이스 클럭 (1.8~4.0GHz)
  - 캐시 (12MB~504MB), TDP (55W~550W)
  - 소켓 타입 (FCLGA4710, FCLGA7529 등)
  - 가격 (로딩 방식이지만 존재)
- **현재 제품군**: Xeon 6, 5세대/4세대 Xeon Scalable, Xeon Max, Xeon W, Xeon D
- **카탈로그 규모**: 약 91개 제품 (비교 도구 제공)
- **법적 리스크**: 낮음 (공개 기술 스펙)

#### AMD EPYC
- **URL**: `https://www.amd.com/en/products/processors/server/epyc.html`
- **크롤링 가능성**: **중간** - 연결 불안정 확인됨, 동적 렌더링
- **수집 가능 데이터**: 모델명, 코어수, 클럭, TDP, 소켓, 가격(MSRP)
- **대안**: AMD Product Specifications 페이지 또는 제3자 데이터베이스
- **법적 리스크**: 낮음

### 1.3 메모리 (RAM)

#### Samsung Semiconductor
- **RDIMM URL**: `https://semiconductor.samsung.com/dram/module/rdimm/`
- **크롤링 가능성**: **중간** - 기본 스펙 페이지 접근 가능
- **수집 가능 데이터**:
  - 용량: 최대 256GB
  - 속도: 최대 6,400Mbps
  - 전압: 1.1V, 1.2V
  - 구성: x4/x8, 싱글/멀티 랭크
  - ECC 지원 여부
- **한계**: 개별 모델 번호/파트넘버 상세 목록은 제한적
- **법적 리스크**: 낮음

#### SK Hynix / Micron
- **URL**: 각 반도체 사이트의 서버 DRAM 카테고리
- **크롤링 가능성**: **중간** - 유사 구조
- **대안**: 유통사 사이트(다나와, Newegg 등)에서 실제 판매 모델 수집

### 1.4 스토리지

#### Samsung Enterprise SSD
- **URL**: `https://semiconductor.samsung.com/ssd/enterprise-ssd/`
- **개별 제품 패턴**: `/ssd/enterprise-ssd/[모델명]/` (예: `/ssd/enterprise-ssd/pm1763/`)
- **크롤링 가능성**: **높음** - 구조화된 제품 페이지 확인
- **현재 제품군**:
  | 모델 | 인터페이스 | 최대 읽기 속도 | 최대 용량 |
  |------|-----------|--------------|----------|
  | PM1763 | PCIe Gen6 | 28,400 MB/s | 61.44TB |
  | PM1753 | PCIe Gen5 | 14,500 MB/s | 30.72TB |
  | BM1743 | PCIe Gen5 | 12,500 MB/s | 30.72TB |
  | PM1743 | PCIe Gen5 | 14,000 MB/s | 15.36TB |
  | PM1653 | SAS 24Gbps | 4,200 MB/s | 30.72TB |
  | PM1733a | PCIe Gen4 | 7,500 MB/s | 30.72TB |
- **법적 리스크**: 낮음

#### Seagate Exos (Enterprise HDD)
- **URL**: `https://www.seagate.com/products/enterprise-drives/`
- **크롤링 가능성**: **낮음** - SSL 인증서 문제 확인
- **대안**: Seagate 공개 PDF 스펙시트, 유통사 데이터
- **법적 리스크**: 중간

#### Western Digital (Ultrastar)
- **URL**: `https://www.westerndigital.com/products/data-center-platforms`
- **크롤링 가능성**: **낮음** - 동적 렌더링, 실제 데이터 JS로 로드
- **대안**: WD 공개 스펙시트 PDF
- **법적 리스크**: 중간

### 1.5 네트워크 카드

#### Intel Ethernet
- **URL**: `https://www.intel.com/content/www/us/en/products/details/ethernet.html`
- **제품 패턴**: `/content/www/us/en/products/details/ethernet/[시리즈]/[모델].html`
- **크롤링 가능성**: **높음** - 구조화된 제품 목록 확인
- **현재 제품군**:
  - **800 시리즈**: E810 (최대 200GbE), E830 (최대 200GbE)
  - **700 시리즈**: XXV710 (40GbE), X710 (40GbE)
  - **600 시리즈**: E610 (10GBASE-T)
  - **500 시리즈**: X550 (10GBASE-T)
  - **1G 시리즈**: I350, I226, I225, I210
- **폼팩터**: PCIe, OCP (Open Compute Project)
- **법적 리스크**: 낮음

### 1.6 RAID 컨트롤러

#### Broadcom MegaRAID
- **URL**: `https://www.broadcom.com/products/storage/raid-controllers`
- **크롤링 가능성**: **낮음** - 동적 콘텐츠, JS 렌더링
- **수집 가능 데이터**: 모델명, RAID 레벨, 인터페이스, 캐시 크기
- **대안**: Broadcom 제품 카탈로그 PDF, 유통사 데이터
- **법적 리스크**: 중간

### 1.7 GPU (AI/HPC용)

#### NVIDIA Data Center GPU
- **URL**: `https://www.nvidia.com/en-us/data-center/products/`
- **개별 제품 패턴**: `/en-us/data-center/[제품명]/` (예: `/en-us/data-center/h100/`)
- **크롤링 가능성**: **중간** - 제품 개요 페이지 접근 가능, 상세 스펙 확인됨
- **H100 확인된 스펙**:
  - GPU 메모리: 80GB (SXM) / 94GB (NVL)
  - 메모리 대역폭: 3.35TB/s ~ 3.9TB/s
  - FP64: 34 TFLOPS, FP32: 67 TFLOPS
  - TDP: 350W~700W
  - NVLink: 최대 900GB/s
  - Multi-Instance GPU: 최대 7개 구성
  - 폼팩터: SXM / PCIe 듀얼슬롯
- **제품 아키텍처**: Blackwell, Hopper, Ada Lovelace
- **주요 제품**: GB300 NVL72, GB200 NVL72, H100, L40S, A100
- **가격 정보**: 페이지에 미표시 (별도 견적)
- **법적 리스크**: 낮음 (공개 스펙)

### 1.8 한국 가격 비교/유통 사이트

#### 다나와 (danawa.com)
- **URL 패턴**: `https://prod.danawa.com/list/?cate=[카테고리번호]`
- **크롤링 가능성**: **중간** - 리다이렉트 및 동적 렌더링 존재
- **수집 가능 데이터**: 제품명, 최저가, 판매처 목록, 스펙 비교
- **카테고리 구조**: 계층형 (컴퓨터 > 서버 > CPU/메모리/스토리지)
- **법적 리스크**: **높음** - 가격 데이터 상업적 사용 시 ToS 위반 가능

#### 컴퓨존 (compuzone.co.kr)
- **URL**: `https://www.compuzone.co.kr/`
- **크롤링 가능성**: **낮음** - 리다이렉트 구조, 동적 렌더링
- **법적 리스크**: 높음

#### 나라장터 (g2b.go.kr)
- **URL**: `https://www.g2b.go.kr/`
- **크롤링 가능성**: **낮음** - 인증 필요, 복잡한 세션 관리
- **수집 가능 데이터**: 공공조달 계약 가격 (공개 정보)
- **법적 리스크**: 낮음 (공공 데이터)

### 1.9 크롤링 가능성 종합 평가

| 사이트 | 크롤링 난이도 | 데이터 품질 | 추천도 |
|--------|-------------|-----------|--------|
| Intel (Xeon/Ethernet) | ★☆☆ 쉬움 | ★★★ 높음 | **최우선** |
| Samsung SSD | ★☆☆ 쉬움 | ★★★ 높음 | **최우선** |
| Samsung DRAM | ★★☆ 보통 | ★★☆ 보통 | 권장 |
| NVIDIA GPU | ★★☆ 보통 | ★★★ 높음 | 권장 |
| Intel Ethernet | ★☆☆ 쉬움 | ★★★ 높음 | 권장 |
| Dell/HPE/Lenovo | ★★★ 어려움 | ★★★ 높음 | PDF 파싱 대안 |
| 다나와 | ★★☆ 보통 | ★★★ 높음 | 가격 참조용 |
| Supermicro | ★★☆ 보통 | ★★☆ 보통 | 선택적 |
| Broadcom RAID | ★★★ 어려움 | ★★☆ 보통 | PDF 대안 |

---

## 2. 부품 카테고리별 데이터 스키마

### 2.1 공통 필드 (모든 부품)

```typescript
interface CommonPartFields {
  // 식별 정보
  id: string;                    // UUID
  partNumber: string;            // 제조사 파트넘버 (예: "INTEL-XEON-6980P")
  manufacturer: string;          // 제조사 (예: "Intel", "Samsung")
  brand: string;                 // 브랜드 (예: "Xeon", "EPYC")
  model: string;                 // 모델명
  category: PartCategory;        // 부품 카테고리 (enum)
  subCategory: string;           // 세부 카테고리

  // 기본 정보
  name: string;                  // 표시명
  description: string;           // 설명
  generation: string;            // 세대 (예: "5th Gen", "DDR5")
  releaseDate: Date;             // 출시일
  endOfLife: boolean;            // 단종 여부
  eolDate?: Date;                // 단종 예정일

  // 가격 정보 (섹션 2.6 참조)
  pricing: PricingInfo;

  // 메타데이터
  specSheetUrl?: string;         // 스펙시트 URL
  imageUrl?: string;             // 제품 이미지
  sourceUrl: string;             // 데이터 출처 URL
  lastUpdated: Date;             // 최종 업데이트
  dataSource: DataSource;        // 데이터 출처 (enum: CRAWLED, MANUAL, API)
  isVerified: boolean;           // 검증 여부
}

enum PartCategory {
  CPU = 'CPU',
  MEMORY = 'MEMORY',
  SSD = 'SSD',
  HDD = 'HDD',
  NIC = 'NIC',
  RAID = 'RAID',
  GPU = 'GPU',
  PSU = 'PSU',
  CHASSIS = 'CHASSIS',
  MOTHERBOARD = 'MOTHERBOARD',
}
```

### 2.2 CPU 전용 필드

```typescript
interface CpuPart extends CommonPartFields {
  // 성능 스펙
  cores: number;                  // 총 코어수
  threads: number;                // 총 스레드수
  baseClock: number;              // 베이스 클럭 (GHz)
  boostClock: number;             // 부스트/터보 클럭 (GHz)
  cache: {
    l2: string;                   // L2 캐시
    l3: string;                   // L3 캐시 (예: "504MB")
  };

  // 플랫폼 스펙
  socket: string;                 // 소켓 타입 (예: "FCLGA4710")
  tdp: number;                    // TDP (W)
  maxTdp?: number;                // 최대 TDP (구성 가능 시)
  memorySupport: {
    type: string[];               // DDR4, DDR5
    maxSpeed: number;             // 최대 속도 (MHz)
    maxCapacity: string;          // 최대 용량
    channels: number;             // 메모리 채널 수
  };

  // 기능
  pcieVersion: string;            // PCIe 버전
  pcieLanes: number;              // PCIe 레인 수
  architecture: string;           // 아키텍처 (예: "Granite Rapids")
  lithography: string;            // 공정 (예: "Intel 3")
  maxCpuPerSystem: number;        // 시스템당 최대 CPU 수

  // 벤치마크 (선택)
  benchmarks?: {
    specInt?: number;
    specFp?: number;
  };
}
```

### 2.3 메모리(RAM) 전용 필드

```typescript
interface MemoryPart extends CommonPartFields {
  // 기본 스펙
  type: 'DDR4' | 'DDR5';
  moduleType: 'RDIMM' | 'LRDIMM' | 'UDIMM' | 'NVDIMM';
  capacity: number;               // 용량 (GB)
  speed: number;                  // 속도 (MHz, 예: 4800, 5600, 6400)

  // 상세 스펙
  voltage: number;                // 전압 (V)
  cas: number;                    // CAS Latency
  ecc: boolean;                   // ECC 지원
  rank: 'Single' | 'Dual' | 'Quad' | 'Octa';
  organization: 'x4' | 'x8';     // 데이터 폭

  // 물리 스펙
  formFactor: 'DIMM' | 'SO-DIMM';
  height: string;                 // 높이 (Low Profile 등)
  pinCount: number;               // 핀 수 (예: 288, 288)

  // 호환성
  compatiblePlatforms: string[];  // 호환 플랫폼 목록
}
```

### 2.4 스토리지 전용 필드

```typescript
interface SsdPart extends CommonPartFields {
  // 기본 스펙
  capacity: number;               // 용량 (GB/TB)
  capacityUnit: 'GB' | 'TB';
  interface: 'NVMe' | 'SATA' | 'SAS';
  pcieGen?: 'Gen3' | 'Gen4' | 'Gen5' | 'Gen6';
  formFactor: '2.5"' | 'M.2' | 'U.2' | 'U.3' | 'E1.S' | 'E3.S' | 'EDSFF';

  // 성능
  seqRead: number;                // 순차 읽기 (MB/s)
  seqWrite: number;               // 순차 쓰기 (MB/s)
  randomReadIops: number;         // 랜덤 읽기 IOPS
  randomWriteIops: number;        // 랜덤 쓰기 IOPS
  latencyRead?: number;           // 읽기 지연 (μs)
  latencyWrite?: number;          // 쓰기 지연 (μs)

  // 내구성
  dwpd: number;                   // DWPD (Drive Writes Per Day)
  tbw: number;                    // TBW (Total Bytes Written, TB)
  mtbf: number;                   // MTBF (시간)

  // 전력
  powerRead: number;              // 읽기 시 전력 (W)
  powerWrite: number;             // 쓰기 시 전력 (W)
  powerIdle: number;              // 유휴 전력 (W)

  // 보안/기능
  encryption: boolean;            // 하드웨어 암호화
  workloadType: 'Mixed' | 'Read-Intensive' | 'Write-Intensive';
}

interface HddPart extends CommonPartFields {
  capacity: number;               // 용량 (TB)
  interface: 'SATA' | 'SAS';
  formFactor: '3.5"' | '2.5"';
  rpm: number;                    // RPM (7200, 10000, 15000)
  cacheSize: number;              // 캐시 (MB)
  transferRate: number;           // 전송 속도 (MB/s)
  mtbf: number;                   // MTBF
  powerOperating: number;         // 동작 전력 (W)
  powerIdle: number;              // 유휴 전력 (W)
  workload: string;               // 연간 워크로드 (TB/yr)
  heliumSealed: boolean;          // 헬륨 밀봉 여부
}
```

### 2.5 네트워크 카드, RAID, GPU 전용 필드

```typescript
interface NicPart extends CommonPartFields {
  speed: string;                  // 속도 (예: "10GbE", "25GbE", "100GbE")
  maxSpeed: number;               // 최대 속도 (Gbps)
  portCount: number;              // 포트 수
  portType: string;               // 포트 타입 (RJ45, SFP+, SFP28, QSFP28)
  busInterface: string;           // PCIe x8 Gen3 등
  formFactor: 'PCIe' | 'OCP 3.0' | 'Mezzanine';
  controller: string;             // 컨트롤러 칩셋
  features: string[];             // SR-IOV, RDMA, iSCSI 등
  maxPower: number;               // 최대 전력 (W)
}

interface RaidPart extends CommonPartFields {
  raidLevels: string[];           // 지원 RAID 레벨 (0,1,5,6,10,50,60)
  interface: 'SAS' | 'SATA' | 'NVMe';
  maxDrives: number;              // 최대 드라이브 수
  cacheSize: number;              // 캐시 크기 (MB/GB)
  busInterface: string;           // PCIe 인터페이스
  ports: number;                  // 내부/외부 포트 수
  maxTransferRate: string;        // 최대 전송 속도
  batteryBackup: boolean;         // BBU/슈퍼캡 지원
  features: string[];             // CacheCade, FastPath 등
}

interface GpuPart extends CommonPartFields {
  // 성능
  memory: number;                 // GPU 메모리 (GB)
  memoryType: 'HBM2e' | 'HBM3' | 'HBM3e' | 'GDDR6';
  memoryBandwidth: number;        // 메모리 대역폭 (TB/s)
  fp64: number;                   // FP64 TFLOPS
  fp32: number;                   // FP32 TFLOPS
  tf32: number;                   // TF32 Tensor TFLOPS
  fp16: number;                   // FP16 TFLOPS
  fp8: number;                    // FP8 TFLOPS
  int8: number;                   // INT8 TOPS

  // 물리 스펙
  formFactor: 'SXM' | 'PCIe' | 'OAM';
  tdp: number;                    // TDP (W)
  maxTdp?: number;                // 구성 가능 최대 TDP
  cooling: 'Air' | 'Liquid';
  slotSize: string;               // PCIe 슬롯 크기

  // 연결성
  interconnect: string;           // NVLink, NVSwitch 등
  interconnectBandwidth: number;  // 인터커넥트 대역폭 (GB/s)
  pcieVersion: string;
  pcieBandwidth: number;          // PCIe 대역폭 (GB/s)

  // 기능
  multiInstanceGpu: number;       // MIG 인스턴스 수
  architecture: string;           // Hopper, Blackwell 등
  useCase: string[];              // AI Training, Inference, HPC 등
}
```

### 2.6 가격 관련 필드

```typescript
interface PricingInfo {
  // 공식 가격
  listPriceUsd: number;           // USD 리스트가 (MSRP)
  listPriceKrw: number;           // KRW 리스트가

  // 시장 가격 (크롤링)
  marketPriceKrw?: number;        // 한국 시장가 (다나와 등)
  marketPriceUsd?: number;        // 글로벌 시장가
  marketPriceDate?: Date;         // 시장가 조회일

  // 내부 가격 (가상 생성)
  costPrice: number;              // 원가 (매입가)
  supplyPrice: number;            // 공급가 (고객 판매가)
  marginRate: number;             // 마진율 (%)

  // 할인 체계
  volumeDiscounts: VolumeDiscount[];
  projectDiscount?: number;       // 프로젝트 할인율 (%)

  // 통화/환율
  currency: 'KRW' | 'USD';
  exchangeRate?: number;          // 적용 환율
}

interface VolumeDiscount {
  minQuantity: number;            // 최소 수량
  maxQuantity?: number;           // 최대 수량
  discountRate: number;           // 할인율 (%)
}
```

---

## 3. 가상 내부 가격 생성 전략

### 3.1 카테고리별 업계 평균 마진 구조

서버 부품 유통 업계의 일반적인 마진 구조를 기반으로 한 비율입니다.

| 카테고리 | 리스트가 대비 원가 비율 | 유통 마진 | 공급가 마진 | 비고 |
|---------|----------------------|----------|-----------|------|
| **CPU** | 65~75% | 8~15% | 15~25% | 고가 제품일수록 마진율 낮음 |
| **메모리(RAM)** | 75~85% | 5~10% | 10~18% | 시장 변동성 높음, 박리다매 |
| **SSD (Enterprise)** | 60~70% | 10~15% | 15~25% | 용량 클수록 마진율 높음 |
| **HDD (Enterprise)** | 70~80% | 8~12% | 12~20% | 성숙 시장, 안정적 마진 |
| **네트워크 카드** | 55~70% | 15~20% | 20~30% | 고속 NIC일수록 마진 높음 |
| **RAID 컨트롤러** | 50~65% | 15~25% | 25~35% | 고부가가치, 높은 마진 |
| **GPU (AI/HPC)** | 70~80% | 5~10% | 10~20% | 공급 부족 시 마진 축소 |
| **서버 완제품** | 55~70% | 10~20% | 15~30% | 구성에 따라 크게 변동 |

### 3.2 가상 가격 생성 알고리즘

```typescript
interface PriceGenerationConfig {
  category: PartCategory;
  costRatio: { min: number; max: number };   // 원가 비율 범위
  supplyMargin: { min: number; max: number }; // 공급 마진 범위
  volatility: number;                         // 가격 변동성 (0~1)
}

// 카테고리별 설정
const PRICE_CONFIGS: Record<PartCategory, PriceGenerationConfig> = {
  CPU: {
    category: 'CPU',
    costRatio: { min: 0.65, max: 0.75 },
    supplyMargin: { min: 0.15, max: 0.25 },
    volatility: 0.05,
  },
  MEMORY: {
    category: 'MEMORY',
    costRatio: { min: 0.75, max: 0.85 },
    supplyMargin: { min: 0.10, max: 0.18 },
    volatility: 0.15,  // 메모리는 변동성 높음
  },
  SSD: {
    category: 'SSD',
    costRatio: { min: 0.60, max: 0.70 },
    supplyMargin: { min: 0.15, max: 0.25 },
    volatility: 0.10,
  },
  HDD: {
    category: 'HDD',
    costRatio: { min: 0.70, max: 0.80 },
    supplyMargin: { min: 0.12, max: 0.20 },
    volatility: 0.05,
  },
  NIC: {
    category: 'NIC',
    costRatio: { min: 0.55, max: 0.70 },
    supplyMargin: { min: 0.20, max: 0.30 },
    volatility: 0.08,
  },
  RAID: {
    category: 'RAID',
    costRatio: { min: 0.50, max: 0.65 },
    supplyMargin: { min: 0.25, max: 0.35 },
    volatility: 0.05,
  },
  GPU: {
    category: 'GPU',
    costRatio: { min: 0.70, max: 0.80 },
    supplyMargin: { min: 0.10, max: 0.20 },
    volatility: 0.12,
  },
};

// 가격 생성 함수
function generatePricing(listPrice: number, config: PriceGenerationConfig): PricingInfo {
  // 1. 원가 계산 (범위 내 랜덤 + 변동성)
  const baseCostRatio = randomBetween(config.costRatio.min, config.costRatio.max);
  const volatilityAdjust = (Math.random() - 0.5) * 2 * config.volatility;
  const costRatio = clamp(baseCostRatio + volatilityAdjust, 0.40, 0.95);
  const costPrice = Math.round(listPrice * costRatio);

  // 2. 공급가 계산 (원가 + 공급 마진)
  const supplyMargin = randomBetween(config.supplyMargin.min, config.supplyMargin.max);
  const supplyPrice = Math.round(costPrice * (1 + supplyMargin));

  // 3. 수량 할인 체계 생성
  const volumeDiscounts = [
    { minQuantity: 1,   maxQuantity: 4,   discountRate: 0 },
    { minQuantity: 5,   maxQuantity: 19,  discountRate: 3 },    // 3% 할인
    { minQuantity: 20,  maxQuantity: 49,  discountRate: 5 },    // 5% 할인
    { minQuantity: 50,  maxQuantity: 99,  discountRate: 8 },    // 8% 할인
    { minQuantity: 100, maxQuantity: undefined, discountRate: 12 }, // 12% 할인
  ];

  return {
    listPriceKrw: listPrice,
    costPrice,
    supplyPrice,
    marginRate: ((supplyPrice - costPrice) / supplyPrice) * 100,
    volumeDiscounts,
  };
}
```

### 3.3 가격 예시

| 부품 | 리스트가(KRW) | 원가 | 공급가 | 마진율 |
|------|-------------|------|--------|--------|
| Intel Xeon 6980P (128코어) | ₩18,500,000 | ₩12,950,000 | ₩15,540,000 | 16.7% |
| Intel Xeon 6780E (144코어) | ₩11,200,000 | ₩7,840,000 | ₩9,408,000 | 16.7% |
| Samsung DDR5 64GB RDIMM | ₩450,000 | ₩360,000 | ₩410,000 | 12.2% |
| Samsung PM1743 3.84TB NVMe | ₩2,800,000 | ₩1,820,000 | ₩2,275,000 | 20.0% |
| NVIDIA H100 SXM 80GB | ₩45,000,000 | ₩33,750,000 | ₩39,375,000 | 14.3% |
| Intel E810 25GbE 2포트 | ₩850,000 | ₩510,000 | ₩663,000 | 23.1% |
| Broadcom MegaRAID 9560-8i | ₩1,200,000 | ₩660,000 | ₩891,000 | 25.9% |

### 3.4 프로젝트/특수 할인 구조

```typescript
interface ProjectDiscount {
  type: 'volume' | 'project' | 'partner' | 'education' | 'government';
  discountRange: { min: number; max: number };
}

const PROJECT_DISCOUNTS: ProjectDiscount[] = [
  { type: 'volume',     discountRange: { min: 3, max: 12 } },   // 수량 할인
  { type: 'project',    discountRange: { min: 5, max: 20 } },   // 프로젝트 할인
  { type: 'partner',    discountRange: { min: 10, max: 30 } },  // 파트너 할인
  { type: 'education',  discountRange: { min: 10, max: 25 } },  // 교육기관 할인
  { type: 'government', discountRange: { min: 5, max: 15 } },   // 공공기관 할인
];
```

---

## 4. 크롤링 기술 스택 제안

### 4.1 추천 기술 스택

```
┌─────────────────────────────────────────────────┐
│                  크롤링 파이프라인                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [수집 계층]                                     │
│  ├── Playwright (동적 사이트: Dell, HPE, 다나와)    │
│  ├── httpx + BeautifulSoup (정적 사이트: Intel ARK)│
│  └── PyPDF2/pdfplumber (PDF 스펙시트 파싱)         │
│                                                 │
│  [오케스트레이션]                                  │
│  ├── Scrapy (크롤링 프레임워크, 스케줄링)            │
│  └── Celery + Redis (비동기 작업 큐)               │
│                                                 │
│  [데이터 처리]                                    │
│  ├── Pandas (데이터 정규화/클리닝)                  │
│  ├── Pydantic (데이터 검증/스키마)                  │
│  └── 가격 생성 엔진 (커스텀)                        │
│                                                 │
│  [저장]                                          │
│  ├── PostgreSQL (메인 DB)                         │
│  ├── Redis (캐싱/중복 체크)                        │
│  └── S3/MinIO (PDF/이미지 저장)                    │
│                                                 │
│  [API/통합]                                      │
│  └── Next.js API Routes (견적 SaaS 연동)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.2 프레임워크별 역할

| 도구 | 용도 | 선택 이유 |
|------|------|---------|
| **Playwright** | 동적 사이트 크롤링 | Headless 브라우저, JS 렌더링 지원, Dell/HPE/다나와 대응 |
| **httpx + BS4** | 정적 사이트 크롤링 | 가볍고 빠름, Intel ARK/Samsung 대응 |
| **Scrapy** | 크롤링 오케스트레이션 | 미들웨어, 파이프라인, 중복 필터, 속도 제한 내장 |
| **pdfplumber** | PDF 파싱 | HPE QuickSpecs, Dell/Supermicro 스펙시트 |
| **Pydantic** | 데이터 검증 | TypeScript 스키마와 1:1 대응, 자동 검증 |
| **Pandas** | 데이터 클리닝 | 정규화, 단위 통일, 결측치 처리 |

### 4.3 데이터 정규화/클리닝 규칙

```python
# 데이터 정규화 규칙 예시

NORMALIZATION_RULES = {
    'capacity': {
        # 용량 단위 통일 → GB
        'patterns': [
            (r'(\d+)\s*TB', lambda m: int(m.group(1)) * 1024),
            (r'(\d+)\s*GB', lambda m: int(m.group(1))),
            (r'(\d+)\s*MB', lambda m: int(m.group(1)) / 1024),
        ]
    },
    'speed': {
        # 메모리 속도 → MHz
        'patterns': [
            (r'(\d+)\s*Mbps', lambda m: int(m.group(1)) / 8),
            (r'DDR5-(\d+)', lambda m: int(m.group(1))),
            (r'PC5-(\d+)', lambda m: int(m.group(1)) / 8),
        ]
    },
    'price': {
        # 가격 정규화 → KRW 정수
        'patterns': [
            (r'\$\s*([\d,]+)', lambda m: usd_to_krw(m.group(1))),
            (r'₩\s*([\d,]+)', lambda m: int(m.group(1).replace(',', ''))),
            (r'([\d,]+)\s*원', lambda m: int(m.group(1).replace(',', ''))),
        ]
    },
    'power': {
        # 전력 → W
        'patterns': [
            (r'(\d+)\s*[Ww]', lambda m: int(m.group(1))),
            (r'(\d+)\s*kW', lambda m: int(m.group(1)) * 1000),
        ]
    },
}
```

### 4.4 크롤링 주기 및 업데이트 전략

| 데이터 유형 | 업데이트 주기 | 이유 |
|-----------|------------|------|
| 제품 스펙 (CPU/GPU 등) | **월 1회** | 스펙은 거의 변하지 않음, 신제품 출시 시 |
| 시장 가격 | **주 1회** | 가격 변동 반영 (특히 메모리/SSD) |
| 신제품 감지 | **주 2회** | 카탈로그 페이지 변경 모니터링 |
| 단종 상태 | **월 1회** | EOL 정보 업데이트 |
| 환율 | **일 1회** | 가격 환산에 필요 |

### 4.5 초기 시드 데이터 규모 제안

| 카테고리 | 최소 모델 수 | 권장 모델 수 | 비고 |
|---------|------------|------------|------|
| CPU | 15 | 30 | Intel Xeon 10 + AMD EPYC 5 (최소) |
| 메모리 | 12 | 24 | DDR4/DDR5 × 용량(16/32/64/128GB) × 속도 |
| SSD | 15 | 30 | Samsung/Intel/Micron × 인터페이스 × 용량 |
| HDD | 8 | 15 | Seagate Exos/WD Ultrastar × 용량 |
| NIC | 8 | 15 | 1G/10G/25G/100G × Intel/Broadcom |
| RAID | 5 | 10 | Broadcom MegaRAID 주요 모델 |
| GPU | 6 | 12 | NVIDIA A100/H100/H200/L40S + AMD MI300X |
| **합계** | **69** | **136** | |

> **최소 69개 모델**로 MVP 견적 시스템 구동 가능. **136개 모델**이면 현실적인 견적 시나리오 대부분 커버.

---

## 5. 데이터 구축 로드맵

### Phase 1: 기반 구축 (1~2주)

**목표**: DB 스키마 구축 + 핵심 부품 시드 데이터

| 작업 | 상세 | 우선순위 |
|------|------|---------|
| DB 스키마 생성 | PostgreSQL 테이블, Prisma 스키마 정의 | P0 |
| **CPU 데이터 수집** | Intel Xeon (10개) + AMD EPYC (5개) | P0 |
| **메모리 데이터 수집** | DDR5 RDIMM 12개 모델 | P0 |
| 가격 생성 엔진 | 카테고리별 가상 가격 자동 생성 로직 | P0 |
| 환율 API 연동 | 원/달러 환율 자동 반영 | P1 |

**선정 이유**: CPU와 메모리는 모든 서버 견적의 필수 항목. Intel ARK는 크롤링이 가장 쉬운 소스.

### Phase 2: 스토리지 확장 (2~3주)

**목표**: SSD/HDD 데이터 + 크롤링 자동화

| 작업 | 상세 | 우선순위 |
|------|------|---------|
| **Enterprise SSD 수집** | Samsung PM 시리즈 15개 모델 | P0 |
| **Enterprise HDD 수집** | Seagate Exos + WD Ultrastar 8개 | P1 |
| 크롤러 자동화 | Scrapy + Playwright 파이프라인 구축 | P1 |
| PDF 파서 | HPE QuickSpecs, Dell 스펙시트 파싱 | P2 |

**선정 이유**: 스토리지는 견적에서 가격 비중이 높고 옵션이 다양. Samsung SSD는 크롤링 용이.

### Phase 3: 네트워크/RAID 추가 (3~4주)

**목표**: 네트워크 및 확장 카드 DB 완성

| 작업 | 상세 | 우선순위 |
|------|------|---------|
| **NIC 데이터 수집** | Intel Ethernet 8개 + Broadcom 4개 | P1 |
| **RAID 컨트롤러 수집** | Broadcom MegaRAID 5개 | P1 |
| 다나와 가격 크롤러 | 시장가 참조 데이터 수집 (합법 범위) | P2 |
| 호환성 매트릭스 | CPU-메모리-보드 호환성 데이터 구축 | P1 |

### Phase 4: GPU + 서버 완제품 (4~6주)

**목표**: AI/HPC GPU + 완제품 구성 템플릿

| 작업 | 상세 | 우선순위 |
|------|------|---------|
| **GPU 데이터 수집** | NVIDIA H100/H200/L40S 등 6개 | P1 |
| **서버 완제품 템플릿** | Dell/HPE/Lenovo 대표 구성 10개 | P2 |
| 견적 프리셋 | 용도별 서버 구성 추천 템플릿 | P2 |
| 데이터 검증 | 전체 데이터 정합성 점검 | P0 |

### Phase 5: 고도화 (6주~)

**목표**: 운영 품질 달성

| 작업 | 상세 | 우선순위 |
|------|------|---------|
| 자동 업데이트 | 크롤링 스케줄러 + 변경 감지 | P1 |
| 가격 히스토리 | 가격 변동 추적/차트 | P2 |
| 검색/필터 API | 부품 검색, 필터링, 비교 API | P1 |
| 관리자 UI | 부품 데이터 관리 화면 | P2 |
| 데이터 확장 | 전원공급장치, 케이블, 랙 등 | P3 |

---

## 6. 리스크 및 권고사항

### 6.1 법적 리스크 완화

1. **robots.txt 준수**: 모든 크롤러에서 robots.txt 체크 필수
2. **요청 속도 제한**: 사이트당 최소 2~5초 간격
3. **공개 데이터만 사용**: 로그인 필요 데이터 수집 금지
4. **가격 데이터 주의**: 다나와 등 한국 가격 비교 사이트는 상업적 사용 시 법적 문제 가능 → 참조용으로만 활용하고, 가상 가격 생성에 활용
5. **캐싱**: 동일 페이지 반복 접근 방지

### 6.2 기술적 권고

1. **수동 시드 데이터 우선**: Phase 1은 크롤링보다 공개 PDF/카탈로그에서 수동 입력이 더 빠르고 정확
2. **점진적 자동화**: 수동 → 반자동 → 완전 자동화 순서로 진행
3. **데이터 품질 > 수량**: 69개 정확한 데이터가 500개 부정확한 데이터보다 나음
4. **단위 통일 필수**: 모든 스펙 데이터는 표준 단위로 정규화 (GB, MHz, W, Gbps)

### 6.3 대안 데이터 소스

| 소스 | 설명 | 장점 |
|------|------|------|
| **제조사 PDF 스펙시트** | Dell, HPE, Lenovo 공개 PDF | 정확, 합법적 |
| **PCPartPicker** | 부품 비교 사이트 | 구조화된 데이터 |
| **ServeTheHome** | 서버 리뷰 사이트 | 실제 벤치마크, 가격 정보 |
| **TechPowerUp** | GPU/CPU 데이터베이스 | 상세 스펙, 비교 |
| **공공데이터포털** | data.go.kr | 공공조달 가격 (합법) |
