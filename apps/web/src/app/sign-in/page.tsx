import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const session = await auth();
  if (session?.user) redirect(searchParams.callbackUrl ?? "/dashboard");

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "4rem" }}>
      <div className="card stack">
        <h1>Entrar no TaskFlow</h1>
        <p className="muted">Use sua conta Google para continuar.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: searchParams.callbackUrl ?? "/dashboard" });
          }}
        >
          <button type="submit" className="btn-primary" style={{ width: "100%" }}>Continuar com Google</button>
        </form>
      </div>
    </main>
  );
}
