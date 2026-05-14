export async function postSlackMessage(channel: string, text: string) {
  if (!process.env.SLACK_BOT_TOKEN) return { skipped: true };

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
    },
    body: JSON.stringify({ channel, text })
  });

  const data = await response.json();
  return data;
}
