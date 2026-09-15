import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/activity", async (req, { params }) => {
  await requireMembership(params.organizationId);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: params.organizationId },
    include: { actor: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = logs.length > limit;
  const page = hasMore ? logs.slice(0, limit) : logs;
  return json({ activity: page, nextCursor: hasMore ? page[page.length - 1]?.id : null });
});
