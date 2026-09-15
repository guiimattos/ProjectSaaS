import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { incrementUsage, writeAuditLog } from "@/lib/billing";
import { assertCanCreateTask } from "@/lib/entitlements";
import { trackEvent } from "@/lib/observability";
import { badRequest, notFound } from "@/lib/api/errors";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "@/lib/validators";

export const taskInclude = {
  project: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
} satisfies Prisma.TaskInclude;

/** Garante que projeto e responsável pertencem ao mesmo tenant. */
async function validateRelations(organizationId: string, input: { projectId?: string | null; assigneeId?: string | null }) {
  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, organizationId } });
    if (!project) throw badRequest("Projeto inválido");
  }
  if (input.assigneeId) {
    const member = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: input.assigneeId } },
    });
    if (!member) throw badRequest("Responsável não é membro da organização");
  }
}

export async function listTasks(organizationId: string, query: z.infer<typeof listTasksQuerySchema>) {
  const tasks = await prisma.task.findMany({
    where: {
      organizationId,
      status: query.status ?? { not: "ARCHIVED" },
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
    },
    include: taskInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > query.limit;
  const page = hasMore ? tasks.slice(0, query.limit) : tasks;
  return { tasks: page, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
}

export async function createTask(organizationId: string, actorUserId: string, input: z.infer<typeof createTaskSchema>) {
  await assertCanCreateTask(organizationId);
  await validateRelations(organizationId, input);

  const task = await prisma.task.create({
    data: {
      organizationId,
      createdById: actorUserId,
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      assigneeId: input.assigneeId,
      completedAt: input.status === "DONE" ? new Date() : undefined,
    },
    include: taskInclude,
  });

  await Promise.all([
    incrementUsage(organizationId, "TASKS_CREATED"),
    writeAuditLog({ organizationId, actorUserId, action: "task.created", resourceType: "task", resourceId: task.id }),
  ]);
  trackEvent({ name: "task.created", organizationId, userId: actorUserId, properties: { taskId: task.id } });
  return task;
}

export async function getTask(organizationId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId }, include: taskInclude });
  if (!task) throw notFound("Tarefa não encontrada");
  return task;
}

export async function updateTask(organizationId: string, actorUserId: string, taskId: string, input: z.infer<typeof updateTaskSchema>) {
  const current = await getTask(organizationId, taskId);
  await validateRelations(organizationId, input);

  const { dueDate, ...rest } = input;
  const becameDone = input.status === "DONE" && current.status !== "DONE";
  const leftDone = input.status !== undefined && input.status !== "DONE" && current.status === "DONE";

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(becameDone ? { completedAt: new Date() } : leftDone ? { completedAt: null } : {}),
    },
    include: taskInclude,
  });

  await writeAuditLog({ organizationId, actorUserId, action: "task.updated", resourceType: "task", resourceId: task.id, metadataJson: { changes: Object.keys(input) } });
  return task;
}

export async function deleteTask(organizationId: string, actorUserId: string, taskId: string) {
  await getTask(organizationId, taskId);
  await prisma.task.delete({ where: { id: taskId } });
  await writeAuditLog({ organizationId, actorUserId, action: "task.deleted", resourceType: "task", resourceId: taskId });
}
