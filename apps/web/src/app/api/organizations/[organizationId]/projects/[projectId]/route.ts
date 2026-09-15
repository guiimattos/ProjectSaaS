import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/billing";

type P = { organizationId: string; projectId: string };

async function getProject(params: P) {
  const project = await prisma.project.findFirst({ where: { id: params.projectId, organizationId: params.organizationId } });
  if (!project) throw notFound("Projeto não encontrado");
  return project;
}

export const GET = withHandler<P>("GET /api/organizations/:id/projects/:projectId", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  const project = await getProject(params);
  return json({ project });
});

export const PATCH = withHandler<P>("PATCH /api/organizations/:id/projects/:projectId", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId);
  await getProject(params);
  const { archived, ...data } = await parseBody(req, updateProjectSchema);

  const project = await prisma.project.update({
    where: { id: params.projectId },
    data: { ...data, ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }) },
  });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "project.updated", resourceType: "project", resourceId: project.id });
  return json({ project });
});

export const DELETE = withHandler<P>("DELETE /api/organizations/:id/projects/:projectId", async (_req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  await getProject(params);
  await prisma.project.delete({ where: { id: params.projectId } });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "project.deleted", resourceType: "project", resourceId: params.projectId });
  return json({ ok: true });
});
