import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertIntegrationSchema } from "@/lib/validators";
import { requireMembership } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { writeAuditLog } from "@/lib/billing";

type P = { organizationId: string };

/** Mascara segredos ao devolver a config para a UI. */
function mask(config: Record<string, unknown>) {
  const out = { ...config };
  for (const key of ["apiKey", "webhookUrl"]) {
    const v = out[key];
    if (typeof v === "string" && v.length > 8) out[key] = `${v.slice(0, 6)}…${v.slice(-4)}`;
  }
  return out;
}

export const GET = withHandler<P>("GET /api/organizations/:id/integrations", async (_req, { params }) => {
  await requireMembership(params.organizationId, "ADMIN");
  const rows = await prisma.organizationIntegration.findMany({ where: { organizationId: params.organizationId } });
  return json({ integrations: rows.map((r) => ({ provider: r.provider, enabled: r.enabled, config: mask(r.configJson as Record<string, unknown>), updatedAt: r.updatedAt })) });
});

export const PUT = withHandler<P>("PUT /api/organizations/:id/integrations", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  const input = await parseBody(req, upsertIntegrationSchema);

  // Campos secretos vazios preservam o valor já salvo (a UI recebe versão mascarada).
  const existing = await prisma.organizationIntegration.findUnique({ where: { organizationId_provider: { organizationId: params.organizationId, provider: input.provider } } });
  const prev = (existing?.configJson ?? {}) as Record<string, unknown>;
  const config: Record<string, string | boolean | string[] | undefined> = { ...input.config };
  for (const key of ["apiKey", "webhookUrl"]) {
    if (!config[key] || String(config[key]).includes("…")) config[key] = typeof prev[key] === "string" ? (prev[key] as string) : undefined;
  }

  const row = await prisma.organizationIntegration.upsert({
    where: { organizationId_provider: { organizationId: params.organizationId, provider: input.provider } },
    create: { organizationId: params.organizationId, provider: input.provider, enabled: input.enabled, configJson: config as Prisma.InputJsonObject },
    update: { enabled: input.enabled, configJson: config as Prisma.InputJsonObject },
  });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "integration.updated", resourceType: "integration", resourceId: row.id, metadataJson: { provider: input.provider, enabled: input.enabled } });
  return json({ integration: { provider: row.provider, enabled: row.enabled, config: mask(config) } });
});

export const DELETE = withHandler<P>("DELETE /api/organizations/:id/integrations", async (req, { params }) => {
  const { user } = await requireMembership(params.organizationId, "ADMIN");
  const provider = new URL(req.url).searchParams.get("provider");
  if (provider !== "SLACK" && provider !== "NOTION") return json({ error: "provider inválido" }, { status: 400 });
  await prisma.organizationIntegration.deleteMany({ where: { organizationId: params.organizationId, provider } });
  await writeAuditLog({ organizationId: params.organizationId, actorUserId: user.id, action: "integration.removed", resourceType: "integration", metadataJson: { provider } });
  return json({ ok: true });
});
