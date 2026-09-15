import { createTaskSchema, listTasksQuerySchema } from "@/lib/validators";
import { enforceRateLimit, requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api/errors";
import { createTask, listTasks } from "@/lib/tasks/service";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/tasks", async (req, { params }) => {
  await requireMembership(params.organizationId);
  const parsed = listTasksQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message);
  return json(await listTasks(params.organizationId, parsed.data));
});

export const POST = withHandler<P>("POST /api/organizations/:id/tasks", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId);
  await enforceRateLimit(`task-create:${user.id}`, 120);
  const input = await parseBody(req, createTaskSchema);
  const task = await createTask(params.organizationId, user.id, input);
  return json({ task }, { status: 201 });
});
