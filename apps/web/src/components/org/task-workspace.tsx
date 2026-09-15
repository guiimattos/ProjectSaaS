"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, GripVertical, ChevronRight, ListChecks } from "lucide-react";
import { Avatar, EmptyState, PRIORITY_LABEL, STATUS_LABEL, formatDate } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";
import { MemberDTO, PRIORITIES, ProjectDTO, STATUSES, TaskDTO, TaskStatus } from "@/lib/ui/task-types";
import { TaskDetail } from "@/components/org/task-detail";
import { NewTaskModal } from "@/components/org/new-task-modal";

type Props = { organizationId: string; currentUserId: string; initialTasks: TaskDTO[]; projects: ProjectDTO[]; members: MemberDTO[]; view: "board" | "list" };

/** Estado compartilhado entre quadro e lista: tarefas, filtros, seleção (via ?task=) e modal de criação (via ?new=1). */
export function TaskWorkspace({ organizationId, currentUserId, initialTasks, projects, members, view }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState(params.get("project") ?? "");
  const [assignee, setAssignee] = useState(params.get("assignee") === "me" ? currentUserId : "");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [newStatus, setNewStatus] = useState<TaskStatus>("TODO");
  const selectedId = params.get("task");
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const setParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`?${next.toString()}`, { scroll: false });
  }, [params, router]);

  const filtered = useMemo(() => tasks.filter((t) =>
    (!q || t.title.toLowerCase().includes(q.toLowerCase())) &&
    (!projectId || t.projectId === projectId) &&
    (!assignee || t.assigneeId === assignee) &&
    (!priority || t.priority === priority) &&
    (!status || t.status === status)
  ), [tasks, q, projectId, assignee, priority, status]);

  const upsert = (t: TaskDTO) => setTasks((prev) => prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev]);
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const move = async (id: string, to: TaskStatus) => {
    const prev = tasks;
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: to } : t)));
    try {
      const { task } = await api<{ task: TaskDTO }>(`/api/organizations/${organizationId}/tasks/${id}`, { method: "PATCH", json: { status: to } });
      upsert(task);
    } catch (err) { setTasks(prev); toast({ kind: "error", title: (err as Error).message }); }
  };

  const openNew = (s: TaskStatus = "TODO") => { setNewStatus(s); setNewOpen(true); };
  const closeNew = () => { setNewOpen(false); if (params.get("new")) setParam("new", null); };

  return (
    <>
      <div className="row-between mb-4">
        <div className="filters">
          <label className="chip" style={{ paddingLeft: 10 }}><Search size={14} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" aria-label="Buscar tarefas" style={{ border: 0, background: "transparent", outline: "none", width: 140, font: "inherit" }} /></label>
          <select className="select input-sm" style={{ width: "auto", minHeight: 36 }} value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Filtrar por projeto"><option value="">Todos os projetos</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className="select input-sm" style={{ width: "auto", minHeight: 36 }} value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filtrar por responsável"><option value="">Qualquer responsável</option><option value={currentUserId}>Minhas</option>{members.filter((m) => m.id !== currentUserId).map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}</select>
          <select className="select input-sm" style={{ width: "auto", minHeight: 36 }} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filtrar por prioridade"><option value="">Qualquer prioridade</option>{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}</select>
          {view === "list" && <select className="select input-sm" style={{ width: "auto", minHeight: 36 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status"><option value="">Qualquer status</option>{[...STATUSES, "ARCHIVED"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>}
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}><Plus size={16} aria-hidden="true" /> Nova tarefa</button>
      </div>

      {view === "board"
        ? <Board tasks={filtered} onMove={move} onOpen={(id) => setParam("task", id)} onAdd={openNew} />
        : <List tasks={filtered} onOpen={(id) => setParam("task", id)} onToggle={(t) => move(t.id, t.status === "DONE" ? "TODO" : "DONE")} selectedId={selectedId} onAdd={() => openNew()} />}

      <NewTaskModal organizationId={organizationId} open={newOpen} onClose={closeNew} onCreated={upsert} projects={projects} members={members} defaultStatus={newStatus} />
      <TaskDetail organizationId={organizationId} task={selected} projects={projects} members={members} currentUserId={currentUserId} onClose={() => setParam("task", null)} onChange={upsert} onDelete={remove} />
    </>
  );
}

function Board({ tasks, onMove, onOpen, onAdd }: { tasks: TaskDTO[]; onMove: (id: string, s: TaskStatus) => void; onOpen: (id: string) => void; onAdd: (s: TaskStatus) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  return (
    <div className="kanban" role="list" aria-label="Quadro de tarefas">
      {STATUSES.map((s) => {
        const col = tasks.filter((t) => t.status === s);
        return (
          <section key={s} className={`kanban-col ${over === s ? "drop-target" : ""}`} role="listitem" aria-label={`${STATUS_LABEL[s]} (${col.length})`}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); if (dragId) onMove(dragId, s); setDragId(null); }}>
            <div className="kanban-col-head">
              <span className="row" style={{ gap: 8 }}><span className="dot" style={{ background: s === "DONE" ? "var(--color-success)" : s === "IN_PROGRESS" ? "var(--color-warning)" : "var(--color-primary)" }} aria-hidden="true" />{STATUS_LABEL[s]}<span className="badge">{col.length}</span></span>
              <button className="btn btn-ghost btn-icon" style={{ width: 32, minHeight: 32 }} onClick={() => onAdd(s)} aria-label={`Adicionar em ${STATUS_LABEL[s]}`}><Plus size={16} /></button>
            </div>
            {col.map((t) => <BoardCard key={t.id} task={t} dragging={dragId === t.id} onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)} onOpen={() => onOpen(t.id)} onMove={(to) => onMove(t.id, to)} />)}
            {col.length === 0 && <p className="subtle text-xs" style={{ textAlign: "center", padding: 24 }}>Arraste tarefas para cá</p>}
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({ task, dragging, onDragStart, onDragEnd, onOpen, onMove }: { task: TaskDTO; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onOpen: () => void; onMove: (s: TaskStatus) => void }) {
  const idx = STATUSES.indexOf(task.status);
  const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();
  // Alternativa por teclado ao drag-and-drop: setas ← → movem entre colunas.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onOpen();
    if (e.key === "ArrowRight" && idx < STATUSES.length - 1) { e.preventDefault(); onMove(STATUSES[idx + 1]); }
    if (e.key === "ArrowLeft" && idx > 0) { e.preventDefault(); onMove(STATUSES[idx - 1]); }
  };
  return (
    <article className={`kanban-card ${dragging ? "dragging" : ""}`} draggable tabIndex={0} role="button"
      aria-label={`${task.title}. Prioridade ${PRIORITY_LABEL[task.priority]}. Enter abre, setas movem de coluna.`}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }} onDragEnd={onDragEnd} onClick={onOpen} onKeyDown={onKey}>
      <div className="row" style={{ gap: 6, alignItems: "flex-start" }}>
        <GripVertical size={14} className="subtle" style={{ marginTop: 3, flexShrink: 0 }} aria-hidden="true" />
        <span className="kanban-card-title flex-1 wrap-any">{task.title}</span>
      </div>
      <div className="kanban-card-meta">
        <span className={`priority-${task.priority} font-semibold`}>{PRIORITY_LABEL[task.priority]}</span>
        {task.project && <span className="row" style={{ gap: 4 }}><span className="dot" style={{ background: task.project.color ?? "var(--color-primary)" }} aria-hidden="true" />{task.project.name}</span>}
        {task.dueDate && <span className={overdue ? "badge badge-danger" : "row"} style={{ gap: 4 }}><Calendar size={12} aria-hidden="true" />{formatDate(task.dueDate)}</span>}
        {task.assignee && <span style={{ marginLeft: "auto" }}><Avatar name={task.assignee.name} email={task.assignee.email} image={task.assignee.image} size="sm" /></span>}
      </div>
    </article>
  );
}

function List({ tasks, onOpen, onToggle, selectedId, onAdd }: { tasks: TaskDTO[]; onOpen: (id: string) => void; onToggle: (t: TaskDTO) => void; selectedId: string | null; onAdd: () => void }) {
  if (tasks.length === 0) return <div className="card"><EmptyState icon={ListChecks} title="Nenhuma tarefa encontrada" description="Ajuste os filtros ou crie a primeira tarefa." action={<button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Nova tarefa</button>} /></div>;
  const groups = STATUSES.map((s) => ({ s, items: tasks.filter((t) => t.status === s) })).concat([{ s: "ARCHIVED" as TaskStatus, items: tasks.filter((t) => t.status === "ARCHIVED") }]).filter((g) => g.items.length);
  return (
    <div className="stack">
      {groups.map((g) => (
        <section key={g.s} className="card" style={{ padding: "var(--space-3)" }}>
          <h2 className="card-title" style={{ padding: "4px 12px 8px" }}>{STATUS_LABEL[g.s]} <span className="subtle">({g.items.length})</span></h2>
          {g.items.map((t) => {
            const overdue = t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date();
            return (
              <div key={t.id} className={`task-row ${selectedId === t.id ? "selected" : ""}`} onClick={() => onOpen(t.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(t.id)}>
                <input type="checkbox" className="checkbox" checked={t.status === "DONE"} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(t)} aria-label={`Concluir ${t.title}`} />
                <div className="flex-1">
                  <div className={`task-row-title truncate ${t.status === "DONE" ? "done" : ""}`}>{t.title}</div>
                  <div className="row text-xs subtle" style={{ gap: 8, marginTop: 2 }}>
                    <span className={`priority-${t.priority} font-semibold`}>{PRIORITY_LABEL[t.priority]}</span>
                    {t.project && <span>{t.project.name}</span>}
                    {t.dueDate && <span className={overdue ? "badge badge-danger" : ""}>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>{t.assignee && <Avatar name={t.assignee.name} email={t.assignee.email} image={t.assignee.image} size="sm" />}<ChevronRight size={16} className="subtle" aria-hidden="true" /></div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
