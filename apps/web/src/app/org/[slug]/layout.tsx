import { signOut } from "@/auth";
import { listUserOrganizations, requirePageOrganization } from "@/lib/ui/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const { user, organization, membership } = await requirePageOrganization(params.slug);
  const orgs = await listUserOrganizations(user.id);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <AppShell
      org={{ id: organization.id, name: organization.name, slug: organization.slug, role: membership.role }}
      orgs={orgs}
      user={{ name: user.name, email: user.email, image: user.image }}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
