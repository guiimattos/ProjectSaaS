import { LucideIcon } from "lucide-react";

export function Avatar({ name, email, image, size }: { name?: string | null; email?: string; image?: string | null; size?: "sm" | "lg" }) {
  const label = name ?? email ?? "?";
  const initials = label.split(/\s+|@/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <span className={`avatar ${size ? `avatar-${size}` : ""}`} title={label} aria-label={label}>
      {image ? <img src={image} alt="" /> : initials}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={26} aria-hidden="true" /></div>
      <h3>{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
      {action && <div className="mt-4 row" style={{ justifyContent: "center" }}>{action}</div>}
    </div>
  );
}

export function Field({ label, htmlFor, required, help, error, children }: { label: string; htmlFor: string; required?: boolean; help?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>
      {children}
      {error ? <span className="error-text" id={`${htmlFor}-error`} role="alert">{error}</span> : help ? <span className="help" id={`${htmlFor}-help`}>{help}</span> : null}
    </div>
  );
}

export const STATUS_LABEL: Record<string, string> = { TODO: "A fazer", IN_PROGRESS: "Em andamento", DONE: "Concluída", ARCHIVED: "Arquivada" };
export const PRIORITY_LABEL: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" };
export const ROLE_LABEL: Record<string, string> = { OWNER: "Proprietário", ADMIN: "Admin", MEMBER: "Membro" };

export function StatusBadge({ status }: { status: string }) {
  const cls = status === "DONE" ? "badge-success" : status === "IN_PROGRESS" ? "badge-warning" : status === "ARCHIVED" ? "" : "badge-primary";
  return <span className={`badge ${cls}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === "URGENT" ? "badge-danger" : priority === "HIGH" ? "badge-accent" : priority === "LOW" ? "" : "badge-primary";
  return <span className={`badge ${cls}`}>{PRIORITY_LABEL[priority] ?? priority}</span>;
}

export function formatDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", opts);
}

export function timeAgo(d: string | Date) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return formatDate(d);
}
