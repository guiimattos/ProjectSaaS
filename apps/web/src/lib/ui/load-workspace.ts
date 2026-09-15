import { prisma } from "@/lib/prisma";
import { listTasks } from "@/lib/tasks/service";
import { serializeTask } from "@/lib/ui/task-types";

/** Dados compartilhados por quadro e lista. */
export async function loadWorkspace(organizationId: string) {
  const [{ tasks }, projects, members] = await Promise.all([
    listTasks(organizationId, { limit: 100 }),
    prisma.project.findMany({ where: { organizationId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.organizationMember.findMany({ where: { organizationId }, include: { user: { select: { id: true, name: true, email: true, image: true } } } }),
  ]);
  return { tasks: tasks.map(serializeTask), projects, members: members.map((m) => m.user) };
}
