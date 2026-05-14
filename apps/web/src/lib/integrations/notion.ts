export async function createNotionTask(title: string) {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DB_ID) return { skipped: true };

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`
    },
    body: JSON.stringify({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: title } }] }
      }
    })
  });

  return response.json();
}
