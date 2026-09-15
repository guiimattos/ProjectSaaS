import { requireUser } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { acceptInvitation, getInvitationByToken } from "@/lib/organizations/invitations";

type P = { token: string };

export const GET = withHandler<P>("GET /api/invitations/:token", async (_req, { params }) => {
  const invitation = await getInvitationByToken(params.token);
  return json({ invitation: { email: invitation.email, role: invitation.role, organization: invitation.organization, invitedBy: invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? null, expiresAt: invitation.expiresAt } });
});

export const POST = withHandler<P>("POST /api/invitations/:token", async (_req, { params }) => {
  const user = await requireUser();
  const organization = await acceptInvitation(params.token, user);
  return json({ organization });
});
