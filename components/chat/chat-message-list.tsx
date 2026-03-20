"use client";

import { useRef, useEffect } from "react";
import { Loader2, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatMessage } from "./chat-message";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageListProps {
  messages: Message[];
  loading?: boolean;
  children?: React.ReactNode;
}

export function ChatMessageList({ messages, loading, children }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} role={msg.role} content={msg.content} />
      ))}

      {children}

      {loading && (
        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">분석 중...</span>
            </CardContent>
          </Card>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
