import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { organizationId } = await req.json();

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org?.stripeCustomerId) return NextResponse.json({ error: "No customer" }, { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
  });

  return NextResponse.json({ url: portal.url });
}
