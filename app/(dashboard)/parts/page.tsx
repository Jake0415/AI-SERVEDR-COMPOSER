"use client";

// ============================================================
// 제품 관리 페이지 — IT 인프라 장비 / 서버 파트 2탭 구조
// ============================================================

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Cpu } from "lucide-react";
import EquipmentTab from "./_components/equipment-tab";
import ServerPartsTab from "./_components/server-parts-tab";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("equipment");

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl font-bold">제품 관리</h2>
        <p className="text-muted-foreground">
          IT 인프라 장비 및 서버 확장 부품 통합 관리
        </p>
      </div>

      {/* 2탭 구조 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="equipment" className="gap-2">
            <Server className="h-4 w-4" />
            IT 인프라 장비
          </TabsTrigger>
          <TabsTrigger value="parts" className="gap-2">
            <Cpu className="h-4 w-4" />
            서버 파트
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4">
          <EquipmentTab />
        </TabsContent>

        <TabsContent value="parts" className="mt-4">
          <ServerPartsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
