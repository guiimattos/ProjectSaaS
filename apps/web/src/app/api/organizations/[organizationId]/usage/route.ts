import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { getEntitlements, getMonthlyUsage } from "@/lib/entitlements";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/usage", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  const [entitlements, tasksCreated, members] = await Promise.all([
    getEntitlements(params.organizationId),
    getMonthlyUsage(params.organizationId, "TASKS_CREATED"),
    prisma.organizationMember.count({ where: { organizationId: params.organizationId } }),
  ]);

  return json({
    plan: { code: entitlements.planCode, name: entitlements.name, status: entitlements.subscription?.status ?? null, currentPeriodEnd: entitlements.subscription?.currentPeriodEnd ?? null, cancelAtPeriodEnd: entitlements.subscription?.cancelAtPeriodEnd ?? false },
    limits: entitlements.limits,
    features: entitlements.features,
    usage: { tasksCreatedThisMonth: tasksCreated, members },
  });
});
