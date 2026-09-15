import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { MembersPanel } from "@/components/members-panel";

export default async function MembersPage({ params }: { params: { slug: string } }) {
  const { organization, membership, user } = await requirePageOrganization(params.slug);
  const isAdmin = membership.role !== "MEMBER";

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    isAdmin
      ? prisma.invitation.findMany({ where: { organizationId: organization.id, status: "PENDING" }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <h1>Membros</h1>
      <MembersPanel
        organizationId={organization.id}
        currentUserId={user.id}
        isAdmin={isAdmin}
        members={members.map((m) => ({ id: m.id, userId: m.user.id, name: m.user.name, email: m.user.email, role: m.role }))}
        invitations={invitations.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt.toISOString() }))}
      />
    </>
  );
}
