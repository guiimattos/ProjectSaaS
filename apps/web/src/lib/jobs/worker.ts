import { createIntegrationWorker } from "@/lib/jobs/queue";
import { createNotionTask } from "@/lib/integrations/notion";
import { postSlackMessage } from "@/lib/integrations/slack";

export const worker = createIntegrationWorker(async (name, data) => {
  if (name === "notion.task.create") {
    await createNotionTask({
      title: String(data.title ?? "TaskFlow task"),
      apiKey: data.apiKey ? String(data.apiKey) : undefined,
      databaseId: data.databaseId ? String(data.databaseId) : undefined,
    });
  }

  if (name === "slack.message.post") {
    await postSlackMessage({
      webhookUrl: data.webhookUrl ? String(data.webhookUrl) : undefined,
      channel: data.channel ? String(data.channel) : undefined,
      text: String(data.text ?? "TaskFlow notification"),
    });
  }
});
