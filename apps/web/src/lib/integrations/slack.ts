/** Envia mensagem via Incoming Webhook (por tenant) ou via bot token global (fallback). */
export async function postSlackMessage(input: { webhookUrl?: string; channel?: string; text: string }) {
  if (input.webhookUrl) {
    const res = await fetch(input.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input.text }) });
    return { ok: res.ok };
  }

  if (!process.env.SLACK_BOT_TOKEN || !input.channel) return { skipped: true };
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel: input.channel, text: input.text }),
  });
  return response.json();
}
