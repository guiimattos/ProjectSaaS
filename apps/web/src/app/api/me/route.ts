import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { json, parseBody, withHandler } from "@/lib/api/handler";
import { z } from "zod";

export const GET = withHandler("GET /api/me", async () => {
  const user = await requireUser();
  return json({ user: { id: user.id, name: user.name, email: user.email, image: user.image } });
});

export const PATCH = withHandler("PATCH /api/me", async (req) => {
  const user = await requireUser();
  const { name } = await parseBody(req, z.object({ name: z.string().min(1).max(80) }));
  const updated = await prisma.user.update({ where: { id: user.id }, data: { name } });
  return json({ user: { id: updated.id, name: updated.name, email: updated.email, image: updated.image } });
});
