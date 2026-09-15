import { readFileSync } from 'node:fs';

// Checks estáticos: garantem que os controles críticos não sejam removidos por acidente.
const checks = [
  {
    file: 'apps/web/src/app/api/stripe/webhook/route.ts',
    mustInclude: ['stripe.webhooks.constructEvent', 'processedStripeEvent.findUnique', 'processedStripeEvent.create'],
    label: 'Webhook Stripe tem validação de assinatura + idempotência',
  },
  {
    file: 'apps/web/src/app/api/billing/checkout/route.ts',
    mustInclude: ['requireMembership(', '"ADMIN"', 'stripe.checkout.sessions.create', 'ensureStripeCustomer('],
    label: 'Checkout exige membership ADMIN e vincula customer Stripe',
  },
  {
    file: 'apps/web/src/app/api/organizations/route.ts',
    mustInclude: ['requireUser()', 'enforceRateLimit(', 'createOrganizationSchema'],
    label: 'Criação de organização com auth, rate limit e validação',
  },
  {
    file: 'apps/web/src/lib/api/auth.ts',
    mustInclude: ['organizationMember.findUnique', 'throw forbidden', 'throw unauthorized'],
    label: 'Guard de membership rejeita não-membros e não-autenticados',
  },
  {
    file: 'apps/web/src/lib/tasks/service.ts',
    mustInclude: ['assertCanCreateTask(', 'incrementUsage(', 'organizationId'],
    label: 'Criação de tarefa respeita limite do plano e registra uso',
  },
  {
    file: 'apps/web/src/app/api/organizations/[organizationId]/invitations/route.ts',
    mustInclude: ['requireMembership(params.organizationId, "ADMIN")', 'assertCanAddMember('],
    label: 'Convites exigem ADMIN e respeitam limite de membros',
  },
  {
    file: 'apps/web/src/app/api/organizations/[organizationId]/integrations/route.ts',
    mustInclude: ['requireMembership(params.organizationId, "ADMIN")', 'mask('],
    label: 'Integrações exigem ADMIN e mascaram segredos na resposta',
  },
  {
    file: 'apps/web/src/app/api/organizations/[organizationId]/route.ts',
    mustInclude: ['requireMembership(params.organizationId, "OWNER")'],
    label: 'Exclusão de organização exige OWNER',
  },
  {
    file: 'apps/web/src/middleware.ts',
    mustInclude: ['/dashboard/:path*', '/org/:path*'],
    label: 'Middleware protege rotas autenticadas',
  },
];

let failures = 0;
for (const check of checks) {
  const content = readFileSync(check.file, 'utf8');
  const missing = check.mustInclude.filter((token) => !content.includes(token));
  if (missing.length > 0) {
    failures += 1;
    console.error(`FAIL: ${check.label}`);
    console.error(`  Arquivo: ${check.file}`);
    console.error(`  Tokens ausentes: ${missing.join(', ')}`);
  } else {
    console.log(`PASS: ${check.label}`);
  }
}

if (failures > 0) process.exit(1);
