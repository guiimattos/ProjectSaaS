-- Row Level Security baseline for multi-tenant isolation.
-- Usage (example):
--   SET app.current_organization_id = '<org-id>';
-- Policies read this value via current_setting(..., true).

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_on_organization ON "Organization"
  USING (id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_members ON "OrganizationMember"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_subscriptions ON "Subscription"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_usage ON "UsageRecord"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_audit ON "AuditLog"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_on_projects ON "Project"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_tasks ON "Task"
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_on_invitations ON "Invitation"
  USING ("organizationId" = current_setting('app.current_organization_id', true));
