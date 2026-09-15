import { prisma } from "@/lib/prisma";
import { updateOrganizationSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/billing";
import { trackEvent } from "@/lib/observability";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id", async (_req, { params }) => {
  const { organization, membership } = await requireMembership(params.organizationId);
  return json({ organization: { id: organization.id, name: organization.name, slug: organization.slug, createdAt: organization.createdAt, role: membership.role } });
});

export const PATCH = withHandler<P>("PATCH /api/organizations/:id", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  const data = await parseBody(req, updateOrganizationSchema);

  if (data.slug) {
    const taken = await prisma.organization.findFirst({ where: { slug: data.slug, NOT: { id: params.organizationId } } });
    if (taken) throw new ApiError(409, "Slug já está em uso");
  }

  const organization = await prisma.organization.update({ where: { id: params.organizationId }, data });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "organization.updated", resourceType: "organization", resourceId: organization.id, metadataJson: data });
  return json({ organization: { id: organization.id, name: organization.name, slug: organization.slug } });
});

export const DELETE = withHandler<P>("DELETE /api/organizations/:id", async (_req, { params }) => {
  const { user, organization } = await requireMembership(params.organizationId, "OWNER");
  const active = await prisma.subscription.findFirst({ where: { organizationId: params.organizationId, stripeSubscriptionId: { not: null }, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } } });
  if (active) throw new ApiError(409, "Cancele a assinatura no portal de billing antes de excluir a organização");

  await prisma.organization.delete({ where: { id: params.organizationId } });
  trackEvent({ name: "organization.deleted", organizationId: params.organizationId, userId: user.id, properties: { slug: organization.slug } });
  return json({ ok: true });
});
