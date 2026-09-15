import { PLAN_MATRIX, PlanCode } from "@taskflow/shared";
import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { getEntitlements, getMonthlyUsage } from "@/lib/entitlements";
import { BillingActions } from "@/components/billing-actions";

function Meter({ used, max }: { used: number; max: number | null }) {
  if (max === null) return <span className="muted">{used} · ilimitado</span>;
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="stack" style={{ marginTop: "0.25rem" }}>
      <div className="meter"><div style={{ width: `${pct}%` }} /></div>
      <span className="muted">{used} / {max}</span>
    </div>
  );
}

export default async function BillingPage({ params, searchParams }: { params: { slug: string }; searchParams: { success?: string; canceled?: string } }) {
  const { organization, membership } = await requirePageOrganization(params.slug);
  const [entitlements, tasksThisMonth, membersCount, plans] = await Promise.all([
    getEntitlements(organization.id),
    getMonthlyUsage(organization.id, "TASKS_CREATED"),
    prisma.organizationMember.count({ where: { organizationId: organization.id } }),
    prisma.plan.findMany({ where: { stripePriceId: { not: null } }, orderBy: { createdAt: "asc" } }),
  ]);
  const isAdmin = membership.role !== "MEMBER";
  const sub = entitlements.subscription;

  return (
    <>
      <h1>Plano e uso</h1>
      {searchParams.success && <div className="card" style={{ borderColor: "#10b981" }}>Assinatura confirmada! Pode levar alguns segundos para o plano refletir aqui.</div>}
      {searchParams.canceled && <div className="card muted">Checkout cancelado.</div>}

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Plano atual: {entitlements.name}</h2>
            {sub?.currentPeriodEnd && (
              <p className="muted">
                {sub.cancelAtPeriodEnd ? "Cancela em" : "Renova em"} {sub.currentPeriodEnd.toLocaleDateString("pt-BR")} · status {sub.status}
              </p>
            )}
          </div>
          {isAdmin && organization.stripeCustomerId && <BillingActions organizationId={organization.id} mode="portal" />}
        </div>
        <div className="grid" style={{ marginTop: "1rem" }}>
          <div><strong>Tarefas este mês</strong><Meter used={tasksThisMonth} max={entitlements.limits.maxTasksPerMonth} /></div>
          <div><strong>Membros</strong><Meter used={membersCount} max={entitlements.limits.maxMembers} /></div>
        </div>
      </section>

      <section className="card">
        <h2>Planos</h2>
        <div className="grid">
          {(Object.keys(PLAN_MATRIX) as PlanCode[]).map((code) => {
            const plan = PLAN_MATRIX[code];
            const dbPlan = plans.find((p) => p.code === code);
            const isCurrent = code === entitlements.planCode;
            return (
              <div key={code} className="card" style={{ margin: 0, borderColor: isCurrent ? "var(--primary)" : undefined }}>
                <h3>{plan.name} {isCurrent && <span className="badge">atual</span>}</h3>
                <ul className="muted" style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }}>
                  <li>{plan.limits.maxMembers ?? "Ilimitados"} membros</li>
                  <li>{plan.limits.maxTasksPerMonth ?? "Ilimitadas"} tarefas/mês</li>
                  <li>Analytics avançado: {plan.features.advancedAnalytics ? "sim" : "não"}</li>
                  <li>Export de auditoria: {plan.features.auditExport ? "sim" : "não"}</li>
                </ul>
                {isAdmin && !isCurrent && dbPlan?.stripePriceId && (
                  <BillingActions organizationId={organization.id} mode="checkout" priceId={dbPlan.stripePriceId} label={`Assinar ${plan.name}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
