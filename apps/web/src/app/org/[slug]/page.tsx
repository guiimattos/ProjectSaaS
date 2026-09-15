import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { getOrganizationStats } from "@/lib/organizations/stats";
import { getEntitlements, getMonthlyUsage } from "@/lib/entitlements";
import { StatTile } from "@/components/org/stat-tiles";
import { ActivityChart } from "@/components/org/activity-chart";
import { Avatar, PRIORITY_LABEL, formatDate, timeAgo } from "@/components/ui/primitives";
import { describeActivity } from "@/lib/ui/activity";

export default async function OverviewPage({ params }: { params: { slug: string } }) {
  const { organization, user } = await requirePageOrganization(params.slug);
  const base = `/org/${organization.slug}`;

  const [stats, myTasks, activity, entitlements, tasksThisMonth] = await Promise.all([
    getOrganizationStats(organization.id),
    prisma.task.findMany({ where: { organizationId: organization.id, assigneeId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } }, orderBy: [{ dueDate: "asc" }, { priority: "desc" }], take: 6, include: { project: { select: { name: true, color: true } } } }),
    prisma.auditLog.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true, email: true, image: true } } } }),
    getEntitlements(organization.id),
    getMonthlyUsage(organization.id, "TASKS_CREATED"),
  ]);
  const open = stats.status.TODO + stats.status.IN_PROGRESS;
  const limit = entitlements.limits.maxTasksPerMonth;
  const pct = limit ? Math.min(100, Math.round((tasksThisMonth / limit) * 100)) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <div className="page-header">
        <div><h1>{greeting}, {user.name?.split(" ")[0] ?? "time"}</h1><p>Aqui está o panorama de {organization.name}.</p></div>
        <Link href={`${base}/tasks?new=1`} className="btn btn-primary"><Plus size={16} aria-hidden="true" /> Nova tarefa</Link>
      </div>

      <div className="grid grid-4 mb-4">
        <StatTile icon="todo" label="Abertas" value={open} hint={`${stats.status.TODO} a fazer`} />
        <StatTile icon="progress" label="Em andamento" value={stats.status.IN_PROGRESS} tone="warning" />
        <StatTile icon="done" label="Concluídas (7d)" value={stats.completedThisWeek} tone="success" hint={`${stats.createdThisWeek} criadas no período`} />
        <StatTile icon="overdue" label="Atrasadas" value={stats.overdue} tone={stats.overdue ? "danger" : "primary"} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2 className="card-title mb-4">Fluxo de trabalho</h2>
          <ActivityChart series={stats.series} />
        </section>

        <section className="card">
          <div className="row-between mb-4"><h2 className="card-title">Minhas tarefas</h2><Link href={`${base}/tasks?assignee=me`} className="text-sm">Ver todas <ArrowRight size={14} style={{ display: "inline" }} aria-hidden="true" /></Link></div>
          {myTasks.length === 0 && <p className="muted text-sm">Nada atribuído a você. Aproveite ☕</p>}
          {myTasks.map((t) => {
            const overdue = t.dueDate && t.dueDate < new Date();
            return (
              <Link key={t.id} href={`${base}/tasks?task=${t.id}`} className="list-item" style={{ color: "inherit", textDecoration: "none" }}>
                <span className={`dot priority-${t.priority}`} style={{ background: "currentColor" }} aria-label={PRIORITY_LABEL[t.priority]} />
                <span className="flex-1 truncate text-sm font-medium">{t.title}</span>
                {t.project && <span className="badge">{t.project.name}</span>}
                {t.dueDate && <span className={`text-xs ${overdue ? "badge badge-danger" : "subtle"}`}>{formatDate(t.dueDate)}</span>}
              </Link>
            );
          })}
        </section>

        <section className="card">
          <div className="row-between mb-4"><h2 className="card-title">Atividade recente</h2><Link href={`${base}/activity`} className="text-sm">Histórico <ArrowRight size={14} style={{ display: "inline" }} aria-hidden="true" /></Link></div>
          {activity.length === 0 && <p className="muted text-sm">Ainda sem atividade.</p>}
          {activity.map((a) => (
            <div key={a.id} className="list-item" style={{ alignItems: "flex-start" }}>
              <Avatar name={a.actor?.name} email={a.actor?.email} image={a.actor?.image} size="sm" />
              <div className="flex-1 text-sm wrap-any"><span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "Sistema"}</span> <span className="muted">{describeActivity(a.action)}</span></div>
              <span className="subtle text-xs">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </section>

        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="row-between">
            <div><h2 className="card-title">Uso do plano {entitlements.name}</h2><p className="muted text-sm mt-2">{tasksThisMonth}{limit ? ` de ${limit}` : ""} tarefas criadas este mês{limit ? ` (${pct}%)` : " · ilimitado"}.</p></div>
            {limit && pct >= 80 && <Link href={`${base}/billing`} className="btn btn-accent btn-sm">Fazer upgrade</Link>}
          </div>
          {limit && <div className={`meter mt-4 ${pct >= 100 ? "danger" : pct >= 80 ? "warn" : ""}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>}
        </section>
      </div>
    </>
  );
}
