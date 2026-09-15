import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

/** Garante que a organização tenha um Customer no Stripe e persiste o id. */
export async function ensureStripeCustomer(org: { id: string; name: string; stripeCustomerId: string | null }, email: string) {
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const { prisma } = await import("@/lib/prisma");
  const customer = await stripe.customers.create({
    name: org.name,
    email,
    metadata: { organizationId: org.id },
  });
  await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}
