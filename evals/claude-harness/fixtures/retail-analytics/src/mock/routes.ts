/** BACKEND-OWNED: Reporting API mock route handlers. Do not edit. */
import type { MockResponse, Route, Scenario } from './framework';
import type {
  Anomaly,
  BreakdownDimension,
  BreakdownMetric,
  BreakdownRow,
  DataQuality,
  ExportFormat,
  ExportJob,
  Me,
  MetricValues,
  ReportFilters,
  Role,
  Segment,
  TimeseriesPoint,
} from '../api/types';
import {
  AVAILABLE_FROM,
  DATA_END,
  DATA_VERSION,
  DEFAULT_RANGE,
  MAX_RANGE_DAYS,
  PARTIAL_MISSING_STORES,
  REFRESHED_AT,
  addDays,
  anomalies,
  categories,
  daysBetween,
  facts,
  regions,
  segments,
  stores,
  users,
  type Fact,
} from './data';

interface ExportRecord {
  job: ExportJob;
  polls: number;
  rowCount: number;
  failOnReady: { code: string; message: string } | null;
}

let session: Me = users.analyst;
let exportsById = new Map<string, ExportRecord>();
let nextExportId = 5301;

export function resetMockData() {
  session = users.analyst;
  exportsById = new Map();
  nextExportId = 5301;
}

/** Switch the signed-in mock user (dev/test only). */
export function setMockSession(role: Role) {
  session = users[role];
}

const factsByDate = new Map<string, Fact[]>();
for (const f of facts) {
  const list = factsByDate.get(f.date);
  if (list) list.push(f);
  else factsByDate.set(f.date, [f]);
}

const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id;

function currentUser(scenario: Scenario): Me {
  return scenario === 'forbidden' ? users.viewer : session;
}

function dataQuality(scenario: Scenario, storeIds: string[]): DataQuality {
  if (scenario !== 'partial') return { status: 'complete', missingStores: [], note: null };
  const missing = PARTIAL_MISSING_STORES.filter((id) => storeIds.includes(id));
  if (missing.length === 0) return { status: 'complete', missingStores: [], note: null };
  return {
    status: 'partial',
    missingStores: missing,
    note: `POS feed has not been received since 2026-09-26 03:00 UTC for ${missing.map(storeName).join(', ')}. Their sales are excluded from these figures; totals will be restated when the feed catches up.`,
  };
}

interface Scope {
  filters: ReportFilters;
  /** Stores whose data is included (already excludes missing stores in the `partial` scenario). */
  storeIds: string[];
  /** Stores in scope before exclusions, used for data-quality reporting. */
  scopedStoreIds: string[];
  regionIds: string[];
  days: number;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function resolveScope(get: (k: string) => string | null | undefined, user: Me, scenario: Scenario): Scope | MockResponse {
  const from = get('from');
  const to = get('to');
  if (!from || !to || !ISO.test(from) || !ISO.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    return err(422, 'VALIDATION', '`from` and `to` are required ISO dates (YYYY-MM-DD)');
  }
  if (from > to) return err(422, 'VALIDATION', '`from` must be on or before `to`');
  if (from < AVAILABLE_FROM || to > DATA_END) {
    return err(422, 'VALIDATION', `Data is available from ${AVAILABLE_FROM} to ${DATA_END}`);
  }
  const days = daysBetween(from, to) + 1;
  if (days > MAX_RANGE_DAYS) return err(422, 'VALIDATION', `Date range cannot exceed ${MAX_RANGE_DAYS} days`);

  const region = get('region') || undefined;
  const store = get('store') || undefined;
  const category = get('category') || undefined;
  const segment = (get('segment') || undefined) as Segment | undefined;

  if (region && !regions.some((r) => r.id === region)) return err(422, 'VALIDATION', `Unknown region ${region}`);
  if (region && !user.regions.includes(region)) return err(403, 'FORBIDDEN', 'You do not have access to this region');
  const storeRec = store ? stores.find((s) => s.id === store) : undefined;
  if (store && !storeRec) return err(422, 'VALIDATION', `Unknown store ${store}`);
  if (storeRec && !user.regions.includes(storeRec.region)) return err(403, 'FORBIDDEN', 'You do not have access to this store');
  if (storeRec && region && storeRec.region !== region) return err(422, 'VALIDATION', `Store ${store} is not in region ${region}`);
  if (category && !categories.some((c) => c.id === category)) return err(422, 'VALIDATION', `Unknown category ${category}`);
  if (segment && !segments.some((s) => s.id === segment)) return err(422, 'VALIDATION', `Unknown segment ${segment}`);

  const regionIds = user.regions.filter((r) => !region || r === region);
  const scopedStoreIds = stores.filter((s) => regionIds.includes(s.region) && (!store || s.id === store)).map((s) => s.id);
  const storeIds = scenario === 'partial' ? scopedStoreIds.filter((id) => !PARTIAL_MISSING_STORES.includes(id)) : scopedStoreIds;
  return { filters: { from, to, region, store, category, segment }, storeIds, scopedStoreIds, regionIds, days };
}

const isError = (x: Scope | MockResponse): x is MockResponse => 'status' in x;

/** Share of a store's sales attributed to a customer segment, plus behavioural adjustments. */
function segmentAdj(storeId: string, segment: Segment | undefined) {
  const none = { share: 1, visits: 1, marginPts: 0, returns: 1 };
  if (!segment) return none;
  const format = stores.find((s) => s.id === storeId)?.format;
  const hub = format === 'online_hub';
  const onlineShare = hub ? 1 : format === 'flagship' ? 0.22 : format === 'outlet' ? 0.08 : 0.16;
  switch (segment) {
    case 'online':
      return { share: onlineShare, visits: 1, marginPts: 0, returns: hub ? 1 : 1.6 };
    case 'in_store':
      return { share: 1 - onlineShare, visits: 1, marginPts: 0, returns: 1 };
    case 'loyalty':
      return { share: hub ? 0.33 : 0.41, visits: 0.6, marginPts: 0.02, returns: 0.9 };
    case 'new_customers':
      return { share: format === 'outlet' ? 0.19 : 0.12, visits: 1.5, marginPts: 0, returns: 1.2 };
  }
}

interface Acc {
  revenue: number;
  cost: number;
  visits: number;
  orders: number;
  returns: number;
  n: number;
}
const emptyAcc = (): Acc => ({ revenue: 0, cost: 0, visits: 0, orders: 0, returns: 0, n: 0 });

function add(acc: Acc, f: Fact, segment: Segment | undefined) {
  const s = segmentAdj(f.store, segment);
  acc.revenue += f.revenue * s.share;
  acc.cost += f.cost * s.share + f.revenue * s.share * s.marginPts;
  acc.visits += f.visits * s.share * s.visits;
  acc.orders += f.orders * s.share;
  acc.returns += f.returns * s.share * s.returns;
  acc.n += 1;
}

function toMetrics(a: Acc): MetricValues {
  return {
    revenue: round(a.revenue, 2),
    grossMargin: a.revenue ? round((a.revenue - a.cost) / a.revenue, 4) : 0,
    conversionRate: a.visits ? round(a.orders / a.visits, 4) : 0,
    returnsRate: a.revenue ? round(a.returns / a.revenue, 4) : 0,
    orders: Math.round(a.orders),
  };
}

function eachFact(scope: Scope, from: string, days: number, fn: (f: Fact, dayIndex: number) => void) {
  const { storeIds, filters } = scope;
  for (let i = 0; i < days; i++) {
    for (const f of factsByDate.get(addDays(from, i)) ?? []) {
      if (!storeIds.includes(f.store)) continue;
      if (filters.category && f.category !== filters.category) continue;
      fn(f, i);
    }
  }
}

const priorFrom = (scope: Scope) => addDays(scope.filters.from, -scope.days);

function breakdownRows(scope: Scope, dimension: BreakdownDimension, metric: BreakdownMetric): BreakdownRow[] {
  const keyOf = (f: Fact) =>
    dimension === 'store' ? f.store : dimension === 'category' ? f.category : (stores.find((s) => s.id === f.store)?.region ?? '');
  const cur = new Map<string, Acc>();
  const prev = new Map<string, Acc>();
  eachFact(scope, scope.filters.from, scope.days, (f) => {
    const k = keyOf(f);
    if (!cur.has(k)) cur.set(k, emptyAcc());
    add(cur.get(k) as Acc, f, scope.filters.segment);
  });
  eachFact(scope, priorFrom(scope), scope.days, (f) => {
    const k = keyOf(f);
    if (!prev.has(k)) prev.set(k, emptyAcc());
    add(prev.get(k) as Acc, f, scope.filters.segment);
  });
  const label = (k: string) =>
    dimension === 'store' ? storeName(k) : dimension === 'category' ? (categories.find((c) => c.id === k)?.name ?? k) : (regions.find((r) => r.id === k)?.name ?? k);
  const pick = (m: MetricValues) =>
    metric === 'revenue' ? m.revenue : metric === 'marginPct' ? m.grossMargin : metric === 'conversion' ? m.conversionRate : m.returnsRate;
  const rows = [...cur.entries()].map(([key, acc]): BreakdownRow => {
    const m = toMetrics(acc);
    const p = prev.get(key);
    const pm = p && p.revenue > 0 ? toMetrics(p) : null;
    const delta = pm && pick(pm) !== 0 ? round((pick(m) - pick(pm)) / pick(pm), 4) : null;
    return {
      key,
      label: label(key),
      revenue: m.revenue,
      marginPct: round(m.grossMargin * 100, 1),
      conversion: m.conversionRate,
      returnsRate: m.returnsRate,
      orders: m.orders,
      deltaVsPrior: delta,
    };
  });
  const sortVal = (r: BreakdownRow) => (metric === 'revenue' ? r.revenue : metric === 'marginPct' ? r.marginPct : metric === 'conversion' ? r.conversion : r.returnsRate);
  return rows.sort((a, b) => sortVal(b) - sortVal(a));
}

const METRICS: BreakdownMetric[] = ['revenue', 'marginPct', 'conversion', 'returnsRate'];
const DIMENSIONS: BreakdownDimension[] = ['region', 'store', 'category'];

function anomalyVisible(a: Anomaly, scope: Scope, user: Me): boolean {
  if (a.date < scope.filters.from || a.date > scope.filters.to) return false;
  const { dimension, key } = a.scope;
  const { region, store, category, segment } = scope.filters;
  if (dimension === 'region') return user.regions.includes(key) && (!region || key === region) && (!store || stores.find((s) => s.id === store)?.region === key);
  if (dimension === 'store') {
    const rec = stores.find((s) => s.id === key);
    return !!rec && user.regions.includes(rec.region) && (!region || rec.region === region) && (!store || key === store);
  }
  if (dimension === 'category') return !category || key === category;
  return !segment || key === segment;
}

function countRows(scope: Scope): number {
  let n = 0;
  eachFact(scope, scope.filters.from, scope.days, () => {
    n += 1;
  });
  return n;
}

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: currentUser(scenario) }) },
  {
    method: 'GET',
    pattern: '/api/reports/dimensions',
    handler: ({ scenario }) => {
      const user = currentUser(scenario);
      return {
        status: 200,
        body: {
          regions: regions.filter((r) => user.regions.includes(r.id)),
          stores: stores
            .filter((s) => user.regions.includes(s.region))
            .map(({ id, name, region, format, status, openedOn }) => ({ id, name, region, format, status, openedOn })),
          categories,
          segments,
          availableRange: { from: AVAILABLE_FROM, to: DATA_END },
          defaultRange: DEFAULT_RANGE,
          currency: 'USD',
          dataVersion: DATA_VERSION,
          refreshedAt: REFRESHED_AT,
        },
      };
    },
  },
  {
    method: 'GET',
    pattern: '/api/reports/timeseries',
    handler: ({ query, scenario }) => {
      const scope = resolveScope((k) => query.get(k), currentUser(scenario), scenario);
      if (isError(scope)) return scope;
      const granularity = query.get('granularity') || 'day';
      if (granularity !== 'day' && granularity !== 'week') return err(422, 'VALIDATION', '`granularity` must be day or week');
      const { from, to } = scope.filters;
      const pFrom = priorFrom(scope);
      // Buckets are aligned by index: day i of the range and day i of the prior period share a bucket.
      const firstMonday = addDays(from, -((new Date(`${from}T00:00:00Z`).getUTCDay() + 6) % 7));
      const bucketOf = (i: number) => (granularity === 'day' ? i : Math.floor((daysBetween(firstMonday, from) + i) / 7));
      const nBuckets = bucketOf(scope.days - 1) + 1;
      const cur = Array.from({ length: nBuckets }, emptyAcc);
      const prev = Array.from({ length: nBuckets }, emptyAcc);
      const curDates: string[] = [];
      const prevDates: string[] = [];
      const curTotal = emptyAcc();
      const prevTotal = emptyAcc();
      for (let i = 0; i < scope.days; i++) {
        const b = bucketOf(i);
        curDates[b] ??= granularity === 'day' ? addDays(from, i) : addDays(firstMonday, b * 7);
        prevDates[b] ??= addDays(pFrom, i);
      }
      if (scenario !== 'empty') {
        eachFact(scope, from, scope.days, (f, i) => {
          add(cur[bucketOf(i)], f, scope.filters.segment);
          add(curTotal, f, scope.filters.segment);
        });
        eachFact(scope, pFrom, scope.days, (f, i) => {
          add(prev[bucketOf(i)], f, scope.filters.segment);
          add(prevTotal, f, scope.filters.segment);
        });
      }
      const points = (accs: Acc[], dates: string[]): TimeseriesPoint[] =>
        scenario === 'empty' ? [] : accs.map((a, i) => ({ date: dates[i], ...toMetrics(a) }));
      return {
        status: 200,
        body: {
          granularity,
          range: { from, to },
          comparisonRange: { from: pFrom, to: addDays(from, -1) },
          points: points(cur, curDates),
          comparisonPoints: points(prev, prevDates),
          totals: toMetrics(curTotal),
          comparisonTotals: toMetrics(prevTotal),
          dataQuality: dataQuality(scenario, scope.scopedStoreIds),
          dataVersion: DATA_VERSION,
        },
      };
    },
  },
  {
    method: 'GET',
    pattern: '/api/reports/breakdown',
    handler: ({ query, scenario }) => {
      const scope = resolveScope((k) => query.get(k), currentUser(scenario), scenario);
      if (isError(scope)) return scope;
      const dimension = query.get('dimension') as BreakdownDimension;
      const metric = (query.get('metric') || 'revenue') as BreakdownMetric;
      if (!DIMENSIONS.includes(dimension)) return err(422, 'VALIDATION', '`dimension` must be region, store or category');
      if (!METRICS.includes(metric)) return err(422, 'VALIDATION', '`metric` must be revenue, marginPct, conversion or returnsRate');
      return {
        status: 200,
        body: {
          dimension,
          metric,
          range: { from: scope.filters.from, to: scope.filters.to },
          rows: scenario === 'empty' ? [] : breakdownRows(scope, dimension, metric),
          dataQuality: dataQuality(scenario, scope.scopedStoreIds),
          dataVersion: DATA_VERSION,
        },
      };
    },
  },
  {
    method: 'GET',
    pattern: '/api/reports/anomalies',
    handler: ({ query, scenario }) => {
      const user = currentUser(scenario);
      const scope = resolveScope((k) => query.get(k), user, scenario);
      if (isError(scope)) return scope;
      if (scenario === 'empty') return { status: 200, body: [] };
      const list = anomalies
        .filter((a) => anomalyVisible(a, scope, user))
        .map(({ effect: _e, ...a }) => a)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return { status: 200, body: list };
    },
  },
  {
    method: 'GET',
    pattern: '/api/reports/stores/:id',
    handler: ({ params, query, scenario }) => {
      const user = currentUser(scenario);
      const store = stores.find((s) => s.id === params.id);
      if (!store) return err(404, 'NOT_FOUND', 'Store not found');
      if (!user.regions.includes(store.region)) return err(403, 'FORBIDDEN', 'You do not have access to this store');
      const scope = resolveScope((k) => (k === 'from' || k === 'to' ? query.get(k) : k === 'store' ? store.id : undefined), user, scenario);
      if (isError(scope)) return scope;
      const cur = emptyAcc();
      const prev = emptyAcc();
      if (scenario !== 'empty') {
        eachFact(scope, scope.filters.from, scope.days, (f) => add(cur, f, undefined));
        eachFact(scope, priorFrom(scope), scope.days, (f) => add(prev, f, undefined));
      }
      return {
        status: 200,
        body: {
          store,
          range: { from: scope.filters.from, to: scope.filters.to },
          totals: toMetrics(cur),
          comparisonTotals: prev.n > 0 && prev.revenue > 0 ? toMetrics(prev) : null,
          categories: scenario === 'empty' ? [] : breakdownRows(scope, 'category', 'revenue'),
          dataQuality: dataQuality(scenario, scope.scopedStoreIds),
          dataVersion: DATA_VERSION,
        },
      };
    },
  },
  {
    method: 'POST',
    pattern: '/api/exports',
    handler: ({ body, scenario }) => {
      const user = currentUser(scenario);
      if (!user.permissions.includes('exports:create')) return err(403, 'FORBIDDEN', 'Your role does not permit exporting reports');
      const b = (body ?? {}) as { filters?: Record<string, unknown>; format?: string; dataVersion?: unknown };
      if (!b.filters || typeof b.filters !== 'object') return err(422, 'VALIDATION', '`filters` is required');
      if (b.format !== 'csv' && b.format !== 'xlsx') return err(422, 'VALIDATION', '`format` must be csv or xlsx');
      if (typeof b.dataVersion !== 'number') return err(422, 'VALIDATION', '`dataVersion` is required');
      const raw = b.filters;
      const scope = resolveScope((k) => (typeof raw[k] === 'string' ? (raw[k] as string) : undefined), user, scenario);
      if (isError(scope)) return scope;
      if (b.dataVersion !== DATA_VERSION) {
        return err(409, 'STALE_VERSION', `Report data was refreshed (version ${DATA_VERSION}) since you loaded it. Reload before exporting.`);
      }
      const dq = dataQuality(scenario, scope.scopedStoreIds);
      const exportId = `exp-${nextExportId++}`;
      const job: ExportJob = {
        exportId,
        status: 'queued',
        format: b.format as ExportFormat,
        createdAt: new Date().toISOString(),
        filtersApplied: { ...scope.filters, regions: scope.regionIds },
        dataVersion: DATA_VERSION,
        rowCount: null,
        downloadUrl: null,
        error: null,
      };
      exportsById.set(exportId, {
        job,
        polls: 0,
        rowCount: countRows(scope),
        failOnReady:
          dq.status === 'partial'
            ? { code: 'SOURCE_INCOMPLETE', message: `Export blocked: POS data is missing for ${dq.missingStores.map(storeName).join(', ')}. Exclude these stores with the store or region filter, or retry once the feed catches up.` }
            : null,
      });
      return { status: 202, body: job };
    },
  },
  {
    method: 'GET',
    pattern: '/api/exports/:id',
    handler: ({ params }) => {
      const rec = exportsById.get(params.id);
      if (!rec) return err(404, 'NOT_FOUND', 'Export not found');
      rec.polls += 1;
      if (rec.job.status === 'queued') rec.job = { ...rec.job, status: 'running' };
      else if (rec.job.status === 'running') {
        rec.job = rec.failOnReady
          ? { ...rec.job, status: 'failed', error: rec.failOnReady }
          : {
              ...rec.job,
              status: 'ready',
              rowCount: rec.rowCount,
              downloadUrl: `https://exports.reporting.storefront.example/${rec.job.exportId}.${rec.job.format}?sig=4f1c9a0e&expires=900`,
            };
      }
      return { status: 200, body: rec.job };
    },
  },
];
