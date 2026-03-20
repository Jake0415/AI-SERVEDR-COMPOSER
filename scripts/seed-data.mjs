// 전체 시드 데이터 투입 스크립트 (멱등성 보장 — UPSERT 패턴)
// 테넌트 + 사용자(super_admin) + 카테고리 + 부품 + 거래처 + 견적 + AI 프롬프트
import postgres from "postgres";
import bcryptjs from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:cc1818efc73c5bdcd8ca873743bb0af7@localhost:5436/aisc");
const TENANT = "23b256fb-68d8-49ba-b49e-a1f86550ce31";
const USER = "46817658-ba49-4599-ae9f-75807406fa1b";
const FORCE_RESEED = process.env.FORCE_RESEED === "true";

async function addPart(catMap, catName, modelName, manufacturer, specs, listPrice, marketPrice, supplyPrice) {
  // 기존 부품 존재 확인
  const [existing] = await sql`
    SELECT p.id FROM ai_server_composer.parts p
    WHERE p.tenant_id = ${TENANT} AND p.model_name = ${modelName} AND p.manufacturer = ${manufacturer}`;

  if (existing) {
    // 가격만 업데이트
    await sql`UPDATE ai_server_composer.part_prices
      SET list_price = ${listPrice}, market_price = ${marketPrice}, supply_price = ${supplyPrice}
      WHERE part_id = ${existing.id}`;
    return;
  }

  const [p] = await sql`INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs)
    VALUES (${TENANT}, ${catMap[catName]}, ${modelName}, ${manufacturer}, ${JSON.stringify(specs)}::jsonb)
    RETURNING id`;
  await sql`INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
    VALUES (${p.id}, ${listPrice}, ${marketPrice}, ${supplyPrice})`;
}

async function main() {
  // Step 0: 강제 리셋 모드일 경우에만 전체 클린업
  if (FORCE_RESEED) {
    await sql`DELETE FROM ai_server_composer.tenants`;
    console.log("Step 0: FORCE_RESEED — 기존 데이터 전체 클린업 완료");
  }

  // Step 1: 테넌트 UPSERT
  await sql`INSERT INTO ai_server_composer.tenants (id, company_name, business_number, ceo_name, address, business_type, business_item, phone, email, quotation_prefix)
    VALUES (${TENANT}, '테스트 IT솔루션', '123-45-67890', '홍길동', '서울시 강남구 테헤란로 123', '정보통신업', '서버/네트워크 장비', '02-1234-5678', 'admin@test-it.co.kr', 'QT')
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      business_number = EXCLUDED.business_number,
      ceo_name = EXCLUDED.ceo_name,
      address = EXCLUDED.address,
      business_type = EXCLUDED.business_type,
      business_item = EXCLUDED.business_item,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      quotation_prefix = EXCLUDED.quotation_prefix`;
  console.log("Step 1: 테넌트 UPSERT 완료");

  // Step 2: 사용자 UPSERT (super_admin)
  const passwordHash = await bcryptjs.hash("@Dnflwlq01", 12);
  await sql`INSERT INTO ai_server_composer.users (id, tenant_id, email, password_hash, name, phone, department, role)
    VALUES (${USER}, ${TENANT}, 'yhk71261@gmail.com', ${passwordHash}, '관리자', '010-0000-0000', '개발팀', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      department = EXCLUDED.department,
      role = EXCLUDED.role`;
  console.log("Step 2: 사용자(super_admin) UPSERT 완료 — yhk71261@gmail.com");

  // Step 3: 카테고리 14개 UPSERT
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
      ON CONFLICT (tenant_id, name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        "group" = EXCLUDED."group",
        spec_fields = EXCLUDED.spec_fields`;
  }
  console.log("Step 3: 카테고리 14개 UPSERT 완료");

  const cats = await sql`SELECT id, name FROM ai_server_composer.part_categories WHERE tenant_id = ${TENANT}`;
  const catMap = {};
  cats.forEach(c => catMap[c.name] = c.id);

  // Step 4: 부품 투입 (존재하면 가격 업데이트, 없으면 신규 삽입)
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

  // 섀시 3개 (풍부한 스펙 데이터)
  await addPart(catMap,"chassis","SYS-421GE 4U GPU","Supermicro",{form_factor:"4U",u_size:4,max_drive_bays:24,cpu_sockets:2,max_memory_gb:2048,gpu_slots:8,pcie_slots:"8x PCIe 5.0 x16",psu:"2200W redundant",network:"2x 25GbE",weight_kg:30,dimensions:"437x178x711mm"},3500000,3050000,2300000);
  await addPart(catMap,"chassis","SC826BAC4 2U Storage","Supermicro",{form_factor:"2U",u_size:2,max_drive_bays:12,cpu_sockets:2,max_memory_gb:512,pcie_slots:"4x PCIe 4.0 x8",psu:"740W redundant",network:"2x GbE",weight_kg:15,dimensions:"437x89x650mm"},1200000,1050000,790000);
  await addPart(catMap,"chassis","SC813MF2TQ 1U Compute","Supermicro",{form_factor:"1U",u_size:1,max_drive_bays:4,cpu_sockets:1,max_memory_gb:128,pcie_slots:"1x PCIe 4.0 x16",psu:"350W",network:"2x GbE",weight_kg:8,dimensions:"437x43x503mm"},650000,570000,430000);
  console.log("섀시 3개 완료");

  const totalParts = await sql`SELECT count(*) FROM ai_server_composer.parts WHERE tenant_id = ${TENANT}`;
  console.log("총 부품:", totalParts[0].count);

  // Step 5: 거래처 5개 (고정 ID로 UPSERT)
  const customerIds = [
    "c1000001-0000-4000-a000-000000000001",
    "c1000001-0000-4000-a000-000000000002",
    "c1000001-0000-4000-a000-000000000003",
    "c1000001-0000-4000-a000-000000000004",
    "c1000001-0000-4000-a000-000000000005",
  ];
  const customerData = [
    ["한국전력공사","305-82-00001","김사장","서울시 서초구","공기업","전력","public"],
    ["국방과학연구소","123-82-00002","이원장","대전시 유성구","연구기관","방위산업","public"],
    ["네이버클라우드","220-87-00003","박대표","성남시 분당구","정보통신","클라우드","private"],
    ["카카오엔터프라이즈","110-87-00004","최대표","제주시","정보통신","AI/클라우드","private"],
    ["삼성SDS","124-81-00005","정대표","서울시 송파구","정보통신","IT서비스","private"],
  ];
  for (let i = 0; i < customerData.length; i++) {
    const [cn,bn,ceo,addr,bt,bi,ct] = customerData[i];
    await sql`INSERT INTO ai_server_composer.customers (id, tenant_id, company_name, business_number, ceo_name, address, business_type, business_item, customer_type)
      VALUES (${customerIds[i]}, ${TENANT}, ${cn}, ${bn}, ${ceo}, ${addr}, ${bt}, ${bi}, ${ct})
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        business_number = EXCLUDED.business_number,
        ceo_name = EXCLUDED.ceo_name,
        address = EXCLUDED.address,
        business_type = EXCLUDED.business_type,
        business_item = EXCLUDED.business_item,
        customer_type = EXCLUDED.customer_type`;
  }
  console.log("Step 5: 거래처 5개 UPSERT 완료");

  // Step 6: 견적 3건 + 낙찰이력 (고정 ID로 UPSERT)
  const quotationIds = [
    "a1000001-0000-4000-a000-000000000001",
    "a1000001-0000-4000-a000-000000000002",
    "a1000001-0000-4000-a000-000000000003",
  ];
  const validity = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0];
  const types = ["profitability","spec_match","performance"];
  const totals = [15000000, 22000000, 45000000];
  const statuses = ["won","lost","draft"];

  for (let i = 0; i < 3; i++) {
    await sql`INSERT INTO ai_server_composer.quotations
      (id, tenant_id, customer_id, quotation_number, revision, quotation_type, total_cost, total_supply, vat, total_amount, status, validity_date, created_by)
      VALUES (${quotationIds[i]}, ${TENANT}, ${customerIds[i]}, ${"QT-2026-" + String(i+1).padStart(4,"0")}, 1, ${types[i]}, ${Math.round(totals[i]*0.7)}, ${totals[i]}, ${Math.round(totals[i]*0.1)}, ${Math.round(totals[i]*1.1)}, ${statuses[i]}, ${validity}, ${USER})
      ON CONFLICT (tenant_id, quotation_number, revision) DO UPDATE SET
        id = EXCLUDED.id,
        quotation_type = EXCLUDED.quotation_type,
        total_cost = EXCLUDED.total_cost,
        total_supply = EXCLUDED.total_supply,
        vat = EXCLUDED.vat,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        validity_date = EXCLUDED.validity_date`;

    if (i < 2) {
      // 낙찰이력: quotation_id 기준 존재 확인
      const [existingBid] = await sql`
        SELECT id FROM ai_server_composer.bid_results WHERE quotation_id = ${quotationIds[i]}`;
      if (!existingBid) {
        await sql`INSERT INTO ai_server_composer.bid_results (quotation_id, result, reason, recorded_by)
          VALUES (${quotationIds[i]}, ${i === 0 ? "won" : "lost"}, ${i === 0 ? "최저가 입찰 성공" : "경쟁사 대비 가격 열위"}, ${USER})`;
      }
    }
  }
  console.log("Step 6: 견적 3건 + 낙찰이력 2건 UPSERT 완료");

  // Step 7: AI 프롬프트 시드 데이터 UPSERT
  const promptSeeds = [
    {
      slug: "rfp-analyzer",
      name: "RFP 분석 프롬프트",
      description: "RFP 문서에서 서버 하드웨어 요구사항을 추출합니다.",
      category: "extraction",
      system_prompt: `당신은 한국 IT 인프라 견적 전문가입니다.\nRFP(제안요청서) 문서에서 서버 하드웨어 요구사항을 정확히 추출합니다.\n\n## 규칙\n1. 반드시 아래 JSON 스키마로 출력하세요.\n2. 명시되지 않은 사양은 null로 설정하세요. 절대 추측하지 마세요.\n3. 수량이 불명확하면 notes 배열에 기록하세요.\n4. 한국 공공기관 RFP의 관용적 표현을 이해하세요:\n   - "고성능 서버" = GPU 서버 가능성 높음\n   - "대용량 스토리지" = HDD 기반, 10TB 이상\n   - "이중화" = 전원 이중화 (1+1 PSU)\n   - "인공지능/딥러닝/머신러닝" = GPU 필수\n5. 서버 구성이 여러 종류면 각각 별도 객체로 분리하세요.`,
    },
    {
      slug: "chat-quotation",
      name: "AI 대화형 견적 프롬프트",
      description: "사용자와 대화하며 서버 사양을 파악합니다.",
      category: "analysis",
      system_prompt: `당신은 한국 서버 인프라 견적 전문가 AI입니다.\n사용자와 대화하며 서버 사양을 파악합니다.\n\n## 응답 규칙\n1. 반드시 아래 JSON 형식으로 응답하세요.\n2. 사용자의 요청에서 서버 사양을 최대한 추출하세요.\n3. 정보가 충분하면 is_complete: true로 설정하세요.\n4. 정보가 부족하면 is_complete: false로 설정하고, reply에 추가 질문을 포함하세요.\n5. 추측하지 말고, 명시되지 않은 사양은 null로 설정하세요.`,
    },
    {
      slug: "recommendation",
      name: "견적 추천 설명 프롬프트",
      description: "3가지 견적안의 추천 근거를 생성합니다.",
      category: "recommendation",
      system_prompt: `당신은 서버 하드웨어 구성 컨설턴트입니다.\n고객에게 제안할 견적안의 추천 근거를 작성합니다.\n\n## 규칙\n1. 각 견적안별 2-3문장으로 추천 이유를 작성하세요.\n2. 경쟁 우위 포인트를 반드시 포함하세요.\n3. 가격 대비 성능(가성비) 관점을 포함하세요.\n4. 한국어, 비즈니스 톤으로 작성하세요.\n5. 구체적인 모델명과 수치를 언급하세요.`,
    },
  ];
  for (const p of promptSeeds) {
    await sql`INSERT INTO ai_server_composer.ai_prompts
      (tenant_id, slug, name, description, category, system_prompt, is_active, is_system, version, created_by)
      VALUES (${TENANT}, ${p.slug}, ${p.name}, ${p.description}, ${p.category}, ${p.system_prompt}, true, true, 1, ${USER})
      ON CONFLICT (tenant_id, slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        system_prompt = EXCLUDED.system_prompt,
        is_active = EXCLUDED.is_active,
        version = EXCLUDED.version`;
  }
  console.log("Step 7: AI 프롬프트 3건 UPSERT 완료");

  // Step 8: IT 인프라 장비 코드 시드 (IT_Infra_Code.xlsx 기반 전체 데이터)
  const codeData = [
    // [대분류, 대분류코드, 중분류, 장비명]
    ["컴퓨팅(서버)","CM","물리 서버","리눅스 서버"],
    ["컴퓨팅(서버)","CM","물리 서버","윈도우 서버"],
    ["컴퓨팅(서버)","CM","물리 서버","GPU 서버"],
    ["컴퓨팅(서버)","CM","물리 서버","고밀도/블레이드 서버"],
    ["컴퓨팅(서버)","CM","물리 서버","하이퍼컨버지드(HCI) 노드"],
    ["컴퓨팅(서버)","CM","가상화/오케스트레이션","하이퍼바이저 호스트(ESXi/KVM/Hyper-V)"],
    ["컴퓨팅(서버)","CM","가상화/오케스트레이션","컨트롤 플레인 노드(K8s/OpenStack)"],
    ["컴퓨팅(서버)","CM","가상화/오케스트레이션","워크 노드(K8s)"],
    ["컴퓨팅(서버)","CM","가상화/오케스트레이션","베어메탈 서버"],
    ["컴퓨팅(서버)","CM","가속/네트워크","고속 NIC(10/25/40/100G)"],
    ["컴퓨팅(서버)","CM","가속/네트워크","RDMA/InfiniBand 어댑터"],
    ["스토리지","ST","블록","SAN 스토리지(FC/iSCSI)"],
    ["스토리지","ST","파일","NAS"],
    ["스토리지","ST","오브젝트","오브젝트 스토리지(S3 호환)"],
    ["스토리지","ST","분산","분산 스토리지(Ceph/Gluster/vSAN)"],
    ["스토리지","ST","서버 내부","NVMe SSD"],
    ["스토리지","ST","서버 내부","SAS/SATA SSD/HDD"],
    ["스토리지","ST","서버 내부","RAID 컨트롤러/HBA"],
    ["스토리지","ST","확장","JBOD 확장 인클로저"],
    ["스토리지","ST","백업/아카이브","백업 서버"],
    ["스토리지","ST","백업/아카이브","백업 스토리지"],
    ["스토리지","ST","백업/아카이브","테이프 라이브러리"],
    ["스토리지","ST","백업/아카이브","백업 어플라이언스(중복제거)"],
    ["네트워크","NW","스위칭","L2 스위치"],
    ["네트워크","NW","스위칭/라우팅","L3 스위치"],
    ["네트워크","NW","라우팅","라우터"],
    ["네트워크","NW","데이터센터 패브릭","코어 스위치"],
    ["네트워크","NW","데이터센터 패브릭","TOR(Top of Rack) 스위치"],
    ["네트워크","NW","데이터센터 패브릭","스파인-리프(Spine-Leaf) 스위치"],
    ["네트워크","NW","광/케이블","SFP/SFP+/QSFP 트랜시버"],
    ["네트워크","NW","광/케이블","패치 패널/ODF"],
    ["네트워크","NW","광/케이블","케이블(광/UTP/DAC)"],
    ["네트워크","NW","트래픽 분산","L4 스위치/로드밸런서"],
    ["네트워크","NW","트래픽 분산","L7 로드밸런서"],
    ["네트워크","NW","트래픽 분산","ADC"],
    ["네트워크","NW","원격/지사","VPN 장비"],
    ["네트워크","NW","원격/지사","SD-WAN 장비"],
    ["네트워크","NW","스위칭","액세스 스위치(Access Switch)"],
    ["네트워크","NW","스위칭/집선","집선 스위치(Aggregation Switch)"],
    ["네트워크","NW","데이터센터 패브릭","리프(Leaf) 스위치"],
    ["네트워크","NW","데이터센터 패브릭","스파인(Spine) 스위치"],
    ["네트워크","NW","관리망","관리 스위치(OOB Switch)"],
    ["네트워크","NW","보안 연계","TAP/미러링 스위치"],
    ["보안","SC","경계 보안","방화벽(FW)"],
    ["보안","SC","경계 보안","차세대 방화벽(NGFW)"],
    ["보안","SC","웹 보안","웹방화벽(WAF)"],
    ["보안","SC","가용성 보안","DDoS 방어 장비/서비스"],
    ["보안","SC","침입 탐지/차단","IDS"],
    ["보안","SC","침입 탐지/차단","IPS"],
    ["보안","SC","가시성","NDR/NTA"],
    ["보안","SC","접근통제","AAA(RADIUS/TACACS+) 서버"],
    ["보안","SC","접근통제","MFA 서버"],
    ["보안","SC","접근통제","PAM"],
    ["보안","SC","접근통제","NAC"],
    ["보안","SC","암호화/키관리","HSM"],
    ["보안","SC","암호화/키관리","KMS/인증서 관리 서버"],
    ["운영/관리","OP","기본 서비스","DNS 서버"],
    ["운영/관리","OP","기본 서비스","DHCP 서버"],
    ["운영/관리","OP","기본 서비스","NTP 서버"],
    ["운영/관리","OP","관리 접근","점프 서버(Bastion)"],
    ["운영/관리","OP","모니터링","모니터링 서버(Prometheus/Zabbix 등)"],
    ["운영/관리","OP","로그","로그 수집/분석(ELK/OpenSearch/SIEM)"],
    ["운영/관리","OP","자산/CMDB","자산관리/CMDB"],
    ["운영/관리","OP","배포/CI","CI/CD 서버(Jenkins/GitLab CI 등)"],
    ["운영/관리","OP","자동화","자동화 서버(Ansible/Terraform 등)"],
    ["운영/관리","OP","메일","메일 릴레이"],
    ["운영/관리","OP","클라우드 플랫폼","클라우드 컨트롤러 노드(OpenStack 등)"],
    ["운영/관리","OP","클라우드 플랫폼","이미지 저장소/레지스트리"],
    ["운영/관리","OP","클라우드 플랫폼","IAM/SSO 서버"],
    ["콘솔/OOB","CN","현장/원격 콘솔","KVM 스위치"],
    ["콘솔/OOB","CN","현장/원격 콘솔","IP KVM"],
    ["콘솔/OOB","CN","현장/원격 콘솔","콘솔 서버(시리얼)"],
    ["콘솔/OOB","CN","OOB 관리","BMC/iDRAC/iLO"],
    ["콘솔/OOB","CN","현장 장비","랙 콘솔(모니터/키보드)"],
    ["콘솔/OOB","CN","현장 장비","크래시 카트"],
    ["전원","PW","전원 안정","UPS"],
    ["전원","PW","전원 분배","PDU"],
    ["전원","PW","전원 분배","지능형 PDU"],
    ["전원","PW","전원 절체","ATS"],
    ["전원","PW","비상 전원","발전기"],
    ["전원","PW","장비 내장","이중 PSU"],
    ["랙/시설","RK","랙","서버 랙"],
    ["랙/시설","RK","랙","네트워크 랙"],
    ["랙/시설","RK","랙 부품","레일킷/선반"],
    ["랙/시설","RK","공기 흐름","블랭킹 패널"],
    ["랙/시설","RK","배선","케이블 트레이/덕트"],
    ["랙/시설","RK","센서","온습도 센서"],
    ["랙/시설","RK","보안","출입통제 장치"],
    ["랙/시설","RK","보안","CCTV"],
    ["랙/시설","RK","안전","화재감지/소화 설비"],
    ["랙/시설","RK","환경","항온항습기"],
    ["랙/시설","RK","환경","누수감지 센서"],
    ["백업/DR","DR","복제","스토리지 복제 장비/기능"],
    ["백업/DR","DR","전환","DR 오케스트레이션 서버"],
    ["백업/DR","DR","WAN 최적화","WAN 가속기"],
    ["특화(VDI)","VD","VDI","VDI 브로커/관리 서버"],
    ["특화(VDI)","VD","VDI","프로파일/사용자 데이터 스토리지"],
    ["특화(VDI)","VD","VDI","씬클라이언트/단말"],
    ["소프트웨어/라이선스","SW","가상화 SW","하이퍼바이저 라이선스/서포트"],
    ["소프트웨어/라이선스","SW","클라우드 SW","클라우드 관리 플랫폼(OpenStack 등)"],
    ["소프트웨어/라이선스","SW","보안 SW","백신/EDR/취약점 스캐너"],
    ["소프트웨어/라이선스","SW","운영 SW","백업/모니터링/로그 솔루션"],
  ];

  // 대분류 → 중분류 → 장비명 계층 구조 구축
  const majorMap = {};   // 대분류명 → { id, code }
  const minorMap = {};   // "대분류코드|중분류명" → { id, code }
  let majorOrder = 0;
  let minorOrder = 0;
  let itemOrder = 0;

  for (const [majorName, majorCode, minorName, itemName] of codeData) {
    // 대분류 UPSERT
    if (!majorMap[majorName]) {
      majorOrder++;
      const [row] = await sql`INSERT INTO ai_server_composer.equipment_codes
        (tenant_id, code, name, level, parent_id, sort_order)
        VALUES (${TENANT}, ${majorCode}, ${majorName}, 1, null, ${majorOrder})
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order
        RETURNING id`;
      majorMap[majorName] = { id: row.id, code: majorCode };
    }

    // 중분류 UPSERT
    const minorKey = `${majorCode}|${minorName}`;
    if (!minorMap[minorKey]) {
      // 해당 대분류 아래 중분류 순번 계산
      const existingMinors = Object.keys(minorMap).filter(k => k.startsWith(majorCode + "|")).length;
      const minorNum = String(existingMinors + 1).padStart(2, "0");
      const minorCode = `${majorCode}-${minorNum}`;
      minorOrder++;
      const [row] = await sql`INSERT INTO ai_server_composer.equipment_codes
        (tenant_id, code, name, level, parent_id, sort_order)
        VALUES (${TENANT}, ${minorCode}, ${minorName}, 2, ${majorMap[majorName].id}, ${minorOrder})
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, parent_id = EXCLUDED.parent_id
        RETURNING id`;
      minorMap[minorKey] = { id: row.id, code: minorCode };
    }

    // 장비명 UPSERT
    const parentMinor = minorMap[minorKey];
    const existingItems = await sql`SELECT count(*) as cnt FROM ai_server_composer.equipment_codes
      WHERE tenant_id = ${TENANT} AND level = 3 AND parent_id = ${parentMinor.id}`;
    const itemNum = String(parseInt(existingItems[0].cnt) + 1).padStart(3, "0");
    const itemCode = `${parentMinor.code}-${itemNum}`;
    itemOrder++;
    await sql`INSERT INTO ai_server_composer.equipment_codes
      (tenant_id, code, name, level, parent_id, sort_order)
      VALUES (${TENANT}, ${itemCode}, ${itemName}, 3, ${parentMinor.id}, ${itemOrder})
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, parent_id = EXCLUDED.parent_id`;
  }

  const [codeCount] = await sql`SELECT count(*) as cnt FROM ai_server_composer.equipment_codes WHERE tenant_id = ${TENANT}`;
  console.log("Step 8: IT 인프라 장비 코드", codeCount.cnt, "건 UPSERT 완료");

  // Step 9: 서버 파트 코드 시드 (고정 코드 — 멱등성 보장)
  // [카테고리명, 카테고리코드, 부품명, 부품코드]
  const partCodeData = [
    ["CPU","CP","프로세서","CP-001"],
    ["메모리","MM","RAM","MM-001"],
    ["스토리지","ST","HDD","ST-001"],
    ["스토리지","ST","SSD","ST-002"],
    ["스토리지","ST","NVMe SSD","ST-003"],
    ["스토리지","ST","디스크 베이","ST-004"],
    ["스토리지","ST","RAID 카드","ST-005"],
    ["스토리지","ST","HBA 카드","ST-006"],
    ["스토리지","ST","NVMe 확장 카드","ST-007"],
    ["GPU","GP","GPU 카드","GP-001"],
    ["네트워크","NE","NIC","NE-001"],
    ["네트워크","NE","RDMA NIC","NE-002"],
    ["네트워크","NE","DPDK 가속 카드","NE-003"],
    ["확장","EX","PCIe 슬롯","EX-001"],
    ["전원","PO","파워 서플라이","PO-001"],
    ["쿨링","CL","팬","CL-001"],
    ["관리","MG","BMC/iDRAC/iLO","MG-001"],
    ["보안","SE","TPM 모듈","SE-001"],
    ["가속기","AC","FPGA 카드","AC-001"],
    ["메인보드","MB","서버 메인보드","MB-001"],
  ];

  const partCatMap = {};
  let partCatOrder = 0;

  for (const [catName, catCode, partName, fixedCode] of partCodeData) {
    if (!partCatMap[catName]) {
      partCatOrder++;
      const [row] = await sql`INSERT INTO ai_server_composer.part_codes
        (tenant_id, code, name, level, parent_id, sort_order)
        VALUES (${TENANT}, ${catCode}, ${catName}, 1, null, ${partCatOrder})
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order
        RETURNING id`;
      partCatMap[catName] = { id: row.id, code: catCode };
    }
    const parent = partCatMap[catName];
    await sql`INSERT INTO ai_server_composer.part_codes
      (tenant_id, code, name, level, parent_id, sort_order)
      VALUES (${TENANT}, ${fixedCode}, ${partName}, 2, ${parent.id}, 0)
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id`;
  }

  // 이전 중복 데이터 정리 (고정 코드 외 삭제)
  const validCodes = partCodeData.map(d => d[3]);
  const validCatCodes = [...new Set(partCodeData.map(d => d[1]))];
  const allValid = [...validCatCodes, ...validCodes];
  await sql`DELETE FROM ai_server_composer.part_codes
    WHERE tenant_id = ${TENANT} AND code != ALL(${allValid})`;

  const [partCodeCount] = await sql`SELECT count(*) as cnt FROM ai_server_composer.part_codes WHERE tenant_id = ${TENANT}`;
  console.log("Step 9: 서버 파트 코드", partCodeCount.cnt, "건 UPSERT 완료");

  // Step 10: parts에 partCodeId 매핑 + chassis를 equipment_products로 이전
  const partCodeMap = {
    "cpu": "CP-001", "memory": "MM-001", "ssd": "ST-002", "hdd": "ST-001",
    "nic": "NE-001", "raid": "ST-005", "gpu": "GP-001", "psu": "PO-001",
    "motherboard": "MB-001", "hba": "ST-006",
  };

  // partCodeId 매핑
  for (const [catName, pcCode] of Object.entries(partCodeMap)) {
    const [pc] = await sql`SELECT id FROM ai_server_composer.part_codes
      WHERE tenant_id = ${TENANT} AND code = ${pcCode} LIMIT 1`;
    if (pc) {
      await sql`UPDATE ai_server_composer.parts SET part_code_id = ${pc.id}
        WHERE tenant_id = ${TENANT} AND category_id IN (
          SELECT id FROM ai_server_composer.part_categories WHERE tenant_id = ${TENANT} AND name = ${catName}
        )`;
    }
  }
  const [mappedCount] = await sql`SELECT count(*) as cnt FROM ai_server_composer.parts
    WHERE tenant_id = ${TENANT} AND part_code_id IS NOT NULL AND is_deleted = false`;
  console.log("Step 10-a: parts partCodeId 매핑", mappedCount.cnt, "건");

  // chassis 3건을 equipment_products로 이전
  const chassisParts = await sql`SELECT p.id, p.model_name, p.manufacturer, p.specs,
    pp.list_price, pp.market_price, pp.supply_price
    FROM ai_server_composer.parts p
    LEFT JOIN ai_server_composer.part_prices pp ON pp.part_id = p.id
    WHERE p.tenant_id = ${TENANT} AND p.is_deleted = false
    AND p.category_id IN (SELECT id FROM ai_server_composer.part_categories WHERE tenant_id = ${TENANT} AND name = 'chassis')`;

  // equipment_codes에서 적절한 장비명 코드 찾기
  const chassisMapping = {
    "SYS-421GE 4U GPU": "CM-01-004",        // 고밀도/블레이드 서버
    "SC826BAC4 2U Storage": "CM-01-001",     // 리눅스 서버 (스토리지 서버)
    "SC813MF2TQ 1U Compute": "CM-01-001",    // 리눅스 서버 (컴퓨트 서버)
  };

  for (const cp of chassisParts) {
    const eqCode = chassisMapping[cp.model_name] || "CM-01-001";
    const [eqCodeRow] = await sql`SELECT id FROM ai_server_composer.equipment_codes
      WHERE tenant_id = ${TENANT} AND code = ${eqCode} LIMIT 1`;
    if (eqCodeRow) {
      // equipment_products에 UPSERT
      const [existing] = await sql`SELECT id FROM ai_server_composer.equipment_products
        WHERE tenant_id = ${TENANT} AND model_name = ${cp.model_name} AND manufacturer = ${cp.manufacturer} LIMIT 1`;
      if (!existing) {
        const [ep] = await sql`INSERT INTO ai_server_composer.equipment_products
          (tenant_id, equipment_code_id, model_name, manufacturer, specs)
          VALUES (${TENANT}, ${eqCodeRow.id}, ${cp.model_name}, ${cp.manufacturer}, ${JSON.stringify(cp.specs || {})}::jsonb)
          RETURNING id`;
        await sql`INSERT INTO ai_server_composer.equipment_product_prices
          (product_id, list_price, market_price, supply_price)
          VALUES (${ep.id}, ${cp.list_price || 0}, ${cp.market_price || 0}, ${cp.supply_price || 0})`;
      }
    }
    // 원본 parts에서 소프트 삭제
    await sql`UPDATE ai_server_composer.parts SET is_deleted = true, deleted_at = NOW() WHERE id = ${cp.id}`;
  }
  console.log("Step 10-b: chassis", chassisParts.length, "건 → equipment_products 이전 완료");

  await sql.end();
  console.log("\n=== 전체 시드 데이터 투입 완료 ===");
  console.log("로그인: yhk71261@gmail.com / @Dnflwlq01");
}

main().catch(e => { console.error(e); process.exit(1); });
