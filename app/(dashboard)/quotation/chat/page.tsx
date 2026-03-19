"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Loader2, Bot, User, Server, Database, Brain, Monitor, Cpu, ArrowRight } from "lucide-react";
import { CustomerBanner } from "@/components/quotation/customer-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedServerConfig } from "@/lib/types/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WORKLOADS = [
  { id: "web", label: "웹서버", icon: Server, desc: "웹 애플리케이션 호스팅" },
  { id: "db", label: "DB서버", icon: Database, desc: "데이터베이스 운영" },
  { id: "ai", label: "AI/ML", icon: Brain, desc: "AI 학습/추론" },
  { id: "vdi", label: "VDI", icon: Monitor, desc: "가상 데스크톱" },
  { id: "hpc", label: "HPC", icon: Cpu, desc: "고성능 컴퓨팅" },
];

const FREE_INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "안녕하세요! 서버 견적을 도와드리겠습니다.\n\n필요한 서버 사양을 자연어로 말씀해주세요.\n\n예시: \"웹서버 3대, CPU 32코어, 메모리 64GB, SSD 1TB 구성으로 견적 부탁드립니다\"",
  timestamp: new Date(),
};

const GUIDE_INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "어떤 용도의 서버가 필요하신가요? 아래에서 용도를 선택해주세요.",
  timestamp: new Date(),
};

/** ParsedServerConfig → 사양 요약 텍스트 */
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

export default function QuotationChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer_id") ?? "";
  const initialMode = searchParams.get("mode") === "guide" ? "guide" : "free";

  useEffect(() => {
    if (!customerId) {
      router.replace("/quotation");
    }
  }, [customerId, router]);

  const [mode, setMode] = useState<"free" | "guide">(initialMode);
  const [messages, setMessages] = useState<Message[]>([
    initialMode === "guide" ? GUIDE_INITIAL_MESSAGE : FREE_INITIAL_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedSpecs, setParsedSpecs] = useState<ParsedServerConfig[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [guideStep, setGuideStep] = useState<"workload" | "detail" | "confirm">("workload");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModeChange = (newMode: string) => {
    const m = newMode as "free" | "guide";
    setMode(m);
    setMessages([m === "guide" ? GUIDE_INITIAL_MESSAGE : FREE_INITIAL_MESSAGE]);
    setParsedSpecs([]);
    setIsComplete(false);
    setGuideStep("workload");
    setInput("");
  };

  const handleWorkloadSelect = (workloadId: string) => {
    const workload = WORKLOADS.find((w) => w.id === workloadId);
    if (!workload) return;

    const userMsg: Message = { role: "user", content: `${workload.label} 용도`, timestamp: new Date() };
    const followUp: Message = {
      role: "assistant",
      content: `${workload.label} 구성을 도와드리겠습니다.\n\n다음 정보를 알려주세요:\n1. 서버 대수\n2. 필요한 CPU 코어 수\n3. 메모리 용량\n4. 스토리지 요구사항\n\n또는 대략적으로 "서버 3대, 메모리 64GB" 처럼 말씀해주세요.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, followUp]);
    setGuideStep("detail");
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), history: messages }),
      });

      const json = await res.json();
      if (json.success) {
        const { reply, specs, is_complete } = json.data;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, timestamp: new Date() },
        ]);

        if (specs && specs.length > 0) {
          setParsedSpecs(specs);
        }
        if (is_complete) {
          setIsComplete(true);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "요청을 처리하지 못했습니다. 다시 시도해주세요.", timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했습니다. 다시 시도해주세요.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuotation = () => {
    if (parsedSpecs.length === 0) return;
    // specs를 sessionStorage에 저장하여 result 페이지에서 사용
    sessionStorage.setItem("chat_quotation_specs", JSON.stringify(parsedSpecs));
    router.push(`/quotation/result?customer_id=${customerId}&source=chat`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {customerId && <CustomerBanner customerId={customerId} />}

      <div className="mb-4 mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI 대화형 견적</h2>
          <p className="text-muted-foreground">AI와 대화하며 서버 사양을 결정하고 견적을 생성합니다.</p>
        </div>
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList>
            <TabsTrigger value="free">자유 입력</TabsTrigger>
            <TabsTrigger value="guide">가이드 모드</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card className={`max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </CardContent>
                </Card>
                {msg.role === "user" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {mode === "guide" && guideStep === "workload" && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 py-2">
                {WORKLOADS.map((w) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleWorkloadSelect(w.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{w.label}</span>
                      <span className="text-xs text-muted-foreground">{w.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <Card>
                  <CardContent className="p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder={mode === "guide" && guideStep === "workload"
                ? "또는 직접 사양을 입력하세요..."
                : "서버 사양을 입력하세요..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 사양 요약 패널 */}
        <div className="hidden lg:block w-80 shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                사양 요약
                {isComplete && <Badge className="text-xs">확정 가능</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {parsedSpecs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">대화를 통해 사양이 결정되면</p>
                  <p className="text-sm">여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedSpecs.map((config, idx) => (
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
            {parsedSpecs.length > 0 && (
              <div className="p-4 border-t">
                <Button className="w-full" onClick={handleGenerateQuotation}>
                  견적 생성
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
