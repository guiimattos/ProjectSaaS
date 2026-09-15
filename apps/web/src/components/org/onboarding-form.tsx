"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/ui/api-client";
import { Field } from "@/components/ui/primitives";

const toSlug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function OnboardingForm({ hasOrgs }: { hasOrgs: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api<{ slug: string }>("/api/organizations", { method: "POST", json: { name, slug } });
      router.push(`/org/${res.slug}/members?welcome=1`);
    } catch (err) {
      setError((err as Error).message); setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" noValidate>
      <Field label="Nome da organização" htmlFor="org-name" required>
        <input id="org-name" className="input" value={name} required autoFocus autoComplete="organization" placeholder="Acme Inc."
          onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(toSlug(e.target.value)); }} />
      </Field>
      <Field label="Endereço" htmlFor="org-slug" required help={`taskflow.app/org/${slug || "sua-empresa"}`} error={error}>
        <input id="org-slug" className="input" value={slug} required pattern="[a-z0-9-]+" aria-invalid={!!error} aria-describedby={error ? "org-slug-error" : "org-slug-help"}
          onChange={(e) => { setSlugTouched(true); setSlug(toSlug(e.target.value)); }} />
      </Field>
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || !name || !slug}>
        {loading ? "Criando…" : "Criar organização"} <ArrowRight size={18} aria-hidden="true" />
      </button>
      {hasOrgs && <Link href="/dashboard" className="btn btn-ghost btn-block">Cancelar</Link>}
    </form>
  );
}
