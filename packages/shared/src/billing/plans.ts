export const PLAN_MATRIX = {
  free: {
    limits: { maxMembers: 3, maxTasksPerMonth: 100, maxApiCallsPerMonth: 1000 },
    features: { advancedAnalytics: false, auditExport: false }
  },
  pro: {
    limits: { maxMembers: 25, maxTasksPerMonth: 10000, maxApiCallsPerMonth: 100000 },
    features: { advancedAnalytics: true, auditExport: true }
  },
  enterprise: {
    limits: { maxMembers: null, maxTasksPerMonth: null, maxApiCallsPerMonth: null },
    features: { advancedAnalytics: true, auditExport: true }
  }
} as const;
