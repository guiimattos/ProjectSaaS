import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listUserOrganizations, requirePageUser } from "@/lib/ui/session";
import { Logo } from "@/components/ui/logo";
import { AccountForm } from "@/components/org/account-form";
import { Avatar, ROLE_LABEL } from "@/components/ui/primitives";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requirePageUser();
  const orgs = await listUserOrganizations(user.id);
  return (
    <main className="container stack" style={{ paddingBlock: "var(--space-8)", maxWidth: 720 }}>
      <div className="row-between"><Logo href="/dashboard" /><Link href="/dashboard" className="btn btn-ghost"><ArrowLeft size={16} aria-hidden="true" /> Voltar</Link></div>
      <div className="page-header"><div><h1>Minha conta</h1><p>Dados do seu perfil e organizações.</p></div></div>
      <section className="card row" style={{ gap: 16 }}>
        <Avatar name={user.name} email={user.email} image={user.image} size="lg" />
        <div className="flex-1"><AccountForm name={user.name ?? ""} email={user.email} /></div>
      </section>
      <section className="card">
        <h2 className="card-title mb-2">Organizações</h2>
        {orgs.map((o) => <Link key={o.id} href={`/org/${o.slug}`} className="list-item" style={{ color: "inherit" }}><span className="avatar" style={{ borderRadius: 8 }}>{o.name.slice(0, 2).toUpperCase()}</span><span className="flex-1 font-medium">{o.name}</span><span className="badge">{ROLE_LABEL[o.role]}</span></Link>)}
      </section>
    </main>
  );
}
