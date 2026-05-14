import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { billingCheckoutSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
import { captureError, trackEvent } from "@/lib/observability";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`billing-checkout:${session.user.email}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = billingCheckoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { organizationId, priceId } = parsed.data;

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { organizationId, user: { email: session.user.email } },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: membership.organization.stripeCustomerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=1`,
      metadata: { organizationId },
    });

    trackEvent({
      name: "billing.checkout.created",
      organizationId,
      properties: { checkoutSessionId: checkout.id },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    captureError(error, { route: "POST /api/billing/checkout", organizationId });
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
