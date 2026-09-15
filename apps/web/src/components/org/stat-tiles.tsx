"use client";

import { ListTodo, Loader, CheckCircle2, AlertTriangle } from "lucide-react";
import CountUp from "@/components/reactbits/CountUp/CountUp";

const ICONS = { todo: ListTodo, progress: Loader, done: CheckCircle2, overdue: AlertTriangle };

export function StatTile({ icon, label, value, hint, tone }: { icon: keyof typeof ICONS; label: string; value: number; hint?: string; tone?: "primary" | "warning" | "danger" | "success" }) {
  const Icon = ICONS[icon];
  const color = tone === "danger" ? "var(--color-destructive)" : tone === "warning" ? "var(--color-warning)" : tone === "success" ? "var(--color-success)" : "var(--color-primary)";
  return (
    <div className="card card-hover stat">
      <div className="row-between"><span className="card-title">{label}</span><Icon size={18} style={{ color }} aria-hidden="true" /></div>
      <span className="stat-value" aria-label={`${label}: ${value}`}><CountUp to={value} duration={1} /></span>
      {hint && <span className="subtle text-xs">{hint}</span>}
    </div>
  );
}
