# TaskFlow SaaS

TaskFlow é um SaaS B2B multi-tenant de gestão de tarefas e projetos, construído com foco em **Auth + Billing primeiro**.

## Stack
- **Monorepo** npm workspaces: `apps/web` (Next.js 14 App Router), `packages/db` (Prisma), `packages/shared` (matriz de planos)
- **Auth**: NextAuth v5 + Prisma Adapter (Google OAuth)
- **Billing**: Stripe Checkout, Customer Portal e webhook idempotente
- **Jobs**: BullMQ + Redis para integrações (Slack/Notion)
- **Banco**: PostgreSQL (script de RLS em `packages/db/prisma/rls.sql`)

## Funcionalidades
- Organizações com papéis `OWNER` / `ADMIN` / `MEMBER`
- Projetos e tarefas (status, prioridade, responsável, prazo, filtros, paginação por cursor)
- Convites de equipe por link com expiração e revogação
- Planos Free / Pro / Enterprise com limites aplicados no servidor (tarefas/mês, membros)
- Auditoria (`AuditLog`) e métricas de uso (`UsageRecord`) por tenant

## Rodando localmente
```bash
cp .env.example .env            # preencha DATABASE_URL, AUTH_SECRET, Google e Stripe
npm install
npm run db:generate
npm run db:push                 # ou db:migrate para gerar migrations
npm run db:seed                 # cria planos free/pro/enterprise
npm run dev                     # http://localhost:3000
npm run worker                  # (opcional) worker BullMQ, requer Redis
```

Webhook Stripe em dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Estrutura da API
| Rota | Descrição |
| --- | --- |
| `GET/POST /api/organizations` | Listar / criar organizações |
| `GET/POST /api/organizations/:id/projects`, `GET/PATCH/DELETE .../projects/:projectId` | Projetos |
| `GET/POST /api/organizations/:id/tasks`, `GET/PATCH/DELETE .../tasks/:taskId` | Tarefas (`?status=&projectId=&assigneeId=&q=&cursor=`) |
| `GET /api/organizations/:id/members`, `PATCH/DELETE .../members/:memberId` | Membros e papéis |
| `GET/POST /api/organizations/:id/invitations`, `DELETE .../invitations/:invitationId` | Convites (ADMIN) |
| `GET/POST /api/invitations/:token` | Ver / aceitar convite |
| `GET /api/organizations/:id/usage` | Plano, limites e uso atual |
| `POST /api/billing/checkout`, `POST /api/billing/portal` | Stripe (ADMIN) |
| `POST /api/stripe/webhook` | Sincronização de assinaturas |

Convenções em `apps/web/src/lib/api`: `withHandler` (tratamento de erros), `requireUser` / `requireMembership(orgId, minRole)` (auth + tenant), `parseBody` (zod).

## Checks
```bash
npm run check:conflicts       # bloqueia marcadores/restos de conflito
npm run test:critical-flows   # garante controles críticos de auth/billing/limites
npm run typecheck
npm run build
```
O CI (`.github/workflows/ci.yml`) roda todos os checks acima.
