import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { Execution, IncidentDetail, IncidentSummary, Investigation, LogEntry, Me, MetricsResponse, Remediation, Service, TraceSpan } from './api/types';

function Nav() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api.me().then(setMe);
  }, []);
  return (
    <div style={{ background: '#222', color: '#fff', padding: 8, width: 1200 }}>
      <b>Beacon</b> <Link to="/incidents" style={{ color: '#fff' }}>Incidents</Link> <Link to="/services" style={{ color: '#fff' }}>Services</Link>
      <span style={{ float: 'right' }}>{me?.name} ({me?.role})</span>
    </div>
  );
}

function IncidentList() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    api.incidents({ status: (status || undefined) as IncidentSummary['status'] | undefined }).then(setIncidents);
  }, [status]);
  return (
    <div style={{ width: 1200, padding: 20 }}>
      <h1>Incidents</h1>
      <select data-testid="status-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All</option>
        {['investigating', 'identified', 'mitigating', 'resolved'].map((s) => <option key={s}>{s}</option>)}
      </select>
      <table>
        <tbody>
          {incidents.map((i) => (
            <tr key={i.id} data-testid="incident-row" onClick={() => navigate(`/incidents/${i.id}`)}>
              <td style={{ background: i.severity === 'SEV1' ? 'red' : i.severity === 'SEV2' ? 'orange' : 'white', width: 10 }} />
              <td>{i.id}</td>
              <td style={{ width: 600 }}>{i.title}</td>
              <td>{i.status}</td>
              <td>{i.affectedServices.join(',')}</td>
              <td>{i.commander}</td>
              <td>{i.startedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    api.services().then(setServices);
  }, []);
  return (
    <div style={{ width: 900, padding: 20 }}>
      <h1>Services</h1>
      {services.map((s) => (
        <div key={s.id} data-testid="service-row" style={{ padding: 4, borderBottom: '1px solid #eee' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: s.health === 'healthy' ? 'green' : s.health === 'degraded' ? 'orange' : 'red' }} />{' '}
          {s.name} – {s.owningTeam} – {s.onCall.name} – T{s.tier} – {s.slo.current}%
        </div>
      ))}
    </div>
  );
}

function IncidentPage() {
  const { id = '' } = useParams();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);

  useEffect(() => {
    api.incident(id).then(setIncident);
    api.logs(id).then(setLogs);
    api.metrics(id).then(setMetrics);
    api.traces(id).then(setTraces);
    api.remediations(id).then(setRemediations);
  }, [id]);

  const investigate = async () => {
    const r = await api.startInvestigation(id, { version: incident!.version });
    const t = setInterval(async () => {
      const inv = await api.investigation(r.investigationId);
      setInvestigation(inv);
      if (inv.status !== 'running') clearInterval(t);
    }, 2000);
  };

  const run = async (r: Remediation) => {
    const approved = await api.approveRemediation(r.id, { version: r.version });
    const res = await api.executeRemediation(r.id, { version: approved.version, approvalId: approved.approval!.approvalId });
    const t = setInterval(async () => {
      const ex = await api.execution(res.executionId);
      setExecution(ex);
      if (ex.status !== 'queued' && ex.status !== 'running') clearInterval(t);
    }, 2000);
  };

  if (!incident) return null;
  return (
    <div style={{ padding: 20, width: 1200 }}>
      <h2>
        {incident.id} [{incident.severity}] {incident.title}
      </h2>
      <div>Status: {incident.status} | Commander: {incident.commander}</div>
      <p>{incident.summary}</p>
      <button onClick={investigate}>Investigate</button>
      {investigation && (
        <div>
          Investigation {investigation.id}: {investigation.status}
          {investigation.hypotheses.map((h) => (
            <div key={h.id}>
              {Math.round(h.confidence * 100)}% {h.summary}
            </div>
          ))}
        </div>
      )}
      <h3>Remediations</h3>
      {remediations.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: 6, margin: 4, width: 700 }}>
          {r.title} ({r.risk}) <button onClick={() => run(r)}>Run</button>
        </div>
      ))}
      {execution && <div>Execution {execution.id}: {execution.status}</div>}
      <h3>Metrics</h3>
      {metrics?.series.map((s) => <div key={s.service + s.metric}>{s.service} {s.metric}: {s.points[s.points.length - 1]?.value}</div>)}
      <h3>Traces</h3>
      {traces.map((t) => <div key={t.spanId}>{t.service} {t.operation} {t.durationMs}ms {t.errorMessage}</div>)}
      <h3>Logs</h3>
      <pre style={{ width: 1100, overflow: 'scroll', background: '#f4f4f4' }}>{logs.map((l) => `${l.ts} ${l.level.toUpperCase()} ${l.service} ${l.message}`).join('\n')}</pre>
      <h3>Timeline</h3>
      {incident.timeline.map((e) => <div key={e.id}>{e.at} {e.actor}: {e.message}</div>)}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/incidents" replace />} />
        <Route path="/incidents" element={<IncidentList />} />
        <Route path="/incidents/:id" element={<IncidentPage />} />
        <Route path="/services" element={<ServiceList />} />
      </Routes>
    </>
  );
}
