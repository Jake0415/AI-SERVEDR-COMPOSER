"use client";

import { Cpu, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParsedServerConfig } from "@/lib/types/ai";

interface SpecsSidebarProps {
  specs: ParsedServerConfig[];
  isComplete: boolean;
  onGenerate: () => void;
}

function specSummary(config: ParsedServerConfig) {
  const lines: { label: string; value: string }[] = [];
  const r = config.requirements;
  if (r.cpu) {
    const parts = [];
    if (r.cpu.min_cores) parts.push(`${r.cpu.min_cores}코어`);
    if (r.cpu.architecture) parts.push(r.cpu.architecture);
    if (parts.length > 0) lines.push({ label: "CPU", value: parts.join(", ") });
  }
  if (r.memory) lines.push({ label: "메모리", value: `${r.memory.min_capacity_gb}GB ${r.memory.type ?? ""}`.trim() });
  if (r.storage) {
    const storageStr = r.storage.items.map(s => `${s.type} ${s.min_capacity_gb}GB x${s.quantity}`).join(", ");
    lines.push({ label: "스토리지", value: storageStr });
  }
  if (r.gpu) lines.push({ label: "GPU", value: `${r.gpu.min_vram_gb}GB x${r.gpu.min_count}` });
  if (r.network) lines.push({ label: "네트워크", value: `${r.network.min_speed_gbps}Gbps` });
  return lines;
}

export function SpecsSidebar({ specs, isComplete, onGenerate }: SpecsSidebarProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          사양 요약
          {isComplete && <Badge className="text-xs">확정 가능</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {specs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cpu className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">대화를 통해 사양이 결정되면</p>
            <p className="text-sm">여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {specs.map((config, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{config.config_name}</span>
                  <Badge variant="secondary">x{config.quantity}</Badge>
                </div>
                {specSummary(config).map((item, j) => (
                  <div key={j} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
                {config.notes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{config.notes.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {specs.length > 0 && (
        <div className="p-4 border-t">
          <Button className="w-full" onClick={onGenerate}>
            견적 생성
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
}
