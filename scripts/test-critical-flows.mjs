import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'apps/web/src/app/api/stripe/webhook/route.ts',
    mustInclude: ['stripe.webhooks.constructEvent', 'processedStripeEvent.findUnique', 'processedStripeEvent.create'],
    label: 'Webhook Stripe tem validação de assinatura + idempotência',
  },
  {
    file: 'apps/web/src/app/api/billing/checkout/route.ts',
    mustInclude: ['auth()', 'stripe.checkout.sessions.create', 'organizationMember.findFirst'],
    label: 'Checkout exige auth e membership do tenant',
  },
  {
    file: 'apps/web/src/app/api/organizations/route.ts',
    mustInclude: ['auth()', 'rateLimit(', 'createOrganizationSchema.safeParse'],
    label: 'Criação de organização com auth, rate limit e validação',
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

if (failures > 0) {
  process.exit(1);
}
