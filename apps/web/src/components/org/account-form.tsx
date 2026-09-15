"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";

export function AccountForm({ name: initial, email }: { name: string; email: string }) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api("/api/me", { method: "PATCH", json: { name } }); toast({ kind: "success", title: "Perfil atualizado" }); router.refresh(); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="row" style={{ alignItems: "flex-end" }}>
      <div className="flex-1"><Field label="Nome" htmlFor="acc-name" required><input id="acc-name" className="input" value={name} required onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field></div>
      <div className="flex-1"><Field label="E-mail" htmlFor="acc-email" help="Gerenciado pelo Google."><input id="acc-email" className="input" value={email} readOnly aria-readonly="true" /></Field></div>
      <button type="submit" className="btn btn-primary" disabled={saving || name === initial} style={{ marginBottom: 22 }}>{saving ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
