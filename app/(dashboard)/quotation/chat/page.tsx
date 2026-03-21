"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Server, Database, Brain, Monitor, Cpu } from "lucide-react";
import { CustomerBanner } from "@/components/quotation/customer-banner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { SpecsSidebar } from "@/components/chat/specs-sidebar";
import type { ParsedServerConfig } from "@/lib/types/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WORKLOADS = [
  { id: "web", label: "웹서버", icon: Server, desc: "웹 애플리케이션 호스팅" },
  { id: "db", label: "DB서버", icon: Database, desc: "데이터베이스 운영" },
  { id: "ai", label: "AI/ML", icon: Brain, desc: "AI 학습/추론" },
  { id: "vdi", label: "VDI", icon: Monitor, desc: "가상 데스크톱" },
  { id: "hpc", label: "HPC", icon: Cpu, desc: "고성능 컴퓨팅" },
];

const FREE_INITIAL: Message = {
  role: "assistant",
  content: "안녕하세요! 서버 견적을 도와드리겠습니다.\n\n필요한 서버 사양을 자연어로 말씀해주세요.\n\n예시: \"웹서버 3대, CPU 32코어, 메모리 64GB, SSD 1TB 구성으로 견적 부탁드립니다\"",
};

const GUIDE_INITIAL: Message = {
  role: "assistant",
  content: "어떤 용도의 서버가 필요하신가요? 아래에서 용도를 선택해주세요.",
};

export default function QuotationChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer_id") ?? "";
  const initialMode = searchParams.get("mode") === "guide" ? "guide" : "free";

  useEffect(() => {
    if (!customerId) router.replace("/quotation");
  }, [customerId, router]); // router는 Next.js에서 안정적 참조

  const [mode, setMode] = useState<"free" | "guide">(initialMode);
  const [messages, setMessages] = useState<Message[]>([initialMode === "guide" ? GUIDE_INITIAL : FREE_INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedSpecs, setParsedSpecs] = useState<ParsedServerConfig[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [guideStep, setGuideStep] = useState<"workload" | "detail">("workload");

  const handleModeChange = (newMode: string) => {
    const m = newMode as "free" | "guide";
    setMode(m);
    setMessages([m === "guide" ? GUIDE_INITIAL : FREE_INITIAL]);
    setParsedSpecs([]);
    setIsComplete(false);
    setGuideStep("workload");
    setInput("");
    setThreadId(null);
  };

  const handleWorkloadSelect = (workloadId: string) => {
    const workload = WORKLOADS.find((w) => w.id === workloadId);
    if (!workload) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `${workload.label} 용도` },
      {
        role: "assistant",
        content: `${workload.label} 구성을 도와드리겠습니다.\n\n다음 정보를 알려주세요:\n1. 서버 대수\n2. 필요한 CPU 코어 수\n3. 메모리 용량\n4. 스토리지 요구사항\n\n또는 대략적으로 "서버 3대, 메모리 64GB" 처럼 말씀해주세요.`,
      },
    ]);
    setGuideStep("detail");
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/quotation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          threadId,
          mode,
          customerId: customerId || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const { reply, specs, isComplete: complete, threadId: tid } = json.data;
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (tid) setThreadId(tid);
        if (specs && specs.length > 0) setParsedSpecs(specs);
        if (complete) setIsComplete(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.error?.message ?? "요청을 처리하지 못했습니다." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (parsedSpecs.length === 0) return;
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatMessageList messages={messages} loading={loading}>
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
          </ChatMessageList>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={loading}
            placeholder={mode === "guide" && guideStep === "workload"
              ? "또는 직접 사양을 입력하세요..."
              : "서버 사양을 입력하세요... (Shift+Enter로 줄바꿈)"}
          />
        </div>

        <div className="hidden lg:block w-80 shrink-0">
          <SpecsSidebar specs={parsedSpecs} isComplete={isComplete} onGenerate={handleGenerate} />
        </div>
      </div>
    </div>
  );
}
