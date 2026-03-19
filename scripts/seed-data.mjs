// 전체 시드 데이터 투입 스크립트
import postgres from "postgres";

const sql = postgres("postgresql://postgres.pqxkibkbwmbcdnbmzxgc:%40Dnflwlq01%21@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres");
const TENANT = "23b256fb-68d8-49ba-b49e-a1f86550ce31";
const USER = "46817658-ba49-4599-ae9f-75807406fa1b";

async function addPart(catMap, catName, modelName, manufacturer, specs, listPrice, marketPrice, supplyPrice) {
  const [p] = await sql`INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs)
    VALUES (${TENANT}, ${catMap[catName]}, ${modelName}, ${manufacturer}, ${JSON.stringify(specs)}::jsonb)
    RETURNING id`;
  await sql`INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
    VALUES (${p.id}, ${listPrice}, ${marketPrice}, ${supplyPrice})`;
}

async function main() {
  // Step 1: 중복 테넌트 삭제
  await sql`DELETE FROM ai_server_composer.tenants WHERE id != ${TENANT}`;
  console.log("Step 1: 중복 테넌트 정리 완료");

  // Step 2: 카테고리 14개
  const categories = [
    { name: "cpu", display: "CPU", group: "server_parts", specs: ["cores","threads","socket","tdp_w"] },
    { name: "memory", display: "메모리", group: "server_parts", specs: ["type","capacity_gb","speed_mhz","ecc"] },
    { name: "ssd", display: "SSD", group: "server_parts", specs: ["capacity_gb","interface","pcie_gen"] },
    { name: "hdd", display: "HDD", group: "server_parts", specs: ["capacity_tb","interface","rpm"] },
    { name: "nic", display: "NIC", group: "network_infra", specs: ["speed_gbps","port_count"] },
    { name: "raid", display: "RAID", group: "server_parts", specs: ["raid_levels","max_drives","cache_mb"] },
    { name: "gpu", display: "GPU", group: "server_parts", specs: ["vram_gb","tdp_w","architecture"] },
    { name: "psu", display: "PSU", group: "server_parts", specs: ["capacity_w","efficiency"] },
    { name: "motherboard", display: "메인보드", group: "server_parts", specs: ["socket","memory_slots","memory_type"] },
    { name: "chassis", display: "섀시", group: "server_parts", specs: ["form_factor","u_size","max_drive_bays"] },
    { name: "hba", display: "HBA", group: "server_parts", specs: ["interface","ports"] },
    { name: "switch", display: "스위치", group: "network_infra", specs: ["ports","speed_gbps"] },
    { name: "transceiver", display: "트랜시버", group: "network_infra", specs: ["speed_gbps","type"] },
    { name: "cable", display: "케이블", group: "network_infra", specs: ["type","length_m"] },
  ];
  for (const c of categories) {
    await sql`INSERT INTO ai_server_composer.part_categories (tenant_id, name, display_name, "group", spec_fields, is_default)
      VALUES (${TENANT}, ${c.name}, ${c.display}, ${c.group}, ${JSON.stringify(c.specs)}::jsonb, true)
      ON CONFLICT (tenant_id, name) DO NOTHING`;
  }
  console.log("Step 2: 카테고리 14개 완료");

  const cats = await sql`SELECT id, name FROM ai_server_composer.part_categories WHERE tenant_id = ${TENANT}`;
  const catMap = {};
  cats.forEach(c => catMap[c.name] = c.id);

  // Step 3: 부품 투입
  // CPU 15개
  await addPart(catMap,"cpu","Xeon w5-3435X","Intel",{cores:16,threads:32,socket:"LGA4677",tdp_w:270},1200000,1050000,870000);
  await addPart(catMap,"cpu","Xeon w7-3465X","Intel",{cores:28,threads:56,socket:"LGA4677",tdp_w:300},3800000,3400000,2700000);
  await addPart(catMap,"cpu","Xeon w9-3495X","Intel",{cores:56,threads:112,socket:"LGA4677",tdp_w:350},8500000,7600000,6100000);
  await addPart(catMap,"cpu","Xeon Gold 6430","Intel",{cores:32,threads:64,socket:"LGA4677",tdp_w:270},4200000,3700000,2950000);
  await addPart(catMap,"cpu","Xeon Gold 6448Y","Intel",{cores:32,threads:64,socket:"LGA4677",tdp_w:225},4800000,4200000,3360000);
  await addPart(catMap,"cpu","Xeon Platinum 8480+","Intel",{cores:56,threads:112,socket:"LGA4677",tdp_w:350},16000000,14200000,11400000);
  await addPart(catMap,"cpu","Xeon Silver 4410Y","Intel",{cores:12,threads:24,socket:"LGA4677",tdp_w:150},700000,620000,510000);
  await addPart(catMap,"cpu","Xeon Silver 4416+","Intel",{cores:20,threads:40,socket:"LGA4677",tdp_w:165},950000,840000,680000);
  await addPart(catMap,"cpu","EPYC 9124","AMD",{cores:16,threads:32,socket:"SP5",tdp_w:200},1100000,980000,790000);
  await addPart(catMap,"cpu","EPYC 9254","AMD",{cores:24,threads:48,socket:"SP5",tdp_w:200},2400000,2100000,1700000);
  await addPart(catMap,"cpu","EPYC 9454","AMD",{cores:48,threads:96,socket:"SP5",tdp_w:290},5200000,4600000,3700000);
  await addPart(catMap,"cpu","EPYC 9554","AMD",{cores:64,threads:128,socket:"SP5",tdp_w:360},7200000,6400000,5100000);
  await addPart(catMap,"cpu","EPYC 9654","AMD",{cores:96,threads:192,socket:"SP5",tdp_w:360},14500000,12800000,10200000);
  await addPart(catMap,"cpu","EPYC 9754","AMD",{cores:128,threads:256,socket:"SP5",tdp_w:360},15500000,13700000,11000000);
  await addPart(catMap,"cpu","EPYC 9354","AMD",{cores:32,threads:64,socket:"SP5",tdp_w:280},3500000,3100000,2500000);
  console.log("CPU 15개 완료");

  // 메모리 12개
  await addPart(catMap,"memory","M321R4GA 32GB DDR5-4800","Samsung",{type:"DDR5",capacity_gb:32,speed_mhz:4800,ecc:true},180000,155000,125000);
  await addPart(catMap,"memory","M321R8GA 64GB DDR5-4800","Samsung",{type:"DDR5",capacity_gb:64,speed_mhz:4800,ecc:true},340000,295000,240000);
  await addPart(catMap,"memory","M321RCG 128GB DDR5-4800","Samsung",{type:"DDR5",capacity_gb:128,speed_mhz:4800,ecc:true},850000,740000,600000);
  await addPart(catMap,"memory","M321R2GA 16GB DDR5-5600","Samsung",{type:"DDR5",capacity_gb:16,speed_mhz:5600,ecc:true},110000,95000,78000);
  await addPart(catMap,"memory","M321R4GA 32GB DDR5-5600","Samsung",{type:"DDR5",capacity_gb:32,speed_mhz:5600,ecc:true},200000,175000,142000);
  await addPart(catMap,"memory","M321R8GA 64GB DDR5-5600","Samsung",{type:"DDR5",capacity_gb:64,speed_mhz:5600,ecc:true},380000,330000,270000);
  await addPart(catMap,"memory","HMCG94AG 64GB DDR5-4800","SK Hynix",{type:"DDR5",capacity_gb:64,speed_mhz:4800,ecc:true},330000,285000,232000);
  await addPart(catMap,"memory","HMCG88AG 32GB DDR5-5600","SK Hynix",{type:"DDR5",capacity_gb:32,speed_mhz:5600,ecc:true},195000,170000,138000);
  await addPart(catMap,"memory","HMCG94AG 128GB DDR5-5600","SK Hynix",{type:"DDR5",capacity_gb:128,speed_mhz:5600,ecc:true},920000,800000,650000);
  await addPart(catMap,"memory","MTC40F 64GB DDR5-4800","Micron",{type:"DDR5",capacity_gb:64,speed_mhz:4800,ecc:true},320000,278000,226000);
  await addPart(catMap,"memory","MTC20F 32GB DDR5-5600","Micron",{type:"DDR5",capacity_gb:32,speed_mhz:5600,ecc:true},190000,165000,135000);
  await addPart(catMap,"memory","MTC80F 128GB DDR5-5600","Micron",{type:"DDR5",capacity_gb:128,speed_mhz:5600,ecc:true},900000,785000,638000);
  console.log("메모리 12개 완료");

  // SSD 8개
  await addPart(catMap,"ssd","PM9A3 960GB NVMe U.2","Samsung",{capacity_gb:960,interface:"NVMe",pcie_gen:"4.0"},280000,245000,185000);
  await addPart(catMap,"ssd","PM9A3 1.92TB NVMe U.2","Samsung",{capacity_gb:1920,interface:"NVMe",pcie_gen:"4.0"},480000,420000,320000);
  await addPart(catMap,"ssd","PM9A3 3.84TB NVMe U.2","Samsung",{capacity_gb:3840,interface:"NVMe",pcie_gen:"4.0"},850000,740000,560000);
  await addPart(catMap,"ssd","PM9C1a 1.92TB NVMe U.2","Samsung",{capacity_gb:1920,interface:"NVMe",pcie_gen:"5.0"},680000,595000,450000);
  await addPart(catMap,"ssd","D7-P5620 1.6TB NVMe U.2","Intel",{capacity_gb:1600,interface:"NVMe",pcie_gen:"4.0"},650000,570000,430000);
  await addPart(catMap,"ssd","7450 PRO 960GB NVMe U.2","Micron",{capacity_gb:960,interface:"NVMe",pcie_gen:"4.0"},280000,245000,185000);
  await addPart(catMap,"ssd","7450 PRO 3.84TB NVMe U.2","Micron",{capacity_gb:3840,interface:"NVMe",pcie_gen:"4.0"},850000,740000,560000);
  await addPart(catMap,"ssd","PM893 960GB SATA 2.5","Samsung",{capacity_gb:960,interface:"SATA"},180000,155000,118000);
  console.log("SSD 8개 완료");

  // HDD 6개
  await addPart(catMap,"hdd","Exos X20 16TB SAS","Seagate",{capacity_tb:16,interface:"SAS",rpm:7200},650000,560000,430000);
  await addPart(catMap,"hdd","Exos X20 20TB SAS","Seagate",{capacity_tb:20,interface:"SAS",rpm:7200},780000,670000,520000);
  await addPart(catMap,"hdd","Exos X22 22TB SAS","Seagate",{capacity_tb:22,interface:"SAS",rpm:7200},850000,740000,570000);
  await addPart(catMap,"hdd","Ultrastar HC570 22TB SAS","WD",{capacity_tb:22,interface:"SAS",rpm:7200},850000,740000,570000);
  await addPart(catMap,"hdd","Ultrastar HC560 20TB SAS","WD",{capacity_tb:20,interface:"SAS",rpm:7200},780000,670000,520000);
  await addPart(catMap,"hdd","Exos X18 16TB SATA","Seagate",{capacity_tb:16,interface:"SATA",rpm:7200},650000,560000,430000);
  console.log("HDD 6개 완료");

  // NIC 4개
  await addPart(catMap,"nic","E810-XXVDA2 25GbE","Intel",{speed_gbps:25,port_count:2},450000,390000,280000);
  await addPart(catMap,"nic","E810-CQDA2 100GbE","Intel",{speed_gbps:100,port_count:2},1200000,1050000,750000);
  await addPart(catMap,"nic","ConnectX-7 100GbE","NVIDIA",{speed_gbps:100,port_count:2},1200000,1050000,750000);
  await addPart(catMap,"nic","I350-T4 1GbE","Intel",{speed_gbps:1,port_count:4},120000,105000,75000);
  console.log("NIC 4개 완료");

  // RAID 3개
  await addPart(catMap,"raid","MegaRAID 9560-8i","Broadcom",{raid_levels:"0,1,5,6,10",max_drives:8,cache_mb:4096},750000,650000,440000);
  await addPart(catMap,"raid","MegaRAID 9560-16i","Broadcom",{raid_levels:"0,1,5,6,10",max_drives:16,cache_mb:8192},1100000,960000,650000);
  await addPart(catMap,"raid","MegaRAID 9670-24i","Broadcom",{raid_levels:"0,1,5,6,10",max_drives:24,cache_mb:8192},1500000,1300000,880000);
  console.log("RAID 3개 완료");

  // GPU 4개
  await addPart(catMap,"gpu","H100 SXM 80GB","NVIDIA",{vram_gb:80,tdp_w:700,architecture:"Hopper"},45000000,40000000,34000000);
  await addPart(catMap,"gpu","H100 PCIe 80GB","NVIDIA",{vram_gb:80,tdp_w:350,architecture:"Hopper"},38000000,34000000,29000000);
  await addPart(catMap,"gpu","L40S 48GB","NVIDIA",{vram_gb:48,tdp_w:350,architecture:"Ada Lovelace"},12000000,10500000,8900000);
  await addPart(catMap,"gpu","A100 PCIe 80GB","NVIDIA",{vram_gb:80,tdp_w:300,architecture:"Ampere"},18000000,15500000,13000000);
  console.log("GPU 4개 완료");

  // PSU 3개
  await addPart(catMap,"psu","PWS-1K28P 1200W","Supermicro",{capacity_w:1200,efficiency:"80+ Platinum"},350000,305000,230000);
  await addPart(catMap,"psu","DPS-1600AB 1600W","Delta",{capacity_w:1600,efficiency:"80+ Platinum"},480000,420000,315000);
  await addPart(catMap,"psu","DPS-2000BB 2000W","Delta",{capacity_w:2000,efficiency:"80+ Titanium"},650000,570000,430000);
  console.log("PSU 3개 완료");

  // 메인보드 3개
  await addPart(catMap,"motherboard","X13DEI-T LGA4677 Dual","Supermicro",{socket:"LGA4677",memory_slots:32,memory_type:"DDR5"},1800000,1570000,1180000);
  await addPart(catMap,"motherboard","H13SSL-N SP5 Single","Supermicro",{socket:"SP5",memory_slots:12,memory_type:"DDR5"},950000,830000,625000);
  await addPart(catMap,"motherboard","KRPA-U16 SP3 Dual","ASUS",{socket:"SP3",memory_slots:32,memory_type:"DDR4"},1200000,1050000,790000);
  console.log("메인보드 3개 완료");

  // 섀시 3개
  await addPart(catMap,"chassis","SYS-421GE 4U GPU","Supermicro",{form_factor:"4U",u_size:4,max_drive_bays:24},3500000,3050000,2300000);
  await addPart(catMap,"chassis","SC826BAC4 2U Storage","Supermicro",{form_factor:"2U",u_size:2,max_drive_bays:12},1200000,1050000,790000);
  await addPart(catMap,"chassis","SC813MF2TQ 1U Compute","Supermicro",{form_factor:"1U",u_size:1,max_drive_bays:4},650000,570000,430000);
  console.log("섀시 3개 완료");

  const totalParts = await sql`SELECT count(*) FROM ai_server_composer.parts WHERE tenant_id = ${TENANT}`;
  console.log("총 부품:", totalParts[0].count);

  // Step 4: 거래처 5개
  const customerData = [
    ["한국전력공사","305-82-00001","김사장","서울시 서초구","공기업","전력","public"],
    ["국방과학연구소","123-82-00002","이원장","대전시 유성구","연구기관","방위산업","public"],
    ["네이버클라우드","220-87-00003","박대표","성남시 분당구","정보통신","클라우드","private"],
    ["카카오엔터프라이즈","110-87-00004","최대표","제주시","정보통신","AI/클라우드","private"],
    ["삼성SDS","124-81-00005","정대표","서울시 송파구","정보통신","IT서비스","private"],
  ];
  for (const [cn,bn,ceo,addr,bt,bi,ct] of customerData) {
    await sql`INSERT INTO ai_server_composer.customers (tenant_id, company_name, business_number, ceo_name, address, business_type, business_item, customer_type)
      VALUES (${TENANT}, ${cn}, ${bn}, ${ceo}, ${addr}, ${bt}, ${bi}, ${ct})`;
  }
  console.log("Step 4: 거래처 5개 완료");

  // Step 5: 견적 3건 + 낙찰이력
  const customers = await sql`SELECT id FROM ai_server_composer.customers WHERE tenant_id = ${TENANT} LIMIT 3`;
  const validity = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0];
  const types = ["profitability","spec_match","performance"];
  const totals = [15000000, 22000000, 45000000];
  const statuses = ["won","lost","draft"];

  for (let i = 0; i < 3; i++) {
    const [q] = await sql`INSERT INTO ai_server_composer.quotations
      (tenant_id, customer_id, quotation_number, quotation_type, total_cost, total_supply, vat, total_amount, status, validity_date, created_by)
      VALUES (${TENANT}, ${customers[i].id}, ${"QT-2026-" + String(i+1).padStart(4,"0")}, ${types[i]}, ${Math.round(totals[i]*0.7)}, ${totals[i]}, ${Math.round(totals[i]*0.1)}, ${Math.round(totals[i]*1.1)}, ${statuses[i]}, ${validity}, ${USER})
      RETURNING id`;

    if (i < 2) {
      await sql`INSERT INTO ai_server_composer.bid_results (quotation_id, result, reason, recorded_by)
        VALUES (${q.id}, ${i === 0 ? "won" : "lost"}, ${i === 0 ? "최저가 입찰 성공" : "경쟁사 대비 가격 열위"}, ${USER})`;
    }
  }
  console.log("Step 5: 견적 3건 + 낙찰이력 2건 완료");

  await sql.end();
  console.log("\n=== 전체 시드 데이터 투입 완료 ===");
}

main().catch(e => { console.error(e); process.exit(1); });
