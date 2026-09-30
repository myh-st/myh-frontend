/** BACKEND CONTRACT – generated from the Connector Service OpenAPI spec. Do not edit. */
export type Role = 'admin' | 'member';
export type Permission = 'connections:read' | 'connections:manage';

export type ConnectorCategory = 'cloud_storage' | 'collaboration' | 'crm' | 'database' | 'custom_api';
export type AuthMethod = 'oauth' | 'api_key' | 'service_account' | 'basic';
export type Direction = 'inbound' | 'outbound' | 'bidirectional';
export type ScopeAccess = 'read' | 'write';

export type ConnectionStatus = 'connected' | 'degraded' | 'expired' | 'disconnected';
export type TestOutcome = 'ok' | 'failed';
/** Freshness of the health telemetry (status, last test, last sync) reported for a connection. */
export type DataStatus = 'fresh' | 'stale' | 'unavailable';
export type ConnectionAction = 'test' | 'reauthorize' | 'reconnect' | 'rotate_credentials' | 'disconnect';

export interface Me {
  id: string;
  name: string;
  email: string;
  orgName: string;
  role: Role;
  permissions: Permission[];
}

export interface ScopeOption {
  id: string;
  label: string;
  access: ScopeAccess;
}

/** A credential input required by a non-OAuth connector. `secret` fields are write-only. */
export interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  multiline?: boolean;
}

export interface EndpointField {
  label: string;
  placeholder: string;
}

export interface ConnectorType {
  type: string;
  name: string;
  vendor: string;
  category: ConnectorCategory;
  description: string;
  authMethod: AuthMethod;
  availableScopes: ScopeOption[];
  supportsDirection: Direction[];
  /** Non-secret location (host, bucket, base URL, project). null when the vendor is fixed (OAuth SaaS). */
  endpointField: EndpointField | null;
  /** Empty for `oauth`. */
  credentialFields: CredentialField[];
}

export interface ConnectionError {
  code: string;
  message: string;
  occurredAt: string;
  remediation: string;
}

/** Secrets are never returned by the service. `secretConfigured` reports whether one is stored. */
export interface Connection {
  id: string;
  type: string;
  displayName: string;
  status: ConnectionStatus;
  /** Non-secret identity, e.g. "ops@acme.com" or "db: prod-replica.acme.internal". */
  account: string;
  grantedScopes: string[];
  direction: Direction;
  lastSuccessfulSyncAt: string | null;
  lastTestAt: string | null;
  lastTestResult: TestOutcome | null;
  error?: ConnectionError;
  version: number;
  secretConfigured: boolean;
  createdAt: string;
  createdBy: string;
  dataStatus: DataStatus;
  /** Actions the current user may perform on this connection in its current state (server-computed). */
  allowedActions: ConnectionAction[];
}

export type ConnectionEventKind =
  | 'created'
  | 'test'
  | 'sync_failed'
  | 'credentials_rotated'
  | 'reauthorized'
  | 'reconnected'
  | 'disconnected'
  | 'status_changed';

export interface ConnectionEvent {
  at: string;
  kind: ConnectionEventKind;
  actor: string | null;
  message: string;
}

export interface ConnectionDetail extends Connection {
  endpoint: string | null;
  credentialsRotatedAt: string | null;
  events: ConnectionEvent[];
}

export interface CreateConnectionRequest {
  type: string;
  displayName: string;
  scopes: string[];
  direction: Direction;
  /** Required when the connector type has an `endpointField`. */
  endpoint?: string;
  /** Required for non-OAuth types, keyed by `credentialFields[].key`. Write-only. */
  credentials?: Record<string, string>;
}

/** Returned (202) for OAuth connector types. The connection appears in the list once consent completes. */
export interface OAuthPendingConnection {
  authorizationUrl: string;
  pendingConnectionId: string;
  expiresAt: string;
}

/** 202 OAuthPendingConnection for `oauth`; 201 Connection otherwise. */
export type CreateConnectionResult = OAuthPendingConnection | Connection;

export interface TestResult {
  result: TestOutcome;
  latencyMs: number;
  checkedAt: string;
  error?: ConnectionError;
  connection: Connection;
}

export interface ReauthorizeResult {
  authorizationUrl: string;
  expiresAt: string;
}

export interface DependentWorkflow {
  id: string;
  name: string;
  owner: string;
  lastRunAt: string | null;
}

export interface DisconnectImpact {
  connectionId: string;
  dependentWorkflows: DependentWorkflow[];
  syncJobs: number;
  /** Whether previously synced data stays in Bridge after disconnect. */
  dataRetained: boolean;
  retentionDays: number | null;
  /** Upstream services that could not be queried; the lists above may be incomplete. */
  unavailableSources?: string[];
}

export interface DisconnectResult {
  disconnectedAt: string;
  revokedScopes: string[];
  affectedSyncJobs: number;
  connection: Connection;
}
