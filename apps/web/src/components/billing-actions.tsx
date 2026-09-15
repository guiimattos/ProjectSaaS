"use client";

import { useState } from "react";
import { api } from "@/lib/ui/api-client";

export function BillingActions({ organizationId, mode, priceId, label }: { organizationId: string; mode: "checkout" | "portal"; priceId?: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>(`/api/billing/${mode}`, { method: "POST", json: { organizationId, priceId } });
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={go} disabled={loading} className={mode === "checkout" ? "btn-primary" : ""}>
        {loading ? "Redirecionando…" : label ?? (mode === "portal" ? "Gerenciar assinatura" : "Assinar")}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
