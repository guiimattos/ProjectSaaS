import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toStatus(status: Stripe.Subscription.Status) {
  if (status === "trialing") return "TRIALING";
  if (status === "active") return "ACTIVE";
  if (status === "past_due") return "PAST_DUE";
 codex/structure-saas-product-from-scratch-asdxe6
  if (status === "canceled" || status === "unpaid" || status === "incomplete" || status === "incomplete_expired") return "CANCELED";
=======
 main
  return "CANCELED";
}

async function syncSubscription(sub: Stripe.Subscription) {
  const org = await prisma.organization.findFirst({ where: { stripeCustomerId: String(sub.customer) } });
  const stripePriceId = sub.items.data[0]?.price.id;
  if (!org || !stripePriceId) return;

  const plan = await prisma.plan.findFirst({ where: { stripePriceId } });
  if (!plan) return;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      organizationId: org.id,
      planId: plan.id,
      status: toStatus(sub.status),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: String(sub.customer),
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end
    },
    update: {
      planId: plan.id,
      status: toStatus(sub.status),
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end
    }
  });
}

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

codex/structure-saas-product-from-scratch-asdxe6

 codex/structure-saas-product-from-scratch-xv9hhs

codex/structure-saas-product-from-scratch-0nfrvt

codex/structure-saas-product-from-scratch-csp08h

codex/structure-saas-product-from-scratch-3pxpnl
main
main
 main
 main
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId = typeof session.subscription === "string" ? session.subscription : null;
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      break;
    }
    default:
      break;
 codex/structure-saas-product-from-scratch-asdxe6

 codex/structure-saas-product-from-scratch-xv9hhs

 codex/structure-saas-product-from-scratch-0nfrvt

 codex/structure-saas-product-from-scratch-csp08h


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
main
 main
 main
 main
 main
  }

  await prisma.processedStripeEvent.create({
    data: { stripeEventId: event.id, eventType: event.type }
  });

  return NextResponse.json({ received: true });
}
