import { updateTaskSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { deleteTask, getTask, updateTask } from "@/lib/tasks/service";

type P = { organizationId: string; taskId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/tasks/:taskId", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  return json({ task: await getTask(params.organizationId, params.taskId) });
});

export const PATCH = withHandler<P>("PATCH /api/organizations/:id/tasks/:taskId", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId);
  const input = await parseBody(req, updateTaskSchema);
  return json({ task: await updateTask(params.organizationId, user.id, params.taskId, input) });
});

export const DELETE = withHandler<P>("DELETE /api/organizations/:id/tasks/:taskId", async (_req, { params }) => {
  const { user } = await requireMembership(params.organizationId);
  await deleteTask(params.organizationId, user.id, params.taskId);
  return json({ ok: true });
});
