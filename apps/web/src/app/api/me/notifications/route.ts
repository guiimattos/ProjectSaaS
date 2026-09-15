import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { listNotifications } from "@/lib/notifications/service";

export const GET = withHandler("GET /api/me/notifications", async () => {
  const user = await requireUser();
  return json(await listNotifications(user.id));
});

/** Marca todas como lidas. */
export const POST = withHandler("POST /api/me/notifications", async () => {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return json({ ok: true });
});
