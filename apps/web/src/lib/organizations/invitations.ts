import { prisma } from "@/lib/prisma";
import { ApiError, notFound } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/billing";
import { trackEvent } from "@/lib/observability";

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, slug: true } }, invitedBy: { select: { name: true, email: true } } },
  });
  if (!invitation) throw notFound("Convite não encontrado");
  if (invitation.status !== "PENDING") throw new ApiError(410, "Convite não está mais válido");
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    throw new ApiError(410, "Convite expirado");
  }
  return invitation;
}

export async function acceptInvitation(token: string, user: { id: string; email: string }) {
  const invitation = await getInvitationByToken(token);
  if (invitation.email !== user.email.toLowerCase()) {
    throw new ApiError(403, `Este convite foi enviado para ${invitation.email}`);
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
      create: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
      update: {},
    }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } }),
  ]);

  await writeAuditLog({ organizationId: invitation.organizationId, actorUserId: user.id, action: "invitation.accepted", resourceType: "invitation", resourceId: invitation.id });
  trackEvent({ name: "invitation.accepted", organizationId: invitation.organizationId, userId: user.id });
  return invitation.organization;
}
