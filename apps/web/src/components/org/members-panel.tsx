"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Copy, Trash2, Mail, Check, PartyPopper } from "lucide-react";
import { Avatar, Field, ROLE_LABEL, formatDate } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";

type Member = { id: string; userId: string; name: string | null; email: string; image: string | null; role: "OWNER" | "ADMIN" | "MEMBER"; createdAt: string };
type Invitation = { id: string; email: string; role: string; token: string; expiresAt: string };

export function MembersPanel({ organizationId, currentUserId, isAdmin, members, invitations, limit, welcome }: {
  organizationId: string; currentUserId: string; isAdmin: boolean; members: Member[]; invitations: Invitation[]; limit: number | null; welcome?: boolean;
}) {
  const base = `/api/organizations/${organizationId}`;
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<Member | null>(null);
  const seats = members.length + invitations.length;

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast({ kind: "success", title: ok }); router.refresh(); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api<{ invitation: { acceptUrl: string; emailSent: boolean } }>(`${base}/invitations`, { method: "POST", json: { email, role } });
      setEmail("");
      if (res.invitation.emailSent) toast({ kind: "success", title: "Convite enviado por e-mail", description: email });
      else { await navigator.clipboard?.writeText(res.invitation.acceptUrl).catch(() => undefined); toast({ kind: "info", title: "Link de convite copiado", description: "E-mail não configurado — compartilhe o link manualmente." }); }
      router.refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  const copyLink = (token: string) => navigator.clipboard?.writeText(`${window.location.origin}/invite/${token}`).then(() => toast({ kind: "success", title: "Link copiado" }));

  return (
    <div className="stack">
      {welcome && (
        <div className="card-glass row" style={{ borderColor: "var(--color-primary)" }}>
          <PartyPopper size={22} style={{ color: "var(--color-accent)" }} aria-hidden="true" />
          <div className="flex-1"><strong>Organização criada!</strong><p className="muted text-sm">Convide o time abaixo, ou pule e comece a criar tarefas.</p></div>
        </div>
      )}

      {isAdmin && (
        <section className="card">
          <div className="row-between mb-4"><h2 style={{ fontSize: "var(--text-lg)" }}>Convidar pessoas</h2><span className="subtle text-sm tabular">{seats}{limit ? ` / ${limit}` : ""} assentos</span></div>
          <form onSubmit={invite} className="row" style={{ alignItems: "flex-end" }} noValidate>
            <div className="flex-1" style={{ minWidth: 220 }}>
              <Field label="E-mail" htmlFor="inv-email" required error={error}>
                <input id="inv-email" type="email" className="input" placeholder="pessoa@empresa.com" value={email} required autoComplete="off" onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
              </Field>
            </div>
            <Field label="Papel" htmlFor="inv-role"><select id="inv-role" className="select" style={{ width: 140 }} value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}><option value="MEMBER">Membro</option><option value="ADMIN">Admin</option></select></Field>
            <button type="submit" className="btn btn-primary" disabled={loading || !email} style={{ marginBottom: error ? 26 : 0 }}><UserPlus size={16} aria-hidden="true" /> {loading ? "Enviando…" : "Convidar"}</button>
          </form>
          {invitations.length > 0 && (
            <div className="mt-6">
              <h3 className="card-title mb-2">Convites pendentes</h3>
              {invitations.map((i) => (
                <div key={i.id} className="list-item">
                  <span className="avatar avatar-sm"><Mail size={12} aria-hidden="true" /></span>
                  <span className="flex-1 truncate text-sm">{i.email} <span className="badge" style={{ marginLeft: 6 }}>{ROLE_LABEL[i.role]}</span></span>
                  <span className="subtle text-xs hide-mobile">expira {formatDate(i.expiresAt)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => copyLink(i.token)} aria-label={`Copiar link de ${i.email}`}><Copy size={14} /></button>
                  <button className="btn btn-ghost btn-sm btn-danger" onClick={() => run(() => api(`${base}/invitations/${i.id}`, { method: "DELETE" }), "Convite revogado")} aria-label={`Revogar convite de ${i.email}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Pessoa</th><th>Papel</th><th className="hide-mobile">Desde</th><th><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td><div className="row" style={{ gap: 10 }}><Avatar name={m.name} email={m.email} image={m.image} /><div className="truncate"><div className="font-medium">{m.name ?? "—"}{m.userId === currentUserId && <span className="subtle"> (você)</span>}</div><div className="subtle text-xs">{m.email}</div></div></div></td>
                  <td>
                    {isAdmin && m.role !== "OWNER" ? (
                      <select className="select input-sm" style={{ width: 130 }} value={m.role} aria-label={`Papel de ${m.name ?? m.email}`} onChange={(e) => run(() => api(`${base}/members/${m.id}`, { method: "PATCH", json: { role: e.target.value } }), "Papel atualizado")}>
                        <option value="ADMIN">Admin</option><option value="MEMBER">Membro</option>
                      </select>
                    ) : <span className={`badge ${m.role === "OWNER" ? "badge-accent" : m.role === "ADMIN" ? "badge-primary" : ""}`}>{ROLE_LABEL[m.role]}</span>}
                  </td>
                  <td className="hide-mobile subtle">{formatDate(m.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ textAlign: "right" }}>
                    {m.role !== "OWNER" && (isAdmin || m.userId === currentUserId) && (
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => setConfirm(m)}>{m.userId === currentUserId ? "Sair" : "Remover"}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} danger confirmLabel={confirm?.userId === currentUserId ? "Sair" : "Remover"}
        title={confirm?.userId === currentUserId ? "Sair da organização?" : `Remover ${confirm?.name ?? confirm?.email}?`}
        description={confirm?.userId === currentUserId ? "Você perderá acesso a todas as tarefas e projetos desta organização." : "A pessoa perderá acesso imediatamente. Tarefas atribuídas a ela permanecem."}
        onConfirm={() => confirm && run(() => api(`${base}/members/${confirm.id}`, { method: "DELETE" }), "Feito").then(() => { const self = confirm.userId === currentUserId; setConfirm(null); if (self) router.push("/dashboard"); })} />
    </div>
  );
}
