import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
 codex/structure-saas-product-from-scratch-4sig3k
import { createOrganizationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
import { captureError, trackEvent } from "@/lib/observability";
=======

codex/structure-saas-product-from-scratch-asdxe6
import { createOrganizationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
import { captureError, trackEvent } from "@/lib/observability";
=======
 codex/structure-saas-product-from-scratch-xv9hhs
import { createOrganizationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
import { captureError, trackEvent } from "@/lib/observability";
=======
 codex/structure-saas-product-from-scratch-0nfrvt
import { createOrganizationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";

main
 main
 main
 main

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 codex/structure-saas-product-from-scratch-4sig3k
=======
 codex/structure-saas-product-from-scratch-asdxe6
=======
codex/structure-saas-product-from-scratch-xv9hhs
=======
< codex/structure-saas-product-from-scratch-0nfrvt
 main
 main
 main
  const rl = rateLimit(`org-create:${session.user.email}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = createOrganizationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { name, slug } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
  if (!freePlan) return NextResponse.json({ error: "Missing free plan" }, { status: 500 });

 codex/structure-saas-product-from-scratch-4sig3k
=======
 codex/structure-saas-product-from-scratch-asdxe6
=======
codex/structure-saas-product-from-scratch-xv9hhs
 main
main
  try {
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        ownerUserId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
        subscriptions: { create: { planId: freePlan.id, status: "ACTIVE" } },
      },
    });

    trackEvent({
      name: "organization.created",
      organizationId: org.id,
      userId: user.id,
      properties: { slug: org.slug },
    });

    return NextResponse.json({ organizationId: org.id });
  } catch (error) {
    captureError(error, { route: "POST /api/organizations" });
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
 codex/structure-saas-product-from-scratch-4sig3k
=======
 codex/structure-saas-product-from-scratch-asdxe6
=======
  const { name, slug } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

main
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      ownerUserId: user.id,
 codex/structure-saas-product-from-scratch-0nfrvt
      members: { create: { userId: user.id, role: "OWNER" } },
      subscriptions: { create: { planId: freePlan.id, status: "ACTIVE" } }

      members: { create: { userId: user.id, role: "OWNER" } }
main
    }
  });

  return NextResponse.json({ organizationId: org.id });
main
 main
main
}
