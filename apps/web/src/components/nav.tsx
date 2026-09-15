import Link from "next/link";
import { signOut } from "@/auth";

export function Nav({ orgSlug, userLabel }: { orgSlug?: string; userLabel?: string | null }) {
  return (
    <header className="nav">
      <div className="nav-links">
        <Link href="/dashboard" className="brand">TaskFlow</Link>
        {orgSlug && (
          <>
            <Link href={`/org/${orgSlug}`}>Tarefas</Link>
            <Link href={`/org/${orgSlug}/members`}>Membros</Link>
            <Link href={`/org/${orgSlug}/billing`}>Plano</Link>
          </>
        )}
      </div>
      <div className="row">
        {userLabel && <span className="muted">{userLabel}</span>}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button type="submit" className="btn-sm">Sair</button>
        </form>
      </div>
    </header>
  );
}
