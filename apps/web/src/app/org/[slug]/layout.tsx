import { requirePageOrganization } from "@/lib/ui/session";
import { Nav } from "@/components/nav";

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const { user, organization } = await requirePageOrganization(params.slug);
  return (
    <>
      <Nav orgSlug={organization.slug} userLabel={user.name ?? user.email} />
      <main className="container stack">{children}</main>
    </>
  );
}
