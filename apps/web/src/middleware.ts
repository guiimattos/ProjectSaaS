import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Guarda leve de rotas: apenas verifica presença do cookie de sessão (a validação
 * real acontece em `auth()` dentro das páginas/rotas). Evita Prisma no edge runtime.
 * Também lembra a última organização visitada para o redirect de /dashboard.
 */
export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  const match = req.nextUrl.pathname.match(/^\/org\/([a-z0-9-]+)/);
  if (match && req.cookies.get("tf_last_org")?.value !== match[1]) {
    res.cookies.set("tf_last_org", match[1], { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/org/:path*", "/invite/:path*", "/onboarding", "/account"],
};
