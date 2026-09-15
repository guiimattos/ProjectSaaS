"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Sparkles } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText/BlurText";
import ShinyText from "@/components/reactbits/ShinyText/ShinyText";
import Magnet from "@/components/reactbits/Magnet/Magnet";
import FadeContent from "@/components/reactbits/FadeContent/FadeContent";

// Aurora usa WebGL (ogl): só no cliente e fora do bundle inicial.
const Aurora = dynamic(() => import("@/components/reactbits/Aurora/Aurora"), { ssr: false });

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <Aurora colorStops={["#2563eb", "#7c3aed", "#ea580c"]} amplitude={1.1} blend={0.6} speed={0.6} />
      </div>
      <div className="container hero-content">
        <span className="eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          <ShinyText text="Novo: integrações Slack e Notion por workspace" speed={3} />
        </span>
        <h1>
          <BlurText text="Organize o trabalho do seu time sem fricção" delay={60} animateBy="words" direction="top" className="hero-title" />
        </h1>
        <p className="hero-sub">
          Projetos, tarefas, membros e cobrança num só lugar. Multi-tenant de verdade, com limites por plano aplicados no servidor e auditoria de tudo.
        </p>
        <FadeContent blur duration={600} delay={300}>
          <div className="row" style={{ justifyContent: "center" }}>
            <Magnet padding={40} magnetStrength={6}>
              <Link href="/sign-in" className="btn btn-accent btn-lg">Começar grátis <ArrowRight size={18} aria-hidden="true" /></Link>
            </Magnet>
            <a href="#features" className="btn btn-lg">Ver funcionalidades</a>
          </div>
          <p className="subtle text-sm mt-4">Sem cartão de crédito · Plano Free com 3 membros e 100 tarefas/mês</p>
        </FadeContent>
        <FadeContent blur duration={800} delay={500}>
          <MockBoard />
        </FadeContent>
      </div>
    </section>
  );
}

function MockBoard() {
  const cols = [
    { title: "A fazer", items: ["Definir escopo do onboarding", "Revisar copy da landing"] },
    { title: "Em andamento", items: ["Integração Slack", "Relatório semanal"] },
    { title: "Concluído", items: ["Checkout Stripe", "Convites por e-mail", "Auditoria"] },
  ];
  return (
    <div className="mock-window" aria-hidden="true">
      <div className="mock-bar"><span /><span /><span /></div>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, minWidth: 0 }}>
        {cols.map((c) => (
          <div key={c.title} className="kanban-col" style={{ minHeight: 0 }}>
            <div className="kanban-col-head">{c.title}<span className="badge">{c.items.length}</span></div>
            {c.items.map((i) => (
              <div key={i} className="kanban-card" style={{ cursor: "default" }}>
                <div className="kanban-card-title" style={{ fontSize: 13 }}>{i}</div>
                <div className="kanban-card-meta"><span className="dot" style={{ background: "var(--color-primary)" }} /> Produto</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
