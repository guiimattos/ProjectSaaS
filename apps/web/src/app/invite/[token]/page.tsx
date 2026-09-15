import Link from "next/link";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Building2, AlertTriangle } from "lucide-react";
import { requirePageUser } from "@/lib/ui/session";
import { acceptInvitation, getInvitationByToken } from "@/lib/organizations/invitations";
import { ApiError } from "@/lib/api/errors";
import { Logo } from "@/components/ui/logo";
import { ROLE_LABEL } from "@/components/ui/primitives";

const AuroraBg = dynamic(() => import("@/components/landing/aurora-bg"), { ssr: false });
export const metadata = { title: "Convite" };

export default async function InvitePage({ params }: { params: { token: string } }) {
  const user = await requirePageUser();

  let invitation;
  try { invitation = await getInvitationByToken(params.token); }
  catch (error) {
    return (
      <main className="auth-page"><AuroraBg />
        <div className="card-glass auth-card stack"><Logo /><div className="empty-icon" style={{ margin: 0 }}><AlertTriangle aria-hidden="true" /></div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Convite inválido</h1><p className="muted">{error instanceof ApiError ? error.message : "Não foi possível abrir este convite."}</p>
          <Link href="/dashboard" className="btn">Ir para o dashboard</Link></div>
      </main>
    );
  }

  const mismatch = invitation.email !== user.email.toLowerCase();
  return (
    <main className="auth-page"><AuroraBg />
      <div className="card-glass auth-card stack">
        <Logo />
        <div className="feature-icon" style={{ margin: 0 }}><Building2 aria-hidden="true" /></div>
        <div><h1 style={{ fontSize: "var(--text-2xl)" }}>Junte-se a {invitation.organization.name}</h1>
          <p className="muted mt-2">{invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? "Alguém"} convidou <strong>{invitation.email}</strong> como {ROLE_LABEL[invitation.role]}.</p></div>
        {mismatch ? (
          <p className="error-text" role="alert">Você está logado como {user.email}. Entre com a conta {invitation.email} para aceitar.</p>
        ) : (
          <form action={async () => { "use server"; const org = await acceptInvitation(params.token, user); redirect(`/org/${org.slug}`); }}>
            <button type="submit" className="btn btn-primary btn-lg btn-block">Aceitar convite</button>
          </form>
        )}
        <Link href="/dashboard" className="btn btn-ghost btn-block">Agora não</Link>
      </div>
    </main>
  );
}
