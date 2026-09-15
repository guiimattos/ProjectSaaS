import { Check, CheckCircle2, XCircle } from "lucide-react";
import { PLAN_MATRIX, PlanCode } from "@taskflow/shared";
import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { getEntitlements, getMonthlyUsage } from "@/lib/entitlements";
import { BillingActions } from "@/components/org/billing-actions";
import { formatDate } from "@/components/ui/primitives";

export const metadata = { title: "Plano e uso" };

function Meter({ used, max, label }: { used: number; max: number | null; label: string }) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="stat">
      <div className="row-between"><span className="card-title">{label}</span><span className="text-sm tabular muted">{used}{max ? ` / ${max}` : " · ilimitado"}</span></div>
      {max ? <div className={`meter mt-2 ${pct >= 100 ? "danger" : pct >= 80 ? "warn" : ""}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}><div style={{ width: `${pct}%` }} /></div> : <div className="meter mt-2"><div style={{ width: "100%", background: "var(--color-success)" }} /></div>}
    </div>
  );
}

export default async function BillingPage({ params, searchParams }: { params: { slug: string }; searchParams: { success?: string; canceled?: string } }) {
  const { organization, membership } = await requirePageOrganization(params.slug, "ADMIN");
  const [entitlements, tasksThisMonth, membersCount, plans] = await Promise.all([
    getEntitlements(organization.id),
    getMonthlyUsage(organization.id, "TASKS_CREATED"),
    prisma.organizationMember.count({ where: { organizationId: organization.id } }),
    prisma.plan.findMany({ where: { stripePriceId: { not: null } } }),
  ]);
  const sub = entitlements.subscription;
  const isAdmin = membership.role !== "MEMBER";
  const PRICE: Record<PlanCode, string> = { free: "R$0", pro: "R$79", enterprise: "Sob consulta" };

  return (
    <>
      <div className="page-header"><div><h1>Plano e uso</h1><p>Gerencie a assinatura e acompanhe os limites da organização.</p></div></div>

      {searchParams.success && <div className="card row mb-4" style={{ borderColor: "var(--color-success)" }} role="status"><CheckCircle2 style={{ color: "var(--color-success)" }} aria-hidden="true" /><span><strong>Assinatura confirmada!</strong> <span className="muted">Pode levar alguns segundos para o plano refletir aqui.</span></span></div>}
      {searchParams.canceled && <div className="card row mb-4" role="status"><XCircle className="subtle" aria-hidden="true" /><span className="muted">Checkout cancelado. Nada foi cobrado.</span></div>}

      <section className="card mb-4">
        <div className="row-between">
          <div>
            <h2>Plano {entitlements.name} {sub?.status && sub.status !== "ACTIVE" && <span className="badge badge-warning">{sub.status}</span>}</h2>
            {sub?.currentPeriodEnd && <p className="muted text-sm mt-2">{sub.cancelAtPeriodEnd ? "Cancela em" : "Renova em"} {formatDate(sub.currentPeriodEnd, { day: "2-digit", month: "long", year: "numeric" })}</p>}
          </div>
          {isAdmin && organization.stripeCustomerId && <BillingActions organizationId={organization.id} mode="portal" />}
        </div>
        <div className="grid grid-2 mt-6">
          <Meter label="Tarefas este mês" used={tasksThisMonth} max={entitlements.limits.maxTasksPerMonth} />
          <Meter label="Membros" used={membersCount} max={entitlements.limits.maxMembers} />
        </div>
      </section>

      <div className="grid grid-3">
        {(Object.keys(PLAN_MATRIX) as PlanCode[]).map((code) => {
          const plan = PLAN_MATRIX[code];
          const dbPlan = plans.find((p) => p.code === code);
          const isCurrent = code === entitlements.planCode;
          return (
            <div key={code} className={`card pricing-card ${isCurrent ? "featured" : ""}`}>
              {isCurrent && <span className="badge badge-primary" style={{ position: "absolute", top: 16, right: 16 }}>Plano atual</span>}
              <div><h3>{plan.name}</h3><div className="pricing-price mt-2" style={{ fontSize: "var(--text-3xl)" }}>{PRICE[code]}{code !== "enterprise" && <small>/mês</small>}</div></div>
              <ul className="check-list">
                <li><Check aria-hidden="true" /> {plan.limits.maxMembers ? `${plan.limits.maxMembers} membros` : "Membros ilimitados"}</li>
                <li><Check aria-hidden="true" /> {plan.limits.maxTasksPerMonth ? `${plan.limits.maxTasksPerMonth.toLocaleString("pt-BR")} tarefas/mês` : "Tarefas ilimitadas"}</li>
                <li style={{ opacity: plan.features.advancedAnalytics ? 1 : 0.45 }}><Check aria-hidden="true" /> Analytics avançado</li>
                <li style={{ opacity: plan.features.auditExport ? 1 : 0.45 }}><Check aria-hidden="true" /> Exportação de auditoria</li>
              </ul>
              <div style={{ marginTop: "auto" }}>
                {isCurrent ? <button className="btn btn-block" disabled>Plano atual</button>
                  : code === "enterprise" && !dbPlan?.stripePriceId ? <a href="mailto:vendas@taskflow.app" className="btn btn-block">Falar com vendas</a>
                  : dbPlan?.stripePriceId ? <BillingActions organizationId={organization.id} mode="checkout" priceId={dbPlan.stripePriceId} label={`Assinar ${plan.name}`} className="btn-primary btn-block" />
                  : <button className="btn btn-block" disabled title="Configure STRIPE_PRICE_* e rode o seed">Indisponível</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
