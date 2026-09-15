import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="container" style={{ maxWidth: 720, paddingTop: "4rem" }}>
      <h1 style={{ fontSize: "2.25rem" }}>TaskFlow</h1>
      <p className="muted" style={{ fontSize: "1.1rem" }}>
        Gestão de tarefas e projetos para times, com organizações multi-tenant, controle de acesso por papel e planos com limites de uso.
      </p>
      <div className="row" style={{ marginTop: "1.5rem" }}>
        <Link href="/sign-in" className="btn btn-primary">Entrar</Link>
      </div>
    </main>
  );
}
