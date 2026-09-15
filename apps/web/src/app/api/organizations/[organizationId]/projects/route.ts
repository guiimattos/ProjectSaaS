import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { writeAuditLog } from "@/lib/billing";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/projects", async (req, { params }) => {
  await requireMembership(params.organizationId);
  const includeArchived = new URL(req.url).searchParams.get("archived") === "1";
  const projects = await prisma.project.findMany({
    where: { organizationId: params.organizationId, ...(includeArchived ? {} : { archivedAt: null }) },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });
  return json({ projects });
});

export const POST = withHandler<P>("POST /api/organizations/:id/projects", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId);
  const data = await parseBody(req, createProjectSchema);

  const project = await prisma.project.create({ data: { ...data, organizationId: params.organizationId } });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "project.created", resourceType: "project", resourceId: project.id });
  return json({ project }, { status: 201 });
});
