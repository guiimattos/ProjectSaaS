import { ensureStripeCustomer, stripe } from "@/lib/stripe";
import { billingCheckoutSchema } from "@/lib/validators";
import { trackEvent } from "@/lib/observability";
import { enforceRateLimit, requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";

export const POST = withHandler("POST /api/billing/checkout", async (req) => {
  const { organizationId, priceId } = await parseBody(req, billingCheckoutSchema);
  const { user, organization } = await requireMembership(organizationId, "ADMIN");
  await enforceRateLimit(`billing-checkout:${user.id}`, 30);

  const customerId = await ensureStripeCustomer(organization, user.email);

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: organizationId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/billing?canceled=1`,
    metadata: { organizationId },
    subscription_data: { metadata: { organizationId } },
  });

  trackEvent({ name: "billing.checkout.created", organizationId, userId: user.id, properties: { checkoutSessionId: checkout.id } });
  return json({ url: checkout.url });
});
