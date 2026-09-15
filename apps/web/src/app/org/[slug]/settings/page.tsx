import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { SettingsPanel } from "@/components/org/settings-panel";

export const metadata = { title: "Configurações" };

function mask(config: Record<string, unknown>) {
  const out = { ...config };
  for (const key of ["apiKey", "webhookUrl"]) { const v = out[key]; if (typeof v === "string" && v.length > 8) out[key] = `${v.slice(0, 6)}…${v.slice(-4)}`; }
  return out;
}

export default async function SettingsPage({ params }: { params: { slug: string } }) {
  const { organization, membership } = await requirePageOrganization(params.slug, "ADMIN");
  const integrations = await prisma.organizationIntegration.findMany({ where: { organizationId: organization.id } });

  return (
    <>
      <div className="page-header"><div><h1>Configurações</h1><p>Identidade, integrações e administração de {organization.name}.</p></div></div>
      <SettingsPanel organization={{ id: organization.id, name: organization.name, slug: organization.slug }} isOwner={membership.role === "OWNER"}
        integrations={integrations.map((i) => ({ provider: i.provider, enabled: i.enabled, config: mask(i.configJson as Record<string, unknown>) }))} />
    </>
  );
}
