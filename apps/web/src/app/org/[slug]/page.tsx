import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { listTasks } from "@/lib/tasks/service";
import { getEntitlements, getMonthlyUsage } from "@/lib/entitlements";
import { TaskBoard } from "@/components/task-board";

export default async function OrgTasksPage({ params }: { params: { slug: string } }) {
  const { organization, user } = await requirePageOrganization(params.slug);

  const [{ tasks }, projects, members, entitlements, tasksThisMonth] = await Promise.all([
    listTasks(organization.id, { limit: 100 }),
    prisma.project.findMany({ where: { organizationId: organization.id, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.organizationMember.findMany({ where: { organizationId: organization.id }, include: { user: { select: { id: true, name: true, email: true } } } }),
    getEntitlements(organization.id),
    getMonthlyUsage(organization.id, "TASKS_CREATED"),
  ]);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>{organization.name}</h1>
        <span className="muted">
          Plano <strong>{entitlements.name}</strong> · {tasksThisMonth}
          {entitlements.limits.maxTasksPerMonth !== null && ` / ${entitlements.limits.maxTasksPerMonth}`} tarefas este mês
        </span>
      </div>
      <TaskBoard
        organizationId={organization.id}
        currentUserId={user.id}
        initialTasks={JSON.parse(JSON.stringify(tasks))}
        projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
        members={members.map((m) => ({ id: m.user.id, label: m.user.name ?? m.user.email }))}
      />
    </>
  );
}
