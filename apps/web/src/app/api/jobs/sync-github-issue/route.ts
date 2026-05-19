import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueIntegrationJob } from "@/lib/jobs/queue";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`jobs-sync-github:${session.user.email}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const owner = String(body?.owner ?? "").trim();
  const repo = String(body?.repo ?? "").trim();
  const title = String(body?.title ?? "").trim();
  const issueBody = String(body?.body ?? "").trim();

  if (!owner || !repo || !title) {
    return NextResponse.json({ error: "owner, repo and title are required" }, { status: 400 });
  }

  const job = await enqueueIntegrationJob("github.issue.create", {
    owner,
    repo,
    title,
    body: issueBody || undefined,
    requestedBy: session.user.email,
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}
