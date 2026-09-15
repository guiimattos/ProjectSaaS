import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createOrganization } from "@/lib/organizations/create";

/** Login de desenvolvimento: só existe fora de produção e com DEV_LOGIN=1. Nunca habilite em produção. */
export const devLoginEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "1";

export const DEV_USER = { email: "teste@taskflow.local", name: "Usuário Teste" };

export async function devLogin() {
  "use server";
  if (!devLoginEnabled()) throw new Error("Dev login desabilitado");

  const user = await prisma.user.upsert({
    where: { email: DEV_USER.email },
    update: {},
    create: { email: DEV_USER.email, name: DEV_USER.name, emailVerified: new Date() },
  });

  const hasOrg = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  if (!hasOrg) {
    const org = await createOrganization({ name: "Demo Corp", slug: "demo", ownerUserId: user.id }).catch(() =>
      createOrganization({ name: "Demo Corp", slug: `demo-${Date.now().toString(36)}`, ownerUserId: user.id })
    );
    const project = await prisma.project.create({ data: { organizationId: org.id, name: "Primeiro projeto", color: "#2563eb" } });
    await prisma.task.createMany({
      data: [
        { organizationId: org.id, projectId: project.id, title: "Explorar o quadro kanban", status: "TODO", priority: "HIGH", assigneeId: user.id, createdById: user.id },
        { organizationId: org.id, projectId: project.id, title: "Convidar o time", status: "IN_PROGRESS", priority: "MEDIUM", assigneeId: user.id, createdById: user.id, dueDate: new Date(Date.now() + 3 * 86_400_000) },
        { organizationId: org.id, title: "Configurar integração com Slack", status: "TODO", priority: "LOW", createdById: user.id },
        { organizationId: org.id, projectId: project.id, title: "Criar a organização", status: "DONE", priority: "MEDIUM", assigneeId: user.id, createdById: user.id, completedAt: new Date() },
      ],
    });
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86_400_000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  // Mesmo cookie que o Auth.js usa em dev (http). Em https seria __Secure-authjs.session-token.
  cookies().set("authjs.session-token", sessionToken, { path: "/", httpOnly: true, sameSite: "lax", expires });
  redirect("/dashboard");
}
