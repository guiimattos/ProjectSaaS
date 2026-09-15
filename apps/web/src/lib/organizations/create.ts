import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/observability";
import { writeAuditLog } from "@/lib/billing";
import { ApiError } from "@/lib/api/errors";

export async function createOrganization(input: { name: string; slug: string; ownerUserId: string }) {
  const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
  if (!freePlan) throw new ApiError(500, "Plano free não encontrado. Rode o seed do banco.");

  const slugTaken = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (slugTaken) throw new ApiError(409, "Slug já está em uso");

  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      ownerUserId: input.ownerUserId,
      members: { create: { userId: input.ownerUserId, role: "OWNER" } },
      subscriptions: { create: { planId: freePlan.id, status: "ACTIVE" } },
    },
  });

  await writeAuditLog({ organizationId: org.id, actorUserId: input.ownerUserId, action: "organization.created", resourceType: "organization", resourceId: org.id });
  trackEvent({ name: "organization.created", organizationId: org.id, userId: input.ownerUserId, properties: { slug: org.slug } });
  return org;
}
