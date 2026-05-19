export async function createGithubIssue(params: {
  owner: string;
  repo: string;
  title: string;
  body?: string;
}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "taskflow-app",
    },
    body: JSON.stringify({
      title: params.title,
      body: params.body ?? "Criado automaticamente pelo TaskFlow",
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub issue create failed: ${response.status}`);
  }

  return response.json();
}
