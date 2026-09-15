"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error" | "info"; title: string; description?: string };
type Ctx = { toast: (t: Omit<Toast, "id">) => void };

const ToastContext = createContext<Ctx>({ toast: () => undefined });
export const useToast = () => useContext(ToastContext);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((t: Omit<Toast, "id">) => setToasts((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]), []);
  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toaster" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => { const id = setTimeout(onDismiss, 4500); return () => clearTimeout(id); }, [onDismiss]);
  const Icon = ICONS[toast.kind];
  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      <Icon size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1">
        <div className="font-semibold">{toast.title}</div>
        {toast.description && <div className="muted text-xs mt-2" style={{ marginTop: 2 }}>{toast.description}</div>}
      </div>
      <button className="btn btn-ghost btn-icon" style={{ width: 28, minHeight: 28 }} onClick={onDismiss} aria-label="Fechar notificação"><X size={14} /></button>
    </div>
  );
}
