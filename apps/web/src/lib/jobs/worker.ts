import { createIntegrationWorker } from "@/lib/jobs/queue";
import { createNotionTask } from "@/lib/integrations/notion";
import { postSlackMessage } from "@/lib/integrations/slack";

export const worker = createIntegrationWorker(async (name, data) => {
  if (name === "notion.task.create") {
    const title = String(data.title ?? "TaskFlow task");
    await createNotionTask(title);
  }

  if (name === "slack.message.post") {
    const channel = String(data.channel ?? "");
    const text = String(data.text ?? "TaskFlow notification");
    if (channel) await postSlackMessage(channel, text);
  }
});
