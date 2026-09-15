"use client";

import Link from "next/link";
import { Building2, KanbanSquare, ShieldCheck, CreditCard, Plug, Bell, Check, ArrowRight } from "lucide-react";
import SpotlightCard from "@/components/reactbits/SpotlightCard/SpotlightCard";
import CountUp from "@/components/reactbits/CountUp/CountUp";
import AnimatedContent from "@/components/reactbits/AnimatedContent/AnimatedContent";
import GradientText from "@/components/reactbits/GradientText/GradientText";
import { PLAN_MATRIX, PlanCode } from "@taskflow/shared";

const FEATURES = [
  { icon: Building2, title: "Multi-tenant nativo", desc: "Organizações isoladas, papéis OWNER/ADMIN/MEMBER e políticas de RLS prontas para o Postgres." },
  { icon: KanbanSquare, title: "Quadro e lista", desc: "Kanban com arrastar e soltar, filtros por projeto, responsável e prioridade, prazos e comentários." },
  { icon: CreditCard, title: "Billing com Stripe", desc: "Checkout, portal do cliente e webhook idempotente. Limites por plano aplicados no servidor." },
  { icon: Plug, title: "Integrações por workspace", desc: "Slack e Notion configurados por organização, processados em fila com retry automático." },
  { icon: Bell, title: "Notificações", desc: "Atribuições, conclusões e comentários chegam na hora para quem precisa saber." },
  { icon: ShieldCheck, title: "Auditoria e segurança", desc: "Trilha de auditoria por tenant, rate limiting e observabilidade plugável (PostHog/Sentry)." },
];

export function Features() {
  return (
    <section id="features" className="section container">
      <div className="section-title">
        <h2>Tudo que um SaaS B2B precisa, <GradientText colors={["#2563eb", "#7c3aed", "#ea580c"]} animationSpeed={6}>já pronto</GradientText></h2>
        <p>Foco em auth e billing primeiro. O resto do produto cresce em cima de uma base sólida.</p>
      </div>
      <div className="grid grid-3">
        {FEATURES.map((f, i) => (
          <AnimatedContent key={f.title} distance={40} delay={i * 0.06} duration={0.6} ease="power3.out">
            <SpotlightCard spotlightColor="rgba(37, 99, 235, 0.18)">
              <div className="feature-icon"><f.icon size={22} aria-hidden="true" /></div>
              <h3>{f.title}</h3>
              <p className="muted mt-2 text-sm" style={{ lineHeight: 1.6 }}>{f.desc}</p>
            </SpotlightCard>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}

const STATS = [
  { value: 99.9, suffix: "%", label: "de disponibilidade alvo", decimals: 1 },
  { value: 3, suffix: "", label: "planos com limites reais" },
  { value: 20, suffix: "+", label: "endpoints REST tipados" },
  { value: 100, suffix: "%", label: "eventos auditados" },
];

export function Stats() {
  return (
    <section className="section container">
      <div className="card-glass grid grid-4" style={{ textAlign: "center" }}>
        {STATS.map((s) => (
          <div key={s.label} className="stat" style={{ alignItems: "center", padding: "8px 0" }}>
            <span className="stat-value" style={{ color: "var(--color-primary)" }}>
              <CountUp to={s.value} duration={1.6} separator="." />{s.suffix}
            </span>
            <span className="muted text-sm">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const PRICE: Record<PlanCode, { price: string; period?: string; cta: string; featured?: boolean }> = {
  free: { price: "R$0", period: "/mês", cta: "Começar grátis" },
  pro: { price: "R$79", period: "/mês", cta: "Assinar Pro", featured: true },
  enterprise: { price: "Sob consulta", cta: "Falar com vendas" },
};

export function Pricing() {
  return (
    <section id="pricing" className="section container">
      <div className="section-title">
        <h2>Preços simples, limites claros</h2>
        <p>Comece no Free e faça upgrade quando o time crescer. Sem surpresas.</p>
      </div>
      <div className="grid grid-3" style={{ alignItems: "stretch" }}>
        {(Object.keys(PLAN_MATRIX) as PlanCode[]).map((code) => {
          const plan = PLAN_MATRIX[code];
          const p = PRICE[code];
          return (
            <div key={code} className={`card pricing-card ${p.featured ? "featured" : ""}`}>
              {p.featured && <span className="badge badge-primary" style={{ position: "absolute", top: 16, right: 16 }}>Mais popular</span>}
              <div>
                <h3>{plan.name}</h3>
                <div className="pricing-price mt-2">{p.price}{p.period && <small>{p.period}</small>}</div>
              </div>
              <ul className="check-list">
                <li><Check aria-hidden="true" /> {plan.limits.maxMembers ?? "Membros ilimitados"}{plan.limits.maxMembers && " membros"}</li>
                <li><Check aria-hidden="true" /> {plan.limits.maxTasksPerMonth ? `${plan.limits.maxTasksPerMonth.toLocaleString("pt-BR")} tarefas/mês` : "Tarefas ilimitadas"}</li>
                <li><Check aria-hidden="true" /> Projetos, quadro e comentários</li>
                <li><Check aria-hidden="true" /> Integrações Slack e Notion</li>
                <li style={{ opacity: plan.features.advancedAnalytics ? 1 : 0.45 }}><Check aria-hidden="true" /> Analytics avançado</li>
                <li style={{ opacity: plan.features.auditExport ? 1 : 0.45 }}><Check aria-hidden="true" /> Exportação de auditoria</li>
              </ul>
              <Link href="/sign-in" className={`btn btn-block ${p.featured ? "btn-primary" : ""}`} style={{ marginTop: "auto" }}>{p.cta}</Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="section container">
      <div className="cta-band">
        <h2>Pronto para organizar o próximo sprint?</h2>
        <p>Crie sua organização em menos de um minuto e convide o time por e-mail.</p>
        <Link href="/sign-in" className="btn btn-lg" style={{ background: "#fff", color: "var(--color-primary)", borderColor: "#fff" }}>
          Criar conta <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
