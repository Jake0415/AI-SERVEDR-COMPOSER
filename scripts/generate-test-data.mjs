import ExcelJS from "exceljs";

const filePath = "template-doc/IT-Infra-equipments-template.xlsx";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);

const ws = wb.getWorksheet("장비 데이터");

// 기존 데이터 행 삭제 (헤더 제외)
while (ws.rowCount > 1) ws.spliceRows(2, 1);

const data = [
  // === X86 서버 리눅스 (CM-01-001) — 10개 ===
  ["CM-01-001","PowerEdge R350","Dell",2,4200000,3800000,3200000,"Xeon E-2434 4Core 3.4GHz x1","16GB DDR5","480GB SSD x2","1G UTP 4포트","350W","엔트리 1U 서버"],
  ["CM-01-001","ProLiant DL20 Gen11","HPE",2,4800000,4300000,3600000,"Xeon E-2436 6Core 2.9GHz x1","32GB DDR5","960GB SSD x2","1G UTP 4포트","500W","엔트리 1U 서버"],
  ["CM-01-001","PowerEdge R760","Dell",3,8500000,7200000,6100000,"Xeon Gold 5416S 16Core 2.0GHz x2","64GB DDR5","480GB SSD x2","1G UTP 8포트, 10G SFP+ 2포트","800W Platinum 이중화","2U 범용 서버"],
  ["CM-01-001","ProLiant DL380 Gen11","HPE",3,9200000,7800000,6600000,"Xeon Gold 5418Y 24Core 2.0GHz x2","64GB DDR5","960GB SSD x2","1G UTP 8포트, 10G SFP+ 4포트","800W Platinum 이중화","2U 범용 서버"],
  ["CM-01-001","ThinkSystem SR650 V3","Lenovo",3,8800000,7500000,6300000,"Xeon Gold 5416S 16Core 2.0GHz x2","64GB DDR5","480GB SSD x2","1G UTP 4포트, 10G SFP+ 4포트","750W Titanium 이중화","2U 범용 서버"],
  ["CM-01-001","PRIMERGY RX2540 M7","Fujitsu",2,9500000,8200000,6900000,"Xeon Gold 5418Y 24Core 2.0GHz x2","128GB DDR5","960GB SSD x2","1G UTP 8포트, 10G SFP+ 4포트","900W Platinum 이중화","2U 범용 서버"],
  ["CM-01-001","PowerEdge R760 고사양","Dell",3,15000000,13000000,11000000,"Xeon Gold 6430 32Core 2.1GHz x2","256GB DDR5","480GB SSD x2","1G UTP 8포트, 25G SFP28 4포트","1400W Titanium 이중화","2U 고성능 응용서버"],
  ["CM-01-001","ProLiant DL380 Gen11 고사양","HPE",3,16500000,14200000,12000000,"Xeon Gold 6438Y+ 32Core 2.0GHz x2","256GB DDR5","960GB SSD x4","1G UTP 8포트, 25G SFP28 4포트","1600W Titanium 이중화","2U 고성능 DB서버"],
  ["CM-01-001","ThinkSystem SR650 V3 고사양","Lenovo",1,14500000,12500000,10500000,"Xeon Gold 6430 32Core 2.1GHz x2","128GB DDR5","NVMe 1.92TB x2, SSD 480GB x2","1G UTP 8포트, 25G SFP28 2포트","1100W Titanium 이중화","2U DB서버급"],
  ["CM-01-001","PowerEdge R660","Dell",1,7800000,6800000,5700000,"Xeon Silver 4416+ 20Core 2.0GHz x2","64GB DDR5","480GB SSD x2","1G UTP 4포트, 10G SFP+ 2포트","700W Platinum 이중화","1U 컴팩트 성능관리"],

  // === X86 서버 윈도우 (CM-01-002) — 3개 ===
  ["CM-01-002","PowerEdge T560","Dell",1,6500000,5500000,4600000,"Xeon Silver 4410Y 12Core 2.0GHz x1","32GB DDR5","480GB SSD x2, 2TB HDD x4","1G UTP 8포트, HBA 32G Dual x2","800W","타워형 백업서버+Windows"],
  ["CM-01-002","ProLiant ML350 Gen11","HPE",1,7200000,6200000,5200000,"Xeon Silver 4416+ 20Core 2.0GHz x1","32GB DDR5","960GB SSD x2, 4TB HDD x4","1G UTP 8포트, HBA 32G Dual x2","800W 이중화","타워형 백업서버+Windows"],
  ["CM-01-002","ThinkSystem ST650 V3","Lenovo",1,6800000,5800000,4900000,"Xeon Silver 4410T 10Core 2.7GHz x1","32GB DDR5","480GB SSD x2, 2TB HDD x4","1G UTP 4포트, HBA 32G Dual x2","750W","타워형 백업서버+Windows"],

  // === 운영 스토리지 All Flash (ST-01-001) — 5개 ===
  ["ST-01-001","NetApp AFF A250","NetApp",1,85000000,75000000,65000000,"Dual Controller 24Core","Cache 128GB","Usable 40TB NVMe All Flash","FC 32G x4, 10GbE x4","이중화 PSU","운영 스토리지, Dual Active-Active"],
  ["ST-01-001","PowerStore 500T","Dell",1,78000000,68000000,58000000,"Dual Controller","Cache 96GB","Usable 40TB NVMe All Flash","FC 32G x4, 25GbE x4","이중화 PSU","운영 스토리지, NVMe-oF 지원"],
  ["ST-01-001","Primera A630","HPE",1,92000000,80000000,68000000,"Dual Controller 32Core","Cache 192GB","Usable 50TB NVMe All Flash","FC 32G x8, 25GbE x4","이중화 PSU","운영 스토리지, 고가용성"],
  ["ST-01-001","VSP E590","Hitachi",1,95000000,83000000,70000000,"Dual Controller","Cache 256GB","Usable 50TB NVMe All Flash","FC 32G x8, 25GbE x8","이중화 PSU","운영 스토리지, 엔터프라이즈급"],
  ["ST-01-001","NetApp AFF C250","NetApp",1,65000000,57000000,48000000,"Dual Controller 16Core","Cache 64GB","Usable 30TB QLC Flash","FC 32G x4, 10GbE x4","이중화 PSU","운영 스토리지, 가성비형"],

  // === 백업 스토리지 Hybrid (ST-01-001) — 5개 ===
  ["ST-01-001","NetApp FAS2820","NetApp",1,45000000,40000000,35000000,"Dual Controller","Cache 64GB","Usable 200TB SAS/NL-SAS Hybrid","FC 32G x4, 25GbE x4","이중화 PSU","백업 스토리지 4U/40Bay"],
  ["ST-01-001","PowerVault ME5024","Dell",1,38000000,33000000,28000000,"Dual Controller","Cache 32GB","Usable 200TB SAS Hybrid","FC 32G x4, 25GbE x4","이중화 PSU","백업 스토리지 2U/24Bay"],
  ["ST-01-001","PowerScale F200","Dell",1,52000000,45000000,38000000,"Scale-out 3노드","","Usable 250TB NAS Scale-out","25GbE x8","이중화 노드","백업 NAS Scale-out"],
  ["ST-01-001","Scalar i3","Quantum",1,25000000,22000000,18000000,"","","Usable 300TB LTO-9 테이프","FC 32G x2","이중화 전원","백업 테이프 라이브러리"],
  ["ST-01-001","StoreOnce 5260","HPE",1,48000000,42000000,36000000,"Dual Controller","","Usable 200TB 중복제거","25GbE x4, FC 32G x4","이중화 PSU","백업 어플라이언스"],

  // === L4 스위치 (NW-02-001) — 3개 ===
  ["NW-02-001","PAS-5216","Piolink",1,35000000,30000000,25000000,"","Memory 16GB","","10G SFP+ x2, 1G SFP x8","이중화 PSU","L4 스위치, 16M세션, 6Gbps"],
  ["NW-02-001","BIG-IP i2600","F5",1,55000000,48000000,40000000,"","Memory 32GB","","10G SFP+ x4, 1G x8","이중화 PSU","L4/L7 ADC, 20Gbps, SSL가속"],
  ["NW-02-001","Thunder 3430S","A10",1,42000000,36000000,30000000,"","Memory 16GB","","10G SFP+ x4, 1G x8","이중화 PSU","L4 ADC, SSL가속, HA"],

  // === L2 스위치 10G (NW-01-001) — 5개 ===
  ["NW-01-001","7050SX3-48YC12","Arista",4,12000000,10500000,8800000,"","","","1/10G SFP+ x48, 100G QSFP x12","이중화 PSU","L2/L3 스위치, 350mpps"],
  ["NW-01-001","Catalyst C9300-48UXM","Cisco",4,14000000,12000000,10000000,"","","","10G mGig x36, 10G SFP+ x12","이중화 PSU","L2/L3 StackWise 지원"],
  ["NW-01-001","EX4400-48T","Juniper",4,11000000,9500000,8000000,"","","","1/10G RJ45 x48, 25G SFP28 x4","이중화 PSU","L2/L3 Virtual Chassis"],
  ["NW-01-001","ICX 7550-48ZP","Ruckus",4,10500000,9000000,7500000,"","","","1/10G mGig x48, 100G QSFP28 x6","이중화 PSU","L2/L3 PoE++ 지원"],
  ["NW-01-001","S5248F-ON","Dell",4,9800000,8500000,7100000,"","","","10G SFP+ x48, 100G QSFP28 x6","이중화 PSU","L2/L3 OS10 Enterprise"],

  // === L2 스위치 1G (NW-01-001) — 3개 ===
  ["NW-01-001","Catalyst C9200L-24T-4G","Cisco",1,3500000,3000000,2500000,"","","","1G UTP x24, 10G SFP+ x4","","L2 관리용 스위치"],
  ["NW-01-001","7010TX-48","Arista",1,5000000,4500000,3800000,"","","","1G UTP x48, 10G SFP+ x4","이중화 PSU","L2 스위치, 120Gbps"],
  ["NW-01-001","FlexNetwork 5520-24T","HPE",1,2800000,2400000,2000000,"","","","1G UTP x24, 10G SFP+ x4","","L2 관리용 스위치"],

  // === SAN 스위치 (NW-01-001) — 3개 ===
  ["NW-01-001","G630","Brocade",2,15000000,13000000,11000000,"","","","FC 32G x48 (16포트 활성화)","이중화 PSU","SAN 스위치, ISL 트렁킹"],
  ["NW-01-001","G620","Brocade",2,10000000,8500000,7200000,"","","","FC 32G x24 (24포트 활성화)","","SAN 엔트리급"],
  ["NW-01-001","MDS 9148T","Cisco",2,13000000,11000000,9200000,"","","","FC 32G x48 (24포트 활성화)","이중화 PSU","SAN NVMe/FC 지원"],

  // === 랙/KVM ===
  ["CM-01-001","NetShelter SX 42U","APC",2,3500000,3000000,2500000,"","","","","","42U 표준랙 W600xD1200, 900Kg"],
  ["CM-01-001","KVM 1754D2 Console","Avocent",2,4200000,3600000,3000000,"","","","","","17.3인치 LCD KVM 16포트+USB Adapter x24"],

  // === 스트리밍/VMS 서버 ===
  ["CM-01-001","PowerEdge R450 스트리밍","Dell",1,8000000,7000000,6000000,"Xeon Silver 4410Y 12Core 2.0GHz x1","16GB DDR5","480GB SSD x2 이중화","1G/10G 2포트 이중화","800W 이중화","스트리밍 서버 1U, 500대 카메라"],
  ["CM-01-001","SYS-1029U VMS","Supermicro",1,12000000,10500000,8800000,"Xeon Gold 5418Y 24Core 2.0GHz x1","32GB ECC DDR5","M.2 SSD 128GB x2 이중화","1GbE x2, 10GbE x2","400W 이중화","VMS 서버 512ch, H.265"],
];

data.forEach(row => ws.addRow(row));

// 가격 열 숫자 포맷
for (let r = 2; r <= ws.rowCount; r++) {
  ["E","F","G"].forEach(c => { ws.getCell(`${c}${r}`).numFmt = "#,##0"; });
}

await wb.xlsx.writeFile(filePath);
console.log(`테스트 데이터 ${data.length}행 추가 완료 → ${filePath}`);
