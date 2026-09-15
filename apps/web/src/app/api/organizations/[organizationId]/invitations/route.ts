import { prisma } from "@/lib/prisma";
import { createInvitationSchema } from "@/lib/validators";
import { enforceRateLimit, requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api/errors";
import { assertCanAddMember } from "@/lib/entitlements";
import { writeAuditLog } from "@/lib/billing";
import { trackEvent } from "@/lib/observability";
import { invitationEmail, sendEmail } from "@/lib/email/send";

type P = { organizationId: string };
const INVITE_TTL_DAYS = 7;

export const GET = withHandler<P>("GET /api/organizations/:id/invitations", async (_req, { params }) => {
  await requireMembership(params.organizationId, "ADMIN");
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: params.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
  });
  return json({ invitations });
});

export const POST = withHandler<P>("POST /api/organizations/:id/invitations", async (req, { params }) => {
  const { user, organization } = await requireMembership(params.organizationId, "ADMIN");
  await enforceRateLimit(`invite:${user.id}`, 30);
  const parsedInvite = await parseBody(req, createInvitationSchema);
  const email = parsedInvite.email;
  const role = parsedInvite.role ?? "MEMBER";
  const normalizedEmail = email.toLowerCase();

  const alreadyMember = await prisma.organizationMember.findFirst({
    where: { organizationId: params.organizationId, user: { email: normalizedEmail } },
  });
  if (alreadyMember) throw badRequest("Usuário já é membro");

  await assertCanAddMember(params.organizationId);

  // Reaproveita convite pendente para o mesmo e-mail em vez de duplicar.
  await prisma.invitation.updateMany({
    where: { organizationId: params.organizationId, email: normalizedEmail, status: "PENDING" },
    data: { status: "REVOKED" },
  });

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: params.organizationId,
      email: normalizedEmail,
      role,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "invitation.created", resourceType: "invitation", resourceId: invitation.id, metadataJson: { email: normalizedEmail, role } });
  trackEvent({ name: "invitation.created", organizationId: params.organizationId, userId: user.id });

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;
  const mail = invitationEmail({ organization: organization.name, inviter: user.name ?? user.email, role, acceptUrl });
  const delivery = await sendEmail({ to: normalizedEmail, subject: mail.subject, html: mail.html, text: mail.text });

  return json({ invitation: { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt, acceptUrl, organization: organization.name, emailSent: !delivery.skipped && !("error" in delivery) } }, { status: 201 });
});
