import { createIntegrationWorker } from "@/lib/jobs/queue";
import { createNotionTask } from "@/lib/integrations/notion";
import { postSlackMessage } from "@/lib/integrations/slack";
import { summarizeText } from "@/lib/integrations/openai";
import { createGithubIssue } from "@/lib/integrations/github";

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

  if (name === "openai.summary.generate") {
    const text = String(data.text ?? "");
    if (!text) return;

    const summary = await summarizeText(text);
    console.info("[ai-summary]", summary);
  }

  if (name === "github.issue.create") {
    const owner = String(data.owner ?? "");
    const repo = String(data.repo ?? "");
    const title = String(data.title ?? "");
    const body = String(data.body ?? "");

    if (!owner || !repo || !title) return;

    const issue = await createGithubIssue({ owner, repo, title, body });
    console.info("[github-issue]", issue?.html_url ?? "created");
  }
});


// Growth: AI summaries
