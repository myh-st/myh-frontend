/** BACKEND CONTRACT – Reporting API client. Do not edit. */
import { get, send } from './http';
import type {
  BreakdownDimension,
  BreakdownMetric,
  BreakdownResponse,
  Anomaly,
  CreateExportRequest,
  Dimensions,
  ExportJob,
  Granularity,
  Me,
  ReportFilters,
  StoreReport,
  TimeseriesResponse,
} from './types';

function qs(params: object): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  me: () => get<Me>('/api/me'),
  dimensions: () => get<Dimensions>('/api/reports/dimensions'),
  timeseries: (filters: ReportFilters & { granularity?: Granularity }) =>
    get<TimeseriesResponse>(`/api/reports/timeseries${qs(filters)}`),
  breakdown: (filters: ReportFilters & { dimension: BreakdownDimension; metric?: BreakdownMetric }) =>
    get<BreakdownResponse>(`/api/reports/breakdown${qs(filters)}`),
  anomalies: (filters: ReportFilters) => get<Anomaly[]>(`/api/reports/anomalies${qs(filters)}`),
  store: (id: string, range: { from: string; to: string }) =>
    get<StoreReport>(`/api/reports/stores/${encodeURIComponent(id)}${qs(range)}`),
  createExport: (body: CreateExportRequest) => send<ExportJob>('POST', '/api/exports', body),
  exportStatus: (id: string) => get<ExportJob>(`/api/exports/${encodeURIComponent(id)}`),
};
