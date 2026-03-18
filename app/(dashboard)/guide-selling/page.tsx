"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server, Database, Brain, Monitor, Cpu, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WORKLOADS = [
  { id: "web", label: "웹 서버", icon: Server, desc: "웹 애플리케이션, API 서버", color: "bg-blue-500" },
  { id: "db", label: "DB 서버", icon: Database, desc: "RDBMS, NoSQL 데이터베이스", color: "bg-green-500" },
  { id: "ai", label: "AI/ML 서버", icon: Brain, desc: "모델 학습, 추론 워크로드", color: "bg-purple-500" },
  { id: "vdi", label: "VDI 서버", icon: Monitor, desc: "가상 데스크톱 인프라", color: "bg-orange-500" },
  { id: "hpc", label: "HPC 서버", icon: Cpu, desc: "고성능 컴퓨팅, 시뮬레이션", color: "bg-red-500" },
];

const SCALE_OPTIONS = [
  { id: "small", label: "소규모", desc: "사용자 ~100명, 데이터 ~1TB" },
  { id: "medium", label: "중규모", desc: "사용자 100~1,000명, 데이터 1~10TB" },
  { id: "large", label: "대규모", desc: "사용자 1,000명+, 데이터 10TB+" },
];

const RECOMMENDATIONS: Record<string, Record<string, { cpu: string; memory: string; storage: string; qty: string }>> = {
  web: {
    small: { cpu: "Xeon Silver 4310 (12C)", memory: "64GB DDR4", storage: "SSD 480GB x2 (RAID1)", qty: "1대" },
    medium: { cpu: "Xeon Gold 5317 (12C)", memory: "128GB DDR4", storage: "SSD 960GB x2 (RAID1)", qty: "2대" },
    large: { cpu: "Xeon Gold 6330 (28C)", memory: "256GB DDR4", storage: "SSD 1.92TB x2 (RAID1)", qty: "4대+" },
  },
  db: {
    small: { cpu: "Xeon Gold 5317 (12C)", memory: "128GB DDR4", storage: "SSD 960GB x4 (RAID10)", qty: "1대" },
    medium: { cpu: "Xeon Gold 6330 (28C)", memory: "512GB DDR4", storage: "SSD 3.84TB x4 (RAID10)", qty: "2대" },
    large: { cpu: "Xeon Platinum 8358 (32C) x2", memory: "1TB DDR4", storage: "NVMe 7.68TB x8", qty: "3대+" },
  },
  ai: {
    small: { cpu: "Xeon Gold 6330 (28C)", memory: "256GB DDR4", storage: "NVMe 3.84TB x2", qty: "1대 + GPU 1장" },
    medium: { cpu: "Xeon Platinum 8358 (32C) x2", memory: "512GB DDR4", storage: "NVMe 7.68TB x4", qty: "2대 + GPU 4장" },
    large: { cpu: "Xeon Platinum 8380 (40C) x2", memory: "1TB DDR4", storage: "NVMe 15.36TB x8", qty: "4대+ + GPU 8장+" },
  },
  vdi: {
    small: { cpu: "Xeon Silver 4314 (16C)", memory: "128GB DDR4", storage: "SSD 960GB x4", qty: "1대 (25 VDI)" },
    medium: { cpu: "Xeon Gold 6330 (28C)", memory: "512GB DDR4", storage: "SSD 3.84TB x4", qty: "2대 (100 VDI)" },
    large: { cpu: "Xeon Platinum 8358 (32C) x2", memory: "1TB DDR4", storage: "NVMe 7.68TB x8", qty: "4대+ (250+ VDI)" },
  },
  hpc: {
    small: { cpu: "Xeon Gold 6330 (28C) x2", memory: "256GB DDR4", storage: "NVMe 3.84TB x2", qty: "2대" },
    medium: { cpu: "Xeon Platinum 8358 (32C) x2", memory: "512GB DDR4", storage: "NVMe 7.68TB x4", qty: "4대" },
    large: { cpu: "Xeon Platinum 8380 (40C) x2", memory: "1TB DDR4", storage: "NVMe 15.36TB x8", qty: "8대+" },
  },
};

export default function GuideSellingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workload, setWorkload] = useState<string | null>(null);
  const [scale, setScale] = useState<string | null>(null);

  const recommendation = workload && scale ? RECOMMENDATIONS[workload]?.[scale] : null;

  const reset = () => { setStep(1); setWorkload(null); setScale(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">가이드 셀링</h2>
          <p className="text-muted-foreground">용도에 맞는 최적의 서버 구성을 추천합니다.</p>
        </div>
        {step > 1 && (
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />처음부터
          </Button>
        )}
      </div>

      {/* Step 1: 워크로드 선택 */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Step 1: 서버 용도를 선택하세요</h3>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {WORKLOADS.map((w) => {
              const Icon = w.icon;
              return (
                <Card
                  key={w.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setWorkload(w.id); setStep(2); }}
                >
                  <CardHeader className="pb-2">
                    <div className={`w-10 h-10 rounded-lg ${w.color} flex items-center justify-center mb-2`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-sm">{w.label}</CardTitle>
                    <CardDescription className="text-xs">{w.desc}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: 규모 선택 */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Step 2: 규모를 선택하세요</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {SCALE_OPTIONS.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => { setScale(s.id); setStep(3); }}
              >
                <CardHeader>
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 추천 결과 */}
      {step === 3 && recommendation && (
        <div className="space-y-4">
          <h3 className="font-semibold">추천 구성</h3>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Badge>{WORKLOADS.find((w) => w.id === workload)?.label}</Badge>
                <Badge variant="outline">{SCALE_OPTIONS.find((s) => s.id === scale)?.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">CPU:</span> {recommendation.cpu}</div>
                <div><span className="text-muted-foreground">메모리:</span> {recommendation.memory}</div>
                <div><span className="text-muted-foreground">스토리지:</span> {recommendation.storage}</div>
                <div><span className="text-muted-foreground">수량:</span> {recommendation.qty}</div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => router.push("/assembly")}>
            <ArrowRight className="h-4 w-4 mr-2" />
            이 구성으로 서버 조립하기
          </Button>
        </div>
      )}
    </div>
  );
}
