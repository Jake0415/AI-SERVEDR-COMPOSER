"use client";

import { useState } from "react";
import { Server, Cpu, MemoryStick, HardDrive, CircuitBoard, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  { id: 1, label: "베이스 서버", icon: Server, description: "섀시 + 메인보드 선택" },
  { id: 2, label: "CPU", icon: Cpu, description: "프로세서 선택" },
  { id: 3, label: "메모리", icon: MemoryStick, description: "DIMM 슬롯 배치" },
  { id: 4, label: "스토리지", icon: HardDrive, description: "드라이브 베이 배치" },
  { id: 5, label: "확장 카드", icon: CircuitBoard, description: "PCIe 슬롯 배치" },
  { id: 6, label: "전원/견적", icon: Zap, description: "PSU 선택 + 견적 확인" },
];

export default function AssemblyPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [mode, setMode] = useState<"auto" | "manual">("manual");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">서버 조립 견적</h2>
          <p className="text-muted-foreground">부품을 단계별로 선택하여 서버를 구성합니다.</p>
        </div>
      </div>

      {/* 모드 전환 */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "auto" | "manual")}>
        <TabsList>
          <TabsTrigger value="auto">자동 조립</TabsTrigger>
          <TabsTrigger value="manual">수동 조립</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                RFP 요구사항을 기반으로 AI가 최적의 서버 구성을 자동으로 추천합니다.
              </p>
              <Button className="mt-4" onClick={() => setMode("manual")}>
                수동 편집으로 전환
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-6">
          {/* 단계 네비게이션 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const isComplete = step.id < activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-primary bg-primary/5 text-primary"
                      : isComplete
                        ? "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "border-muted hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{step.label}</span>
                  {isComplete && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-100 dark:bg-green-900/40">완료</Badge>}
                  {idx < STEPS.length - 1 && <span className="text-muted-foreground ml-1 hidden lg:inline">→</span>}
                </button>
              );
            })}
          </div>

          <Separator />

          {/* 단계별 컨텐츠 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const step = STEPS[activeStep - 1];
                  const Icon = step.icon;
                  return (
                    <>
                      <Icon className="h-5 w-5" />
                      Step {step.id}: {step.label}
                      <span className="text-muted-foreground font-normal text-sm ml-2">— {step.description}</span>
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeStep === 1 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>베이스 서버 (섀시 + 메인보드) 를 선택하세요.</p>
                  <p className="text-xs mt-1">폼팩터, 소켓, 제조사로 필터링할 수 있습니다.</p>
                </div>
              )}
              {activeStep === 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Cpu className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>CPU를 선택하세요. 소켓 호환 모델만 표시됩니다.</p>
                </div>
              )}
              {activeStep === 3 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MemoryStick className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>메모리 슬롯에 DIMM을 배치하세요.</p>
                  <p className="text-xs mt-1">채널별 균등 배치를 권장합니다.</p>
                </div>
              )}
              {activeStep === 4 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HardDrive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>드라이브 베이에 스토리지를 배치하세요.</p>
                  <p className="text-xs mt-1">2.5인치와 3.5인치 베이가 구분됩니다.</p>
                </div>
              )}
              {activeStep === 5 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CircuitBoard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>PCIe 슬롯에 확장 카드 (GPU, NIC, RAID, HBA)를 배치하세요.</p>
                </div>
              )}
              {activeStep === 6 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>PSU를 선택하고 최종 견적을 확인하세요.</p>
                  <p className="text-xs mt-1">전력 사용량 대비 권장 PSU 용량을 안내합니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 하단 네비게이션 */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
            >
              이전 단계
            </Button>
            <Button
              onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
              disabled={activeStep === 6}
            >
              다음 단계
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
