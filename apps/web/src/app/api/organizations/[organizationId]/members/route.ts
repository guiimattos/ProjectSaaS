import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/members", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: params.organizationId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
  return json({ members });
});
