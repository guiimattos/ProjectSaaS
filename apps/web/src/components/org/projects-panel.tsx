"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FolderKanban, Archive, ArchiveRestore, Trash2, Pencil } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState, Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";

type Project = { id: string; name: string; description: string | null; color: string | null; archivedAt: string | null; _count: { tasks: number }; done: number };
const COLORS = ["#2563eb", "#7c3aed", "#ea580c", "#059669", "#db2777", "#0891b2", "#ca8a04"];

export function ProjectsPanel({ organizationId, slug, projects, isAdmin }: { organizationId: string; slug: string; projects: Project[]; isAdmin: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [confirm, setConfirm] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const base = `/api/organizations/${organizationId}/projects`;

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setLoading(true);
    try { await fn(); if (ok) toast({ kind: "success", title: ok }); router.refresh(); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); }
    finally { setLoading(false); }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body = { name: editing.name, description: editing.description || undefined, color: editing.color || undefined };
    run(() => editing.id ? api(`${base}/${editing.id}`, { method: "PATCH", json: body }) : api(base, { method: "POST", json: body }), editing.id ? "Projeto atualizado" : "Projeto criado").then(() => setEditing(null));
  };

  const visible = projects.filter((p) => showArchived || !p.archivedAt);

  return (
    <>
      <div className="row-between mb-4">
        <label className="chip" style={{ cursor: "pointer" }}><input type="checkbox" className="checkbox" style={{ width: 16, height: 16 }} checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Mostrar arquivados</label>
        <button className="btn btn-primary" onClick={() => setEditing({ color: COLORS[projects.length % COLORS.length] })}><Plus size={16} aria-hidden="true" /> Novo projeto</button>
      </div>

      {visible.length === 0 ? (
        <div className="card"><EmptyState icon={FolderKanban} title="Nenhum projeto ainda" description="Projetos agrupam tarefas por iniciativa, cliente ou área." action={<button className="btn btn-primary" onClick={() => setEditing({ color: COLORS[0] })}><Plus size={16} /> Criar projeto</button>} /></div>
      ) : (
        <div className="grid grid-3">
          {visible.map((p) => {
            const pct = p._count.tasks ? Math.round((p.done / p._count.tasks) * 100) : 0;
            return (
              <div key={p.id} className="card card-hover stack-sm" style={{ opacity: p.archivedAt ? 0.6 : 1 }}>
                <div className="row-between">
                  <Link href={`/org/${slug}/tasks?project=${p.id}`} className="row font-semibold" style={{ color: "inherit", gap: 8 }}><span className="dot" style={{ background: p.color ?? "var(--color-primary)", width: 12, height: 12 }} aria-hidden="true" />{p.name}</Link>
                  {p.archivedAt && <span className="badge">Arquivado</span>}
                </div>
                {p.description && <p className="muted text-sm wrap-any">{p.description}</p>}
                <div className="row-between text-xs subtle"><span>{p.done}/{p._count.tasks} concluídas</span><span className="tabular">{pct}%</span></div>
                <div className="meter"><div style={{ width: `${pct}%`, background: p.color ?? undefined }} /></div>
                <div className="row" style={{ gap: 4, marginTop: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}><Pencil size={14} aria-hidden="true" /> Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => run(() => api(`${base}/${p.id}`, { method: "PATCH", json: { archived: !p.archivedAt } }), p.archivedAt ? "Projeto restaurado" : "Projeto arquivado")}>
                    {p.archivedAt ? <><ArchiveRestore size={14} aria-hidden="true" /> Restaurar</> : <><Archive size={14} aria-hidden="true" /> Arquivar</>}
                  </button>
                  {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={() => setConfirm(p)} aria-label={`Excluir ${p.name}`}><Trash2 size={14} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editar projeto" : "Novo projeto"}>
        {editing && (
          <form onSubmit={save} className="stack">
            <Field label="Nome" htmlFor="pj-name" required><input id="pj-name" className="input" value={editing.name ?? ""} required maxLength={120} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Descrição" htmlFor="pj-desc"><textarea id="pj-desc" className="textarea" style={{ minHeight: 72 }} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="field"><span className="label">Cor</span>
              <div className="row" role="radiogroup" aria-label="Cor do projeto">
                {COLORS.map((c) => <button type="button" key={c} role="radio" aria-checked={editing.color === c} aria-label={c} onClick={() => setEditing({ ...editing, color: c })} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: editing.color === c ? "3px solid var(--color-foreground)" : "3px solid transparent", cursor: "pointer" }} />)}
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={loading || !editing.name}>{loading ? "Salvando…" : "Salvar"}</button></div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} loading={loading} danger confirmLabel="Excluir" title="Excluir projeto?" description={`As ${confirm?._count.tasks ?? 0} tarefas de "${confirm?.name}" ficarão sem projeto.`}
        onConfirm={() => confirm && run(() => api(`${base}/${confirm.id}`, { method: "DELETE" }), "Projeto excluído").then(() => setConfirm(null))} />
    </>
  );
}
