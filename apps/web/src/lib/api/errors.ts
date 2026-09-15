import { NextResponse } from "next/server";

/** Erro de domínio com status HTTP explícito. Lançado por helpers e convertido em resposta pelas rotas. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "Unauthorized");
export const forbidden = (msg = "Forbidden") => new ApiError(403, msg);
export const notFound = (msg = "Not found") => new ApiError(404, msg);
export const badRequest = (msg = "Invalid payload") => new ApiError(400, msg);
export const tooMany = () => new ApiError(429, "Too many requests");
export const limitReached = (msg: string) => new ApiError(402, msg, "PLAN_LIMIT_REACHED");

export function toResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
