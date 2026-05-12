import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/)
});

export const billingCheckoutSchema = z.object({
  organizationId: z.string().min(10),
  priceId: z.string().min(5)
});

export const billingPortalSchema = z.object({
  organizationId: z.string().min(10)
});
