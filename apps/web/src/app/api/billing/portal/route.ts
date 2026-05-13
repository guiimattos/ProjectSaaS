import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
 codex/structure-saas-product-from-scratch-xv9hhs
import { billingPortalSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
=======
 codex/structure-saas-product-from-scratch-0nfrvt
import { billingPortalSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";

 main

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
codex/structure-saas-product-from-scratch-0nfrvt
 main

  const rl = rateLimit(`billing-portal:${session.user.email}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = billingPortalSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { organizationId } = parsed.data;

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, user: { email: session.user.email } },
    include: { organization: true }
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!membership.organization.stripeCustomerId) {
    return NextResponse.json({ error: "No customer" }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: membership.organization.stripeCustomerId,
 codex/structure-saas-product-from-scratch-xv9hhs
=======

  const { organizationId } = await req.json();

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org?.stripeCustomerId) return NextResponse.json({ error: "No customer" }, { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
main
 main
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
  });

  return NextResponse.json({ url: portal.url });
}
