import { UsageMetric } from "@prisma/client";
import { PLAN_MATRIX, PlanCode } from "@taskflow/shared";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription, monthBounds } from "@/lib/billing";
import { limitReached } from "@/lib/api/errors";

export function resolvePlanCode(code: string | undefined): PlanCode {
  return code && code in PLAN_MATRIX ? (code as PlanCode) : "free";
}

export async function getEntitlements(organizationId: string) {
  const subscription = await getActiveSubscription(organizationId);
  const planCode = resolvePlanCode(subscription?.plan.code);
  return { planCode, subscription, ...PLAN_MATRIX[planCode] };
}

export async function getMonthlyUsage(organizationId: string, metric: UsageMetric) {
  const { start, end } = monthBounds();
  const record = await prisma.usageRecord.findUnique({
    where: { organizationId_metric_periodStart_periodEnd: { organizationId, metric, periodStart: start, periodEnd: end } },
  });
  return Number(record?.value ?? 0n);
}

/** Lança 402 quando a organização já atingiu o limite mensal de tarefas do plano. */
export async function assertCanCreateTask(organizationId: string) {
  const { limits, planCode } = await getEntitlements(organizationId);
  if (limits.maxTasksPerMonth === null) return;
  const used = await getMonthlyUsage(organizationId, "TASKS_CREATED");
  if (used >= limits.maxTasksPerMonth) {
    throw limitReached(`Plano ${planCode} permite ${limits.maxTasksPerMonth} tarefas/mês. Faça upgrade.`);
  }
}

/** Lança 402 quando a organização já atingiu o limite de membros (contando convites pendentes). */
export async function assertCanAddMember(organizationId: string) {
  const { limits, planCode } = await getEntitlements(organizationId);
  if (limits.maxMembers === null) return;
  const [members, pending] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId } }),
    prisma.invitation.count({ where: { organizationId, status: "PENDING" } }),
  ]);
  if (members + pending >= limits.maxMembers) {
    throw limitReached(`Plano ${planCode} permite ${limits.maxMembers} membros. Faça upgrade.`);
  }
}

export async function hasFeature(organizationId: string, feature: keyof (typeof PLAN_MATRIX)["free"]["features"]) {
  const { features } = await getEntitlements(organizationId);
  return features[feature];
}
