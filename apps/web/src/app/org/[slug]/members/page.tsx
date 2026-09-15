import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { getEntitlements } from "@/lib/entitlements";
import { MembersPanel } from "@/components/org/members-panel";

export const metadata = { title: "Membros" };

export default async function MembersPage({ params, searchParams }: { params: { slug: string }; searchParams: { welcome?: string } }) {
  const { organization, membership, user } = await requirePageOrganization(params.slug);
  const isAdmin = membership.role !== "MEMBER";

  const [members, invitations, entitlements] = await Promise.all([
    prisma.organizationMember.findMany({ where: { organizationId: organization.id }, include: { user: { select: { id: true, name: true, email: true, image: true } } }, orderBy: { createdAt: "asc" } }),
    isAdmin ? prisma.invitation.findMany({ where: { organizationId: organization.id, status: "PENDING" }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    getEntitlements(organization.id),
  ]);

  return (
    <>
      <div className="page-header"><div><h1>Membros</h1><p>{members.length} pessoa(s) em {organization.name}.</p></div></div>
      <MembersPanel organizationId={organization.id} currentUserId={user.id} isAdmin={isAdmin} limit={entitlements.limits.maxMembers} welcome={searchParams.welcome === "1"}
        members={members.map((m) => ({ id: m.id, userId: m.user.id, name: m.user.name, email: m.user.email, image: m.user.image, role: m.role, createdAt: m.createdAt.toISOString() }))}
        invitations={invitations.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt.toISOString() }))} />
    </>
  );
}
