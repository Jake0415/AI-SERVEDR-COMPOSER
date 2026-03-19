// ============================================================
// POST /api/quotation/excel-upload — 견적용 엑셀 파싱 API
// 엑셀 → ParsedServerConfig[] 변환
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";
import type { ParsedServerConfig } from "@/lib/types/ai";

interface ParseError {
  row: number;
  field: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "파일이 필요합니다." } },
        { status: 400 },
      );
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "엑셀 파일(.xlsx, .xls)만 지원합니다." } },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const ws = workbook.getWorksheet("서버 구성") ?? workbook.worksheets[0];
    if (!ws) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "워크시트를 찾을 수 없습니다." } },
        { status: 400 },
      );
    }

    const configs: ParsedServerConfig[] = [];
    const errors: ParseError[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵

      const configName = String(row.getCell(1).value ?? "").trim();
      const quantity = Number(row.getCell(2).value) || 0;

      if (!configName) return; // 빈 행 스킵

      if (quantity <= 0) {
        errors.push({ row: rowNumber, field: "수량", message: "수량은 1 이상이어야 합니다." });
        return;
      }

      const cpuCores = Number(row.getCell(3).value) || null;
      const cpuModel = String(row.getCell(4).value ?? "").trim() || null;
      const memoryGb = Number(row.getCell(5).value) || 0;
      const memoryType = String(row.getCell(6).value ?? "").trim().toUpperCase() as "DDR4" | "DDR5" | "";
      const ssdGb = Number(row.getCell(7).value) || 0;
      const ssdQty = Number(row.getCell(8).value) || 0;
      const hddGb = Number(row.getCell(9).value) || 0;
      const hddQty = Number(row.getCell(10).value) || 0;
      const gpuModel = String(row.getCell(11).value ?? "").trim() || null;
      const gpuQty = Number(row.getCell(12).value) || 0;
      const networkGbps = Number(row.getCell(13).value) || 0;
      const raidLevel = String(row.getCell(14).value ?? "").trim() || null;
      const powerRedundancy = String(row.getCell(15).value ?? "").trim().toUpperCase() === "Y";
      const notes = String(row.getCell(16).value ?? "").trim();

      // 스토리지 아이템
      const storageItems = [];
      if (ssdGb > 0 && ssdQty > 0) {
        storageItems.push({ type: "SSD" as const, min_capacity_gb: ssdGb, interface_type: "NVMe" as const, quantity: ssdQty });
      }
      if (hddGb > 0 && hddQty > 0) {
        storageItems.push({ type: "HDD" as const, min_capacity_gb: hddGb, interface_type: "SAS" as const, quantity: hddQty });
      }

      // GPU 모델에서 VRAM 추출 시도
      let gpuVram = 0;
      if (gpuModel) {
        const vramMatch = gpuModel.match(/(\d+)\s*GB/i);
        gpuVram = vramMatch ? parseInt(vramMatch[1]) : 80;
      }

      const config: ParsedServerConfig = {
        config_name: configName,
        quantity,
        requirements: {
          cpu: cpuCores ? { min_cores: cpuCores, min_clock_ghz: null, socket_type: null, architecture: cpuModel, max_tdp_w: null } : null,
          memory: memoryGb > 0 ? { min_capacity_gb: memoryGb, type: (memoryType === "DDR4" || memoryType === "DDR5") ? memoryType : null, ecc: true, min_speed_mhz: null } : null,
          storage: storageItems.length > 0 ? { items: storageItems } : null,
          gpu: gpuModel && gpuQty > 0 ? { min_vram_gb: gpuVram, min_count: gpuQty, use_case: "범용", preferred_model: gpuModel } : null,
          network: networkGbps > 0 ? { min_speed_gbps: networkGbps, port_count: null, type: null } : null,
          raid: raidLevel ? { level: raidLevel, required: true } : null,
          power: { redundancy: powerRedundancy, min_wattage: null },
        },
        notes: notes ? [notes] : [],
      };

      configs.push(config);
    });

    if (configs.length === 0 && errors.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "EMPTY_DATA", message: "파싱된 서버 구성이 없습니다. 데이터를 확인해주세요." } },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        parsed_configs: configs,
        config_count: configs.length,
        errors,
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
