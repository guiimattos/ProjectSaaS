import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";

type P = { notificationId: string };

export const PATCH = withHandler<P>("PATCH /api/me/notifications/:id", async (_req, { params }) => {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id: params.notificationId, userId: user.id }, data: { readAt: new Date() } });
  return json({ ok: true });
});
