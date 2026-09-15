# Roadmap de execução

## MVP
- [x] Base monorepo com Next.js App Router
- [x] Auth com NextAuth v5 + Prisma Adapter (Google)
- [x] Organizações multi-tenant com papéis (OWNER/ADMIN/MEMBER)
- [x] Billing: checkout, portal, webhook idempotente e sincronização com Stripe
- [x] Modelagem de dados principal

## Beta
- [x] Seed de planos
- [x] Entitlements por plano (limite de tarefas/mês e membros)
- [x] Domínio de produto: Projetos e Tarefas (CRUD, filtros, paginação por cursor)
- [x] Convites de equipe por link (expiração, revogação, aceite)
- [x] UI: dashboard, board de tarefas, membros, plano/uso
- [x] Integrações iniciais Slack/Notion + jobs BullMQ
- [ ] Envio de e-mail de convite (Resend/SES)
- [ ] Comentários e anexos em tarefas

## Launch
- [~] Observabilidade (camada local pronta; plugar Sentry/PostHog)
- [~] Hardening de segurança (rate limit em memória → Redis; RLS SQL pronto, ativação pendente)
- [~] Testes (checks estáticos + typecheck + build no CI; falta suíte de integração com banco)
- [ ] Onboarding pós-login (criar primeira org automaticamente)

## Growth
- [ ] SSO/SAML
- [ ] IA: sugestões e automações
- [ ] Expansão de integrações (Google Calendar, Linear)
- [ ] Analytics avançado (feature já gateada por plano)
