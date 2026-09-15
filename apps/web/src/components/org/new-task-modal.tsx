"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Field, PRIORITY_LABEL } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";
import { MemberDTO, PRIORITIES, ProjectDTO, TaskDTO, TaskStatus } from "@/lib/ui/task-types";

export function NewTaskModal({ organizationId, open, onClose, onCreated, projects, members, defaultStatus = "TODO", defaultProjectId }: {
  organizationId: string; open: boolean; onClose: () => void; onCreated: (t: TaskDTO) => void; projects: ProjectDTO[]; members: MemberDTO[]; defaultStatus?: TaskStatus; defaultProjectId?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", dueDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { task } = await api<{ task: TaskDTO }>(`/api/organizations/${organizationId}/tasks`, {
        method: "POST",
        json: { title: form.title, description: form.description || undefined, priority: form.priority, status: defaultStatus, projectId: form.projectId || undefined, assigneeId: form.assigneeId || undefined, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined },
      });
      onCreated(task); toast({ kind: "success", title: "Tarefa criada" });
      setForm({ title: "", description: "", priority: "MEDIUM", projectId: defaultProjectId ?? "", assigneeId: "", dueDate: "" });
      onClose();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova tarefa">
      <form onSubmit={submit} className="stack" id="new-task-form">
        <Field label="Título" htmlFor="nt-title" required error={error}>
          <input id="nt-title" className="input" value={form.title} onChange={set("title")} required maxLength={200} placeholder="O que precisa ser feito?" aria-invalid={!!error} />
        </Field>
        <Field label="Descrição" htmlFor="nt-desc"><textarea id="nt-desc" className="textarea" value={form.description} onChange={set("description")} style={{ minHeight: 72 }} /></Field>
        <div className="grid grid-2">
          <Field label="Prioridade" htmlFor="nt-priority"><select id="nt-priority" className="select" value={form.priority} onChange={set("priority")}>{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}</select></Field>
          <Field label="Prazo" htmlFor="nt-due"><input id="nt-due" type="date" className="input" value={form.dueDate} onChange={set("dueDate")} /></Field>
          <Field label="Projeto" htmlFor="nt-project"><select id="nt-project" className="select" value={form.projectId} onChange={set("projectId")}><option value="">Sem projeto</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Responsável" htmlFor="nt-assignee"><select id="nt-assignee" className="select" value={form.assigneeId} onChange={set("assigneeId")}><option value="">Ninguém</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}</select></Field>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !form.title.trim()}>{loading ? "Criando…" : "Criar tarefa"}</button>
        </div>
      </form>
    </Modal>
  );
}
