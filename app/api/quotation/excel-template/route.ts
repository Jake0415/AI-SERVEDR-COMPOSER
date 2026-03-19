// ============================================================
// GET /api/quotation/excel-template — 견적용 엑셀 템플릿 다운로드
// ============================================================

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("서버 구성");

  ws.columns = [
    { header: "서버명", key: "config_name", width: 20 },
    { header: "수량", key: "quantity", width: 8 },
    { header: "CPU 코어 수", key: "cpu_cores", width: 12 },
    { header: "CPU 모델 (선택)", key: "cpu_model", width: 20 },
    { header: "메모리(GB)", key: "memory_gb", width: 12 },
    { header: "메모리 타입", key: "memory_type", width: 12 },
    { header: "SSD 용량(GB)", key: "ssd_gb", width: 14 },
    { header: "SSD 수량", key: "ssd_qty", width: 10 },
    { header: "HDD 용량(GB)", key: "hdd_gb", width: 14 },
    { header: "HDD 수량", key: "hdd_qty", width: 10 },
    { header: "GPU 모델 (선택)", key: "gpu_model", width: 20 },
    { header: "GPU 수량", key: "gpu_qty", width: 10 },
    { header: "네트워크(Gbps)", key: "network_gbps", width: 14 },
    { header: "RAID 레벨", key: "raid_level", width: 12 },
    { header: "전원 이중화(Y/N)", key: "power_redundancy", width: 16 },
    { header: "비고", key: "notes", width: 25 },
  ];

  // 헤더 스타일
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });
  headerRow.height = 28;

  // 샘플 데이터 3행
  const samples = [
    { config_name: "웹 서버", quantity: 3, cpu_cores: 32, cpu_model: "", memory_gb: 64, memory_type: "DDR5", ssd_gb: 1920, ssd_qty: 2, hdd_gb: 0, hdd_qty: 0, gpu_model: "", gpu_qty: 0, network_gbps: 10, raid_level: "", power_redundancy: "Y", notes: "" },
    { config_name: "DB 서버", quantity: 2, cpu_cores: 64, cpu_model: "", memory_gb: 256, memory_type: "DDR5", ssd_gb: 1920, ssd_qty: 4, hdd_gb: 4000, hdd_qty: 8, gpu_model: "", gpu_qty: 0, network_gbps: 25, raid_level: "RAID10", power_redundancy: "Y", notes: "고가용성" },
    { config_name: "AI 학습 서버", quantity: 1, cpu_cores: 48, cpu_model: "", memory_gb: 512, memory_type: "DDR5", ssd_gb: 1920, ssd_qty: 2, hdd_gb: 0, hdd_qty: 0, gpu_model: "A100 80GB", gpu_qty: 4, network_gbps: 100, raid_level: "", power_redundancy: "Y", notes: "NVLink 필요" },
  ];

  samples.forEach((s) => {
    const row = ws.addRow(s);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
  });

  // 메모리 타입 드롭다운
  for (let r = 2; r <= 50; r++) {
    ws.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"DDR4,DDR5"'],
    };
    ws.getCell(`O${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Y,N"'],
    };
  }

  // 숫자 포맷
  ["C", "E", "G", "H", "I", "J", "L", "M"].forEach((col) => {
    for (let r = 2; r <= 50; r++) {
      ws.getCell(`${col}${r}`).numFmt = "#,##0";
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(Buffer.from(buffer)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="server-quotation-template.xlsx"',
    },
  });
}
