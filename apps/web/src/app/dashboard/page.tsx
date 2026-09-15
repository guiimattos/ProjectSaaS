import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/ui/session";
import { Nav } from "@/components/nav";
import { CreateOrganizationForm } from "@/components/create-organization-form";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: { include: { _count: { select: { members: true, tasks: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Nav userLabel={user.name ?? user.email} />
      <main className="container stack">
        <h1>Suas organizações</h1>
        {memberships.length === 0 && <p className="muted">Você ainda não participa de nenhuma organização. Crie a primeira abaixo.</p>}
        <div className="grid">
          {memberships.map(({ organization: org, role }) => (
            <Link key={org.id} href={`/org/${org.slug}`} className="card" style={{ color: "inherit", margin: 0 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{org.name}</strong>
                <span className="badge">{role}</span>
              </div>
              <div className="muted">{org._count.members} membro(s) · {org._count.tasks} tarefa(s)</div>
            </Link>
          ))}
        </div>
        <section className="card">
          <h2>Nova organização</h2>
          <CreateOrganizationForm />
        </section>
      </main>
    </>
  );
}
