export const PLAN_MATRIX = {
  free: {
    name: "Free",
    limits: { maxMembers: 3, maxTasksPerMonth: 100, maxApiCallsPerMonth: 1000 },
    features: { advancedAnalytics: false, auditExport: false },
  },
  pro: {
    name: "Pro",
    limits: { maxMembers: 25, maxTasksPerMonth: 10000, maxApiCallsPerMonth: 100000 },
    features: { advancedAnalytics: true, auditExport: true },
  },
  enterprise: {
    name: "Enterprise",
    limits: { maxMembers: null, maxTasksPerMonth: null, maxApiCallsPerMonth: null },
    features: { advancedAnalytics: true, auditExport: true },
  },
} as const;

export type PlanCode = keyof typeof PLAN_MATRIX;
export type PlanLimits = { maxMembers: number | null; maxTasksPerMonth: number | null; maxApiCallsPerMonth: number | null };
export type PlanFeatures = (typeof PLAN_MATRIX)["free"]["features"];
