"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/ui/api-client";

const toSlug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ slug: string }>("/api/organizations", { method: "POST", json: { name, slug } });
      router.push(`/org/${res.slug}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="row">
      <input placeholder="Nome" value={name} required onChange={(e) => { setName(e.target.value); setSlug(toSlug(e.target.value)); }} />
      <input placeholder="slug" value={slug} required pattern="[a-z0-9-]+" onChange={(e) => setSlug(e.target.value)} />
      <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Criando…" : "Criar"}</button>
      {error && <span className="error">{error}</span>}
    </form>
  );
}
