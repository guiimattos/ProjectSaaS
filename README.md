# TaskFlow SaaS

TaskFlow é uma base SaaS multi-tenant com foco em **Auth + Billing primeiro**, preparada para evoluir para produto B2B em produção.

## Roadmap do Projeto

### Fase 1 — MVP (semanas 1-4)
- Estrutura monorepo com app Next.js 14
- Autenticação com NextAuth + Prisma
- Organizações multi-tenant
- Billing Stripe (checkout, portal, webhook)
- Schema Prisma inicial (usuário, organização, assinatura, uso, auditoria)

### Fase 2 — Beta (semanas 5-8)
- Entitlements por plano + limites de uso
- Integrações públicas iniciais (Google, Slack, Notion)
- Melhorias no webhook (idempotência + sincronização determinística)
- Base para rate limiting e hardening

### Fase 3 — Launch (semanas 9-12)
- Observabilidade (Sentry + Posthog) com camada de abstração pronta
- Segurança avançada (RLS, auditoria expandida, políticas de retenção)
- Testes automatizados de fluxos críticos (auth/billing/webhook)
- Refino de UX de billing e onboarding

### Fase 4 — Growth
- SSO/SAML
- Features de IA e automações
- Expansão de integrações
- Otimização de custos e performance

## Status atual
- ✅ MVP base pronto
- ✅ Parte do Beta em andamento (entitlements/usage/webhook)
- ✅ Observabilidade base adicionada (track/captureError)
- ✅ Script SQL inicial de RLS adicionado
- ⏳ Próximo passo: plugar providers reais (Sentry/Posthog) e CI de testes

## Como interpretar o roadmap
- O foco inicial em Auth/Billing reduz retrabalho e risco de receita.
- Cada fase acumula capacidades sem quebrar contratos anteriores.
- A arquitetura foi desenhada para escalar por tenant com governança de dados.

## Jobs assíncronos (BullMQ)
- Fila `integration-jobs` para tarefas externas (Notion/Slack).
- Endpoint inicial: `POST /api/jobs/sync-notion` para enfileirar criação de tarefa no Notion.
- Worker base em `src/lib/jobs/worker.ts` para processamento de integrações.


## Checks automatizados
- `npm run test:critical-flows`: valida presença dos controles críticos de Auth/Billing/Webhook nos endpoints principais.


## Resolução de conflitos de PR
- Rode `npm run check:conflicts` antes de abrir/atualizar PR.
- O check bloqueia marcadores não resolvidos como `[conflict-start] branch`, `[conflict-mid]` e `[conflict-end] main`.
- Evite commits com arquivos de lock locais não solicitados.


## CI (GitHub Actions)
- Workflow em `.github/workflows/ci.yml` roda automaticamente:
  - `npm run check:conflicts`
  - `npm run test:critical-flows`


## Segurança de dados (RLS)
- Para aplicar políticas RLS no Postgres, rode: `npm run db:apply-rls` com `DATABASE_URL` configurada.


## Observabilidade
- `trackEvent` já envia para PostHog quando `POSTHOG_API_KEY` e `POSTHOG_HOST` estiverem configurados.
- `captureError` mantém log local e prepara gancho para Sentry via `SENTRY_DSN`.


## IA (Growth)
- Novo endpoint: `POST /api/jobs/generate-summary` para enfileirar resumo com OpenAI.
- Worker processa job `openai.summary.generate` e registra saída em log.
