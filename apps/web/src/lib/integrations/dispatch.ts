import { prisma } from "@/lib/prisma";
import { enqueueIntegrationJob } from "@/lib/jobs/queue";
import { captureError } from "@/lib/observability";

export type SlackConfig = { webhookUrl?: string; channel?: string; notifyOn: string[] };
export type NotionConfig = { apiKey?: string; databaseId?: string; syncTasks: boolean };

/**
 * Dispara integrações configuradas pela organização para um evento de domínio.
 * Falhas de fila nunca quebram a requisição principal.
 */
export async function dispatchIntegrationEvent(organizationId: string, event: string, payload: Record<string, unknown>) {
  const integrations = await prisma.organizationIntegration.findMany({ where: { organizationId, enabled: true } });
  if (integrations.length === 0) return;

  for (const integration of integrations) {
    try {
      if (integration.provider === "SLACK") {
        const cfg = integration.configJson as SlackConfig;
        if (!cfg.notifyOn?.includes(event)) continue;
        await enqueueIntegrationJob("slack.message.post", { organizationId, webhookUrl: cfg.webhookUrl, channel: cfg.channel, text: formatSlackMessage(event, payload) });
      }
      if (integration.provider === "NOTION" && event === "task.created") {
        const cfg = integration.configJson as NotionConfig;
        if (!cfg.syncTasks) continue;
        await enqueueIntegrationJob("notion.task.create", { organizationId, apiKey: cfg.apiKey, databaseId: cfg.databaseId, title: payload.title });
      }
    } catch (error) {
      captureError(error, { scope: "dispatchIntegrationEvent", organizationId, event, provider: integration.provider });
    }
  }
}

function formatSlackMessage(event: string, p: Record<string, unknown>) {
  const actor = p.actor ? `*${p.actor}*` : "Alguém";
  switch (event) {
    case "task.created":
      return `${actor} criou a tarefa *${p.title}*`;
    case "task.completed":
      return `${actor} concluiu a tarefa *${p.title}* ✅`;
    case "member.joined":
      return `${actor} entrou na organização`;
    default:
      return `${actor}: ${event}`;
  }
}
