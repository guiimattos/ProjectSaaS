import { Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { Avatar, EmptyState, timeAgo } from "@/components/ui/primitives";
import { describeActivity } from "@/lib/ui/activity";

export const metadata = { title: "Atividade" };

export default async function ActivityPage({ params }: { params: { slug: string } }) {
  const { organization } = await requirePageOrganization(params.slug);
  const logs = await prisma.auditLog.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { name: true, email: true, image: true } } } });

  const days = new Map<string, typeof logs>();
  for (const l of logs) { const k = l.createdAt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); days.set(k, [...(days.get(k) ?? []), l]); }

  return (
    <>
      <div className="page-header"><div><h1>Atividade</h1><p>Trilha de auditoria de tudo que acontece em {organization.name}.</p></div></div>
      {logs.length === 0 && <div className="card"><EmptyState icon={Activity} title="Sem atividade ainda" description="Ações do time aparecerão aqui." /></div>}
      <div className="stack">
        {[...days.entries()].map(([day, items]) => (
          <section key={day} className="card">
            <h2 className="card-title mb-2" style={{ textTransform: "capitalize" }}>{day}</h2>
            {items.map((a) => (
              <div key={a.id} className="list-item" style={{ alignItems: "flex-start" }}>
                <Avatar name={a.actor?.name} email={a.actor?.email} image={a.actor?.image} size="sm" />
                <div className="flex-1 text-sm wrap-any">
                  <span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "Sistema"}</span> <span className="muted">{describeActivity(a.action)}</span>
                  {a.metadataJson && <code className="subtle text-xs" style={{ display: "block", marginTop: 2 }}>{JSON.stringify(a.metadataJson)}</code>}
                </div>
                <time className="subtle text-xs" dateTime={a.createdAt.toISOString()}>{timeAgo(a.createdAt)}</time>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
