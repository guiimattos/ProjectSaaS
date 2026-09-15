import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/ui/logo";
import { DEV_USER, devLogin, devLoginEnabled } from "@/lib/dev-login";

const AuroraBg = dynamic(() => import("@/components/landing/aurora-bg"), { ssr: false });

export const metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: { searchParams: { callbackUrl?: string; error?: string } }) {
  const session = await auth();
  if (session?.user) redirect(searchParams.callbackUrl ?? "/dashboard");

  return (
    <main className="auth-page">
      <AuroraBg />
      <div className="card-glass auth-card stack">
        <Logo />
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Bem-vindo de volta</h1>
          <p className="muted mt-2">Entre com sua conta Google para acessar seus workspaces.</p>
        </div>
        {searchParams.error && <p className="error-text" role="alert">Não foi possível entrar. Tente novamente.</p>}
        <form action={async () => { "use server"; await signIn("google", { redirectTo: searchParams.callbackUrl ?? "/dashboard" }); }}>
          <button type="submit" className="btn btn-primary btn-lg btn-block">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.4-1.6 4.1-5.35 4.1-3.2 0-5.85-2.65-5.85-5.9S8.8 6.3 12 6.3c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 3.85 14.55 3 12 3 7.05 3 3 7.05 3 12s4.05 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.3-1.1z"/></svg>
            Continuar com Google
          </button>
        </form>
        {devLoginEnabled() && (
          <form action={devLogin} className="stack-sm" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-block">Entrar como usuário de teste</button>
            <p className="subtle text-xs" style={{ textAlign: "center" }}>Somente em desenvolvimento · {DEV_USER.email}</p>
          </form>
        )}
        <p className="subtle text-xs" style={{ textAlign: "center" }}>Ao continuar você concorda com os termos de uso e a política de privacidade.</p>
      </div>
    </main>
  );
}
