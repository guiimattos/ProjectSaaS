import { captureError } from "@/lib/observability";

/**
 * Envio de e-mail via Resend (HTTP). Sem RESEND_API_KEY, apenas loga — útil em dev.
 */
export async function sendEmail(input: { to: string; subject: string; html: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "TaskFlow <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email:skipped]", input.to, input.subject);
    return { skipped: true as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return { skipped: false as const, id: ((await res.json()) as { id: string }).id };
  } catch (error) {
    captureError(error, { scope: "sendEmail", to: input.to });
    return { skipped: false as const, error: true };
  }
}

export function invitationEmail(input: { organization: string; inviter: string; role: string; acceptUrl: string }) {
  const subject = `${input.inviter} convidou você para ${input.organization} no TaskFlow`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#1e293b">
      <h1 style="font-size:20px;margin:0 0 16px">Você foi convidado(a) para <strong>${input.organization}</strong></h1>
      <p style="line-height:1.6">${input.inviter} convidou você para participar como <strong>${input.role}</strong>.</p>
      <p style="margin:24px 0"><a href="${input.acceptUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Aceitar convite</a></p>
      <p style="color:#64748b;font-size:13px">Este convite expira em 7 dias. Se você não esperava este e-mail, pode ignorá-lo.</p>
    </div>`;
  const text = `${input.inviter} convidou você para ${input.organization} como ${input.role}. Aceite em: ${input.acceptUrl}`;
  return { subject, html, text };
}
