import { stripe } from "@/lib/stripe";
import { billingPortalSchema } from "@/lib/validators";
import { trackEvent } from "@/lib/observability";
import { enforceRateLimit, requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api/errors";

export const POST = withHandler("POST /api/billing/portal", async (req) => {
  const { organizationId } = await parseBody(req, billingPortalSchema);
  const { user, organization } = await requireMembership(organizationId, "ADMIN");
  enforceRateLimit(`billing-portal:${user.id}`, 30);

  if (!organization.stripeCustomerId) throw badRequest("Organização ainda não possui assinatura paga");

  const portal = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/billing`,
  });

  trackEvent({ name: "billing.portal.created", organizationId, userId: user.id });
  return json({ url: portal.url });
});
