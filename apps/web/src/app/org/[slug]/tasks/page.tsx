import { Suspense } from "react";
import { requirePageOrganization } from "@/lib/ui/session";
import { loadWorkspace } from "@/lib/ui/load-workspace";
import { TaskWorkspace } from "@/components/org/task-workspace";

export const metadata = { title: "Tarefas" };

export default async function TasksPage({ params }: { params: { slug: string } }) {
  const { organization, user } = await requirePageOrganization(params.slug);
  const data = await loadWorkspace(organization.id);
  return (
    <>
      <div className="page-header"><div><h1>Tarefas</h1><p>Todas as tarefas da organização, agrupadas por status.</p></div></div>
      <Suspense><TaskWorkspace organizationId={organization.id} currentUserId={user.id} initialTasks={data.tasks} projects={data.projects} members={data.members} view="list" /></Suspense>
    </>
  );
}
