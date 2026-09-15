"use client";

import { useEffect, useState } from "react";
import { Trash2, Send, Calendar, Flag, FolderKanban, UserRound, CircleDot } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Avatar, Field, PRIORITY_LABEL, STATUS_LABEL, timeAgo } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";
import { MemberDTO, PRIORITIES, ProjectDTO, STATUSES, TaskDTO } from "@/lib/ui/task-types";

const toLocalDate = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

type Comment = { id: string; body: string; createdAt: string; author: { id: string; name: string | null; email: string; image: string | null } | null };

export function TaskDetail({ organizationId, task, projects, members, currentUserId, onClose, onChange, onDelete }: {
  organizationId: string; task: TaskDTO | null; projects: ProjectDTO[]; members: MemberDTO[]; currentUserId: string;
  onClose: () => void; onChange: (t: TaskDTO) => void; onDelete: (id: string) => void;
}) {
  const base = `/api/organizations/${organizationId}/tasks`;
  const { toast } = useToast();
  const [draft, setDraft] = useState<Partial<TaskDTO>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({}); setComments([]);
    if (task) api<{ comments: Comment[] }>(`${base}/${task.id}/comments`).then((r) => setComments(r.comments)).catch(() => undefined);
  }, [task?.id, base]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;
  const current = { ...task, ...draft };

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { task: updated } = await api<{ task: TaskDTO }>(`${base}/${task.id}`, { method: "PATCH", json: body });
      onChange(updated); setDraft({});
    } catch (err) { toast({ kind: "error", title: (err as Error).message }); }
    finally { setSaving(false); }
  };

  const saveText = () => {
    const body: Record<string, unknown> = {};
    if (draft.title !== undefined && draft.title !== task.title) body.title = draft.title;
    if (draft.description !== undefined && draft.description !== task.description) body.description = draft.description ?? "";
    if (Object.keys(body).length) patch(body);
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { comment: c } = await api<{ comment: Comment }>(`${base}/${task.id}/comments`, { method: "POST", json: { body: comment } });
      setComments((prev) => [...prev, c]); setComment("");
    } catch (err) { toast({ kind: "error", title: (err as Error).message }); }
  };

  const removeComment = async (id: string) => {
    await api(`${base}/${task.id}/comments/${id}`, { method: "DELETE" }).catch(() => undefined);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const doDelete = async () => {
    await api(`${base}/${task.id}`, { method: "DELETE" });
    toast({ kind: "success", title: "Tarefa excluída" });
    onDelete(task.id); onClose();
  };

  return (
    <Modal open onClose={onClose} title="Detalhes da tarefa" variant="drawer"
      footer={<><span className="subtle text-xs">Criada {timeAgo(task.createdAt)}{saving && " · salvando…"}</span><button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Trash2 size={14} /> Excluir</button></>}>
      <div className="stack">
        <input className="input" style={{ fontSize: "var(--text-lg)", fontWeight: 600, border: 0, padding: "4px 0", background: "transparent" }} value={current.title}
          aria-label="Título" onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} onBlur={saveText} />

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <Field label="Status" htmlFor="td-status">
            <div className="row" style={{ gap: 6 }}><CircleDot size={16} className="subtle" aria-hidden="true" />
              <select id="td-status" className="select input-sm" value={current.status} onChange={(e) => patch({ status: e.target.value })}>
                {[...STATUSES, "ARCHIVED"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select></div>
          </Field>
          <Field label="Prioridade" htmlFor="td-priority">
            <div className="row" style={{ gap: 6 }}><Flag size={16} className="subtle" aria-hidden="true" />
              <select id="td-priority" className="select input-sm" value={current.priority} onChange={(e) => patch({ priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select></div>
          </Field>
          <Field label="Projeto" htmlFor="td-project">
            <div className="row" style={{ gap: 6 }}><FolderKanban size={16} className="subtle" aria-hidden="true" />
              <select id="td-project" className="select input-sm" value={current.projectId ?? ""} onChange={(e) => patch({ projectId: e.target.value || null })}>
                <option value="">Sem projeto</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          </Field>
          <Field label="Responsável" htmlFor="td-assignee">
            <div className="row" style={{ gap: 6 }}><UserRound size={16} className="subtle" aria-hidden="true" />
              <select id="td-assignee" className="select input-sm" value={current.assigneeId ?? ""} onChange={(e) => patch({ assigneeId: e.target.value || null })}>
                <option value="">Ninguém</option>{members.map((m) => <option key={m.id} value={m.id}>{m.id === currentUserId ? "Eu" : m.name ?? m.email}</option>)}
              </select></div>
          </Field>
          <Field label="Prazo" htmlFor="td-due">
            <div className="row" style={{ gap: 6 }}><Calendar size={16} className="subtle" aria-hidden="true" />
              <input id="td-due" type="date" className="input input-sm" value={current.dueDate ? toLocalDate(current.dueDate) : ""}
                onChange={(e) => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
          </Field>
        </div>

        <Field label="Descrição" htmlFor="td-desc">
          <textarea id="td-desc" className="textarea" placeholder="Adicione contexto, links, critérios de aceite…" value={current.description ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} onBlur={saveText} />
        </Field>

        <section>
          <h3 className="card-title mb-2">Comentários ({comments.length})</h3>
          <div className="stack-sm">
            {comments.map((c) => (
              <div key={c.id} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                <Avatar name={c.author?.name} email={c.author?.email} image={c.author?.image} size="sm" />
                <div className="flex-1">
                  <div className="row" style={{ gap: 6 }}><span className="font-semibold text-sm">{c.author?.name ?? c.author?.email ?? "Usuário removido"}</span><span className="subtle text-xs">{timeAgo(c.createdAt)}</span>
                    {c.author?.id === currentUserId && <button className="btn btn-ghost btn-sm" style={{ minHeight: 24, padding: "0 6px" }} onClick={() => removeComment(c.id)} aria-label="Excluir comentário"><Trash2 size={12} /></button>}
                  </div>
                  <p className="text-sm wrap-any" style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="subtle text-sm">Seja o primeiro a comentar.</p>}
          </div>
          <form onSubmit={sendComment} className="row mt-4" style={{ alignItems: "flex-end" }}>
            <textarea className="textarea flex-1" style={{ minHeight: 60 }} placeholder="Escreva um comentário… (Ctrl+Enter para enviar)" value={comment} aria-label="Novo comentário"
              onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sendComment(e); }} />
            <button type="submit" className="btn btn-primary btn-icon" aria-label="Enviar comentário" disabled={!comment.trim()}><Send size={16} /></button>
          </form>
        </section>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} title="Excluir tarefa?" description={`"${task.title}" será removida permanentemente, incluindo comentários.`} confirmLabel="Excluir" danger />
    </Modal>
  );
}
