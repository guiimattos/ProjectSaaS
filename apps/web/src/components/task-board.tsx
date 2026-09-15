"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/ui/api-client";

type Task = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  project: { id: string; name: string; color: string | null } | null;
  assignee: { id: string; name: string | null; email: string } | null;
};
type Project = { id: string; name: string; color: string | null };
type Member = { id: string; label: string };

const STATUS_LABEL: Record<Task["status"], string> = { TODO: "A fazer", IN_PROGRESS: "Em andamento", DONE: "Concluída", ARCHIVED: "Arquivada" };
const NEXT_STATUS: Record<Task["status"], Task["status"]> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO", ARCHIVED: "TODO" };

export function TaskBoard({ organizationId, currentUserId, initialTasks, projects: initialProjects, members }: {
  organizationId: string; currentUserId: string; initialTasks: Task[]; projects: Project[]; members: Member[];
}) {
  const base = `/api/organizations/${organizationId}`;
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<{ status: string; projectId: string }>({ status: "", projectId: "" });
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newProject, setNewProject] = useState("");

  const visible = useMemo(
    () => tasks.filter((t) => (!filter.status || t.status === filter.status) && (!filter.projectId || t.project?.id === filter.projectId)),
    [tasks, filter]
  );

  async function run(fn: () => Promise<void>) {
    setError(null);
    try { await fn(); } catch (err) { setError((err as Error).message); }
  }

  const createTask = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { task } = await api<{ task: Task }>(`${base}/tasks`, {
        method: "POST",
        json: {
          title, priority,
          projectId: projectId || undefined,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
      });
      setTasks((prev) => [task, ...prev]);
      setTitle(""); setDueDate("");
    });
  };

  const patch = (id: string, body: Record<string, unknown>) =>
    run(async () => {
      const { task } = await api<{ task: Task }>(`${base}/tasks/${id}`, { method: "PATCH", json: body });
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    });

  const remove = (id: string) =>
    run(async () => {
      await api(`${base}/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

  const createProject = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { project } = await api<{ project: Project }>(`${base}/projects`, { method: "POST", json: { name: newProject } });
      setProjects((prev) => [...prev, project]);
      setNewProject("");
    });
  };

  return (
    <div className="stack">
      <section className="card stack">
        <form onSubmit={createTask} className="row">
          <input style={{ flex: "1 1 240px" }} placeholder="Nova tarefa…" value={title} required onChange={(e) => setTitle(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
            <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
          </select>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Sem responsável</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.id === currentUserId ? "Eu" : m.label}</option>)}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button type="submit" className="btn-primary">Adicionar</button>
        </form>
        <form onSubmit={createProject} className="row">
          <input placeholder="Novo projeto…" value={newProject} required onChange={(e) => setNewProject(e.target.value)} />
          <button type="submit">Criar projeto</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <h2>Tarefas <span className="muted">({visible.length})</span></h2>
          <div className="row">
            <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Todos os status</option>
              {(Object.keys(STATUS_LABEL) as Task["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={filter.projectId} onChange={(e) => setFilter((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">Todos os projetos</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {visible.length === 0 && <p className="muted">Nenhuma tarefa por aqui.</p>}
        {visible.map((t) => (
          <div key={t.id} className="task">
            <input type="checkbox" checked={t.status === "DONE"} onChange={() => patch(t.id, { status: t.status === "DONE" ? "TODO" : "DONE" })} aria-label="Concluir" />
            <div style={{ flex: 1 }}>
              <div className={`task-title ${t.status === "DONE" ? "done" : ""}`}>{t.title}</div>
              <div className="task-meta">
                <button className={`badge btn-sm ${t.status === "DONE" ? "badge-done" : t.status === "IN_PROGRESS" ? "badge-progress" : ""}`} style={{ border: 0 }} onClick={() => patch(t.id, { status: NEXT_STATUS[t.status] })} title="Avançar status">
                  {STATUS_LABEL[t.status]}
                </button>
                <span className={`badge ${t.priority === "URGENT" ? "badge-urgent" : ""}`}>{t.priority}</span>
                {t.project && <span className="muted">📁 {t.project.name}</span>}
                {t.assignee && <span className="muted">👤 {t.assignee.name ?? t.assignee.email}</span>}
                {t.dueDate && <span className="muted">📅 {new Date(t.dueDate).toLocaleDateString("pt-BR")}</span>}
              </div>
            </div>
            <button className="btn-sm btn-danger" onClick={() => remove(t.id)}>Excluir</button>
          </div>
        ))}
      </section>
    </div>
  );
}
