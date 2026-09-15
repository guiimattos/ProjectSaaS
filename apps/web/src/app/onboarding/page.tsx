import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { listUserOrganizations, requirePageUser } from "@/lib/ui/session";
import { Logo } from "@/components/ui/logo";
import { OnboardingForm } from "@/components/org/onboarding-form";

const AuroraBg = dynamic(() => import("@/components/landing/aurora-bg"), { ssr: false });
export const metadata = { title: "Criar organização" };

export default async function OnboardingPage({ searchParams }: { searchParams: { new?: string } }) {
  const user = await requirePageUser();
  const orgs = await listUserOrganizations(user.id);
  if (orgs.length > 0 && !searchParams.new) redirect(`/org/${orgs[0].slug}`);

  return (
    <main className="auth-page">
      <AuroraBg />
      <div className="card-glass auth-card stack" style={{ maxWidth: 480 }}>
        <Logo />
        <div className="onboarding-steps" aria-hidden="true"><span className="active" /><span /></div>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>{orgs.length ? "Nova organização" : `Olá, ${user.name?.split(" ")[0] ?? "bem-vindo"}!`}</h1>
          <p className="muted mt-2">{orgs.length ? "Crie mais um workspace isolado para outro time ou cliente." : "Crie sua primeira organização. Você poderá convidar o time em seguida."}</p>
        </div>
        <OnboardingForm hasOrgs={orgs.length > 0} />
      </div>
    </main>
  );
}
