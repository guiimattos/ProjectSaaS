import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { listUserOrganizations, requirePageUser } from "@/lib/ui/session";

/** Ponto de entrada pós-login: vai para a última org visitada, a primeira, ou o onboarding. */
export default async function DashboardPage() {
  const user = await requirePageUser();
  const orgs = await listUserOrganizations(user.id);
  if (orgs.length === 0) redirect("/onboarding");

  const last = cookies().get("tf_last_org")?.value;
  const target = orgs.find((o) => o.slug === last) ?? orgs[0];
  redirect(`/org/${target.slug}`);
}
