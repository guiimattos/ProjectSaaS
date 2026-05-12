import { prisma } from "@/lib/prisma";
import { UsageMetric } from "@prisma/client";

export function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));
  return { start, end };
}

export async function getActiveSubscription(organizationId: string) {
  return prisma.subscription.findFirst({
    where: { organizationId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    include: { plan: true },
    orderBy: { updatedAt: "desc" }
  });
}

export async function incrementUsage(organizationId: string, metric: UsageMetric, amount = 1n) {
  const { start, end } = monthBounds();
  return prisma.usageRecord.upsert({
    where: {
      organizationId_metric_periodStart_periodEnd: {
        organizationId,
        metric,
        periodStart: start,
        periodEnd: end
      }
    },
    create: { organizationId, metric, periodStart: start, periodEnd: end, value: amount },
    update: { value: { increment: amount } }
  });
}

export async function writeAuditLog(input: {
  organizationId: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadataJson?: object;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadataJson: input.metadataJson
    }
  });
}
