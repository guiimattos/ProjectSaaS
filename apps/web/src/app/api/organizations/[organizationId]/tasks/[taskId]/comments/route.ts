import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { getTask } from "@/lib/tasks/service";
import { writeAuditLog } from "@/lib/billing";
import { notify } from "@/lib/notifications/service";

type P = { organizationId: string; taskId: string };
const authorSelect = { id: true, name: true, email: true, image: true };

export const GET = withHandler<P>("GET .../comments", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  await getTask(params.organizationId, params.taskId);
  const comments = await prisma.comment.findMany({ where: { taskId: params.taskId }, include: { author: { select: authorSelect } }, orderBy: { createdAt: "asc" } });
  return json({ comments });
});

export const POST = withHandler<P>("POST .../comments", async (req, { params }) => {
  const { user, organization } = await requireMembership(params.organizationId);
  const task = await getTask(params.organizationId, params.taskId);
  const { body } = await parseBody(req, createCommentSchema);

  const comment = await prisma.comment.create({
    data: { organizationId: params.organizationId, taskId: params.taskId, authorId: user.id, body },
    include: { author: { select: authorSelect } },
  });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "comment.created", resourceType: "task", resourceId: task.id });

  // Notifica responsável e criador (exceto o próprio autor).
  const targets = new Set([task.assigneeId, task.createdById].filter((id): id is string => Boolean(id) && id !== user.id));
  await Promise.all([...targets].map((userId) =>
    notify({ organizationId: params.organizationId, userId, type: "comment.created", title: `${user.name ?? user.email} comentou em "${task.title}"`, body: body.slice(0, 140), href: `/org/${organization.slug}/tasks?task=${task.id}` })
  ));

  return json({ comment }, { status: 201 });
});
