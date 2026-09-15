import { requireMembership } from "@/lib/api/auth";
import { json, withHandler } from "@/lib/api/handler";
import { getOrganizationStats } from "@/lib/organizations/stats";

type P = { organizationId: string };

export const GET = withHandler<P>("GET /api/organizations/:id/stats", async (_req, { params }) => {
  await requireMembership(params.organizationId);
  return json(await getOrganizationStats(params.organizationId));
});
