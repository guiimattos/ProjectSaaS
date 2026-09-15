"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/ui/api-client";

type Member = { id: string; userId: string; name: string | null; email: string; role: "OWNER" | "ADMIN" | "MEMBER" };
type Invitation = { id: string; email: string; role: string; token: string; expiresAt: string };

export function MembersPanel({ organizationId, currentUserId, isAdmin, members, invitations }: {
  organizationId: string; currentUserId: string; isAdmin: boolean; members: Member[]; invitations: Invitation[];
}) {
  const base = `/api/organizations/${organizationId}`;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setError(null);
    try { await fn(); router.refresh(); } catch (err) { setError((err as Error).message); }
  }

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await api<{ invitation: { acceptUrl: string } }>(`${base}/invitations`, { method: "POST", json: { email, role } });
      setLastLink(res.invitation.acceptUrl);
      setEmail("");
    });
  };

  return (
    <div className="stack">
      <section className="card">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th /></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name ?? "—"}{m.userId === currentUserId && <span className="muted"> (você)</span>}</td>
                <td>{m.email}</td>
                <td>
                  {isAdmin && m.role !== "OWNER" ? (
                    <select value={m.role} onChange={(e) => run(() => api(`${base}/members/${m.id}`, { method: "PATCH", json: { role: e.target.value } }).then(() => undefined))}>
                      <option value="ADMIN">ADMIN</option><option value="MEMBER">MEMBER</option>
                    </select>
                  ) : <span className="badge">{m.role}</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {m.role !== "OWNER" && (isAdmin || m.userId === currentUserId) && (
                    <button className="btn-sm btn-danger" onClick={() => run(() => api(`${base}/members/${m.id}`, { method: "DELETE" }).then(() => undefined))}>
                      {m.userId === currentUserId ? "Sair" : "Remover"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isAdmin && (
        <section className="card stack">
          <h2>Convidar membro</h2>
          <form onSubmit={invite} className="row">
            <input type="email" placeholder="email@empresa.com" value={email} required onChange={(e) => setEmail(e.target.value)} />
            <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}>
              <option value="MEMBER">Membro</option><option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="btn-primary">Gerar convite</button>
          </form>
          {lastLink && (
            <p className="muted">Link de convite (compartilhe com a pessoa): <code>{lastLink}</code></p>
          )}
          {error && <div className="error">{error}</div>}

          {invitations.length > 0 && (
            <>
              <h3>Convites pendentes</h3>
              <table>
                <thead><tr><th>E-mail</th><th>Papel</th><th>Expira</th><th /></tr></thead>
                <tbody>
                  {invitations.map((i) => (
                    <tr key={i.id}>
                      <td>{i.email}</td>
                      <td><span className="badge">{i.role}</span></td>
                      <td>{new Date(i.expiresAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-sm" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/invite/${i.token}`)}>Copiar link</button>{" "}
                        <button className="btn-sm btn-danger" onClick={() => run(() => api(`${base}/invitations/${i.id}`, { method: "DELETE" }).then(() => undefined))}>Revogar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}
    </div>
  );
}
