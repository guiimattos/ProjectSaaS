import { prisma } from "@/lib/prisma";
import { createOrganizationSchema } from "@/lib/validators";
import { enforceRateLimit, requireUser } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { createOrganization } from "@/lib/organizations/create";

export const GET = withHandler("GET /api/organizations", async () => {
  const user = await requireUser();
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true, slug: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });
  return json({ organizations: memberships.map((m) => ({ ...m.organization, role: m.role })) });
});

export const POST = withHandler("POST /api/organizations", async (req) => {
  const user = await requireUser();
  await enforceRateLimit(`org-create:${user.id}`, 20);
  const { name, slug } = await parseBody(req, createOrganizationSchema);

  const org = await createOrganization({ name, slug, ownerUserId: user.id });
  return json({ organizationId: org.id, slug: org.slug }, { status: 201 });
});
