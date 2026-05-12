import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { code: "free" },
    update: {},
    create: {
      code: "free",
      name: "Free",
      featuresJson: { advancedAnalytics: false, auditExport: false }
    }
  });

  await prisma.plan.upsert({
    where: { code: "pro" },
    update: { stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY },
    create: {
      code: "pro",
      name: "Pro",
      stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
      featuresJson: { advancedAnalytics: true, auditExport: true }
    }
  });

  await prisma.plan.upsert({
    where: { code: "enterprise" },
    update: { stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY },
    create: {
      code: "enterprise",
      name: "Enterprise",
      stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      featuresJson: { advancedAnalytics: true, auditExport: true }
    }
  });
}

main().finally(() => prisma.$disconnect());
