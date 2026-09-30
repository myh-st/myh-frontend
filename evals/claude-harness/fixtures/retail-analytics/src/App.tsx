import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { Anomaly, BreakdownResponse, Dimensions, StoreReport, TimeseriesResponse } from './api/types';

function Box({ title, value }: { title: string; value: string }) {
  return (
    <div data-testid="metric-box" style={{ border: '1px solid #999', width: 230, height: 90, padding: 10 }}>
      <div>{title}</div>
      <div style={{ fontSize: 28 }}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-09-28');
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [ts, setTs] = useState<TimeseriesResponse | null>(null);
  const [regions, setRegions] = useState<BreakdownResponse | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.dimensions().then(setDims);
  }, []);
  useEffect(() => {
    api.timeseries({ from, to, granularity: 'day' }).then(setTs);
    api.breakdown({ from, to, dimension: 'region' }).then(setRegions);
    api.anomalies({ from, to }).then(setAnomalies);
  }, [from, to]);

  const doExport = () => {
    api.createExport({ filters: { from, to }, format: 'csv', dataVersion: ts ? ts.dataVersion : 0 }).then((job) => {
      alert('Export started: ' + job.exportId);
    });
  };

  return (
    <div style={{ width: 1000, padding: 20 }}>
      <h1>Storefront Insights</h1>
      <div>
        From <input data-testid="from-date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 100 }} /> To{' '}
        <input data-testid="to-date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 100 }} />{' '}
        <button data-testid="export-button" onClick={doExport}>
          Export
        </button>
      </div>
      {ts && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Box title="Revenue" value={'$' + ts.totals.revenue} />
          <Box title="Gross Margin" value={ts.totals.grossMargin * 100 + '%'} />
          <Box title="Conversion" value={ts.totals.conversionRate * 100 + '%'} />
          <Box title="Returns" value={ts.totals.returnsRate * 100 + '%'} />
        </div>
      )}
      <h3>Regions</h3>
      <table style={{ width: 700 }}>
        <tbody>
          <tr>
            <td>Region</td>
            <td>Revenue</td>
            <td>Margin</td>
            <td>Conv</td>
            <td>Returns</td>
            <td>Change</td>
          </tr>
          {regions?.rows.map((r) => (
            <tr key={r.key} data-testid="region-row">
              <td>{r.label}</td>
              <td>{r.revenue}</td>
              <td>{r.marginPct}</td>
              <td>{r.conversion}</td>
              <td>{r.returnsRate}</td>
              <td style={{ color: (r.deltaVsPrior ?? 0) < 0 ? 'red' : 'green' }}>{r.deltaVsPrior}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Anomalies</h3>
      {anomalies.map((a) => (
        <div key={a.id} data-testid="anomaly-item" style={{ color: 'red' }}>
          {a.date} {a.scope.label} {a.metric} {a.magnitudePct}
        </div>
      ))}
      <h3>Stores</h3>
      {dims?.stores.map((s) => (
        <div key={s.id} data-testid="store-link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/stores/${s.id}?from=${from}&to=${to}`)}>
          {s.name}
        </div>
      ))}
    </div>
  );
}

function StorePage() {
  const { id = '' } = useParams();
  const [report, setReport] = useState<StoreReport | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    api.store(id, { from: q.get('from') || '2026-07-01', to: q.get('to') || '2026-09-28' }).then(setReport);
  }, [id]);
  if (!report) return null;
  return (
    <div style={{ width: 1000, padding: 20 }}>
      <h2>{report.store.name}</h2>
      <div>
        {report.store.address} - {report.store.manager} - {report.store.status}
      </div>
      <p>{report.store.notes}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Box title="Revenue" value={'$' + report.totals.revenue} />
        <Box title="Gross Margin" value={report.totals.grossMargin * 100 + '%'} />
        <Box title="Conversion" value={report.totals.conversionRate * 100 + '%'} />
        <Box title="Returns" value={report.totals.returnsRate * 100 + '%'} />
      </div>
      <table style={{ width: 700, marginTop: 20 }}>
        <tbody>
          {report.categories.map((c) => (
            <tr key={c.key} data-testid="category-row">
              <td>{c.label}</td>
              <td>{c.revenue}</td>
              <td>{c.marginPct}</td>
              <td>{c.returnsRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stores/:id" element={<StorePage />} />
    </Routes>
  );
}
