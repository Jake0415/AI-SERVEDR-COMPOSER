// ============================================================
// Server-Parts-template.xlsx 생성 스크립트
// 실행: node scripts/generate-server-parts-template.mjs
// ============================================================

import ExcelJS from "exceljs";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

const TEMPLATE_PATH = join(process.cwd(), "template-doc", "Server-Parts-template.xlsx");
const DESKTOP_PATH = "C:\\Users\\dd\\Desktop\\테스트 데이터\\Server-Parts-template.xlsx";

// ── 파트코드 참조 데이터 (seed-data.mjs 기반) ──
const partCodes = [
  // [코드, 분류명, 레벨, 상위코드]
  ["CP", "CPU", 1, ""],
  ["CP-001", "프로세서", 2, "CP"],
  ["MM", "메모리", 1, ""],
  ["MM-001", "RAM", 2, "MM"],
  ["ST", "스토리지", 1, ""],
  ["ST-001", "HDD", 2, "ST"],
  ["ST-002", "SSD", 2, "ST"],
  ["ST-003", "NVMe SSD", 2, "ST"],
  ["ST-004", "디스크 베이", 2, "ST"],
  ["ST-005", "RAID 카드", 2, "ST"],
  ["ST-006", "HBA 카드", 2, "ST"],
  ["ST-007", "NVMe 확장 카드", 2, "ST"],
  ["GP", "GPU", 1, ""],
  ["GP-001", "GPU 카드", 2, "GP"],
  ["NE", "네트워크", 1, ""],
  ["NE-001", "NIC", 2, "NE"],
  ["NE-002", "RDMA NIC", 2, "NE"],
  ["NE-003", "DPDK 가속 카드", 2, "NE"],
  ["EX", "확장", 1, ""],
  ["EX-001", "PCIe 슬롯", 2, "EX"],
  ["PO", "전원", 1, ""],
  ["PO-001", "파워 서플라이", 2, "PO"],
  ["CL", "쿨링", 1, ""],
  ["CL-001", "팬", 2, "CL"],
  ["MG", "관리", 1, ""],
  ["MG-001", "BMC/iDRAC/iLO", 2, "MG"],
  ["SE", "보안", 1, ""],
  ["SE-001", "TPM 모듈", 2, "SE"],
  ["AC", "가속기", 1, ""],
  ["AC-001", "FPGA 카드", 2, "AC"],
  ["MB", "메인보드", 1, ""],
  ["MB-001", "서버 메인보드", 2, "MB"],
];

// ── 테스트 데이터 (41행) ──
// [파트코드, 모델명, 제조사, 리스트가, 시장가, 공급가, 코어/채널, 클럭/속도, 용량, 인터페이스, TDP/전원, 비고]
const testData = [
  // CPU (8행)
  ["CP-001", "Xeon Gold 6430", "Intel", 3200000, 2900000, 2500000, "32C/64T", "2.1GHz", "", "LGA4677", "270W", "4세대 Sapphire Rapids"],
  ["CP-001", "Xeon Gold 6448Y", "Intel", 3800000, 3400000, 2900000, "32C/64T", "2.1GHz", "", "LGA4677", "225W", "4세대 Sapphire Rapids"],
  ["CP-001", "Xeon Platinum 8480+", "Intel", 8500000, 7800000, 6800000, "56C/112T", "2.0GHz", "", "LGA4677", "350W", "4세대 최상위"],
  ["CP-001", "Xeon Silver 4410Y", "Intel", 680000, 620000, 530000, "12C/24T", "2.0GHz", "", "LGA4677", "150W", "엔트리 서버"],
  ["CP-001", "EPYC 9654", "AMD", 11000000, 10200000, 8800000, "96C/192T", "2.4GHz", "", "SP5", "360W", "Genoa 최상위"],
  ["CP-001", "EPYC 9454", "AMD", 5500000, 5000000, 4300000, "48C/96T", "2.75GHz", "", "SP5", "290W", "Genoa 범용"],
  ["CP-001", "EPYC 9124", "AMD", 1200000, 1080000, 920000, "16C/32T", "3.0GHz", "", "SP5", "200W", "Genoa 엔트리"],
  ["CP-001", "EPYC 9254", "AMD", 2200000, 2000000, 1700000, "24C/48T", "2.9GHz", "", "SP5", "200W", "Genoa 밸류"],

  // 메모리 (6행)
  ["MM-001", "M321R8GA0BB0-CQKZJ DDR5-4800 64GB RDIMM", "Samsung", 350000, 310000, 270000, "1Rx4", "4800MHz", "64GB", "DDR5 RDIMM", "1.1V", "ECC Registered"],
  ["MM-001", "M321R4GA3BB6-CQKZJ DDR5-4800 32GB RDIMM", "Samsung", 180000, 160000, 138000, "2Rx8", "4800MHz", "32GB", "DDR5 RDIMM", "1.1V", "ECC Registered"],
  ["MM-001", "HMCG94AGBRA084N DDR5-4800 128GB RDIMM", "SK hynix", 750000, 680000, 590000, "4Rx4", "4800MHz", "128GB", "DDR5 RDIMM", "1.1V", "고용량"],
  ["MM-001", "HMCG78AGBRA089N DDR5-4800 64GB RDIMM", "SK hynix", 340000, 300000, 260000, "2Rx4", "4800MHz", "64GB", "DDR5 RDIMM", "1.1V", "ECC Registered"],
  ["MM-001", "MTC40F2046S1RC48BA1 DDR5-4800 64GB RDIMM", "Micron", 345000, 305000, 265000, "2Rx4", "4800MHz", "64GB", "DDR5 RDIMM", "1.1V", "범용"],
  ["MM-001", "M321R2GA3PB6-CWMOD DDR5-5600 16GB RDIMM", "Samsung", 95000, 85000, 73000, "1Rx8", "5600MHz", "16GB", "DDR5 RDIMM", "1.1V", "엔트리"],

  // SSD (6행)
  ["ST-002", "PM9A3 3.84TB NVMe U.2", "Samsung", 850000, 770000, 660000, "", "6900/4100MB/s", "3.84TB", "NVMe U.2 PCIe4", "13W", "1 DWPD"],
  ["ST-002", "PM9A3 1.92TB NVMe U.2", "Samsung", 480000, 430000, 370000, "", "6900/4100MB/s", "1.92TB", "NVMe U.2 PCIe4", "12W", "1 DWPD"],
  ["ST-002", "PM893 3.84TB SATA", "Samsung", 520000, 470000, 400000, "", "560/530MB/s", "3.84TB", "SATA 2.5\"", "4W", "1 DWPD"],
  ["ST-002", "D7-P5620 3.2TB NVMe U.2", "Intel", 920000, 840000, 720000, "", "7000/4300MB/s", "3.2TB", "NVMe U.2 PCIe4", "25W", "3 DWPD 혼합워크로드"],
  ["ST-002", "7450 PRO 3.84TB NVMe U.2", "Micron", 780000, 700000, 600000, "", "6800/5300MB/s", "3.84TB", "NVMe U.2 PCIe4", "15W", "1 DWPD"],
  ["ST-002", "CM7-R 3.84TB NVMe E3.S", "Kioxia", 900000, 820000, 700000, "", "14000/7000MB/s", "3.84TB", "NVMe E3.S PCIe5", "25W", "1 DWPD PCIe5"],

  // HDD (4행)
  ["ST-001", "Exos X20 20TB SAS", "Seagate", 650000, 590000, 500000, "", "7200RPM", "20TB", "SAS 12Gb/s 3.5\"", "10.5W", "엔터프라이즈 니어라인"],
  ["ST-001", "Exos X18 18TB SAS", "Seagate", 550000, 490000, 420000, "", "7200RPM", "18TB", "SAS 12Gb/s 3.5\"", "10.1W", "엔터프라이즈 니어라인"],
  ["ST-001", "Ultrastar DC HC560 20TB SATA", "WD", 620000, 560000, 480000, "", "7200RPM", "20TB", "SATA 6Gb/s 3.5\"", "10.2W", "데이터센터"],
  ["ST-001", "MG10ACA20TE 20TB SATA", "Toshiba", 600000, 540000, 460000, "", "7200RPM", "20TB", "SATA 6Gb/s 3.5\"", "10W", "데이터센터"],

  // GPU (6행)
  ["GP-001", "H100 SXM 80GB", "NVIDIA", 45000000, 42000000, 38000000, "16896 CUDA", "1830MHz", "80GB HBM3", "SXM5", "700W", "Hopper 최상위"],
  ["GP-001", "H100 PCIe 80GB", "NVIDIA", 38000000, 35000000, 31000000, "14592 CUDA", "1620MHz", "80GB HBM2e", "PCIe Gen5 x16", "350W", "Hopper PCIe"],
  ["GP-001", "A100 PCIe 80GB", "NVIDIA", 16000000, 14500000, 12500000, "6912 CUDA", "1410MHz", "80GB HBM2e", "PCIe Gen4 x16", "300W", "Ampere 범용"],
  ["GP-001", "A100 SXM4 80GB", "NVIDIA", 18000000, 16500000, 14200000, "6912 CUDA", "1410MHz", "80GB HBM2e", "SXM4", "400W", "Ampere SXM"],
  ["GP-001", "L40S 48GB", "NVIDIA", 12000000, 11000000, 9500000, "18176 CUDA", "2520MHz", "48GB GDDR6", "PCIe Gen4 x16", "350W", "Ada Lovelace 추론"],
  ["GP-001", "A30 24GB", "NVIDIA", 8000000, 7200000, 6200000, "3584 CUDA", "1440MHz", "24GB HBM2", "PCIe Gen4 x16", "165W", "Ampere 엔트리AI"],

  // NIC (5행)
  ["NE-001", "E810-XXVDA2 25GbE", "Intel", 650000, 580000, 500000, "2포트", "25GbE", "", "SFP28 PCIe4 x8", "14.5W", "RDMA/RoCEv2 지원"],
  ["NE-001", "E810-CQDA2 100GbE", "Intel", 1200000, 1080000, 930000, "2포트", "100GbE", "", "QSFP28 PCIe4 x16", "22W", "100G 듀얼포트"],
  ["NE-001", "BCM57508 100GbE", "Broadcom", 1100000, 990000, 850000, "2포트", "100GbE", "", "QSFP28 PCIe4 x16", "20W", "NetXtreme-E"],
  ["NE-002", "ConnectX-7 200GbE", "Mellanox", 2800000, 2500000, 2150000, "2포트", "200GbE", "", "QSFP56 PCIe5 x16", "26W", "InfiniBand/Ethernet"],
  ["NE-002", "ConnectX-6 Dx 100GbE", "Mellanox", 1500000, 1350000, 1160000, "2포트", "100GbE", "", "QSFP56 PCIe4 x16", "22W", "SmartNIC 기능"],

  // RAID (3행)
  ["ST-005", "MegaRAID 9560-16i", "Broadcom", 1200000, 1080000, 920000, "16포트", "12Gb/s", "8GB 캐시", "SAS/SATA/NVMe PCIe4", "17W", "트라이모드"],
  ["ST-005", "MegaRAID 9560-8i", "Broadcom", 750000, 670000, 580000, "8포트", "12Gb/s", "4GB 캐시", "SAS/SATA PCIe4", "13W", "RAID 0/1/5/6/10/50/60"],
  ["ST-005", "SmartRAID 3200-8i", "Microchip", 700000, 630000, 540000, "8포트", "12Gb/s", "8GB 캐시", "SAS/SATA PCIe4", "12W", "maxCrypto 암호화"],

  // PSU (3행)
  ["PO-001", "CRPS 1600W 80+ Titanium", "Delta", 380000, 340000, 290000, "", "", "1600W", "CRPS", "1600W", "80 PLUS Titanium"],
  ["PO-001", "CRPS 2400W 80+ Titanium", "Delta", 520000, 470000, 400000, "", "", "2400W", "CRPS", "2400W", "80 PLUS Titanium"],
  ["PO-001", "CSU2000ADC 2000W", "Artesyn", 450000, 400000, 345000, "", "", "2000W", "CRPS", "2000W", "핫스왑 지원"],
];

async function generate() {
  const workbook = new ExcelJS.Workbook();

  // ── Sheet 1: 부품 데이터 ──
  const ws = workbook.addWorksheet("부품 데이터", {
    pageSetup: { orientation: "landscape" },
  });

  ws.columns = [
    { header: "파트코드 *", key: "partCode", width: 15 },
    { header: "모델명 *", key: "modelName", width: 42 },
    { header: "제조사 *", key: "manufacturer", width: 12 },
    { header: "리스트가", key: "listPrice", width: 14 },
    { header: "시장가", key: "marketPrice", width: 14 },
    { header: "공급가", key: "supplyPrice", width: 14 },
    { header: "코어/채널", key: "cores", width: 14 },
    { header: "클럭/속도", key: "frequency", width: 16 },
    { header: "용량", key: "capacity", width: 14 },
    { header: "인터페이스", key: "iface", width: 22 },
    { header: "TDP/전원", key: "tdp", width: 10 },
    { header: "비고", key: "note", width: 25 },
  ];

  // 헤더 스타일
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.height = 22;

  // 데이터 입력
  for (const row of testData) {
    const dataRow = ws.addRow(row);
    // 가격 컬럼 숫자 포맷
    [4, 5, 6].forEach((col) => {
      dataRow.getCell(col).numFmt = "#,##0";
    });
  }

  // 가격 열 포맷 (빈 행에도 적용, 최대 200행)
  for (let r = testData.length + 2; r <= 200; r++) {
    [4, 5, 6].forEach((col) => {
      ws.getRow(r).getCell(col).numFmt = "#,##0";
    });
  }

  // ── Sheet 2: 코드 참조 ──
  const refWs = workbook.addWorksheet("코드 참조");
  refWs.columns = [
    { header: "파트코드", key: "code", width: 14 },
    { header: "분류명", key: "name", width: 20 },
    { header: "레벨", key: "level", width: 8 },
    { header: "상위코드", key: "parent", width: 14 },
  ];

  const refHeader = refWs.getRow(1);
  refHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });

  for (const [code, name, level, parent] of partCodes) {
    const row = refWs.addRow({ code, name, level, parent: parent || "-" });
    if (level === 1) {
      row.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
      });
    }
  }

  // ── Sheet 3: 안내 ──
  const guideWs = workbook.addWorksheet("안내");
  guideWs.columns = [
    { header: "필드", key: "field", width: 18 },
    { header: "설명", key: "desc", width: 60 },
  ];

  const guideHeader = guideWs.getRow(1);
  guideHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
    cell.font = { bold: true, size: 10 };
  });

  const guideData = [
    ["파트코드 *", "\"코드 참조\" 시트의 Level 2 코드를 입력하세요. 예: CP-001, MM-001, ST-002"],
    ["모델명 *", "부품 모델명 (필수). 예: Xeon Gold 6430"],
    ["제조사 *", "제조사명 (필수). 예: Intel, AMD, Samsung"],
    ["리스트가", "제조사 공시 가격 (원, 숫자). 비워두면 0으로 등록"],
    ["시장가", "시장 거래 가격 (원, 숫자). 비워두면 0으로 등록"],
    ["공급가", "고객 공급 가격 (원, 숫자). 비워두면 0으로 등록"],
    ["코어/채널", "CPU 코어 수, 메모리 채널 수, NIC 포트 수 등"],
    ["클럭/속도", "CPU 클럭, 메모리 속도, 네트워크 속도 등"],
    ["용량", "메모리 용량, 스토리지 용량, GPU VRAM 등"],
    ["인터페이스", "소켓, DDR 규격, PCIe 규격, 폼팩터 등"],
    ["TDP/전원", "전력 소비량 (W)"],
    ["비고", "추가 정보, 특이사항"],
    ["", ""],
    ["[ 입력 규칙 ]", ""],
    ["", "1. 파트코드는 반드시 \"코드 참조\" 시트의 Level 2 코드를 사용하세요."],
    ["", "2. 파트코드, 모델명, 제조사는 필수 입력입니다."],
    ["", "3. 가격은 숫자만 입력하세요 (원 단위, 쉼표 없이)."],
    ["", "4. 동일 모델명+제조사 조합은 중복으로 판정하여 건너뜁니다."],
    ["", "5. 스펙 컬럼(G~L)은 선택사항이며, 값이 있으면 DB specs JSONB에 저장됩니다."],
  ];

  for (const [field, desc] of guideData) {
    guideWs.addRow({ field, desc });
  }

  // ── 파일 저장 ──
  const buffer = await workbook.xlsx.writeBuffer();
  const uint8 = new Uint8Array(buffer);

  // template-doc에 저장
  await writeFile(TEMPLATE_PATH, uint8);
  console.log(`template-doc 저장 완료: ${TEMPLATE_PATH}`);

  // 데스크톱 테스트 데이터 폴더에 저장
  try {
    await mkdir(dirname(DESKTOP_PATH), { recursive: true });
    await writeFile(DESKTOP_PATH, uint8);
    console.log(`데스크톱 저장 완료: ${DESKTOP_PATH}`);
  } catch (e) {
    console.warn(`데스크톱 저장 실패 (경로 확인): ${e.message}`);
  }

  console.log(`\n총 ${testData.length}행 테스트 데이터 포함`);
}

generate().catch(console.error);
