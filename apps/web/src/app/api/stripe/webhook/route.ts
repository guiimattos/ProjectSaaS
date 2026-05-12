import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const exists = await prisma.processedStripeEvent.findUnique({ where: { stripeEventId: event.id } });
  if (exists) return NextResponse.json({ received: true });

  if (event.type.startsWith("customer.subscription")) {
    const sub = event.data.object as Stripe.Subscription;
    const org = await prisma.organization.findFirst({ where: { stripeCustomerId: String(sub.customer) } });
    if (org) {
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        create: {
          organizationId: org.id,
          planId: "REPLACE_PLAN_ID",
          status: "ACTIVE",
          stripeSubscriptionId: sub.id,
          stripeCustomerId: String(sub.customer)
        },
        update: {
          status: sub.status === "active" ? "ACTIVE" : "PAST_DUE"
        }
      });
    }
  }

  await prisma.processedStripeEvent.create({
    data: { stripeEventId: event.id, eventType: event.type }
  });

  return NextResponse.json({ received: true });
}
