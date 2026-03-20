"use client";

import { Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${role === "user" ? "justify-end" : ""}`}>
      {role === "assistant" && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <Card className={`max-w-[80%] ${role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </CardContent>
      </Card>
      {role === "user" && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
