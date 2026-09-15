import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/billing";

type P = { organizationId: string; invitationId: string };

export const DELETE = withHandler<P>("DELETE /api/organizations/:id/invitations/:invitationId", async (_req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  const result = await prisma.invitation.updateMany({
    where: { id: params.invitationId, organizationId: params.organizationId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) throw notFound("Convite não encontrado");
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "invitation.revoked", resourceType: "invitation", resourceId: params.invitationId });
  return json({ ok: true });
});
