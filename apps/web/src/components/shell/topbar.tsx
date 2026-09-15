"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, LogOut, UserCircle2, Check } from "lucide-react";
import { Avatar, timeAgo } from "@/components/ui/primitives";
import { api } from "@/lib/ui/api-client";

type Notification = { id: string; title: string; body: string | null; href: string | null; readAt: string | null; createdAt: string; organization: { name: string } };
type User = { name: string | null; email: string; image: string | null };

export function Topbar({ user, title, onMenu, signOutAction }: { user: User; title?: string; onMenu: () => void; signOutAction: () => Promise<void> }) {
  return (
    <header className="topbar">
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-ghost btn-icon only-mobile" onClick={onMenu} aria-label="Abrir menu"><Menu size={20} /></button>
        {title && <h1 style={{ fontSize: "var(--text-lg)" }} className="truncate">{title}</h1>}
      </div>
      <div className="row" style={{ gap: 4 }}>
        <NotificationsMenu />
        <UserMenu user={user} signOutAction={signOutAction} />
      </div>
    </header>
  );
}

function useClickOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  return ref;
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: Notification[]; unread: number }>({ items: [], unread: 0 });
  const ref = useClickOutside(open, () => setOpen(false));
  const router = useRouter();

  const load = () => api<{ items: Notification[]; unread: number }>("/api/me/notifications").then(setData).catch(() => undefined);
  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id); }, []);

  const markAll = async () => { await api("/api/me/notifications", { method: "POST" }); load(); };
  const openItem = async (n: Notification) => {
    if (!n.readAt) api(`/api/me/notifications/${n.id}`, { method: "PATCH" }).then(load);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-ghost btn-icon" style={{ position: "relative" }} onClick={() => setOpen((v) => !v)} aria-label={`Notificações${data.unread ? `, ${data.unread} não lidas` : ""}`} aria-expanded={open}>
        <Bell size={20} />
        {data.unread > 0 && <span className="notif-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="popover" style={{ width: 360 }}>
          <div className="row-between" style={{ padding: "6px 10px" }}>
            <span className="font-semibold text-sm">Notificações</span>
            {data.unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAll}><Check size={14} /> Marcar todas</button>}
          </div>
          <div className="menu-sep" />
          {data.items.length === 0 && <p className="muted text-sm" style={{ padding: "16px 10px", textAlign: "center" }}>Nenhuma notificação por enquanto.</p>}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {data.items.map((n) => (
              <button key={n.id} className="menu-item" onClick={() => openItem(n)} style={{ alignItems: "flex-start", opacity: n.readAt ? 0.7 : 1 }}>
                <span className="dot" style={{ background: n.readAt ? "var(--color-border-strong)" : "var(--color-accent)", marginTop: 7 }} aria-hidden="true" />
                <span className="flex-1">
                  <span style={{ display: "block", fontWeight: n.readAt ? 400 : 600 }} className="wrap-any">{n.title}</span>
                  {n.body && <span className="subtle text-xs wrap-any" style={{ display: "block" }}>{n.body}</span>}
                  <span className="subtle text-xs">{n.organization.name} · {timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, signOutAction }: { user: User; signOutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-ghost" style={{ padding: "0 6px", gap: 8 }} onClick={() => setOpen((v) => !v)} aria-label="Menu do usuário" aria-expanded={open}>
        <Avatar name={user.name} email={user.email} image={user.image} />
        <span className="hide-mobile text-sm">{user.name ?? user.email}</span>
      </button>
      {open && (
        <div className="popover">
          <div style={{ padding: "8px 10px" }}>
            <div className="font-semibold text-sm truncate">{user.name ?? "—"}</div>
            <div className="subtle text-xs truncate">{user.email}</div>
          </div>
          <div className="menu-sep" />
          <Link href="/account" className="menu-item"><UserCircle2 size={16} aria-hidden="true" /> Minha conta</Link>
          <div className="menu-sep" />
          <form action={signOutAction}><button type="submit" className="menu-item"><LogOut size={16} aria-hidden="true" /> Sair</button></form>
        </div>
      )}
    </div>
  );
}
