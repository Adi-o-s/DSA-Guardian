"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ICON: Record<Tone, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-brand" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />,
  error: <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />,
};

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** Fire a transient message. Replaces the ad-hoc inline status strings. */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss]
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-toast-in pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-pop",
              "border-line bg-surface-overlay text-fg"
            )}
          >
            <span className="mt-0.5 shrink-0">{ICON[t.tone]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 text-fg-subtle hover:text-fg"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
