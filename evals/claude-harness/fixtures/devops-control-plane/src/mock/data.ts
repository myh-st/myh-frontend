/** BACKEND-OWNED seed data for the in-browser mock of the Beacon Incident Platform. Do not edit. */
import type {
  ChangeRecord,
  Execution,
  Hypothesis,
  IncidentDetail,
  Investigation,
  LogEntry,
  Me,
  MetricName,
  Remediation,
  Service,
  TraceSpan,
} from '../api/types';

export type IncidentRecord = Omit<IncidentDetail, 'allowedActions'>;

export const me: Me = {
  id: 'u-2291',
  name: 'Dana Whitfield',
  email: 'dana.whitfield@example.com',
  role: 'incident_commander',
  teams: ['SRE', 'Payments Platform'],
};

const now = Date.now();
export const iso = (mins: number) => new Date(now + mins * 60_000).toISOString();

export const services: Service[] = [
  { id: 'payments-gateway', name: 'Payments Gateway', description: 'Card authorisation and capture against external acquirers (Adyen EU, Worldpay fallback).', tier: 1, health: 'down', owningTeam: 'Payments Platform', onCall: { name: 'Priya Raman', handle: '@priya.r', until: iso(310) }, slo: { objective: '99.95% of authorisations succeed within 2s', target: 99.95, current: 99.41, errorBudgetRemainingPct: 0, status: 'breached' }, openIncidentIds: ['INC-4821'] },
  { id: 'checkout-api', name: 'Checkout API', description: 'Cart-to-order orchestration for web and mobile storefronts.', tier: 1, health: 'degraded', owningTeam: 'Payments Platform', onCall: { name: 'Priya Raman', handle: '@priya.r', until: iso(310) }, slo: { objective: '99.9% availability', target: 99.9, current: 99.83, errorBudgetRemainingPct: 12, status: 'at_risk' }, openIncidentIds: ['INC-4821'] },
  { id: 'auth-service', name: 'Auth Service', description: 'OAuth token issuance, refresh and session revocation.', tier: 1, health: 'degraded', owningTeam: 'Identity', onCall: { name: 'Tomasz Nowak', handle: '@tnowak', until: iso(95) }, slo: { objective: '99.95% of token refreshes succeed', target: 99.95, current: 99.9, errorBudgetRemainingPct: 21, status: 'at_risk' }, openIncidentIds: ['INC-4817'] },
  { id: 'edge-proxy', name: 'Edge Proxy', description: 'Envoy-based ingress tier terminating TLS for all public hostnames.', tier: 1, health: 'healthy', owningTeam: 'Traffic', onCall: { name: 'Aisha Bello', handle: '@abello', until: iso(720) }, slo: { objective: '99.99% availability', target: 99.99, current: 99.97, errorBudgetRemainingPct: 0, status: 'breached' }, openIncidentIds: [] },
  { id: 'ledger-db', name: 'Ledger DB', description: 'PostgreSQL cluster holding orders, payments and refunds (primary + 3 replicas).', tier: 1, health: 'healthy', owningTeam: 'Data Infrastructure', onCall: { name: 'Hana Kobayashi', handle: '@hana.k', until: iso(480) }, slo: { objective: 'Replica lag < 5s for 99.9% of minutes', target: 99.9, current: 99.94, errorBudgetRemainingPct: 64, status: 'meeting' }, openIncidentIds: ['INC-4815'] },
  { id: 'search-indexer', name: 'Search Indexer', description: 'Kafka consumer that projects catalog changes into the OpenSearch product index.', tier: 2, health: 'degraded', owningTeam: 'Discovery', onCall: { name: 'Marcus Oyelaran', handle: '@marcus.o', until: iso(150) }, slo: { objective: 'Index freshness < 5 min for 99% of updates', target: 99, current: 96.2, errorBudgetRemainingPct: 0, status: 'breached' }, openIncidentIds: ['INC-4819'] },
  { id: 'catalog-api', name: 'Catalog API', description: 'Product, price and availability reads for storefronts.', tier: 2, health: 'healthy', owningTeam: 'Discovery', onCall: { name: 'Marcus Oyelaran', handle: '@marcus.o', until: iso(150) }, slo: { objective: '99.9% availability', target: 99.9, current: 99.96, errorBudgetRemainingPct: 71, status: 'meeting' }, openIncidentIds: ['INC-4819'] },
  { id: 'inventory-sync', name: 'Inventory Sync', description: 'Batch reconciliation of warehouse stock counts into the ledger.', tier: 2, health: 'degraded', owningTeam: 'Fulfilment', onCall: { name: 'Hana Kobayashi', handle: '@hana.k', until: iso(480) }, slo: { objective: 'Stock counts reconciled within 15 min', target: 99, current: 98.1, errorBudgetRemainingPct: 8, status: 'at_risk' }, openIncidentIds: ['INC-4815'] },
  { id: 'notifications-worker', name: 'Notifications Worker', description: 'Fan-out of order lifecycle events to push, email and SMS providers.', tier: 3, health: 'degraded', owningTeam: 'Messaging', onCall: { name: 'Luis Ferreira', handle: '@lferreira', until: iso(60) }, slo: { objective: '99.5% of notifications delivered exactly once', target: 99.5, current: 99.52, errorBudgetRemainingPct: 4, status: 'at_risk' }, openIncidentIds: ['INC-4812'] },
  { id: 'image-resizer', name: 'Image Resizer', description: 'On-the-fly thumbnail generation for product media (JPEG, WebP, AVIF).', tier: 3, health: 'healthy', owningTeam: 'Media', onCall: { name: 'Luis Ferreira', handle: '@lferreira', until: iso(60) }, slo: { objective: 'p99 < 400ms', target: 99, current: 99.2, errorBudgetRemainingPct: 38, status: 'meeting' }, openIncidentIds: ['INC-4809'] },
  { id: 'recommendations-api', name: 'Recommendations API', description: 'Personalised ranking for homepage and PDP carousels.', tier: 3, health: 'down', owningTeam: 'Personalisation', onCall: { name: 'Sofia Lindqvist', handle: '@sofia.l', until: iso(200) }, slo: { objective: '99.5% of requests return ≥ 1 item', target: 99.5, current: 97.8, errorBudgetRemainingPct: 0, status: 'breached' }, openIncidentIds: ['INC-4822'] },
];

export function seedIncidents(): IncidentRecord[] {
  return [
    {
      id: 'INC-4821', title: 'EU checkout failures after payments-gateway v2.41.0 deploy — card authorisations timing out', severity: 'SEV1', status: 'mitigating', affectedServices: ['payments-gateway', 'checkout-api'], commander: 'Dana Whitfield', startedAt: iso(-94), resolvedAt: null, version: 7, latestInvestigationId: null,
      summary: 'Card authorisation requests routed through payments-gateway v2.41.0 are timing out against the Adyen EU acquirer endpoint after the connection-pool refactor shipped at the start of the window. Checkout success rate for EU storefronts dropped from 97.8% to 61%; US traffic is unaffected because it still uses the legacy HTTP client pool.',
      customerImpact: 'Roughly 38% of EU checkout attempts fail with "Payment could not be processed". Estimated 4,100 failed orders so far; support contact volume is up 6x and the status page is showing "Degraded performance" for Payments.',
      timeline: [
        { id: 'ev-1', at: iso(-101), kind: 'deploy', actor: 'argo-rollouts', message: 'payments-gateway v2.41.0 promoted to 100% in prod-eu (eks-eu-west-1-prod-a)' },
        { id: 'ev-2', at: iso(-94), kind: 'alert', actor: 'alertmanager', message: 'PaymentsAuthSuccessRateLow firing: auth_success_rate{region="eu"} = 0.71 (< 0.95 for 5m)' },
        { id: 'ev-3', at: iso(-90), kind: 'status_change', actor: 'Dana Whitfield', message: 'Declared SEV1, status → investigating. Dana Whitfield is incident commander.' },
        { id: 'ev-4', at: iso(-72), kind: 'note', actor: 'Priya Raman', message: 'Upstream Adyen status page is green. Our outbound connections to checkout-live.adyen.com are stuck in CONNECTING; suspect pool max-idle change in v2.41.0.' },
        { id: 'ev-5', at: iso(-61), kind: 'status_change', actor: 'Dana Whitfield', message: 'Status → identified. Leading theory: connection pool exhaustion introduced by v2.41.0.' },
        { id: 'ev-6', at: iso(-40), kind: 'status_change', actor: 'Dana Whitfield', message: 'Status → mitigating. Weighing rollback vs. acquirer failover.' },
      ],
    },
    {
      id: 'INC-4822', title: "Recommendations carousel renders empty for logged-in web users bucketed into the 'personalised-ranking-v3' experiment who have fewer than three prior orders", severity: 'SEV4', status: 'investigating', affectedServices: ['recommendations-api'], commander: null, startedAt: iso(-35), resolvedAt: null, version: 2, latestInvestigationId: null,
      summary: 'Homepage "Picked for you" carousel returns zero items for a cohort of roughly 3% of logged-in sessions. The ranking service responds 200 with an empty list; no errors are logged at WARN or above.',
      customerImpact: 'Cosmetic: empty carousel slot on homepage for ~3% of logged-in users. No revenue-path impact confirmed.',
      timeline: [
        { id: 'ev-1', at: iso(-35), kind: 'alert', actor: 'synthetic-monitor', message: 'homepage-reco-nonempty check failed 3/3 in eu-west-1 and us-east-1' },
        { id: 'ev-2', at: iso(-30), kind: 'note', actor: 'Sofia Lindqvist', message: 'Only affects experiment bucket B. Looking at cold-start fallback path.' },
      ],
    },
    {
      id: 'INC-4819', title: 'Search results stale — search-indexer consumer lag above 45 minutes', severity: 'SEV2', status: 'investigating', affectedServices: ['search-indexer', 'catalog-api'], commander: 'Marcus Oyelaran', startedAt: iso(-140), resolvedAt: null, version: 4, latestInvestigationId: 'INV-3307',
      summary: 'Consumer group search-indexer-prod is falling behind on the catalog.changes topic. Price and availability changes take 45–70 minutes to appear in search, while product pages (served by catalog-api) are current.',
      customerImpact: 'Customers see out-of-stock items and outdated prices in search results; add-to-cart then fails with a price-changed warning.',
      timeline: [
        { id: 'ev-1', at: iso(-140), kind: 'alert', actor: 'alertmanager', message: 'KafkaConsumerLagHigh firing: group=search-indexer-prod lag=182,400' },
        { id: 'ev-2', at: iso(-131), kind: 'status_change', actor: 'Marcus Oyelaran', message: 'Declared SEV2, status → investigating.' },
        { id: 'ev-3', at: iso(-118), kind: 'investigation', actor: 'Marcus Oyelaran', message: 'AI investigation INV-3307 started (est. $0.78)' },
        { id: 'ev-4', at: iso(-112), kind: 'investigation', actor: 'beacon', message: 'Investigation INV-3307 completed with 2 hypotheses' },
      ],
    },
    {
      id: 'INC-4817', title: 'iOS app 7.12 users logged out repeatedly — token refresh returning 401', severity: 'SEV2', status: 'identified', affectedServices: ['auth-service'], commander: 'Dana Whitfield', startedAt: iso(-210), resolvedAt: null, version: 5, latestInvestigationId: null,
      summary: 'iOS 7.12 sends the rotated refresh token before the previous rotation is committed, and auth-service treats the reuse as token theft, revoking the whole session family.',
      customerImpact: 'About 22% of iOS 7.12 sessions are forced to log in again every 15–30 minutes. Android and web unaffected.',
      timeline: [
        { id: 'ev-1', at: iso(-210), kind: 'alert', actor: 'alertmanager', message: 'AuthRefreshFailureRate firing: 4.1% (> 1% for 10m)' },
        { id: 'ev-2', at: iso(-195), kind: 'status_change', actor: 'Dana Whitfield', message: 'Declared SEV2, status → investigating.' },
        { id: 'ev-3', at: iso(-150), kind: 'status_change', actor: 'Dana Whitfield', message: 'Status → identified. Refresh-token reuse detection triggering on concurrent refresh from iOS 7.12.' },
      ],
    },
    {
      id: 'INC-4815', title: 'Warehouse stock counts drifting — inventory-sync batch jobs retrying on ledger-db deadlocks', severity: 'SEV3', status: 'mitigating', affectedServices: ['inventory-sync', 'ledger-db'], commander: 'Hana Kobayashi', startedAt: iso(-380), resolvedAt: null, version: 6, latestInvestigationId: null,
      summary: 'Nightly reconciliation overlapped with the hourly delta job; both take row locks on stock_levels in different orders, producing deadlocks and exponential retry backoff.',
      customerImpact: 'Around 1,200 SKUs show stale stock counts; small risk of overselling on low-stock items.',
      timeline: [
        { id: 'ev-1', at: iso(-380), kind: 'alert', actor: 'alertmanager', message: 'InventorySyncBacklog firing: 14 batches pending' },
        { id: 'ev-2', at: iso(-300), kind: 'status_change', actor: 'Hana Kobayashi', message: 'Status → mitigating. Pausing hourly delta job while nightly run drains.' },
      ],
    },
    {
      id: 'INC-4812', title: 'Duplicate push notifications for order-shipped events', severity: 'SEV3', status: 'investigating', affectedServices: ['notifications-worker'], commander: null, startedAt: iso(-55), resolvedAt: null, version: 1, latestInvestigationId: null,
      summary: 'Some customers receive the "Your order has shipped" push notification two to four times.',
      customerImpact: 'Annoyance; a handful of app-store reviews mention it. No incorrect content.',
      timeline: [{ id: 'ev-1', at: iso(-55), kind: 'alert', actor: 'support-bot', message: '12 tickets tagged duplicate-notification in the last hour' }],
    },
    {
      id: 'INC-4809', title: 'Elevated p99 latency for WebP thumbnails from image-resizer', severity: 'SEV4', status: 'identified', affectedServices: ['image-resizer'], commander: 'Luis Ferreira', startedAt: iso(-600), resolvedAt: null, version: 3, latestInvestigationId: null,
      summary: 'libvips upgrade disabled SIMD for WebP encoding on the arm64 node pool.',
      customerImpact: 'Product listing images load ~300ms slower on first view; CDN cache hides most of it.',
      timeline: [{ id: 'ev-1', at: iso(-600), kind: 'alert', actor: 'alertmanager', message: 'ImageResizerLatencyP99 firing: 1.2s' }],
    },
    {
      id: 'INC-4803', title: 'Partial outage: expired TLS certificate on edge-proxy pool eu-central', severity: 'SEV1', status: 'resolved', affectedServices: ['edge-proxy'], commander: 'Dana Whitfield', startedAt: iso(-2980), resolvedAt: iso(-2890), version: 11, latestInvestigationId: null,
      summary: 'cert-manager renewal failed silently for the eu-central listener after an ACME account key rotation.',
      customerImpact: 'About 30% of eu-central requests failed TLS handshake for 90 minutes.',
      timeline: [
        { id: 'ev-1', at: iso(-2980), kind: 'alert', actor: 'alertmanager', message: 'EdgeTLSHandshakeErrors firing' },
        { id: 'ev-2', at: iso(-2930), kind: 'remediation', actor: 'Dana Whitfield', message: 'RM-941 executed (EX-7702): restarted edge-proxy eu-central pods with renewed certificate' },
        { id: 'ev-3', at: iso(-2890), kind: 'status_change', actor: 'Dana Whitfield', message: 'Status → resolved.' },
      ],
    },
    {
      id: 'INC-4798', title: 'ledger-db replica lag caused stale order-history reads', severity: 'SEV2', status: 'resolved', affectedServices: ['ledger-db'], commander: 'Hana Kobayashi', startedAt: iso(-7200), resolvedAt: iso(-7080), version: 8, latestInvestigationId: null,
      summary: 'Long-running analytics query on replica-2 held back WAL replay.',
      customerImpact: 'Order history showed missing recent orders for up to 12 minutes.',
      timeline: [
        { id: 'ev-1', at: iso(-7200), kind: 'alert', actor: 'alertmanager', message: 'PostgresReplicaLag > 60s on ledger-db-replica-2' },
        { id: 'ev-2', at: iso(-7080), kind: 'status_change', actor: 'Hana Kobayashi', message: 'Status → resolved after cancelling query and adding statement_timeout.' },
      ],
    },
  ];
}

const prodEu = { environment: 'prod-eu', cluster: 'eks-eu-west-1-prod-a' };
const base = { mutating: true as const, requiresApproval: true as const, approval: null, lastExecutionId: null, version: 1, status: 'proposed' as const };

export function seedRemediations(): Remediation[] {
  return [
    { ...base, id: 'RM-901', incidentId: 'INC-4821', title: 'Roll back payments-gateway to v2.40.3', kind: 'rollback_deploy', target: { service: 'payments-gateway', ...prodEu }, risk: 'medium', reversible: true, expectedImpact: 'Restores the legacy connection pool; EU authorisation timeouts expected to clear within ~5 minutes of full rollout. Removes the 3DS2 frictionless-flow improvement shipped in v2.41.0 until re-released.', steps: ['Pause Argo Rollout payments-gateway', 'Set image tag to v2.40.3 (sha 9f1c2ab)', 'Progressive rollout 25% → 50% → 100% gated on auth_success_rate', 'Verify authorisation p99 < 800ms for 5 minutes'] },
    { ...base, id: 'RM-902', incidentId: 'INC-4821', title: 'Scale out checkout-api from 12 to 20 replicas', kind: 'scale_out', target: { service: 'checkout-api', ...prodEu }, risk: 'low', reversible: true, expectedImpact: 'Absorbs client retry storm while payments recover. Does not fix the root cause.', steps: ['Raise HPA minReplicas 12 → 20', 'Wait for new pods Ready', 'Confirm CPU saturation < 70%'] },
    { ...base, id: 'RM-903', incidentId: 'INC-4821', title: 'Enable flag eu-acquirer-failover (route EU card traffic to Worldpay)', kind: 'toggle_flag', target: { service: 'payments-gateway', ...prodEu }, risk: 'high', reversible: true, expectedImpact: 'Bypasses the failing Adyen pool entirely. Increases interchange cost by ~0.2% and may raise the 3DS challenge rate; Worldpay capacity has not been load-tested above 400 rps.', steps: ['Set flag eu-acquirer-failover = true for region eu', 'Watch Worldpay authorisation success rate for 3 minutes'] },
    { ...base, id: 'RM-911', incidentId: 'INC-4819', title: 'Scale out search-indexer consumers from 6 to 12', kind: 'scale_out', target: { service: 'search-indexer', environment: 'prod-eu', cluster: 'eks-eu-west-1-prod-b' }, risk: 'medium', reversible: true, expectedImpact: 'Doubles partition consumption throughput; lag should drain in ~25 minutes if OpenSearch bulk ingestion keeps up.', steps: ['Set deployment replicas 6 → 12', 'Wait for new consumers to join group and rebalance', 'Confirm consumer lag decreasing for 5 minutes'] },
    { ...base, id: 'RM-912', incidentId: 'INC-4819', title: 'Restart search-indexer pods to clear stuck partition assignment', kind: 'restart_pods', target: { service: 'search-indexer', environment: 'prod-eu', cluster: 'eks-eu-west-1-prod-b' }, risk: 'high', reversible: false, expectedImpact: 'Forces a consumer-group rebalance. Indexing pauses completely for 2–4 minutes; uncommitted offsets are re-processed.', steps: ['Rolling restart deployment search-indexer (maxUnavailable=2)', 'Confirm all partitions assigned'] },
    { ...base, id: 'RM-921', incidentId: 'INC-4817', title: 'Disable refresh-token reuse detection for iOS 7.12 clients', kind: 'toggle_flag', target: { service: 'auth-service', environment: 'prod-global', cluster: 'gke-auth-global' }, risk: 'medium', reversible: true, expectedImpact: 'Stops forced logouts for iOS 7.12. Temporarily weakens theft detection for that client version until the app hotfix (7.12.1) ships.', steps: ['Set flag auth.refresh-reuse-detection.ios-7-12 = false', 'Verify refresh 401 rate < 0.5% for 10 minutes'] },
    { ...base, id: 'RM-931', incidentId: 'INC-4815', version: 2, status: 'approved', approval: { approvalId: 'APR-5510', approvedBy: 'Hana Kobayashi', approvedAt: iso(-20) }, title: 'Restart inventory-sync workers after pausing delta job', kind: 'restart_pods', target: { service: 'inventory-sync', environment: 'prod-eu', cluster: 'eks-eu-west-1-prod-a' }, risk: 'low', reversible: false, expectedImpact: 'Releases held locks and resumes the nightly reconciliation from the last checkpoint.', steps: ['Scale inventory-sync-delta CronJob to suspended', 'Rolling restart inventory-sync workers', 'Confirm backlog decreasing'] },
    { ...base, id: 'RM-941', incidentId: 'INC-4803', version: 4, status: 'succeeded', approval: { approvalId: 'APR-5402', approvedBy: 'Dana Whitfield', approvedAt: iso(-2935) }, lastExecutionId: 'EX-7702', title: 'Restart edge-proxy eu-central pods to load renewed certificate', kind: 'restart_pods', target: { service: 'edge-proxy', environment: 'prod-eu', cluster: 'eks-eu-central-1-edge' }, risk: 'medium', reversible: false, expectedImpact: 'Pods pick up the manually renewed certificate; handshake errors stop.', steps: ['Rolling restart edge-proxy-eu-central', 'Verify TLS handshake error rate < 0.1%'] },
  ];
}

export function seedExecutions(): Execution[] {
  return [
    {
      id: 'EX-7702', remediationId: 'RM-941', incidentId: 'INC-4803', version: 5, status: 'succeeded', requestedBy: 'Dana Whitfield', approvalId: 'APR-5402', queuedAt: iso(-2932),
      steps: [
        { index: 0, title: 'Rolling restart edge-proxy-eu-central', status: 'succeeded', startedAt: iso(-2932), finishedAt: iso(-2929), output: 'deployment.apps/edge-proxy-eu-central restarted (18/18 pods Ready)' },
        { index: 1, title: 'Verify TLS handshake error rate < 0.1%', status: 'succeeded', startedAt: iso(-2929), finishedAt: iso(-2924), output: 'tls_handshake_error_ratio = 0.0004' },
      ],
      receipt: { executionId: 'EX-7702', startedAt: iso(-2932), finishedAt: iso(-2924), changes: [{ resource: 'deployment/edge-proxy-eu-central', field: 'spec.template.metadata.annotations.restartedAt', before: '—', after: iso(-2932) }], auditRef: 'audit://beacon/2026/EX-7702' },
    },
  ];
}

/** Server-side execution behaviour per remediation (which step fails, what it changes). */
export const executionPlans: Record<string, { failAtStep?: number; failOutput?: string; changes: ChangeRecord[] }> = {
  'RM-901': { changes: [{ resource: 'rollout/payments-gateway', field: 'spec.template.spec.containers[0].image', before: 'payments-gateway:v2.41.0', after: 'payments-gateway:v2.40.3' }] },
  'RM-902': { changes: [{ resource: 'hpa/checkout-api', field: 'spec.minReplicas', before: '12', after: '20' }] },
  'RM-903': { changes: [{ resource: 'flag/eu-acquirer-failover', field: 'enabled[region=eu]', before: 'false', after: 'true' }] },
  'RM-911': {
    failAtStep: 1,
    failOutput: 'Timed out after 300s waiting for consumers: 0/6 new pods Ready. 0/14 nodes are available: 14 Insufficient memory. Consumer group stuck in PreparingRebalance.',
    changes: [{ resource: 'deployment/search-indexer', field: 'spec.replicas', before: '6', after: '12' }],
  },
  'RM-912': { changes: [{ resource: 'deployment/search-indexer', field: 'spec.template.metadata.annotations.restartedAt', before: '—', after: 'now' }] },
  'RM-921': { changes: [{ resource: 'flag/auth.refresh-reuse-detection.ios-7-12', field: 'enabled', before: 'true', after: 'false' }] },
  'RM-931': { changes: [{ resource: 'cronjob/inventory-sync-delta', field: 'spec.suspend', before: 'false', after: 'true' }, { resource: 'deployment/inventory-sync', field: 'spec.template.metadata.annotations.restartedAt', before: '—', after: 'now' }] },
};

export function seedInvestigations(): Investigation[] {
  return [
    {
      id: 'INV-3307', incidentId: 'INC-4819', status: 'completed', model: 'rca-large-2026-06', startedAt: iso(-118), completedAt: iso(-112), estimatedCostUsd: 0.78, actualCostUsd: 0.71, error: null,
      hypotheses: hypotheses['INC-4819'],
    },
  ];
}

export const hypotheses: Record<string, Hypothesis[]> = {
  'INC-4821': [
    { id: 'h-1', summary: 'v2.41.0 reduced the Adyen HTTP client pool from 200 to 20 max connections and enabled keep-alive reuse; under EU peak load requests queue for a connection and exceed the 2s authorisation timeout.', confidence: 0.86, evidence: [
      { kind: 'deploy', ref: 'deploy:payments-gateway@v2.41.0', excerpt: 'refactor(acquirer): share HttpClient pool across acquirers; maxConnections=20' },
      { kind: 'metric', ref: 'metric:payments-gateway:saturation_pct', excerpt: 'connection pool utilisation at 100% from 3 minutes after rollout' },
      { kind: 'log', ref: 'log:payments-gateway:pgw-7c9d-eu-4', excerpt: 'WARN acquirer=adyen-eu pool exhausted, waited 1870ms for connection' },
      { kind: 'trace', ref: 'trace:4bf92f3577b34da6', excerpt: 'adyen.authorise 2004ms (error: deadline exceeded), 1.9s spent in pool.acquire' },
    ] },
    { id: 'h-2', summary: 'Retry storm from checkout-api (3 retries, no jitter) amplifies load on payments-gateway by up to 4x once timeouts begin.', confidence: 0.41, evidence: [
      { kind: 'metric', ref: 'metric:checkout-api:latency_p99_ms', excerpt: 'checkout-api p99 climbs to 6.4s, consistent with 3 sequential 2s retries' },
      { kind: 'log', ref: 'log:checkout-api:co-5f2a-eu-1', excerpt: 'retrying payment authorisation attempt=3 reason=UPSTREAM_TIMEOUT' },
    ] },
    { id: 'h-3', summary: 'Adyen EU endpoint degradation.', confidence: 0.07, evidence: [
      { kind: 'log', ref: 'log:payments-gateway:pgw-7c9d-eu-2', excerpt: 'INFO acquirer=adyen-eu healthcheck ok latency=41ms' },
    ] },
  ],
  'INC-4819': [
    { id: 'h-1', summary: 'One partition (catalog.changes-17) has a poison message (12 MB bundle update) that repeatedly fails OpenSearch bulk indexing, blocking the consumer that owns it and stalling offset commits.', confidence: 0.72, evidence: [
      { kind: 'log', ref: 'log:search-indexer:si-3', excerpt: 'ERROR bulk request rejected: content length 12.4MB exceeds http.max_content_length' },
      { kind: 'metric', ref: 'metric:search-indexer:error_rate_pct', excerpt: 'error rate flat at 16.7% (1 of 6 consumers failing)' },
    ] },
    { id: 'h-2', summary: 'Consumer throughput is insufficient for the Tuesday bulk price update volume.', confidence: 0.31, evidence: [
      { kind: 'metric', ref: 'metric:search-indexer:saturation_pct', excerpt: 'CPU at 88% on all consumers' },
    ] },
  ],
  'INC-4817': [
    { id: 'h-1', summary: 'iOS 7.12 fires two concurrent refresh requests on foreground; the second presents an already-rotated token and trips reuse detection.', confidence: 0.9, evidence: [
      { kind: 'log', ref: 'log:auth-service:auth-2', excerpt: 'WARN refresh token reuse detected family=rtf_… client=ios/7.12.0 action=revoke_family' },
      { kind: 'deploy', ref: 'deploy:ios-app@7.12.0', excerpt: 'Released to 100% of App Store users 3 days ago' },
    ] },
  ],
};

/** Default hypothesis used when an incident has no curated analysis in the mock. */
export const genericHypothesis = (incidentId: string, service: string): Hypothesis[] => [
  { id: 'h-1', summary: `Error and latency increase on ${service} correlates with the most recent configuration change; no single failing dependency identified.`, confidence: 0.38, evidence: [
    { kind: 'metric', ref: `metric:${service}:error_rate_pct`, excerpt: 'error rate above baseline for the incident window' },
    { kind: 'log', ref: `log:${service}:${incidentId}`, excerpt: 'repeated WARN entries during incident window' },
  ] },
];

/** Incidents for which the investigation pipeline fails (insufficient telemetry). */
export const failingInvestigations: Record<string, string> = {
  'INC-4809': 'Insufficient telemetry: image-resizer traces are sampled at 0.1% and no WebP-specific spans were found in the window.',
};

// ---------------------------------------------------------------- telemetry
export function logsFor(incidentId: string): LogEntry[] {
  const L = (m: number, service: string, level: LogEntry['level'], host: string, message: string, traceId: string | null = null): LogEntry => ({ ts: iso(m), service, level, host, message, traceId });
  switch (incidentId) {
    case 'INC-4821':
      return [
        L(-100, 'payments-gateway', 'info', 'pgw-7c9d-eu-1', 'Started PaymentsGatewayApplication v2.41.0 in 8.412s'),
        L(-99, 'payments-gateway', 'info', 'pgw-7c9d-eu-1', 'acquirer=adyen-eu pool initialised maxConnections=20 keepAlive=true'),
        L(-96, 'payments-gateway', 'warn', 'pgw-7c9d-eu-4', 'acquirer=adyen-eu pool exhausted, waited 1870ms for connection', '4bf92f3577b34da6'),
        L(-95, 'payments-gateway', 'error', 'pgw-7c9d-eu-4', 'authorise failed merchantRef=EU-8812731 error=DEADLINE_EXCEEDED after 2004ms', '4bf92f3577b34da6'),
        L(-95, 'checkout-api', 'warn', 'co-5f2a-eu-1', 'retrying payment authorisation attempt=2 reason=UPSTREAM_TIMEOUT orderId=o_91f2c', 'a1c09e22b7d4410f'),
        L(-94, 'checkout-api', 'warn', 'co-5f2a-eu-1', 'retrying payment authorisation attempt=3 reason=UPSTREAM_TIMEOUT orderId=o_91f2c', 'a1c09e22b7d4410f'),
        L(-94, 'checkout-api', 'error', 'co-5f2a-eu-1', 'order o_91f2c failed: PAYMENT_UNAVAILABLE (3 attempts, 6.1s)', 'a1c09e22b7d4410f'),
        L(-90, 'payments-gateway', 'info', 'pgw-7c9d-eu-2', 'acquirer=adyen-eu healthcheck ok latency=41ms'),
        L(-80, 'payments-gateway', 'error', 'pgw-7c9d-eu-3', 'authorise failed merchantRef=EU-8813090 error=DEADLINE_EXCEEDED after 2001ms', 'e77d0a19c3b24a8e'),
        L(-72, 'payments-gateway', 'warn', 'pgw-7c9d-eu-2', 'circuit breaker adyen-eu HALF_OPEN → OPEN (failure ratio 0.44 over 200 calls)'),
        L(-60, 'checkout-api', 'info', 'co-5f2a-eu-3', 'HPA scaled checkout-api 10 → 12 replicas'),
        L(-45, 'payments-gateway', 'debug', 'pgw-7c9d-eu-1', 'pool stats acquirer=adyen-eu leased=20 pending=184 available=0'),
        L(-30, 'payments-gateway', 'error', 'pgw-7c9d-eu-4', 'authorise failed merchantRef=EU-8821442 error=DEADLINE_EXCEEDED after 2003ms', '0c55e1f0a2b94d11'),
        L(-12, 'checkout-api', 'error', 'co-5f2a-eu-2', 'order o_a7710 failed: PAYMENT_UNAVAILABLE (3 attempts, 6.3s) customerCountry=DE basketValue=EUR 312.40 items=7 paymentMethod=visa/3ds2 challengeFlow=frictionless', 'b9f3e0c1d2a54e67'),
      ];
    case 'INC-4819':
      return [
        L(-140, 'search-indexer', 'error', 'si-3', 'bulk request rejected: content length 12.4MB exceeds http.max_content_length (10MB) partition=17 offset=88213302'),
        L(-139, 'search-indexer', 'warn', 'si-3', 'retrying batch partition=17 offset=88213302 attempt=14 backoff=30s'),
        L(-120, 'search-indexer', 'info', 'si-1', 'committed offsets partitions=[0,1,2,3] lag=182400'),
        L(-60, 'catalog-api', 'info', 'cat-2', 'cache warm complete keys=412,003'),
        L(-20, 'search-indexer', 'error', 'si-3', 'bulk request rejected: content length 12.4MB exceeds http.max_content_length (10MB) partition=17 offset=88213302'),
      ];
    case 'INC-4817':
      return [
        L(-200, 'auth-service', 'warn', 'auth-2', 'refresh token reuse detected family=rtf_8c1… client=ios/7.12.0 action=revoke_family'),
        L(-190, 'auth-service', 'info', 'auth-1', 'issued access token client=android/7.12.0 ttl=900s'),
        L(-10, 'auth-service', 'warn', 'auth-3', 'refresh token reuse detected family=rtf_2ae… client=ios/7.12.0 action=revoke_family'),
      ];
    default: {
      const inc = seedIncidents().find((i) => i.id === incidentId);
      const svc = inc?.affectedServices[0] ?? 'unknown';
      return [
        L(-50, svc, 'info', `${svc}-1`, 'health check ok'),
        L(-40, svc, 'warn', `${svc}-2`, 'request exceeded soft latency budget'),
        L(-30, svc, 'error', `${svc}-2`, 'upstream call failed: context deadline exceeded'),
      ];
    }
  }
}

export function tracesFor(incidentId: string): TraceSpan[] {
  const S = (m: number, traceId: string, spanId: string, service: string, operation: string, durationMs: number, errorMessage: string | null = null): TraceSpan => ({ traceId, spanId, service, operation, startedAt: iso(m), durationMs, status: errorMessage ? 'error' : 'ok', errorMessage });
  switch (incidentId) {
    case 'INC-4821':
      return [
        S(-96, '4bf92f3577b34da6', '00f067aa0ba902b7', 'payments-gateway', 'adyen.authorise', 2004, 'deadline exceeded (1.9s in pool.acquire)'),
        S(-95, 'a1c09e22b7d4410f', '5b1c8e7f2d3a4c60', 'checkout-api', 'POST /v2/orders/{id}/pay', 6120, 'PAYMENT_UNAVAILABLE'),
        S(-80, 'e77d0a19c3b24a8e', '9d2e4f6a8b0c1d3e', 'payments-gateway', 'adyen.authorise', 2001, 'deadline exceeded'),
        S(-44, '7a3c1e9b5d2f4a60', '1a2b3c4d5e6f7a8b', 'payments-gateway', 'adyen.authorise', 1780),
        S(-12, 'b9f3e0c1d2a54e67', '3c4d5e6f7a8b9c0d', 'checkout-api', 'POST /v2/orders/{id}/pay', 6310, 'PAYMENT_UNAVAILABLE'),
      ];
    case 'INC-4819':
      return [S(-139, 'c0ffee1234567890', 'aa11bb22cc33dd44', 'search-indexer', 'opensearch.bulk', 30112, '413 Request Entity Too Large')];
    default:
      return [];
  }
}

/** [baseline, peak, threshold] per metric for each affected service. */
export const metricProfiles: Record<string, Record<MetricName, [number, number, number | null]>> = {
  'payments-gateway': { latency_p99_ms: [420, 2010, 800], error_rate_pct: [0.3, 38, 2], saturation_pct: [35, 100, 85] },
  'checkout-api': { latency_p99_ms: [610, 6400, 1500], error_rate_pct: [0.5, 36, 2], saturation_pct: [48, 81, 85] },
  'search-indexer': { latency_p99_ms: [900, 30100, 5000], error_rate_pct: [0.1, 16.7, 5], saturation_pct: [55, 88, 85] },
  'catalog-api': { latency_p99_ms: [120, 140, 500], error_rate_pct: [0.05, 0.07, 1], saturation_pct: [30, 34, 85] },
  'auth-service': { latency_p99_ms: [85, 110, 300], error_rate_pct: [0.4, 4.1, 1], saturation_pct: [28, 31, 85] },
};
