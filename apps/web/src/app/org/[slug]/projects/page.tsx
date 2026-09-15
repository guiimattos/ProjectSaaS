import { prisma } from "@/lib/prisma";
import { requirePageOrganization } from "@/lib/ui/session";
import { ProjectsPanel } from "@/components/org/projects-panel";

export const metadata = { title: "Projetos" };

export default async function ProjectsPage({ params }: { params: { slug: string } }) {
  const { organization, membership } = await requirePageOrganization(params.slug);
  const [projects, doneCounts] = await Promise.all([
    prisma.project.findMany({ where: { organizationId: organization.id }, include: { _count: { select: { tasks: true } } }, orderBy: [{ archivedAt: "asc" }, { createdAt: "asc" }] }),
    prisma.task.groupBy({ by: ["projectId"], where: { organizationId: organization.id, status: "DONE", projectId: { not: null } }, _count: { _all: true } }),
  ]);
  const done = Object.fromEntries(doneCounts.map((d) => [d.projectId, d._count._all]));

  return (
    <>
      <div className="page-header"><div><h1>Projetos</h1><p>Agrupe tarefas por iniciativa e acompanhe o progresso.</p></div></div>
      <ProjectsPanel organizationId={organization.id} slug={organization.slug} isAdmin={membership.role !== "MEMBER"}
        projects={projects.map((p) => ({ id: p.id, name: p.name, description: p.description, color: p.color, archivedAt: p.archivedAt?.toISOString() ?? null, _count: p._count, done: done[p.id] ?? 0 }))} />
    </>
  );
}
