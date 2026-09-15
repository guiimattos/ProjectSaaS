"use client";

import { useState } from "react";
import { Sidebar, OrgSummary } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export function AppShell({ org, orgs, user, signOutAction, children }: {
  org: OrgSummary; orgs: OrgSummary[]; user: { name: string | null; email: string; image: string | null }; signOutAction: () => Promise<void>; children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Pular para o conteúdo</a>
      <Sidebar org={org} orgs={orgs} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div style={{ minWidth: 0 }}>
        <Topbar user={user} title={org.name} onMenu={() => setMenuOpen(true)} signOutAction={signOutAction} />
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
