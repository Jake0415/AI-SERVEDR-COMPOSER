"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, Server, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedServerConfig } from "@/lib/types";

interface RfpRecord {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  parsedRequirements: ParsedServerConfig[] | null;
}

interface UploadResult {
  rfp_id: string;
  file_name: string;
  parsed_configs: ParsedServerConfig[];
  config_count: number;
}

/** RFP 상태별 Badge variant 매핑 */
function statusBadge(status: string) {
  switch (status) {
    case "uploaded":
      return <Badge variant="secondary">업로드됨</Badge>;
    case "parsing":
      return <Badge variant="outline">파싱중</Badge>;
    case "parsed":
      return <Badge>파싱완료</Badge>;
    case "error":
      return <Badge variant="destructive">오류</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function RfpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [rfpList, setRfpList] = useState<RfpRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [dragOver, setDragOver] = useState(false);

  // RFP 이력 조회
  const fetchRfpList = useCallback(async () => {
    try {
      const res = await fetch("/api/rfp");
      const json = await res.json();
      if (json.success) {
        setRfpList(json.data);
      }
    } catch {
      // 조회 실패 시 빈 목록 유지
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRfpList();
  }, [fetchRfpList]);

  // 파일 업로드 처리
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/rfp/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setUploadError(json.error?.message ?? "업로드에 실패했습니다.");
        return;
      }

      setUploadResult(json.data);
      // 이력 새로고침
      await fetchRfpList();
    } catch {
      setUploadError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div>
        <h2 className="text-2xl font-bold">RFP 업로드</h2>
        <p className="text-muted-foreground">
          PDF, DOCX 파일을 업로드하면 AI가 서버 사양 요구사항을 자동으로 추출합니다.
        </p>
      </div>

      {/* 드래그앤드롭 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              파일을 분석하고 있습니다... AI가 서버 사양을 추출 중입니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">PDF, DOCX 파일을 드래그앤드롭하세요</p>
            <p className="text-xs text-muted-foreground">
              또는 클릭하여 파일을 선택하세요 (최대 20MB)
            </p>
          </div>
        )}
      </div>

      {/* 업로드 에러 */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* 파싱 결과 */}
      {uploadResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            파싱 결과 — {uploadResult.config_count}개 서버 구성 발견
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadResult.parsed_configs.map((config, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4" />
                    {config.config_name}
                    <Badge variant="secondary" className="ml-auto">
                      x{config.quantity}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {config.requirements.cpu && (
                    <p>
                      <span className="text-muted-foreground">CPU:</span>{" "}
                      {config.requirements.cpu.min_cores}코어 이상
                      {config.requirements.cpu.min_clock_ghz
                        ? `, ${config.requirements.cpu.min_clock_ghz}GHz+`
                        : ""}
                    </p>
                  )}
                  {config.requirements.memory && (
                    <p>
                      <span className="text-muted-foreground">메모리:</span>{" "}
                      {config.requirements.memory.min_capacity_gb}GB 이상
                      {config.requirements.memory.type
                        ? ` (${config.requirements.memory.type})`
                        : ""}
                    </p>
                  )}
                  {config.requirements.storage && (
                    <p>
                      <span className="text-muted-foreground">스토리지:</span>{" "}
                      {config.requirements.storage.items
                        .map(
                          (s) =>
                            `${s.type} ${s.min_capacity_gb}GB x${s.quantity}`
                        )
                        .join(", ")}
                    </p>
                  )}
                  {config.requirements.gpu && (
                    <p>
                      <span className="text-muted-foreground">GPU:</span>{" "}
                      {config.requirements.gpu.min_vram_gb}GB VRAM x
                      {config.requirements.gpu.min_count}
                    </p>
                  )}
                  {config.notes.length > 0 && (
                    <p className="text-muted-foreground text-xs mt-2">
                      참고: {config.notes.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            onClick={() =>
              router.push(`/quotation?rfp_id=${uploadResult.rfp_id}`)
            }
          >
            이 RFP로 견적 생성
          </Button>
        </div>
      )}

      {/* RFP 이력 테이블 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">RFP 이력</h3>
        {listLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rfpList.length === 0 ? (
          <div className="border rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              업로드된 RFP가 없습니다.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfpList.map((rfp) => (
                  <TableRow key={rfp.id}>
                    <TableCell className="text-sm">
                      {new Date(rfp.createdAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {rfp.fileName}
                    </TableCell>
                    <TableCell>{statusBadge(rfp.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {rfp.status === "parsed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/quotation/configure?rfp_id=${rfp.id}`
                              )
                            }
                          >
                            <ServerCog className="h-3.5 w-3.5 mr-1.5" />
                            서버 구성
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/quotation?rfp_id=${rfp.id}`)
                            }
                          >
                            견적 생성
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
