"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, KanbanSquare, ListChecks, FolderKanban, Users, Activity, CreditCard, Settings, ChevronsUpDown, Plus, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export type OrgSummary = { id: string; name: string; slug: string; role: string };

const NAV = [
  { href: "", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/board", label: "Quadro", icon: KanbanSquare },
  { href: "/tasks", label: "Tarefas", icon: ListChecks },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/members", label: "Membros", icon: Users },
  { href: "/activity", label: "Atividade", icon: Activity },
];
const ADMIN_NAV = [
  { href: "/billing", label: "Plano e uso", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ org, orgs, open, onClose }: { org: OrgSummary; orgs: OrgSummary[]; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const base = `/org/${org.slug}`;
  const isAdmin = org.role !== "MEMBER";

  useEffect(() => { onClose(); /* fecha ao navegar no mobile */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const link = (item: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }) => {
    const href = `${base}${item.href}`;
    const active = item.exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link key={href} href={href} className="nav-link" aria-current={active ? "page" : undefined}>
        <item.icon aria-hidden="true" /> {item.label}
      </Link>
    );
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navegação principal">
        <div className="row-between">
          <Logo href="/dashboard" />
          <button className="btn btn-ghost btn-icon only-mobile" onClick={onClose} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <OrgSwitcher current={org} orgs={orgs} />
        <nav className="stack-sm" style={{ marginTop: 8 }}>
          <div className="nav-section">Workspace</div>
          {NAV.map(link)}
          {isAdmin && <><div className="nav-section">Administração</div>{ADMIN_NAV.map(link)}</>}
        </nav>
        <div style={{ marginTop: "auto" }} className="text-xs subtle">
          <div className="row" style={{ gap: 6 }}><span className="kbd">⌘K</span> busca rápida em breve</div>
        </div>
      </aside>
    </>
  );
}

function OrgSwitcher({ current, orgs }: { current: OrgSummary; orgs: OrgSummary[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="org-switcher" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="avatar" style={{ borderRadius: 8 }}>{current.name.slice(0, 2).toUpperCase()}</span>
        <span className="flex-1 truncate">
          <span className="font-semibold text-sm truncate" style={{ display: "block" }}>{current.name}</span>
          <span className="text-xs subtle">{current.role}</span>
        </span>
        <ChevronsUpDown size={16} className="subtle" aria-hidden="true" />
      </button>
      {open && (
        <div className="popover" style={{ left: 0, right: 0, transformOrigin: "top" }} role="listbox">
          {orgs.map((o) => (
            <button key={o.id} className="menu-item" role="option" aria-selected={o.id === current.id} onClick={() => { setOpen(false); router.push(`/org/${o.slug}`); }}>
              <span className="avatar avatar-sm" style={{ borderRadius: 6 }}>{o.name.slice(0, 2).toUpperCase()}</span>
              <span className="flex-1 truncate">{o.name}</span>
              {o.id === current.id && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
          <div className="menu-sep" />
          <Link href="/onboarding?new=1" className="menu-item"><Plus size={16} aria-hidden="true" /> Nova organização</Link>
        </div>
      )}
    </div>
  );
}
