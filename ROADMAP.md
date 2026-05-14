# Roadmap de execução

## MVP (4 semanas)
- [x] Base monorepo com Next.js App Router
- [x] Auth inicial com NextAuth + Prisma Adapter
- [x] Organização multi-tenant básica
- [x] Billing: checkout, portal, webhook e persistência
- [x] Modelagem de dados principal

## Beta (8 semanas)
- [x] Seed de planos para ambiente
- [x] Camada de billing helper (usage/audit)
- [x] Integrações iniciais Slack/Notion (SDK via HTTP)
- [x] Jobs com BullMQ (queue + worker base + endpoint de enqueue)

## Launch (12 semanas)
- [~] Observabilidade completa (camada local pronta; providers reais pendentes)
- [~] Hardening de segurança (rate limit + RLS SQL baseline; ativação no banco pendente)
- [~] Testes automatizados de fluxos críticos (suite estática inicial adicionada)

## Growth
- [ ] SSO/SAML
- [ ] IA e recomendações
- [ ] expansão de integrações
