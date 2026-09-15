import { prisma } from "@/lib/prisma";
import { updateMemberSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { forbidden, notFound } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/billing";

type P = { organizationId: string; memberId: string };

async function getMember(params: P) {
  const member = await prisma.organizationMember.findFirst({ where: { id: params.memberId, organizationId: params.organizationId } });
  if (!member) throw notFound("Membro não encontrado");
  if (member.role === "OWNER") throw forbidden("O owner não pode ser alterado ou removido");
  return member;
}

export const PATCH = withHandler<P>("PATCH /api/organizations/:id/members/:memberId", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  await getMember(params);
  const { role } = await parseBody(req, updateMemberSchema);

  const member = await prisma.organizationMember.update({ where: { id: params.memberId }, data: { role } });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "member.role_changed", resourceType: "member", resourceId: member.id, metadataJson: { role } });
  return json({ member });
});

export const DELETE = withHandler<P>("DELETE /api/organizations/:id/members/:memberId", async (_req, { params }) => {
  const { user, membership } = await requireMembership(params.organizationId);
  const target = await getMember(params);

  // Membro pode sair sozinho; remover terceiros exige ADMIN.
  const isSelf = target.userId === user.id;
  if (!isSelf && membership.role === "MEMBER") throw forbidden();

  await prisma.organizationMember.delete({ where: { id: params.memberId } });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: isSelf ? "member.left" : "member.removed", resourceType: "member", resourceId: params.memberId });
  return json({ ok: true });
});
