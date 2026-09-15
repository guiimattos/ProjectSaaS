import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/ui/session";
import { acceptInvitation, getInvitationByToken } from "@/lib/organizations/invitations";
import { ApiError } from "@/lib/api/errors";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const user = await requirePageUser();

  let invitation;
  try {
    invitation = await getInvitationByToken(params.token);
  } catch (error) {
    return (
      <main className="container" style={{ maxWidth: 480, paddingTop: "4rem" }}>
        <div className="card"><h1>Convite inválido</h1><p className="muted">{error instanceof ApiError ? error.message : "Não foi possível abrir este convite."}</p><Link href="/dashboard">Ir para o dashboard</Link></div>
      </main>
    );
  }

  const mismatch = invitation.email !== user.email.toLowerCase();

  return (
    <main className="container" style={{ maxWidth: 480, paddingTop: "4rem" }}>
      <div className="card stack">
        <h1>Convite para {invitation.organization.name}</h1>
        <p className="muted">
          {invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? "Alguém"} convidou <strong>{invitation.email}</strong> como {invitation.role}.
        </p>
        {mismatch ? (
          <p className="error">Você está logado como {user.email}. Entre com a conta {invitation.email} para aceitar.</p>
        ) : (
          <form action={async () => { "use server"; const org = await acceptInvitation(params.token, user); redirect(`/org/${org.slug}`); }}>
            <button type="submit" className="btn-primary">Aceitar convite</button>
          </form>
        )}
      </div>
    </main>
  );
}
