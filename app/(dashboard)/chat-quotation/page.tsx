"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatQuotationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 서버 견적을 도와드리겠습니다. 필요한 서버 사양을 자연어로 말씀해주세요.\n\n예시: \"웹서버 3대, CPU 32코어, 메모리 64GB, SSD 1TB 구성으로 견적 부탁드립니다\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.data.reply, timestamp: new Date() },
        ]);

        // 견적 생성 완료 시 이동
        if (json.data.quotation_id) {
          setTimeout(() => router.push(`/quotation-history`), 2000);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.error?.message ?? "처리 중 오류가 발생했습니다.", timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했습니다.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">자연어 견적 생성</h2>
        <p className="text-muted-foreground">대화형으로 서버 사양을 입력하면 AI가 견적을 생성합니다.</p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}-${msg.timestamp.getTime()}`} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <Card className={`max-w-[75%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
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

      {/* 입력 영역 */}
      <div className="flex gap-2 pt-4 border-t">
        <Input
          placeholder="서버 사양을 입력하세요..."
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
  );
}
