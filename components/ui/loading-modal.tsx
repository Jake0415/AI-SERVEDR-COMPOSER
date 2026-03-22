"use client";

import { Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface LoadingStep {
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
}

interface LoadingModalProps {
  open: boolean;
  title?: string;
  description?: string;
  steps?: LoadingStep[];
}

export function LoadingModal({
  open,
  title = "처리 중",
  description,
  steps,
}: LoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {steps && steps.length > 0 && (
          <div className="space-y-3 py-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {step.status === "completed" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
                {step.status === "in_progress" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                )}
                {step.status === "pending" && (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.status === "completed"
                      ? "text-muted-foreground line-through"
                      : step.status === "in_progress"
                        ? "text-foreground font-medium"
                        : step.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
