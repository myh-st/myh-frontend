/** BACKEND CONTRACT – generated from the Reporting API OpenAPI spec. Do not edit. */
export type Role = 'analyst' | 'regional_manager' | 'viewer';
export type Permission = 'reports:read' | 'exports:create';
export type Granularity = 'day' | 'week';
export type Segment = 'online' | 'in_store' | 'loyalty' | 'new_customers';
export type BreakdownDimension = 'region' | 'store' | 'category';
export type BreakdownMetric = 'revenue' | 'marginPct' | 'conversion' | 'returnsRate';
export type AnomalyMetric = 'revenue' | 'grossMargin' | 'conversionRate' | 'returnsRate' | 'orders';
export type StoreFormat = 'flagship' | 'mall' | 'outlet' | 'online_hub';
export type StoreStatus = 'open' | 'remodeling' | 'temporarily_closed';
export type ExportFormat = 'csv' | 'xlsx';
export type ExportStatus = 'queued' | 'running' | 'ready' | 'failed';

export interface Me {
  id: string;
  name: string;
  role: Role;
  /** Region ids this user may see. Analysts and viewers see every region; regional managers only their own. */
  regions: string[];
  permissions: Permission[];
}

export interface Region {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
  /** Region id */
  region: string;
  format: StoreFormat;
  status: StoreStatus;
  /** ISO date (YYYY-MM-DD) */
  openedOn: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface SegmentOption {
  id: Segment;
  name: string;
  description: string;
}

export interface DateRange {
  /** ISO date, inclusive */
  from: string;
  /** ISO date, inclusive */
  to: string;
}

export interface Dimensions {
  regions: Region[];
  stores: Store[];
  categories: Category[];
  segments: SegmentOption[];
  /** Dates for which sales data can be queried (max 180 days per request). */
  availableRange: DateRange;
  defaultRange: DateRange;
  currency: 'USD';
  /** Snapshot id of the reporting warehouse. Required when creating exports. */
  dataVersion: number;
  refreshedAt: string;
}

export interface ReportFilters {
  from: string;
  to: string;
  region?: string;
  store?: string;
  category?: string;
  segment?: Segment;
}

export interface DataQuality {
  status: 'complete' | 'partial';
  /** Store ids whose data is missing from this response. */
  missingStores: string[];
  note: string | null;
}

export interface MetricValues {
  /** USD */
  revenue: number;
  /** Fraction 0–1 (e.g. 0.412 = 41.2%) */
  grossMargin: number;
  /** Fraction 0–1: orders / visits */
  conversionRate: number;
  /** Fraction 0–1: returned value / revenue */
  returnsRate: number;
  orders: number;
}

export interface TimeseriesPoint extends MetricValues {
  /** ISO date. For `week` granularity this is the Monday that starts the bucket. */
  date: string;
}

export interface TimeseriesResponse {
  granularity: Granularity;
  range: DateRange;
  /** Prior period of equal length immediately preceding `range`. */
  comparisonRange: DateRange;
  points: TimeseriesPoint[];
  /** Same number of buckets as `points`, aligned by index. */
  comparisonPoints: TimeseriesPoint[];
  totals: MetricValues;
  comparisonTotals: MetricValues;
  dataQuality: DataQuality;
  dataVersion: number;
}

export interface BreakdownRow {
  key: string;
  label: string;
  /** USD */
  revenue: number;
  /** Percentage 0–100 with one decimal (e.g. 41.2) */
  marginPct: number;
  /** Fraction 0–1 */
  conversion: number;
  /** Fraction 0–1 */
  returnsRate: number;
  orders: number;
  /**
   * Relative change of the requested `metric` versus the prior period of equal length,
   * as a fraction (0.042 = +4.2%). `null` when there is no prior-period data.
   */
  deltaVsPrior: number | null;
}

export interface BreakdownResponse {
  dimension: BreakdownDimension;
  metric: BreakdownMetric;
  range: DateRange;
  /** Sorted by `metric`, descending. */
  rows: BreakdownRow[];
  dataQuality: DataQuality;
  dataVersion: number;
}

export interface Anomaly {
  id: string;
  metric: AnomalyMetric;
  scope: { dimension: 'region' | 'store' | 'category' | 'segment'; key: string; label: string };
  /** ISO date the anomaly was first detected */
  date: string;
  direction: 'up' | 'down';
  /** Size of the deviation from the expected value, in percent (e.g. 212 = 212% above expected). */
  magnitudePct: number;
  explanation: string;
}

export interface StoreDetail extends Store {
  regionName: string;
  manager: string;
  address: string;
  notes: string;
}

export interface StoreReport {
  store: StoreDetail;
  range: DateRange;
  totals: MetricValues;
  /** `null` when the store has no data for the prior period (e.g. recently opened). */
  comparisonTotals: MetricValues | null;
  /** One row per category, sorted by revenue descending. */
  categories: BreakdownRow[];
  dataQuality: DataQuality;
  dataVersion: number;
}

export interface CreateExportRequest {
  filters: ReportFilters;
  format: ExportFormat;
  /** `dataVersion` the user was looking at. 409 STALE_VERSION if the warehouse has refreshed since. */
  dataVersion: number;
}

export interface ExportJob {
  exportId: string;
  status: ExportStatus;
  format: ExportFormat;
  createdAt: string;
  /** Filters after server-side normalisation and permission scoping. */
  filtersApplied: ReportFilters & { regions: string[] };
  dataVersion: number;
  /** Set once the job is `ready`. */
  rowCount: number | null;
  /** Signed URL, set once the job is `ready`. Expires after 15 minutes. */
  downloadUrl: string | null;
  error: { code: string; message: string } | null;
}
