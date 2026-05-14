import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueIntegrationJob } from "@/lib/jobs/queue";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`jobs-generate-summary:${session.user.email}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const text = String(body?.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const job = await enqueueIntegrationJob("openai.summary.generate", { text, requestedBy: session.user.email });
  return NextResponse.json({ ok: true, jobId: job.id });
}
