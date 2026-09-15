# Roadmap de execução

## MVP ✅
- [x] Base monorepo com Next.js App Router
- [x] Auth com NextAuth v5 + Prisma Adapter (Google)
- [x] Organizações multi-tenant com papéis (OWNER/ADMIN/MEMBER)
- [x] Billing: checkout, portal, webhook idempotente e sincronização com Stripe
- [x] Modelagem de dados principal

## Beta ✅
- [x] Seed de planos e entitlements aplicados no servidor (tarefas/mês, membros)
- [x] Domínio de produto: Projetos, Tarefas, Comentários
- [x] Convites por e-mail (Resend) com link, expiração e revogação
- [x] Notificações in-app (atribuição, conclusão, comentários)
- [x] Integrações por organização: Slack (webhook) e Notion (database), via fila BullMQ
- [x] Interface completa: landing, onboarding, overview, quadro kanban, lista, projetos, membros, atividade, plano, configurações, conta
- [x] Design system (ui-ux-pro-max) + componentes ReactBits (Aurora, BlurText, ShinyText, CountUp, SpotlightCard, GradientText, Magnet, FadeContent, AnimatedContent)

## Launch
- [x] Observabilidade: PostHog (eventos) e Sentry (erros) via HTTP quando as chaves existem
- [x] Rate limit com Redis (fallback em memória)
- [x] RLS SQL para todas as tabelas por tenant (ativação manual: `packages/db/prisma/rls.sql`)
- [~] Testes: checks estáticos + typecheck + build no CI; falta suíte de integração com banco (Vitest + Testcontainers)
- [ ] Busca global (⌘K)
- [ ] Anexos em tarefas (Vercel Blob/S3)
- [ ] Exportação de auditoria (CSV) — feature já gateada por plano

## Growth
- [ ] SSO/SAML
- [ ] IA: resumo de tarefas e sugestões de priorização
- [ ] Integrações: Google Calendar, Linear, GitHub
- [ ] Analytics avançado (feature já gateada por plano)
