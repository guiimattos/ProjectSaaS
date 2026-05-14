import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueIntegrationJob } from "@/lib/jobs/queue";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`jobs-sync-notion:${session.user.email}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const title = String(body?.title ?? "TaskFlow task");

  const job = await enqueueIntegrationJob("notion.task.create", { title });
  return NextResponse.json({ ok: true, jobId: job.id });
}
