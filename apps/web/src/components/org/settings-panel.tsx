"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, MessageSquare, BookOpen, Plug } from "lucide-react";
import { Field } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/ui/api-client";

type Integration = { provider: "SLACK" | "NOTION"; enabled: boolean; config: Record<string, unknown> };
type Props = { organization: { id: string; name: string; slug: string }; isOwner: boolean; integrations: Integration[] };

const EVENTS = [
  { key: "task.created", label: "Tarefa criada" },
  { key: "task.completed", label: "Tarefa concluída" },
  { key: "task.assigned", label: "Tarefa atribuída" },
  { key: "member.joined", label: "Novo membro" },
];

export function SettingsPanel({ organization, isOwner, integrations }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const base = `/api/organizations/${organization.id}`;
  const [general, setGeneral] = useState({ name: organization.name, slug: organization.slug });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slack = integrations.find((i) => i.provider === "SLACK");
  const notion = integrations.find((i) => i.provider === "NOTION");
  const [slackForm, setSlackForm] = useState({ enabled: slack?.enabled ?? true, webhookUrl: String(slack?.config.webhookUrl ?? ""), notifyOn: (slack?.config.notifyOn as string[]) ?? ["task.created", "task.completed"] });
  const [notionForm, setNotionForm] = useState({ enabled: notion?.enabled ?? true, apiKey: String(notion?.config.apiKey ?? ""), databaseId: String(notion?.config.databaseId ?? ""), syncTasks: (notion?.config.syncTasks as boolean) ?? true });

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const { organization: o } = await api<{ organization: { slug: string } }>(base, { method: "PATCH", json: general });
      toast({ kind: "success", title: "Configurações salvas" });
      if (o.slug !== organization.slug) router.push(`/org/${o.slug}/settings`); else router.refresh();
    } catch (err) { toast({ kind: "error", title: (err as Error).message }); }
    finally { setSaving(false); }
  };

  const saveIntegration = async (body: unknown, label: string) => {
    try { await api(`${base}/integrations`, { method: "PUT", json: body }); toast({ kind: "success", title: `${label} salvo` }); router.refresh(); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); }
  };
  const removeIntegration = async (provider: string, label: string) => {
    try { await api(`${base}/integrations?provider=${provider}`, { method: "DELETE" }); toast({ kind: "success", title: `${label} desconectado` }); router.refresh(); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); }
  };

  const destroy = async () => {
    setDeleting(true);
    try { await api(base, { method: "DELETE" }); toast({ kind: "success", title: "Organização excluída" }); router.push("/dashboard"); }
    catch (err) { toast({ kind: "error", title: (err as Error).message }); setDeleting(false); }
  };

  return (
    <div className="stack-lg">
      <section className="settings-section">
        <div><h3>Geral</h3><p>Nome e endereço da organização.</p></div>
        <form onSubmit={saveGeneral} className="card stack">
          <Field label="Nome" htmlFor="st-name" required><input id="st-name" className="input" value={general.name} required onChange={(e) => setGeneral({ ...general, name: e.target.value })} /></Field>
          <Field label="Slug" htmlFor="st-slug" required help="Alterar o slug muda todas as URLs da organização."><input id="st-slug" className="input" value={general.slug} required pattern="[a-z0-9-]+" onChange={(e) => setGeneral({ ...general, slug: e.target.value })} /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} aria-hidden="true" /> {saving ? "Salvando…" : "Salvar"}</button></div>
        </form>
      </section>

      <section className="settings-section">
        <div><h3>Integrações</h3><p>Conecte ferramentas do time. Cada organização tem suas próprias credenciais.</p></div>
        <div className="stack">
          <div className="card stack">
            <div className="row-between">
              <div className="row"><span className="feature-icon" style={{ margin: 0, width: 36, height: 36 }}><MessageSquare size={18} aria-hidden="true" /></span><div><strong>Slack</strong><p className="muted text-sm">Receba eventos num canal via Incoming Webhook.</p></div></div>
              <div className="row" style={{ gap: 8 }}><span className="text-sm muted">{slackForm.enabled ? "Ativo" : "Pausado"}</span><button type="button" role="switch" aria-checked={slackForm.enabled} aria-label="Ativar Slack" className="switch" onClick={() => setSlackForm((f) => ({ ...f, enabled: !f.enabled }))} /></div>
            </div>
            <Field label="Webhook URL" htmlFor="slack-url" help={slack ? "Deixe em branco para manter a URL salva." : "Crie um Incoming Webhook em api.slack.com/apps."}>
              <input id="slack-url" className="input" type="url" placeholder="https://hooks.slack.com/services/…" value={slackForm.webhookUrl} autoComplete="off" onChange={(e) => setSlackForm({ ...slackForm, webhookUrl: e.target.value })} />
            </Field>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="label mb-2">Notificar quando</legend>
              <div className="row">{EVENTS.map((ev) => <label key={ev.key} className="chip" style={{ cursor: "pointer" }}><input type="checkbox" className="checkbox" style={{ width: 16, height: 16 }} checked={slackForm.notifyOn.includes(ev.key)} onChange={(e) => setSlackForm((f) => ({ ...f, notifyOn: e.target.checked ? [...f.notifyOn, ev.key] : f.notifyOn.filter((k) => k !== ev.key) }))} /> {ev.label}</label>)}</div>
            </fieldset>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              {slack && <button className="btn btn-ghost btn-danger" onClick={() => removeIntegration("SLACK", "Slack")}>Desconectar</button>}
              <button className="btn btn-primary" onClick={() => saveIntegration({ provider: "SLACK", enabled: slackForm.enabled, config: { webhookUrl: slackForm.webhookUrl.includes("…") ? "" : slackForm.webhookUrl, notifyOn: slackForm.notifyOn } }, "Slack")}><Plug size={16} aria-hidden="true" /> {slack ? "Atualizar" : "Conectar"}</button>
            </div>
          </div>

          <div className="card stack">
            <div className="row-between">
              <div className="row"><span className="feature-icon" style={{ margin: 0, width: 36, height: 36 }}><BookOpen size={18} aria-hidden="true" /></span><div><strong>Notion</strong><p className="muted text-sm">Espelhe novas tarefas numa database do Notion.</p></div></div>
              <div className="row" style={{ gap: 8 }}><span className="text-sm muted">{notionForm.enabled ? "Ativo" : "Pausado"}</span><button type="button" role="switch" aria-checked={notionForm.enabled} aria-label="Ativar Notion" className="switch" onClick={() => setNotionForm((f) => ({ ...f, enabled: !f.enabled }))} /></div>
            </div>
            <div className="grid grid-2">
              <Field label="Integration token" htmlFor="notion-key" help={notion ? "Em branco mantém o token salvo." : "notion.so/my-integrations"}><input id="notion-key" className="input" type="password" autoComplete="off" placeholder="secret_…" value={notionForm.apiKey} onChange={(e) => setNotionForm({ ...notionForm, apiKey: e.target.value })} /></Field>
              <Field label="Database ID" htmlFor="notion-db"><input id="notion-db" className="input" placeholder="32 caracteres" value={notionForm.databaseId} onChange={(e) => setNotionForm({ ...notionForm, databaseId: e.target.value })} /></Field>
            </div>
            <label className="chip" style={{ cursor: "pointer", alignSelf: "flex-start" }}><input type="checkbox" className="checkbox" style={{ width: 16, height: 16 }} checked={notionForm.syncTasks} onChange={(e) => setNotionForm({ ...notionForm, syncTasks: e.target.checked })} /> Criar página para cada nova tarefa</label>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              {notion && <button className="btn btn-ghost btn-danger" onClick={() => removeIntegration("NOTION", "Notion")}>Desconectar</button>}
              <button className="btn btn-primary" onClick={() => saveIntegration({ provider: "NOTION", enabled: notionForm.enabled, config: { apiKey: notionForm.apiKey.includes("…") ? "" : notionForm.apiKey, databaseId: notionForm.databaseId, syncTasks: notionForm.syncTasks } }, "Notion")}><Plug size={16} aria-hidden="true" /> {notion ? "Atualizar" : "Conectar"}</button>
            </div>
          </div>
        </div>
      </section>

      {isOwner && (
        <section className="settings-section">
          <div><h3 style={{ color: "var(--color-destructive)" }}>Zona de perigo</h3><p>Ações irreversíveis.</p></div>
          <div className="card danger-zone row-between">
            <div><strong>Excluir organização</strong><p className="muted text-sm">Remove tarefas, projetos, membros e histórico. Assinaturas ativas precisam ser canceladas antes.</p></div>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" /> Excluir</button>
          </div>
        </section>
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={destroy} loading={deleting} danger confirmLabel="Excluir permanentemente"
        title={`Excluir ${organization.name}?`} description="Esta ação não pode ser desfeita. Todos os dados desta organização serão apagados." />
    </div>
  );
}
