"use client";

import { useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="flex gap-2 pt-4 border-t">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder ?? "서버 사양을 입력하세요... (Shift+Enter로 줄바꿈)"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        className="resize-none min-h-[60px] max-h-[120px]"
      />
      <Button onClick={onSend} disabled={disabled || !value.trim()} className="self-end shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
