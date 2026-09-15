import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SubscriptionStatus } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { captureError, trackEvent } from "@/lib/observability";
import { writeAuditLog } from "@/lib/billing";

export const runtime = "nodejs";

function toStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}

async function findOrganization(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const byCustomer = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
  if (byCustomer) return byCustomer;

  // Fallback: metadata gravada no checkout (cobre customer criado fora do app).
  const orgId = sub.metadata?.organizationId;
  if (!orgId) return null;
  return prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } }).catch(() => null);
}

/** Sincronização determinística: o estado do Stripe é a fonte da verdade. */
async function syncSubscription(sub: Stripe.Subscription) {
  const org = await findOrganization(sub);
  const stripePriceId = sub.items.data[0]?.price.id;
  if (!org || !stripePriceId) return;

  const plan = await prisma.plan.findUnique({ where: { stripePriceId } });
  if (!plan) {
    captureError(new Error(`Plano não mapeado para price ${stripePriceId}`), { organizationId: org.id });
    return;
  }

  const status = toStatus(sub.status);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const data = {
    planId: plan.id,
    status,
    stripeCustomerId: customerId,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: { organizationId: org.id, stripeSubscriptionId: sub.id, ...data },
      update: data,
    });

    // Enquanto há assinatura paga ativa, a assinatura free interna fica cancelada (e vice-versa).
    const freePlan = await tx.plan.findUnique({ where: { code: "free" } });
    if (freePlan && freePlan.id !== plan.id) {
      const paidIsActive = status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
      await tx.subscription.updateMany({
        where: { organizationId: org.id, planId: freePlan.id, stripeSubscriptionId: null },
        data: { status: paidIsActive ? "CANCELED" : "ACTIVE" },
      });
    }
  });

  await writeAuditLog({
    organizationId: org.id,
    action: "subscription.synced",
    resourceType: "subscription",
    resourceId: sub.id,
    metadataJson: { status, plan: plan.code },
  });
  trackEvent({ name: "billing.subscription.synced", organizationId: org.id, properties: { status, plan: plan.code } });
}

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature" }, { status: 400 });
  }

  // Idempotência: cada evento Stripe é processado no máximo uma vez.
  const exists = await prisma.processedStripeEvent.findUnique({ where: { stripeEventId: event.id } });
  if (exists) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId ?? session.client_reference_id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (orgId && customerId) {
          await prisma.organization.updateMany({ where: { id: orgId, stripeCustomerId: null }, data: { stripeCustomerId: customerId } });
        }
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (subId) await syncSubscription(await stripe.subscriptions.retrieve(subId));
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subId) await syncSubscription(await stripe.subscriptions.retrieve(subId));
        break;
      }
      default:
        break;
    }
  } catch (error) {
    captureError(error, { route: "POST /api/stripe/webhook", eventType: event.type, eventId: event.id });
    // 500 faz o Stripe reenviar; o evento ainda não foi marcado como processado.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  await prisma.processedStripeEvent.create({ data: { stripeEventId: event.id, eventType: event.type } });
  return NextResponse.json({ received: true });
}
