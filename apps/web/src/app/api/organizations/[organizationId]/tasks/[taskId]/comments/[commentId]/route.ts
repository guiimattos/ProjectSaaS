import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { forbidden, notFound } from "@/lib/api/errors";

type P = { organizationId: string; taskId: string; commentId: string };

export const DELETE = withHandler<P>("DELETE .../comments/:commentId", async (_req, { params }) => {
  const { user, membership } = await requireMembership(params.organizationId);
  const comment = await prisma.comment.findFirst({ where: { id: params.commentId, taskId: params.taskId, organizationId: params.organizationId } });
  if (!comment) throw notFound("Comentário não encontrado");
  if (comment.authorId !== user.id && membership.role === "MEMBER") throw forbidden();
  await prisma.comment.delete({ where: { id: comment.id } });
  return json({ ok: true });
});
