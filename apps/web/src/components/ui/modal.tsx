"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, footer, variant = "modal" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; variant?: "modal" | "drawer";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  if (variant === "drawer") {
    return (
      <>
        <div className="overlay" onClick={onClose} style={{ display: "block" }} />
        <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={title}>
          <div className="drawer-header">
            <h2 style={{ fontSize: "var(--text-lg)" }} className="truncate">{title}</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
          </div>
          <div className="drawer-body">{children}</div>
          {footer && <div className="drawer-header" style={{ borderTop: "1px solid var(--color-border)", borderBottom: 0, position: "sticky", bottom: 0 }}>{footer}</div>}
        </div>
      </>
    );
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row-between mb-4">
          <h2 style={{ fontSize: "var(--text-xl)" }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        {children}
        {footer && <div className="row mt-6" style={{ justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirmar", danger, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <button className="btn" onClick={onClose} disabled={loading}>Cancelar</button>
        <button className={`btn ${danger ? "btn-danger-solid" : "btn-primary"}`} onClick={onConfirm} disabled={loading}>{loading ? "Aguarde…" : confirmLabel}</button>
      </>
    }>
      <p className="muted">{description}</p>
    </Modal>
  );
}
