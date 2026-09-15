import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

/** Para uso em Server Components: redireciona para login se não autenticado. */
export async function requirePageUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/sign-in");
  return user;
}

/** Carrega organização pelo slug garantindo que o usuário é membro. */
export async function requirePageOrganization(slug: string, minRole?: Role) {
  const user = await requirePageUser();
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organization: { slug } },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard");
  if (minRole === "ADMIN" && membership.role === "MEMBER") redirect(`/org/${slug}`);
  return { user, membership, organization: membership.organization };
}
