import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createOrganizationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/security/rate-limit";
import { captureError, trackEvent } from "@/lib/observability";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`org-create:${session.user.email}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = createOrganizationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { name, slug } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
  if (!freePlan) return NextResponse.json({ error: "Missing free plan" }, { status: 500 });

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
}
