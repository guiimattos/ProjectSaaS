/** Cria página numa database do Notion. Credenciais por tenant com fallback para env global. */
export async function createNotionTask(input: { title: string; apiKey?: string; databaseId?: string }) {
  const apiKey = input.apiKey ?? process.env.NOTION_API_KEY;
  const databaseId = input.databaseId ?? process.env.NOTION_DB_ID;
  if (!apiKey || !databaseId) return { skipped: true };

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Notion-Version": "2022-06-28", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties: { Name: { title: [{ text: { content: input.title } }] } } }),
  });
  return response.json();
}
