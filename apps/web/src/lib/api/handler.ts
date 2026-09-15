import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { captureError } from "@/lib/observability";
import { ApiError, badRequest, toResponse } from "@/lib/api/errors";

type Ctx<P> = { params: P };

/**
 * Envolve um handler de rota: converte ApiError em resposta HTTP,
 * registra erros inesperados e padroniza o 500.
 */
export function withHandler<P = Record<string, string>>(
  routeName: string,
  fn: (req: Request, ctx: Ctx<P>) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      if (!(error instanceof ApiError)) captureError(error, { route: routeName });
      return toResponse(error);
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
  return parsed.data;
}

export const json = NextResponse.json;
