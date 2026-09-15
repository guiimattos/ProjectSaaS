import { prisma } from "@/lib/prisma";

export async function notify(input: { organizationId: string; userId: string; type: string; title: string; body?: string; href?: string }) {
  return prisma.notification.create({ data: input });
}

export async function listNotifications(userId: string, limit = 20) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit, include: { organization: { select: { slug: true, name: true } } } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unread };
}
