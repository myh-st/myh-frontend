import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { AlertSummary, AuditEvent, CaseDetail, DecisionOutcome, Me, Severity } from './api/types';

const colors: Record<Severity, string> = { critical: '#d00', high: '#f80', medium: '#fc0', low: '#9c9' };

function AlertList() {
  const [me, setMe] = useState<Me | null>(null);
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [severity, setSeverity] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.me().then(setMe);
  }, []);
  useEffect(() => {
    api.alerts({ severity: (severity || undefined) as Severity | undefined }).then(setAlerts);
  }, [severity]);

  return (
    <div style={{ width: 1100, padding: 20 }}>
      <h1>Sentinel</h1>
      <div style={{ float: 'right' }}>{me?.name}</div>
      <p>
        Severity:{' '}
        <select data-testid="severity-filter" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All</option>
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </p>
      <table>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id} data-testid="alert-row" onClick={() => a.caseId && navigate(`/cases/${a.caseId}`)}>
              <td style={{ background: colors[a.severity], width: 10 }} />
              <td>{a.id}</td>
              <td style={{ width: 500 }}>{a.title}</td>
              <td>{a.confidence}</td>
              <td>{a.amount.amount}</td>
              <td>{a.customerRef}</td>
              <td>{a.caseId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CasePage() {
  const { id = '' } = useParams();
  const [c, setCase] = useState<CaseDetail | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [outcome, setOutcome] = useState<DecisionOutcome>('confirmed_fraud');

  useEffect(() => {
    api.case(id).then(setCase);
    api.audit(id).then(setAudit);
  }, [id]);

  if (!c) return null;

  const submit = () => {
    const rationale = prompt('Rationale?') || '';
    api.recordDecision(c.id, { version: c.version, outcome, rationale }).then((updated) => {
      setCase(updated);
      api.audit(id).then(setAudit);
    });
  };

  const freeze = () => {
    if (!window.confirm('Are you sure?')) return;
    const accountIds = c.relatedEntities.filter((e) => e.type === 'account').map((e) => e.id);
    api.requestFreeze(c.id, { version: c.version, accountIds, reason: 'Suspected fraud - freeze requested from case page' }).then(() => {
      api.case(id).then(setCase);
      api.audit(id).then(setAudit);
    });
  };

  return (
    <div style={{ width: 1100, padding: 20 }}>
      <h2>
        {c.id} {c.title}
      </h2>
      <div>
        {c.status} | {c.customerRef} | {c.assignee?.name}
      </div>
      <p>{c.hypothesis?.summary}</p>
      <table>
        <tbody>
          {c.transactions.map((t) => (
            <tr key={t.id} data-testid="txn-row" style={{ color: t.flagged ? 'red' : 'black' }}>
              <td>{t.at}</td>
              <td>{t.amount.amount}</td>
              <td>{t.channel}</td>
              <td>{t.counterparty.name}</td>
              <td>{t.device?.label}</td>
              <td>{t.geo?.city}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value as DecisionOutcome)}>
        <option value="confirmed_fraud">confirmed_fraud</option>
        <option value="not_fraud">not_fraud</option>
        <option value="needs_more_info">needs_more_info</option>
      </select>
      <button onClick={submit}>Submit</button>
      <button data-testid="freeze-button" onClick={freeze} style={{ background: 'red', color: 'white' }}>
        Freeze
      </button>
      <h3>Audit</h3>
      {audit.map((e) => (
        <div key={e.id}>
          {e.at} {e.actor.name} {e.action} {e.details}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/alerts" replace />} />
      <Route path="/alerts" element={<AlertList />} />
      <Route path="/cases/:id" element={<CasePage />} />
    </Routes>
  );
}
