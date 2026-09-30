/**
 * BACKEND-OWNED seed data for the in-browser Connector Service mock. Do not edit.
 */
import type { ConnectionDetail, ConnectionError, ConnectorType, DependentWorkflow, Me, TestOutcome } from '../api/types';

export const me: Me = {
  id: 'u-204',
  name: 'Priya Raman',
  email: 'priya.raman@acme.com',
  orgName: 'Acme Corporation',
  role: 'admin',
  permissions: ['connections:read', 'connections:manage'],
};

export const memberMe: Me = { ...me, role: 'member', permissions: ['connections:read'] };

const oauthScopes = (prefix: string, read: string, write: string, extra: { id: string; label: string }[] = []) => [
  { id: `${prefix}.read`, label: read, access: 'read' as const },
  ...extra.map((e) => ({ ...e, access: 'read' as const })),
  { id: `${prefix}.write`, label: write, access: 'write' as const },
];

export const catalog: ConnectorType[] = [
  { type: 'google_drive', name: 'Google Drive', vendor: 'Google', category: 'cloud_storage', description: 'Index and sync files and folders from shared drives and My Drive, including Google Docs, Sheets and Slides exported as text.', authMethod: 'oauth', availableScopes: oauthScopes('drive.files', 'Read files and folders', 'Create and update files', [{ id: 'drive.metadata.read', label: 'Read file metadata and permissions' }]), supportsDirection: ['inbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'sharepoint', name: 'SharePoint Online', vendor: 'Microsoft', category: 'cloud_storage', description: 'Sync document libraries and list items from SharePoint sites in your Microsoft 365 tenant.', authMethod: 'oauth', availableScopes: oauthScopes('sites', 'Read site content', 'Write to document libraries', [{ id: 'sites.permissions.read', label: 'Read site permissions' }]), supportsDirection: ['inbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'box', name: 'Box', vendor: 'Box', category: 'cloud_storage', description: 'Sync folders and files from Box Enterprise, preserving collaborator access lists.', authMethod: 'oauth', availableScopes: oauthScopes('box.files', 'Read files', 'Upload and modify files'), supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'amazon_s3', name: 'Amazon S3', vendor: 'Amazon Web Services', category: 'cloud_storage', description: 'Read objects from or write exports to an S3 bucket using an IAM access key scoped to a prefix.', authMethod: 'api_key', availableScopes: [ { id: 's3.objects.read', label: 'GetObject / ListBucket', access: 'read' }, { id: 's3.objects.write', label: 'PutObject / DeleteObject', access: 'write' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: { label: 'Bucket and prefix', placeholder: 's3://my-bucket/path/' }, credentialFields: [ { key: 'accessKeyId', label: 'Access key ID', secret: false }, { key: 'secretAccessKey', label: 'Secret access key', secret: true } ] },
  { type: 'slack', name: 'Slack', vendor: 'Salesforce', category: 'collaboration', description: 'Post notifications to channels and ingest public channel history for search.', authMethod: 'oauth', availableScopes: [ { id: 'channels.history', label: 'Read public channel history', access: 'read' }, { id: 'channels.read', label: 'List channels', access: 'read' }, { id: 'chat.write', label: 'Post messages', access: 'write' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'microsoft_teams', name: 'Microsoft Teams', vendor: 'Microsoft', category: 'collaboration', description: 'Send adaptive-card notifications to Teams channels and read channel messages.', authMethod: 'oauth', availableScopes: [ { id: 'channel.message.read', label: 'Read channel messages', access: 'read' }, { id: 'channel.message.send', label: 'Send channel messages', access: 'write' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'confluence', name: 'Confluence Cloud', vendor: 'Atlassian', category: 'collaboration', description: 'Index spaces, pages and attachments from Confluence Cloud, respecting page restrictions.', authMethod: 'oauth', availableScopes: oauthScopes('confluence.content', 'Read pages and attachments', 'Create and edit pages', [{ id: 'confluence.space.read', label: 'Read space settings' }]), supportsDirection: ['inbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'salesforce', name: 'Salesforce', vendor: 'Salesforce', category: 'crm', description: 'Sync accounts, contacts, opportunities and custom objects; write back enrichment fields.', authMethod: 'oauth', availableScopes: [ { id: 'api.read', label: 'Read standard and custom objects', access: 'read' }, { id: 'api.write', label: 'Update records', access: 'write' }, { id: 'refresh_token', label: 'Offline access', access: 'read' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'hubspot', name: 'HubSpot', vendor: 'HubSpot', category: 'crm', description: 'Sync contacts, companies and deals from HubSpot CRM and push lifecycle updates.', authMethod: 'oauth', availableScopes: oauthScopes('crm.objects', 'Read CRM objects', 'Write CRM objects'), supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: null, credentialFields: [] },
  { type: 'postgresql', name: 'PostgreSQL', vendor: 'PostgreSQL', category: 'database', description: 'Query tables and views from a PostgreSQL 12+ database over TLS. A read replica is recommended.', authMethod: 'basic', availableScopes: [ { id: 'db.select', label: 'SELECT on allowed schemas', access: 'read' }, { id: 'db.insert', label: 'INSERT into export tables', access: 'write' } ], supportsDirection: ['inbound', 'outbound'], endpointField: { label: 'Host, port and database', placeholder: 'db.example.internal:5432/app' }, credentialFields: [ { key: 'username', label: 'Username', secret: false }, { key: 'password', label: 'Password', secret: true } ] },
  { type: 'snowflake', name: 'Snowflake', vendor: 'Snowflake', category: 'database', description: 'Load curated data into Snowflake or read from shared views using key-pair authentication.', authMethod: 'service_account', availableScopes: [ { id: 'warehouse.usage', label: 'Use warehouse', access: 'read' }, { id: 'schema.select', label: 'SELECT on schema', access: 'read' }, { id: 'schema.write', label: 'CREATE / INSERT on schema', access: 'write' } ], supportsDirection: ['inbound', 'outbound'], endpointField: { label: 'Account URL', placeholder: 'acme-analytics.snowflakecomputing.com' }, credentialFields: [ { key: 'user', label: 'Service user', secret: false }, { key: 'privateKey', label: 'Private key (PEM)', secret: true, multiline: true } ] },
  { type: 'bigquery', name: 'BigQuery', vendor: 'Google Cloud', category: 'database', description: 'Export datasets to BigQuery or read query results using a Google Cloud service account.', authMethod: 'service_account', availableScopes: [ { id: 'bigquery.readonly', label: 'Read datasets', access: 'read' }, { id: 'bigquery.insertdata', label: 'Insert rows', access: 'write' } ], supportsDirection: ['inbound', 'outbound'], endpointField: { label: 'Project ID', placeholder: 'my-gcp-project' }, credentialFields: [ { key: 'clientEmail', label: 'Service account email', secret: false }, { key: 'privateKey', label: 'Private key (PEM)', secret: true, multiline: true } ] },
  { type: 'rest_api', name: 'REST API', vendor: 'Custom', category: 'custom_api', description: 'Connect any JSON REST API that authenticates with a static API key sent in a header.', authMethod: 'api_key', availableScopes: [ { id: 'http.get', label: 'GET requests', access: 'read' }, { id: 'http.write', label: 'POST / PUT / PATCH / DELETE requests', access: 'write' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: { label: 'Base URL', placeholder: 'https://api.example.com/v1' }, credentialFields: [ { key: 'headerName', label: 'Header name', secret: false }, { key: 'apiKey', label: 'API key', secret: true } ] },
  { type: 'graphql_api', name: 'GraphQL API', vendor: 'Custom', category: 'custom_api', description: 'Run queries and mutations against a GraphQL endpoint authenticated with a bearer token.', authMethod: 'api_key', availableScopes: [ { id: 'graphql.query', label: 'Queries', access: 'read' }, { id: 'graphql.mutation', label: 'Mutations', access: 'write' } ], supportsDirection: ['inbound', 'outbound', 'bidirectional'], endpointField: { label: 'Endpoint URL', placeholder: 'https://example.com/graphql' }, credentialFields: [ { key: 'apiKey', label: 'Bearer token', secret: true } ] },
];

export const oauthAuthorizeBase: Record<string, string> = {
  google_drive: 'https://accounts.google.com/o/oauth2/v2/auth',
  sharepoint: 'https://login.microsoftonline.com/acme.onmicrosoft.com/oauth2/v2.0/authorize',
  box: 'https://account.box.com/api/oauth2/authorize',
  slack: 'https://slack.com/oauth/v2/authorize',
  microsoft_teams: 'https://login.microsoftonline.com/acme.onmicrosoft.com/oauth2/v2.0/authorize',
  confluence: 'https://auth.atlassian.com/authorize',
  salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
  hubspot: 'https://app.hubspot.com/oauth/authorize',
};

/** Stored server-side record. `secret` is never serialised to clients. */
export interface StoredConnection {
  conn: Omit<ConnectionDetail, 'dataStatus' | 'allowedActions' | 'secretConfigured'>;
  secret: Record<string, string> | null;
  nextTest: { result: TestOutcome; latencyMs: number; error?: Omit<ConnectionError, 'occurredAt'> };
  impact: { dependentWorkflows: DependentWorkflow[]; syncJobs: number; dataRetained: boolean; retentionDays: number | null };
}

const now = Date.now();
const iso = (mins: number) => new Date(now + mins * 60_000).toISOString();
const DAY = 24 * 60;

const token = { accessToken: 'ya29.redacted', refreshToken: '1//redacted' };

export function seedConnections(): StoredConnection[] {
  return [
    {
      conn: { id: 'conn-01', type: 'google_drive', displayName: 'Finance shared drive', status: 'connected', account: 'finance-ops@acme.com', grantedScopes: ['drive.files.read', 'drive.metadata.read'], direction: 'inbound', lastSuccessfulSyncAt: iso(-14), lastTestAt: iso(-2 * DAY), lastTestResult: 'ok', version: 4, createdAt: iso(-210 * DAY), createdBy: 'Priya Raman', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-210 * DAY), kind: 'created', actor: 'Priya Raman', message: 'Connected with 2 scopes' }, { at: iso(-2 * DAY), kind: 'test', actor: 'Priya Raman', message: 'Connection test passed (212 ms)' } ] },
      secret: token,
      nextTest: { result: 'ok', latencyMs: 188 },
      impact: { dependentWorkflows: [ { id: 'wf-311', name: 'Month-end close document index', owner: 'Finance Systems', lastRunAt: iso(-14) }, { id: 'wf-322', name: 'Invoice PDF extraction', owner: 'Accounts Payable', lastRunAt: iso(-65) } ], syncJobs: 3, dataRetained: true, retentionDays: 30 },
    },
    {
      conn: { id: 'conn-02', type: 'salesforce', displayName: 'Salesforce – Production (NA14) org used by Revenue Operations for account, opportunity and forecast sync', status: 'degraded', account: 'integration.user@acme.com.prod', grantedScopes: ['api.read', 'api.write', 'refresh_token'], direction: 'bidirectional', lastSuccessfulSyncAt: iso(-95), lastTestAt: iso(-40), lastTestResult: 'failed', error: { code: 'RATE_LIMITED', message: 'Salesforce returned REQUEST_LIMIT_EXCEEDED: TotalRequests Limit exceeded (DailyApiRequests 15,000 of 15,000 used). Outbound write-back of 1,284 opportunity updates is paused until the rolling 24-hour window resets.', occurredAt: iso(-40), remediation: 'Reduce the sync frequency of the "Opportunity enrichment" workflow, or ask your Salesforce administrator to raise the org API limit. Syncs resume automatically.' }, version: 11, createdAt: iso(-400 * DAY), createdBy: 'Marcus Lee', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-400 * DAY), kind: 'created', actor: 'Marcus Lee', message: 'Connected with 3 scopes' }, { at: iso(-95), kind: 'sync_failed', actor: null, message: 'Write-back batch 7 of 12 rejected: REQUEST_LIMIT_EXCEEDED' }, { at: iso(-40), kind: 'status_changed', actor: null, message: 'Status changed from connected to degraded' } ] },
      secret: token,
      nextTest: { result: 'failed', latencyMs: 1432, error: { code: 'RATE_LIMITED', message: 'REQUEST_LIMIT_EXCEEDED: TotalRequests Limit exceeded.', remediation: 'Wait for the API limit window to reset or raise the org limit.' } },
      impact: { dependentWorkflows: [ { id: 'wf-101', name: 'Opportunity enrichment', owner: 'Revenue Operations', lastRunAt: iso(-95) }, { id: 'wf-104', name: 'Weekly forecast snapshot to Snowflake', owner: 'Finance Analytics', lastRunAt: iso(-3 * DAY) }, { id: 'wf-117', name: 'Churn-risk alerts to #cs-escalations', owner: 'Customer Success', lastRunAt: iso(-6 * 60) } ], syncJobs: 6, dataRetained: true, retentionDays: 90 },
    },
    {
      conn: { id: 'conn-03', type: 'slack', displayName: 'Slack – incident bridge notifications', status: 'connected', account: 'acme-corp.slack.com (bot: Bridge)', grantedScopes: ['channels.read', 'chat.write'], direction: 'outbound', lastSuccessfulSyncAt: iso(-3), lastTestAt: iso(-12 * DAY), lastTestResult: 'ok', version: 2, createdAt: iso(-90 * DAY), createdBy: 'Priya Raman', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-90 * DAY), kind: 'created', actor: 'Priya Raman', message: 'Connected with 2 scopes' } ] },
      secret: token,
      nextTest: { result: 'ok', latencyMs: 96 },
      impact: { dependentWorkflows: [ { id: 'wf-205', name: 'Sev1/Sev2 incident broadcast', owner: 'SRE', lastRunAt: iso(-3) } ], syncJobs: 1, dataRetained: false, retentionDays: null },
    },
    {
      conn: { id: 'conn-04', type: 'sharepoint', displayName: 'SharePoint – Legal contracts library', status: 'expired', account: 'svc-bridge@acme.onmicrosoft.com', grantedScopes: ['sites.read', 'sites.permissions.read'], direction: 'inbound', lastSuccessfulSyncAt: iso(-4 * DAY), lastTestAt: iso(-4 * DAY), lastTestResult: 'failed', error: { code: 'TOKEN_EXPIRED', message: 'AADSTS700082: The refresh token has expired due to inactivity. The token was issued on 2026-06-28 and was inactive for 90.00:00:00.', occurredAt: iso(-4 * DAY), remediation: 'Reauthorize the connection with an account that has access to the Legal site.' }, version: 7, createdAt: iso(-300 * DAY), createdBy: 'Dana Whitfield', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-300 * DAY), kind: 'created', actor: 'Dana Whitfield', message: 'Connected with 2 scopes' }, { at: iso(-4 * DAY), kind: 'status_changed', actor: null, message: 'Status changed from connected to expired' } ] },
      secret: token,
      nextTest: { result: 'failed', latencyMs: 310, error: { code: 'TOKEN_EXPIRED', message: 'AADSTS700082: The refresh token has expired due to inactivity.', remediation: 'Reauthorize the connection.' } },
      impact: { dependentWorkflows: [ { id: 'wf-402', name: 'Contract renewal reminders', owner: 'Legal Ops', lastRunAt: iso(-4 * DAY) } ], syncJobs: 2, dataRetained: true, retentionDays: 30 },
    },
    {
      conn: { id: 'conn-05', type: 'postgresql', displayName: 'Orders read replica', status: 'connected', account: 'db: prod-replica.acme.internal (bridge_ro)', grantedScopes: ['db.select'], direction: 'inbound', lastSuccessfulSyncAt: iso(-7), lastTestAt: iso(-1 * DAY), lastTestResult: 'ok', version: 5, createdAt: iso(-150 * DAY), createdBy: 'Marcus Lee', endpoint: 'prod-replica.acme.internal:5432/orders', credentialsRotatedAt: iso(-30 * DAY), events: [ { at: iso(-150 * DAY), kind: 'created', actor: 'Marcus Lee', message: 'Connected with 1 scope' }, { at: iso(-30 * DAY), kind: 'credentials_rotated', actor: 'Marcus Lee', message: 'Password rotated' } ] },
      secret: { username: 'bridge_ro', password: 'x' },
      nextTest: { result: 'ok', latencyMs: 41 },
      impact: { dependentWorkflows: [ { id: 'wf-150', name: 'Order status sync to Salesforce', owner: 'Revenue Operations', lastRunAt: iso(-7) }, { id: 'wf-151', name: 'Daily refunds report', owner: 'Finance Analytics', lastRunAt: iso(-10 * 60) } ], syncJobs: 4, dataRetained: true, retentionDays: 14 },
    },
    {
      conn: { id: 'conn-06', type: 'snowflake', displayName: 'Snowflake analytics warehouse', status: 'degraded', account: 'BRIDGE_SVC @ acme-analytics.snowflakecomputing.com', grantedScopes: ['warehouse.usage', 'schema.select', 'schema.write'], direction: 'outbound', lastSuccessfulSyncAt: iso(-26 * 60), lastTestAt: iso(-3 * 60), lastTestResult: 'failed', error: { code: 'SCHEMA_CHANGED', message: 'Target table ANALYTICS.CRM.OPPORTUNITY_SNAPSHOT no longer has column FORECAST_CATEGORY_NAME (dropped by migration 2026_09_29_rename_forecast_columns). 3 of 5 export jobs are failing.', occurredAt: iso(-26 * 60), remediation: 'Update the field mapping for the affected export jobs, then run a connection test.' }, version: 9, createdAt: iso(-260 * DAY), createdBy: 'Marcus Lee', endpoint: 'acme-analytics.snowflakecomputing.com', credentialsRotatedAt: iso(-60 * DAY), events: [ { at: iso(-260 * DAY), kind: 'created', actor: 'Marcus Lee', message: 'Connected with 3 scopes' }, { at: iso(-26 * 60), kind: 'sync_failed', actor: null, message: 'Export OPPORTUNITY_SNAPSHOT failed: invalid identifier FORECAST_CATEGORY_NAME' } ] },
      secret: { user: 'BRIDGE_SVC', privateKey: 'x' },
      nextTest: { result: 'ok', latencyMs: 530 },
      impact: { dependentWorkflows: [ { id: 'wf-104', name: 'Weekly forecast snapshot to Snowflake', owner: 'Finance Analytics', lastRunAt: iso(-3 * DAY) } ], syncJobs: 5, dataRetained: false, retentionDays: null },
    },
    {
      conn: { id: 'conn-07', type: 'hubspot', displayName: 'HubSpot marketing (EU portal)', status: 'disconnected', account: 'portal 25841120 (acme.eu)', grantedScopes: [], direction: 'inbound', lastSuccessfulSyncAt: iso(-18 * DAY), lastTestAt: iso(-18 * DAY), lastTestResult: 'failed', error: { code: 'PERMISSION_REVOKED', message: 'The Bridge app was uninstalled from HubSpot portal 25841120 by j.moreau@acme.eu. All granted scopes were revoked by HubSpot.', occurredAt: iso(-18 * DAY), remediation: 'Reauthorize to reinstall the app in the portal. A HubSpot super admin must approve the install.' }, version: 6, createdAt: iso(-180 * DAY), createdBy: 'Dana Whitfield', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-180 * DAY), kind: 'created', actor: 'Dana Whitfield', message: 'Connected with 1 scope' }, { at: iso(-18 * DAY), kind: 'disconnected', actor: null, message: 'App uninstalled in HubSpot; scopes revoked' } ] },
      secret: null,
      nextTest: { result: 'failed', latencyMs: 0 },
      impact: { dependentWorkflows: [], syncJobs: 0, dataRetained: true, retentionDays: 12 },
    },
    {
      conn: { id: 'conn-08', type: 'rest_api', displayName: 'Internal ticketing API (legacy v1)', status: 'disconnected', account: 'api: tickets.acme.internal', grantedScopes: ['http.get'], direction: 'inbound', lastSuccessfulSyncAt: iso(-6 * DAY), lastTestAt: iso(-6 * DAY), lastTestResult: 'failed', error: { code: 'CIRCUIT_OPEN', message: 'Automatically disconnected after 5 consecutive failed syncs (HTTP 502 Bad Gateway from https://tickets.acme.internal/api/v1/tickets?updated_since=…). Stored credentials were kept.', occurredAt: iso(-6 * DAY), remediation: 'Confirm the ticketing service is healthy, then reconnect.' }, version: 3, createdAt: iso(-500 * DAY), createdBy: 'Marcus Lee', endpoint: 'https://tickets.acme.internal/api/v1', credentialsRotatedAt: iso(-200 * DAY), events: [ { at: iso(-500 * DAY), kind: 'created', actor: 'Marcus Lee', message: 'Connected with 1 scope' }, { at: iso(-6 * DAY), kind: 'disconnected', actor: null, message: 'Circuit breaker opened after 5 consecutive failures' } ] },
      secret: { headerName: 'X-Api-Key', apiKey: 'x' },
      nextTest: { result: 'ok', latencyMs: 220 },
      impact: { dependentWorkflows: [ { id: 'wf-610', name: 'Ticket backlog digest', owner: 'IT Service Desk', lastRunAt: iso(-6 * DAY) } ], syncJobs: 1, dataRetained: true, retentionDays: 30 },
    },
    {
      conn: { id: 'conn-09', type: 'bigquery', displayName: 'BigQuery – product telemetry export', status: 'connected', account: 'bridge-export@acme-telemetry.iam.gserviceaccount.com', grantedScopes: ['bigquery.insertdata'], direction: 'outbound', lastSuccessfulSyncAt: iso(-45), lastTestAt: iso(-9 * DAY), lastTestResult: 'ok', version: 3, createdAt: iso(-75 * DAY), createdBy: 'Priya Raman', endpoint: 'acme-telemetry', credentialsRotatedAt: iso(-75 * DAY), events: [ { at: iso(-75 * DAY), kind: 'created', actor: 'Priya Raman', message: 'Connected with 1 scope' } ] },
      secret: { clientEmail: 'bridge-export@acme-telemetry.iam.gserviceaccount.com', privateKey: 'x' },
      nextTest: { result: 'ok', latencyMs: 305 },
      impact: { dependentWorkflows: [ { id: 'wf-720', name: 'Feature usage rollup', owner: 'Product Analytics', lastRunAt: iso(-45) } ], syncJobs: 2, dataRetained: false, retentionDays: null },
    },
    {
      conn: { id: 'conn-10', type: 'confluence', displayName: 'Confluence engineering wiki', status: 'connected', account: 'acme.atlassian.net (bridge-bot@acme.com)', grantedScopes: ['confluence.content.read', 'confluence.space.read'], direction: 'inbound', lastSuccessfulSyncAt: iso(-22), lastTestAt: null, lastTestResult: null, version: 1, createdAt: iso(-5 * DAY), createdBy: 'Dana Whitfield', endpoint: null, credentialsRotatedAt: null, events: [ { at: iso(-5 * DAY), kind: 'created', actor: 'Dana Whitfield', message: 'Connected with 2 scopes' } ] },
      secret: token,
      nextTest: { result: 'ok', latencyMs: 140 },
      impact: { dependentWorkflows: [ { id: 'wf-801', name: 'Engineering search index', owner: 'Developer Experience', lastRunAt: iso(-22) } ], syncJobs: 1, dataRetained: true, retentionDays: 30 },
    },
    {
      conn: { id: 'conn-11', type: 'amazon_s3', displayName: 'Data lake landing bucket', status: 'degraded', account: 'bucket: acme-datalake-landing/bridge/ (AKIA…Q7XH)', grantedScopes: ['s3.objects.read', 's3.objects.write'], direction: 'bidirectional', lastSuccessfulSyncAt: iso(-8 * 60), lastTestAt: iso(-8 * 60), lastTestResult: 'failed', error: { code: 'ACCESS_DENIED', message: 'PutObject on s3://acme-datalake-landing/bridge/exports/ returned 403 AccessDenied. Reads under bridge/imports/ still succeed.', occurredAt: iso(-8 * 60), remediation: 'Ask the AWS account owner to restore s3:PutObject on the bridge/exports/ prefix, or rotate to a key with that permission.' }, version: 5, createdAt: iso(-120 * DAY), createdBy: 'Priya Raman', endpoint: 's3://acme-datalake-landing/bridge/', credentialsRotatedAt: iso(-120 * DAY), events: [ { at: iso(-120 * DAY), kind: 'created', actor: 'Priya Raman', message: 'Connected with 2 scopes' }, { at: iso(-8 * 60), kind: 'sync_failed', actor: null, message: 'Export batch rejected: AccessDenied' } ] },
      secret: { accessKeyId: 'AKIAEXAMPLEQ7XH', secretAccessKey: 'x' },
      nextTest: { result: 'failed', latencyMs: 180, error: { code: 'ACCESS_DENIED', message: 'PutObject returned 403 AccessDenied.', remediation: 'Restore s3:PutObject on the prefix or rotate the access key.' } },
      impact: { dependentWorkflows: [ { id: 'wf-901', name: 'Nightly CRM export to data lake', owner: 'Data Platform', lastRunAt: iso(-8 * 60) }, { id: 'wf-902', name: 'Vendor file ingestion', owner: 'Procurement', lastRunAt: iso(-2 * 60) } ], syncJobs: 3, dataRetained: true, retentionDays: 7 },
    },
  ];
}
