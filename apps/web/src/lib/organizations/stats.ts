import { prisma } from "@/lib/prisma";

/** Métricas do overview: contagem por status, atrasadas, concluídas na semana e série diária de 14 dias. */
export async function getOrganizationStats(organizationId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

  const [byStatus, overdue, completedThisWeek, createdThisWeek, recentCompleted, recentCreated, byPriority] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } }),
    prisma.task.count({ where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: now } } }),
    prisma.task.count({ where: { organizationId, completedAt: { gte: weekAgo } } }),
    prisma.task.count({ where: { organizationId, createdAt: { gte: weekAgo } } }),
    prisma.task.findMany({ where: { organizationId, completedAt: { gte: twoWeeksAgo } }, select: { completedAt: true } }),
    prisma.task.findMany({ where: { organizationId, createdAt: { gte: twoWeeksAgo } }, select: { createdAt: true } }),
    prisma.task.groupBy({ by: ["priority"], where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] } }, _count: { _all: true } }),
  ]);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(now.getTime() - (13 - i) * 86_400_000)));
  const series = days.map((day) => ({
    day,
    completed: recentCompleted.filter((t) => t.completedAt && dayKey(t.completedAt) === day).length,
    created: recentCreated.filter((t) => dayKey(t.createdAt) === day).length,
  }));

  const status = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const priority = Object.fromEntries(byPriority.map((s) => [s.priority, s._count._all])) as Record<string, number>;

  return {
    status: { TODO: status.TODO ?? 0, IN_PROGRESS: status.IN_PROGRESS ?? 0, DONE: status.DONE ?? 0, ARCHIVED: status.ARCHIVED ?? 0 },
    priority: { LOW: priority.LOW ?? 0, MEDIUM: priority.MEDIUM ?? 0, HIGH: priority.HIGH ?? 0, URGENT: priority.URGENT ?? 0 },
    overdue,
    completedThisWeek,
    createdThisWeek,
    series,
  };
}
