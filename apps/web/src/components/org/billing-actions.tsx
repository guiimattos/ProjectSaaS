"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";

export function BillingActions({ organizationId, mode, priceId, label, className }: { organizationId: string; mode: "checkout" | "portal"; priceId?: string; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function go() {
    setLoading(true);
    try {
      const { url } = await api<{ url: string }>(`/api/billing/${mode}`, { method: "POST", json: { organizationId, priceId } });
      window.location.href = url;
    } catch (err) { toast({ kind: "error", title: (err as Error).message }); setLoading(false); }
  }

  return (
    <button onClick={go} disabled={loading} className={`btn ${className ?? (mode === "checkout" ? "btn-primary" : "")}`}>
      {loading ? "Redirecionando…" : label ?? (mode === "portal" ? "Gerenciar assinatura" : "Assinar")} {mode === "portal" && <ExternalLink size={14} aria-hidden="true" />}
    </button>
  );
}
