import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
 codex/structure-saas-product-from-scratch-0nfrvt
import { billingCheckoutSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
=======
main

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 codex/structure-saas-product-from-scratch-0nfrvt

  const rl = rateLimit(`billing-checkout:${session.user.email}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = billingCheckoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { organizationId, priceId } = parsed.data;

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, user: { email: session.user.email } },
    include: { organization: true }
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: membership.organization.stripeCustomerId ?? undefined,

  const { organizationId, priceId } = await req.json();

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: org.stripeCustomerId ?? undefined,
 main
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=1`,
    metadata: { organizationId }
  });

  return NextResponse.json({ url: checkout.url });
}
