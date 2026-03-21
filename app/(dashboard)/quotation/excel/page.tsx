"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Download, FileSpreadsheet, ArrowRight, CheckCircle2, Cpu, MemoryStick, HardDrive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CustomerBanner } from "@/components/quotation/customer-banner";
import type { ParsedServerConfig } from "@/lib/types/ai";

/** ParsedServerConfig → 테이블 표시용 변환 */
function configToDisplay(c: ParsedServerConfig) {
  const r = c.requirements;
  return {
    config_name: c.config_name,
    quantity: c.quantity,
    cpu: r.cpu ? `${r.cpu.min_cores ?? "?"}코어${r.cpu.architecture ? ` (${r.cpu.architecture})` : ""}` : "-",
    memory: r.memory ? `${r.memory.min_capacity_gb}GB ${r.memory.type ?? ""}`.trim() : "-",
    ssd: r.storage?.items.filter(s => s.type === "SSD").map(s => `${s.min_capacity_gb}GB x${s.quantity}`).join(", ") || "-",
    hdd: r.storage?.items.filter(s => s.type === "HDD").map(s => `${s.min_capacity_gb}GB x${s.quantity}`).join(", ") || "-",
    gpu: r.gpu ? `${r.gpu.preferred_model ?? `${r.gpu.min_vram_gb}GB`} x${r.gpu.min_count}` : "-",
    network: r.network ? `${r.network.min_speed_gbps}Gbps` : "-",
    notes: c.notes.join(", ") || "-",
  };
}

export default function ExcelQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer_id") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!customerId) {
      router.replace("/quotation");
    }
  }, [customerId, router]);

  const [file, setFile] = useState<File | null>(null);
  const [parsedConfigs, setParsedConfigs] = useState<ParsedServerConfig[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTemplateDownload = async () => {
    try {
      const res = await fetch("/api/quotation/excel-template");
      if (!res.ok) throw new Error("템플릿 다운로드 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "server-quotation-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("엑셀 템플릿이 다운로드되었습니다.");
    } catch {
      toast.error("템플릿 다운로드에 실패했습니다.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        toast.error("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
        return;
      }
      setFile(selected);
      setParsedConfigs(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.match(/\.(xlsx|xls)$/i)) {
      setFile(dropped);
      setParsedConfigs(null);
    } else {
      toast.error("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quotation/excel-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "파싱에 실패했습니다.");
        return;
      }

      setParsedConfigs(json.data.parsed_configs);

      if (json.data.errors?.length > 0) {
        toast.warning(`${json.data.errors.length}개 행에서 오류가 발생했습니다.`);
      } else {
        toast.success(`${json.data.config_count}개 서버 구성이 파싱되었습니다.`);
      }
    } catch {
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedConfigs(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [submitting, setSubmitting] = useState(false);

  const handleGenerateQuotation = async () => {
    if (!parsedConfigs || parsedConfigs.length === 0) return;
    setSubmitting(true);

    try {
      const draftRes = await fetch("/api/quotation/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          source: "excel",
          source_data: { configs: parsedConfigs },
        }),
      });
      const draftJson = await draftRes.json();
      if (draftJson.success) {
        router.push(
          `/quotation/result?customer_id=${customerId}&draft_id=${draftJson.data.id}&source=excel`,
        );
      } else {
        // 폴백: draft 생성 실패 시 sessionStorage 사용
        sessionStorage.setItem("excel_quotation_specs", JSON.stringify(parsedConfigs));
        router.push(`/quotation/result?customer_id=${customerId}&source=excel`);
      }
    } catch {
      // 폴백: 네트워크 오류 시 sessionStorage 사용
      sessionStorage.setItem("excel_quotation_specs", JSON.stringify(parsedConfigs));
      router.push(`/quotation/result?customer_id=${customerId}&source=excel`);
    } finally {
      setSubmitting(false);
    }
  };

  const displayData = parsedConfigs?.map(configToDisplay) ?? [];

  return (
    <div className="space-y-6">
      {customerId && <CustomerBanner customerId={customerId} />}

      <div>
        <h2 className="text-2xl font-bold">엑셀 업로드 견적</h2>
        <p className="text-muted-foreground">
          엑셀 파일로 서버 구성을 입력하여 견적을 생성합니다.
        </p>
      </div>

      {/* Step 1: 템플릿 다운로드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">1</Badge>
            <CardTitle className="text-base">엑셀 템플릿 다운로드</CardTitle>
          </div>
          <CardDescription>
            규격에 맞는 엑셀 템플릿을 다운로드하여 서버 구성을 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleTemplateDownload}>
            <Download className="h-4 w-4 mr-2" />
            견적용 엑셀 템플릿 다운로드 (.xlsx)
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: 파일 업로드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">2</Badge>
            <CardTitle className="text-base">엑셀 파일 업로드</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-1">
                엑셀 파일을 드래그하여 놓거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-muted-foreground">
                지원 형식: .xlsx, .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!parsedConfigs && (
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        파싱 중...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        업로드 및 파싱
                      </>
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: 파싱 결과 */}
      {displayData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs bg-green-50 border-green-200 text-green-700">
                <CheckCircle2 className="h-3 w-3" />
              </Badge>
              <CardTitle className="text-base">파싱 결과 확인</CardTitle>
              <Badge variant="secondary">{displayData.length}개 서버 구성</Badge>
            </div>
            <CardDescription>
              파싱된 서버 구성을 확인하고 견적을 생성하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>서버명</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>메모리</TableHead>
                    <TableHead>SSD</TableHead>
                    <TableHead>HDD</TableHead>
                    <TableHead>GPU</TableHead>
                    <TableHead>네트워크</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((server, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{server.config_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{server.quantity}대</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{server.cpu}</TableCell>
                      <TableCell className="text-sm">{server.memory}</TableCell>
                      <TableCell className="text-sm">{server.ssd}</TableCell>
                      <TableCell className="text-sm">{server.hdd}</TableCell>
                      <TableCell className="text-sm">{server.gpu}</TableCell>
                      <TableCell className="text-sm">{server.network}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{server.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">총 서버</p>
                  <p className="text-sm font-semibold">
                    {displayData.reduce((sum, s) => sum + s.quantity, 0)}대
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">서버 유형</p>
                  <p className="text-sm font-semibold">{displayData.length}종</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">GPU 서버</p>
                  <p className="text-sm font-semibold">
                    {displayData.filter((s) => s.gpu !== "-").length}종
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClear}>
                다시 업로드
              </Button>
              <Button onClick={handleGenerateQuotation} disabled={submitting}>
                {submitting ? "견적 초안 생성 중..." : "견적 생성"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
