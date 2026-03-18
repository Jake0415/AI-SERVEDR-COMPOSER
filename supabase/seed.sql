-- ============================================================
-- AI-SERVER-COMPOSER 가상 시드 데이터
-- 실제 서버 부품 스펙 기반, 가상 가격 (69개+ 부품 모델)
--
-- 실행 순서:
-- 1. 먼저 001~004 마이그레이션 실행
-- 2. 테넌트 생성 후 이 파일에서 tenant_id를 교체하여 실행
-- ============================================================

-- ※ 아래 UUID를 실제 테넌트 ID로 교체하세요
-- setup 페이지에서 최초 슈퍼어드민 생성 시 자동으로 테넌트가 만들어집니다.
-- 또는 아래 테스트용 테넌트를 직접 생성:

DO $$
DECLARE
  v_tenant_id UUID;
  v_cat_cpu UUID;
  v_cat_memory UUID;
  v_cat_ssd UUID;
  v_cat_hdd UUID;
  v_cat_nic UUID;
  v_cat_raid UUID;
  v_cat_gpu UUID;
  v_cat_psu UUID;
  v_cat_mb UUID;
  v_cat_chassis UUID;
  v_part_id UUID;
BEGIN

  -- ============ 테스트 테넌트 생성 ============
  INSERT INTO ai_server_composer.tenants (company_name, business_number, ceo_name, address, business_type, business_item, phone, email, quotation_prefix)
  VALUES ('테스트 IT솔루션', '123-45-67890', '홍길동', '서울시 강남구 테헤란로 123', '정보통신업', '서버/네트워크 장비', '02-1234-5678', 'admin@test-it.co.kr', 'QT')
  RETURNING id INTO v_tenant_id;

  -- ============ 14개 기본 카테고리 시드 ============
  PERFORM ai_server_composer.seed_default_categories(v_tenant_id);

  -- 카테고리 ID 조회
  SELECT id INTO v_cat_cpu FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'cpu';
  SELECT id INTO v_cat_memory FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'memory';
  SELECT id INTO v_cat_ssd FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'ssd';
  SELECT id INTO v_cat_hdd FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'hdd';
  SELECT id INTO v_cat_nic FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'nic';
  SELECT id INTO v_cat_raid FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'raid';
  SELECT id INTO v_cat_gpu FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'gpu';
  SELECT id INTO v_cat_psu FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'psu';
  SELECT id INTO v_cat_mb FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'motherboard';
  SELECT id INTO v_cat_chassis FROM ai_server_composer.part_categories WHERE tenant_id = v_tenant_id AND name = 'chassis';

  -- ============================================================
  -- CPU (15개) — Intel Xeon + AMD EPYC
  -- ============================================================

  -- Intel Xeon w5-3435X
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon w5-3435X', 'Intel', '{"cores":16,"threads":32,"base_clock_ghz":3.1,"boost_clock_ghz":4.7,"socket":"LGA4677","tdp_w":270,"memory_type":"DDR5","max_memory_gb":2048,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 1200000, 1050000, 870000);

  -- Intel Xeon w7-3465X
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon w7-3465X', 'Intel', '{"cores":28,"threads":56,"base_clock_ghz":2.5,"boost_clock_ghz":4.8,"socket":"LGA4677","tdp_w":300,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 3800000, 3400000, 2700000);

  -- Intel Xeon w9-3495X
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon w9-3495X', 'Intel', '{"cores":56,"threads":112,"base_clock_ghz":1.9,"boost_clock_ghz":4.8,"socket":"LGA4677","tdp_w":350,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 8500000, 7600000, 6100000);

  -- Intel Xeon Gold 6430
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon Gold 6430', 'Intel', '{"cores":32,"threads":64,"base_clock_ghz":2.1,"boost_clock_ghz":3.4,"socket":"LGA4677","tdp_w":270,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 4200000, 3700000, 2950000);

  -- Intel Xeon Gold 6448Y
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon Gold 6448Y', 'Intel', '{"cores":32,"threads":64,"base_clock_ghz":2.1,"boost_clock_ghz":4.1,"socket":"LGA4677","tdp_w":225,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 4800000, 4200000, 3360000);

  -- Intel Xeon Platinum 8480+
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon Platinum 8480+', 'Intel', '{"cores":56,"threads":112,"base_clock_ghz":2.0,"boost_clock_ghz":3.8,"socket":"LGA4677","tdp_w":350,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 16000000, 14200000, 11400000);

  -- Intel Xeon Silver 4410Y
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon Silver 4410Y', 'Intel', '{"cores":12,"threads":24,"base_clock_ghz":2.0,"boost_clock_ghz":3.9,"socket":"LGA4677","tdp_w":150,"memory_type":"DDR5","max_memory_gb":2048,"max_memory_speed_mhz":4400,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 700000, 620000, 510000);

  -- Intel Xeon Silver 4416+
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'Xeon Silver 4416+', 'Intel', '{"cores":20,"threads":40,"base_clock_ghz":2.0,"boost_clock_ghz":3.9,"socket":"LGA4677","tdp_w":165,"memory_type":"DDR5","max_memory_gb":4096,"max_memory_speed_mhz":4400,"pcie_version":"5.0","architecture":"Sapphire Rapids","memory_channels":8}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 950000, 840000, 680000);

  -- AMD EPYC 9124
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9124', 'AMD', '{"cores":16,"threads":32,"base_clock_ghz":3.0,"boost_clock_ghz":3.7,"socket":"SP5","tdp_w":200,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 1100000, 980000, 790000);

  -- AMD EPYC 9254
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9254', 'AMD', '{"cores":24,"threads":48,"base_clock_ghz":2.9,"boost_clock_ghz":4.15,"socket":"SP5","tdp_w":200,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 2400000, 2100000, 1700000);

  -- AMD EPYC 9454
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9454', 'AMD', '{"cores":48,"threads":96,"base_clock_ghz":2.75,"boost_clock_ghz":3.8,"socket":"SP5","tdp_w":290,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 5200000, 4600000, 3700000);

  -- AMD EPYC 9554
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9554', 'AMD', '{"cores":64,"threads":128,"base_clock_ghz":3.1,"boost_clock_ghz":3.75,"socket":"SP5","tdp_w":360,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 7200000, 6400000, 5100000);

  -- AMD EPYC 9654
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9654', 'AMD', '{"cores":96,"threads":192,"base_clock_ghz":2.4,"boost_clock_ghz":3.7,"socket":"SP5","tdp_w":360,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 14500000, 12800000, 10200000);

  -- AMD EPYC 9754
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9754', 'AMD', '{"cores":128,"threads":256,"base_clock_ghz":2.25,"boost_clock_ghz":3.1,"socket":"SP5","tdp_w":360,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa (Bergamo)","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 15500000, 13700000, 11000000);

  -- AMD EPYC 9354
  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_cpu, 'EPYC 9354', 'AMD', '{"cores":32,"threads":64,"base_clock_ghz":3.25,"boost_clock_ghz":3.8,"socket":"SP5","tdp_w":280,"memory_type":"DDR5","max_memory_gb":6144,"max_memory_speed_mhz":4800,"pcie_version":"5.0","architecture":"Genoa","memory_channels":12}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 3500000, 3100000, 2500000);

  -- ============================================================
  -- 메모리 (12개) — Samsung, SK Hynix
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321R4GA0BB0-CQKZJ 32GB DDR5-4800 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":32,"speed_mhz":4800,"ecc":"true","rank":"1Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 180000, 155000, 125000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321R8GA0BB0-CQKZJ 64GB DDR5-4800 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":64,"speed_mhz":4800,"ecc":"true","rank":"2Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 340000, 295000, 240000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321RCG0PB0-CQKZJ 128GB DDR5-4800 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":128,"speed_mhz":4800,"ecc":"true","rank":"4Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 850000, 740000, 600000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321R2GA0PB0-CWM 16GB DDR5-5600 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":16,"speed_mhz":5600,"ecc":"true","rank":"1Rx8"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 110000, 95000, 78000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321R4GA0BB0-CWM 32GB DDR5-5600 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":32,"speed_mhz":5600,"ecc":"true","rank":"1Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 200000, 175000, 142000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'M321R8GA0BB0-CWM 64GB DDR5-5600 RDIMM', 'Samsung', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":64,"speed_mhz":5600,"ecc":"true","rank":"2Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 380000, 330000, 270000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'HMCG94AGBRA084N 64GB DDR5-4800 RDIMM', 'SK Hynix', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":64,"speed_mhz":4800,"ecc":"true","rank":"2Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 330000, 285000, 232000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'HMCG88AGBRA115N 32GB DDR5-5600 RDIMM', 'SK Hynix', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":32,"speed_mhz":5600,"ecc":"true","rank":"1Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 195000, 170000, 138000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'HMCG94AGBRA115N 128GB DDR5-5600 RDIMM', 'SK Hynix', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":128,"speed_mhz":5600,"ecc":"true","rank":"4Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 920000, 800000, 650000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'MTC40F2046S1RC48BA1 64GB DDR5-4800 RDIMM', 'Micron', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":64,"speed_mhz":4800,"ecc":"true","rank":"2Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 320000, 278000, 226000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'MTC20F1045S1RC56BD1 32GB DDR5-5600 RDIMM', 'Micron', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":32,"speed_mhz":5600,"ecc":"true","rank":"1Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 190000, 165000, 135000);

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_memory, 'MTC80F2085S1RC56BD1 128GB DDR5-5600 RDIMM', 'Micron', '{"type":"DDR5","module_type":"RDIMM","capacity_gb":128,"speed_mhz":5600,"ecc":"true","rank":"4Rx4"}')
  RETURNING id INTO v_part_id;
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price) VALUES (v_part_id, 900000, 785000, 638000);

  -- ============================================================
  -- SSD (12개) — Samsung, Intel, Micron
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_ssd, 'PM9A3 960GB NVMe U.2', 'Samsung', '{"capacity_gb":960,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6500,"seq_write_mbps":1500,"dwpd":1,"tbw":1752}'),
  (v_tenant_id, v_cat_ssd, 'PM9A3 1.92TB NVMe U.2', 'Samsung', '{"capacity_gb":1920,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6500,"seq_write_mbps":2700,"dwpd":1,"tbw":3504}'),
  (v_tenant_id, v_cat_ssd, 'PM9A3 3.84TB NVMe U.2', 'Samsung', '{"capacity_gb":3840,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6500,"seq_write_mbps":3500,"dwpd":1,"tbw":7008}'),
  (v_tenant_id, v_cat_ssd, 'PM9C1a 1.92TB NVMe U.2', 'Samsung', '{"capacity_gb":1920,"interface":"NVMe","pcie_gen":"5.0","form_factor":"U.2","seq_read_mbps":13000,"seq_write_mbps":5100,"dwpd":1,"tbw":3504}'),
  (v_tenant_id, v_cat_ssd, 'PM9C1a 3.84TB NVMe U.2', 'Samsung', '{"capacity_gb":3840,"interface":"NVMe","pcie_gen":"5.0","form_factor":"U.2","seq_read_mbps":13000,"seq_write_mbps":6600,"dwpd":1,"tbw":7008}'),
  (v_tenant_id, v_cat_ssd, 'D7-P5620 1.6TB NVMe U.2', 'Intel', '{"capacity_gb":1600,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":5300,"seq_write_mbps":3000,"dwpd":3,"tbw":8760}'),
  (v_tenant_id, v_cat_ssd, 'D7-P5620 3.2TB NVMe U.2', 'Intel', '{"capacity_gb":3200,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":5300,"seq_write_mbps":3600,"dwpd":3,"tbw":17520}'),
  (v_tenant_id, v_cat_ssd, '7450 PRO 960GB NVMe U.2', 'Micron', '{"capacity_gb":960,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6800,"seq_write_mbps":1400,"dwpd":1,"tbw":1752}'),
  (v_tenant_id, v_cat_ssd, '7450 PRO 1.92TB NVMe U.2', 'Micron', '{"capacity_gb":1920,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6800,"seq_write_mbps":2700,"dwpd":1,"tbw":3504}'),
  (v_tenant_id, v_cat_ssd, '7450 PRO 3.84TB NVMe U.2', 'Micron', '{"capacity_gb":3840,"interface":"NVMe","pcie_gen":"4.0","form_factor":"U.2","seq_read_mbps":6800,"seq_write_mbps":3600,"dwpd":1,"tbw":7008}'),
  (v_tenant_id, v_cat_ssd, 'PM893 960GB SATA 2.5', 'Samsung', '{"capacity_gb":960,"interface":"SATA","pcie_gen":"","form_factor":"2.5","seq_read_mbps":560,"seq_write_mbps":530,"dwpd":1,"tbw":1752}'),
  (v_tenant_id, v_cat_ssd, 'PM893 3.84TB SATA 2.5', 'Samsung', '{"capacity_gb":3840,"interface":"SATA","pcie_gen":"","form_factor":"2.5","seq_read_mbps":560,"seq_write_mbps":530,"dwpd":1,"tbw":7008}');

  -- SSD 가격 일괄 입력
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'NVMe' THEN 280000
      WHEN p.model_name LIKE '%1.92TB%' AND p.specs->>'interface' = 'NVMe' THEN 480000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'NVMe' THEN 850000
      WHEN p.model_name LIKE '%1.6TB%' THEN 650000
      WHEN p.model_name LIKE '%3.2TB%' THEN 1100000
      WHEN p.model_name LIKE '%PM9C1a 1.92TB%' THEN 680000
      WHEN p.model_name LIKE '%PM9C1a 3.84TB%' THEN 1200000
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'SATA' THEN 180000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'SATA' THEN 580000
      ELSE 400000
    END AS list_price,
    CASE
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'NVMe' THEN 245000
      WHEN p.model_name LIKE '%1.92TB%' AND p.specs->>'interface' = 'NVMe' THEN 420000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'NVMe' THEN 740000
      WHEN p.model_name LIKE '%1.6TB%' THEN 570000
      WHEN p.model_name LIKE '%3.2TB%' THEN 960000
      WHEN p.model_name LIKE '%PM9C1a 1.92TB%' THEN 595000
      WHEN p.model_name LIKE '%PM9C1a 3.84TB%' THEN 1050000
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'SATA' THEN 155000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'SATA' THEN 500000
      ELSE 350000
    END AS market_price,
    CASE
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'NVMe' THEN 185000
      WHEN p.model_name LIKE '%1.92TB%' AND p.specs->>'interface' = 'NVMe' THEN 320000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'NVMe' THEN 560000
      WHEN p.model_name LIKE '%1.6TB%' THEN 430000
      WHEN p.model_name LIKE '%3.2TB%' THEN 730000
      WHEN p.model_name LIKE '%PM9C1a 1.92TB%' THEN 450000
      WHEN p.model_name LIKE '%PM9C1a 3.84TB%' THEN 800000
      WHEN p.model_name LIKE '%960GB%' AND p.specs->>'interface' = 'SATA' THEN 118000
      WHEN p.model_name LIKE '%3.84TB%' AND p.specs->>'interface' = 'SATA' THEN 380000
      ELSE 265000
    END AS supply_price
  FROM ai_server_composer.parts p
  WHERE p.category_id = v_cat_ssd AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- HDD (8개) — Seagate, WD
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_hdd, 'Exos X20 16TB SAS', 'Seagate', '{"capacity_tb":16,"interface":"SAS","rpm":7200,"cache_mb":256}'),
  (v_tenant_id, v_cat_hdd, 'Exos X20 20TB SAS', 'Seagate', '{"capacity_tb":20,"interface":"SAS","rpm":7200,"cache_mb":256}'),
  (v_tenant_id, v_cat_hdd, 'Exos X22 22TB SAS', 'Seagate', '{"capacity_tb":22,"interface":"SAS","rpm":7200,"cache_mb":512}'),
  (v_tenant_id, v_cat_hdd, 'Exos X20 20TB SATA', 'Seagate', '{"capacity_tb":20,"interface":"SATA","rpm":7200,"cache_mb":256}'),
  (v_tenant_id, v_cat_hdd, 'Ultrastar HC570 22TB SAS', 'Western Digital', '{"capacity_tb":22,"interface":"SAS","rpm":7200,"cache_mb":512}'),
  (v_tenant_id, v_cat_hdd, 'Ultrastar HC560 20TB SAS', 'Western Digital', '{"capacity_tb":20,"interface":"SAS","rpm":7200,"cache_mb":512}'),
  (v_tenant_id, v_cat_hdd, 'Ultrastar HC560 20TB SATA', 'Western Digital', '{"capacity_tb":20,"interface":"SATA","rpm":7200,"cache_mb":512}'),
  (v_tenant_id, v_cat_hdd, 'Exos X18 16TB SATA', 'Seagate', '{"capacity_tb":16,"interface":"SATA","rpm":7200,"cache_mb":256}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id, 650000, 560000, 430000
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_hdd AND p.tenant_id = v_tenant_id AND p.model_name LIKE '%16TB%'
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id, 780000, 670000, 520000
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_hdd AND p.tenant_id = v_tenant_id AND p.model_name LIKE '%20TB%'
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);
  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id, 850000, 740000, 570000
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_hdd AND p.tenant_id = v_tenant_id AND p.model_name LIKE '%22TB%'
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- NIC (6개) — Intel, Broadcom, Mellanox
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_nic, 'E810-XXVDA2 25GbE', 'Intel', '{"speed_gbps":25,"port_count":2,"bus_interface":"PCIe 4.0 x8","form_factor":"OCP 3.0","max_power_w":18}'),
  (v_tenant_id, v_cat_nic, 'E810-CQDA2 100GbE', 'Intel', '{"speed_gbps":100,"port_count":2,"bus_interface":"PCIe 4.0 x16","form_factor":"HHHL","max_power_w":25}'),
  (v_tenant_id, v_cat_nic, 'BCM57504 100GbE', 'Broadcom', '{"speed_gbps":100,"port_count":4,"bus_interface":"PCIe 4.0 x16","form_factor":"HHHL","max_power_w":30}'),
  (v_tenant_id, v_cat_nic, 'ConnectX-7 100GbE', 'NVIDIA', '{"speed_gbps":100,"port_count":2,"bus_interface":"PCIe 5.0 x16","form_factor":"HHHL","max_power_w":22}'),
  (v_tenant_id, v_cat_nic, 'ConnectX-7 200GbE', 'NVIDIA', '{"speed_gbps":200,"port_count":2,"bus_interface":"PCIe 5.0 x16","form_factor":"HHHL","max_power_w":28}'),
  (v_tenant_id, v_cat_nic, 'I350-T4 1GbE', 'Intel', '{"speed_gbps":1,"port_count":4,"bus_interface":"PCIe 2.1 x4","form_factor":"LP","max_power_w":5}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE WHEN p.model_name LIKE '%25GbE%' THEN 450000 WHEN p.model_name LIKE '%200GbE%' THEN 2800000 WHEN p.model_name LIKE '%1GbE%' THEN 120000 ELSE 1200000 END,
    CASE WHEN p.model_name LIKE '%25GbE%' THEN 390000 WHEN p.model_name LIKE '%200GbE%' THEN 2450000 WHEN p.model_name LIKE '%1GbE%' THEN 105000 ELSE 1050000 END,
    CASE WHEN p.model_name LIKE '%25GbE%' THEN 280000 WHEN p.model_name LIKE '%200GbE%' THEN 1750000 WHEN p.model_name LIKE '%1GbE%' THEN 75000 ELSE 750000 END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_nic AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- RAID (5개) — Broadcom MegaRAID
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_raid, 'MegaRAID 9560-8i', 'Broadcom', '{"raid_levels":"0,1,5,6,10,50,60","supported_interfaces":"SAS,SATA","max_drives":8,"cache_mb":4096,"battery_backup":"true","power_w":14}'),
  (v_tenant_id, v_cat_raid, 'MegaRAID 9560-16i', 'Broadcom', '{"raid_levels":"0,1,5,6,10,50,60","supported_interfaces":"SAS,SATA","max_drives":16,"cache_mb":8192,"battery_backup":"true","power_w":16}'),
  (v_tenant_id, v_cat_raid, 'MegaRAID 9670-24i', 'Broadcom', '{"raid_levels":"0,1,5,6,10,50,60","supported_interfaces":"SAS,SATA,NVMe","max_drives":24,"cache_mb":8192,"battery_backup":"true","power_w":18}'),
  (v_tenant_id, v_cat_raid, 'MegaRAID 9540-8i', 'Broadcom', '{"raid_levels":"0,1,10","supported_interfaces":"SAS,SATA","max_drives":8,"cache_mb":0,"battery_backup":"false","power_w":10}'),
  (v_tenant_id, v_cat_raid, 'MegaRAID 9560-LP', 'Broadcom', '{"raid_levels":"0,1,5,6,10,50,60","supported_interfaces":"SAS,SATA","max_drives":8,"cache_mb":4096,"battery_backup":"true","power_w":12}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE WHEN p.model_name LIKE '%9670%' THEN 1500000 WHEN p.model_name LIKE '%9560-16i%' THEN 1100000 WHEN p.model_name LIKE '%9540%' THEN 350000 ELSE 750000 END,
    CASE WHEN p.model_name LIKE '%9670%' THEN 1300000 WHEN p.model_name LIKE '%9560-16i%' THEN 960000 WHEN p.model_name LIKE '%9540%' THEN 300000 ELSE 650000 END,
    CASE WHEN p.model_name LIKE '%9670%' THEN 880000 WHEN p.model_name LIKE '%9560-16i%' THEN 650000 WHEN p.model_name LIKE '%9540%' THEN 205000 ELSE 440000 END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_raid AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- GPU (6개) — NVIDIA
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_gpu, 'H100 SXM 80GB', 'NVIDIA', '{"vram_gb":80,"memory_type":"HBM3","tdp_w":700,"pcie_version":"5.0","form_factor":"SXM5","architecture":"Hopper"}'),
  (v_tenant_id, v_cat_gpu, 'H100 PCIe 80GB', 'NVIDIA', '{"vram_gb":80,"memory_type":"HBM3","tdp_w":350,"pcie_version":"5.0","form_factor":"PCIe FHFL","architecture":"Hopper"}'),
  (v_tenant_id, v_cat_gpu, 'H200 SXM 141GB', 'NVIDIA', '{"vram_gb":141,"memory_type":"HBM3e","tdp_w":700,"pcie_version":"5.0","form_factor":"SXM5","architecture":"Hopper"}'),
  (v_tenant_id, v_cat_gpu, 'L40S 48GB', 'NVIDIA', '{"vram_gb":48,"memory_type":"GDDR6","tdp_w":350,"pcie_version":"4.0","form_factor":"PCIe FHFL","architecture":"Ada Lovelace"}'),
  (v_tenant_id, v_cat_gpu, 'A100 PCIe 80GB', 'NVIDIA', '{"vram_gb":80,"memory_type":"HBM2e","tdp_w":300,"pcie_version":"4.0","form_factor":"PCIe FHFL","architecture":"Ampere"}'),
  (v_tenant_id, v_cat_gpu, 'A100 SXM 80GB', 'NVIDIA', '{"vram_gb":80,"memory_type":"HBM2e","tdp_w":400,"pcie_version":"4.0","form_factor":"SXM4","architecture":"Ampere"}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE p.model_name
      WHEN 'H100 SXM 80GB'  THEN 45000000 WHEN 'H100 PCIe 80GB' THEN 38000000
      WHEN 'H200 SXM 141GB' THEN 55000000 WHEN 'L40S 48GB'      THEN 12000000
      WHEN 'A100 PCIe 80GB' THEN 18000000 WHEN 'A100 SXM 80GB'  THEN 22000000
    END,
    CASE p.model_name
      WHEN 'H100 SXM 80GB'  THEN 40000000 WHEN 'H100 PCIe 80GB' THEN 34000000
      WHEN 'H200 SXM 141GB' THEN 49000000 WHEN 'L40S 48GB'      THEN 10500000
      WHEN 'A100 PCIe 80GB' THEN 15500000 WHEN 'A100 SXM 80GB'  THEN 19000000
    END,
    CASE p.model_name
      WHEN 'H100 SXM 80GB'  THEN 34000000 WHEN 'H100 PCIe 80GB' THEN 29000000
      WHEN 'H200 SXM 141GB' THEN 42000000 WHEN 'L40S 48GB'      THEN 8900000
      WHEN 'A100 PCIe 80GB' THEN 13000000 WHEN 'A100 SXM 80GB'  THEN 16000000
    END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_gpu AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- PSU (4개)
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_psu, 'PWS-1K28P-SQ 1200W', 'Supermicro', '{"capacity_w":1200,"efficiency":"80 Plus Platinum","redundancy":"1+1","form_factor":"1U"}'),
  (v_tenant_id, v_cat_psu, 'DPS-1600AB 1600W', 'Delta', '{"capacity_w":1600,"efficiency":"80 Plus Platinum","redundancy":"1+1","form_factor":"1U"}'),
  (v_tenant_id, v_cat_psu, 'DPS-2000BB 2000W', 'Delta', '{"capacity_w":2000,"efficiency":"80 Plus Titanium","redundancy":"1+1","form_factor":"2U"}'),
  (v_tenant_id, v_cat_psu, 'DPS-2400AB 2400W', 'Delta', '{"capacity_w":2400,"efficiency":"80 Plus Titanium","redundancy":"1+1","form_factor":"2U"}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE WHEN p.model_name LIKE '%1200W%' THEN 350000 WHEN p.model_name LIKE '%1600W%' THEN 480000 WHEN p.model_name LIKE '%2000W%' THEN 650000 ELSE 820000 END,
    CASE WHEN p.model_name LIKE '%1200W%' THEN 305000 WHEN p.model_name LIKE '%1600W%' THEN 420000 WHEN p.model_name LIKE '%2000W%' THEN 570000 ELSE 720000 END,
    CASE WHEN p.model_name LIKE '%1200W%' THEN 230000 WHEN p.model_name LIKE '%1600W%' THEN 315000 WHEN p.model_name LIKE '%2000W%' THEN 430000 ELSE 540000 END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_psu AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- 메인보드 (3개)
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_mb, 'X13DEI-T LGA4677 Dual', 'Supermicro', '{"socket":"LGA4677","memory_slots":32,"memory_type":"DDR5","storage_interfaces":"NVMe,SATA,SAS","pcie_slots":7,"form_factor":"E-ATX"}'),
  (v_tenant_id, v_cat_mb, 'H13SSL-N SP5 Single', 'Supermicro', '{"socket":"SP5","memory_slots":12,"memory_type":"DDR5","storage_interfaces":"NVMe,SATA","pcie_slots":4,"form_factor":"ATX"}'),
  (v_tenant_id, v_cat_mb, 'KRPA-U16 SP3 Dual', 'ASUS', '{"socket":"SP3","memory_slots":32,"memory_type":"DDR4","storage_interfaces":"NVMe,SATA,SAS","pcie_slots":7,"form_factor":"E-ATX"}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE WHEN p.model_name LIKE '%X13DEI%' THEN 1800000 WHEN p.model_name LIKE '%H13SSL%' THEN 950000 ELSE 1200000 END,
    CASE WHEN p.model_name LIKE '%X13DEI%' THEN 1570000 WHEN p.model_name LIKE '%H13SSL%' THEN 830000 ELSE 1050000 END,
    CASE WHEN p.model_name LIKE '%X13DEI%' THEN 1180000 WHEN p.model_name LIKE '%H13SSL%' THEN 625000 ELSE 790000 END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_mb AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  -- ============================================================
  -- 섀시 (3개)
  -- ============================================================

  INSERT INTO ai_server_composer.parts (tenant_id, category_id, model_name, manufacturer, specs) VALUES
  (v_tenant_id, v_cat_chassis, 'SYS-421GE-TNRT 4U GPU', 'Supermicro', '{"form_factor":"4U","u_size":4,"max_drive_bays":24,"gpu_support":"8x FHFL, SXM5","max_psu":4}'),
  (v_tenant_id, v_cat_chassis, 'SC826BAC4-R1K23LPB 2U Storage', 'Supermicro', '{"form_factor":"2U","u_size":2,"max_drive_bays":12,"gpu_support":"false","max_psu":2}'),
  (v_tenant_id, v_cat_chassis, 'SC813MF2TQ-R608CB 1U Compute', 'Supermicro', '{"form_factor":"1U","u_size":1,"max_drive_bays":4,"gpu_support":"1x LP","max_psu":2}');

  INSERT INTO ai_server_composer.part_prices (part_id, list_price, market_price, supply_price)
  SELECT p.id,
    CASE WHEN p.model_name LIKE '%4U%' THEN 3500000 WHEN p.model_name LIKE '%2U%' THEN 1200000 ELSE 650000 END,
    CASE WHEN p.model_name LIKE '%4U%' THEN 3050000 WHEN p.model_name LIKE '%2U%' THEN 1050000 ELSE 570000 END,
    CASE WHEN p.model_name LIKE '%4U%' THEN 2300000 WHEN p.model_name LIKE '%2U%' THEN 790000 ELSE 430000 END
  FROM ai_server_composer.parts p WHERE p.category_id = v_cat_chassis AND p.tenant_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM ai_server_composer.part_prices pp WHERE pp.part_id = p.id);

  RAISE NOTICE '시드 데이터 완료: tenant_id = %', v_tenant_id;
  RAISE NOTICE '총 부품 수: %', (SELECT count(*) FROM ai_server_composer.parts WHERE tenant_id = v_tenant_id);

END $$;
