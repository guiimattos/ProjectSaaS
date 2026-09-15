import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, tooMany } from "@/lib/api/errors";
import { rateLimitAsync } from "@/lib/security/rate-limit";

const ROLE_RANK: Record<Role, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

/** Usuário autenticado (registro do banco). Lança 401 se não houver sessão. */
export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw unauthorized();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized();
  return user;
}

/** Usuário + membership na organização, exigindo papel mínimo. Lança 403 se não pertencer. */
export async function requireMembership(organizationId: string, minRole: Role = "MEMBER") {
  const user = await requireUser();
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    include: { organization: true },
  });
  if (!membership) throw forbidden();
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) throw forbidden("Insufficient role");
  return { user, membership, organization: membership.organization };
}

export async function enforceRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const rl = await rateLimitAsync(key, limit, windowMs);
  if (!rl.ok) throw tooMany();
}
