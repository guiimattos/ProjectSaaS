import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      ownerUserId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } }
    }
  });

  return NextResponse.json({ organizationId: org.id });
}
