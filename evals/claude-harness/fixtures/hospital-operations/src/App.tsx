import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { AlertDetail, AlertSummary, Ward } from './api/types';

function AlertList() {
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [ward, setWard] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.wards().then(setWards);
  }, []);
  useEffect(() => {
    api.alerts({ ward: ward || undefined }).then(setAlerts);
  }, [ward]);

  return (
    <div style={{ width: 1100, padding: 20 }}>
      <h1>Ward Ops</h1>
      <div style={{ display: 'flex', gap: 10 }}>
        {wards.map((w) => (
          <div key={w.id} style={{ border: '1px solid #ccc', padding: 10, width: 200 }}>
            <b>{w.name}</b>
            <div>Available: {w.beds.available}</div>
            <div>Waiting: {w.waitingAdmissions}</div>
          </div>
        ))}
      </div>
      <p>
        Ward:{' '}
        <select data-testid="ward-filter" value={ward} onChange={(e) => setWard(e.target.value)}>
          <option value="">All</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </p>
      <table>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id} data-testid="alert-row" onClick={() => navigate(`/alerts/${a.id}`)}>
              <td style={{ background: a.urgency === 'critical' ? 'red' : a.urgency === 'high' ? 'orange' : 'white', width: 10 }} />
              <td>{a.id}</td>
              <td>{a.title}</td>
              <td>{a.owner}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertPage() {
  const { id = '' } = useParams();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  useEffect(() => {
    api.alert(id).then(setAlert);
  }, [id]);
  if (!alert) return null;
  return (
    <div style={{ padding: 20 }}>
      <h2>
        {alert.id} {alert.title}
      </h2>
      <p>{alert.description}</p>
      <button onClick={() => api.acknowledge(alert.id, { version: alert.version }).then(setAlert)}>Ack</button>
      <button
        onClick={() => {
          const reason = prompt('Reason?') || '';
          api.escalate(alert.id, { version: alert.version, reason, target: alert.escalationTargets[0] }).then(setAlert);
        }}
      >
        Escalate
      </button>
      <h3>History</h3>
      {alert.handoffs.map((h, i) => (
        <div key={i}>
          {h.at} {h.from} → {h.to}: {h.note}
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
      <Route path="/alerts/:id" element={<AlertPage />} />
    </Routes>
  );
}
