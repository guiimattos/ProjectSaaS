import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/ui/logo";
import { Hero } from "@/components/landing/hero";
import { Features, Stats, Pricing, CtaBand } from "@/components/landing/sections";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <a href="#content" className="skip-link">Pular para o conteúdo</a>
      <header className="landing-nav">
        <div className="container row-between" style={{ minHeight: 64 }}>
          <Logo />
          <nav className="row" aria-label="Principal">
            <a href="#features" className="btn btn-ghost hide-mobile">Funcionalidades</a>
            <a href="#pricing" className="btn btn-ghost hide-mobile">Preços</a>
            <Link href="/sign-in" className="btn btn-primary">Entrar</Link>
          </nav>
        </div>
      </header>
      <main id="content">
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <CtaBand />
      </main>
      <footer className="footer">
        <div className="container row-between">
          <span>© {new Date().getFullYear()} TaskFlow</span>
          <span className="row" style={{ gap: 16 }}><a href="#features">Funcionalidades</a><a href="#pricing">Preços</a><Link href="/sign-in">Entrar</Link></span>
        </div>
      </footer>
    </>
  );
}
