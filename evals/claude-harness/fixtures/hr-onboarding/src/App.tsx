import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { Cohort, HireDetail, HireSummary, ManagerSummary, Me } from './api/types';

const colors: Record<string, string> = { on_track: 'green', at_risk: 'orange', blocked: 'red', completed: 'gray' };

function Header() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api.me().then(setMe);
  }, []);
  return (
    <div style={{ background: '#333', color: 'white', padding: 10, width: 1180 }}>
      <b>Arrive</b> <Link to="/hires" style={{ color: 'white' }}>Hires</Link> <Link to="/manager" style={{ color: 'white' }}>Manager</Link>
      <span style={{ float: 'right' }}>{me?.name}</span>
    </div>
  );
}

function HiresPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohort, setCohort] = useState('');
  const [hires, setHires] = useState<HireSummary[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.cohorts().then(setCohorts);
  }, []);
  useEffect(() => {
    api.hires({ cohort: cohort || undefined }).then(setHires);
  }, [cohort]);
  return (
    <div style={{ width: 1180, padding: 10 }}>
      <select data-testid="cohort-filter" value={cohort} onChange={(e) => setCohort(e.target.value)}>
        <option value="">All cohorts</option>
        {cohorts.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <table style={{ width: 1180 }}>
        <tbody>
          {hires.map((h) => (
            <tr key={h.id} data-testid="hire-row" onClick={() => navigate(`/hires/${h.id}`)}>
              <td style={{ width: 200 }}>{h.displayName}</td>
              <td style={{ width: 260 }}>{h.roleTitle}</td>
              <td>{h.department}</td>
              <td>{h.startDate}</td>
              <td>{h.manager.name}</td>
              <td style={{ width: 150 }}>
                <div style={{ width: 150, height: 8, background: '#eee' }}>
                  <div style={{ width: (150 * h.progress.done) / h.progress.total, height: 8, background: colors[h.status] }} />
                </div>
              </td>
              <td>{h.blockers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HirePage() {
  const { id = '' } = useParams();
  const [hire, setHire] = useState<HireDetail | null>(null);
  useEffect(() => {
    api.hire(id).then(setHire);
  }, [id]);
  if (!hire) return null;
  const pii = (
    <div style={{ fontSize: 12 }}>
      {hire.pii.legalName} | {hire.pii.personalEmail} | {hire.pii.phone} | DOB {hire.pii.dateOfBirth} | ID {hire.pii.nationalIdMasked}
    </div>
  );
  return (
    <div style={{ width: 1180, padding: 10 }}>
      {pii}
      <h2>{hire.displayName}</h2>
      <div>{hire.roleTitle} - {hire.department} - starts {hire.startDate}</div>
      <table style={{ width: 1180 }}>
        <tbody>
          {hire.tasks.map((t) => (
            <tr key={t.id}>
              <td>
                <input
                  type="checkbox"
                  data-testid="task-checkbox"
                  checked={t.status === 'done'}
                  onChange={(e) => api.updateTask(hire.id, t.id, { version: hire.version, status: e.target.checked ? 'done' : 'todo' }).then(setHire)}
                />
              </td>
              <td>{t.title}</td>
              <td>{t.category}</td>
              <td>{t.owner}</td>
              <td>{t.dueDate}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Documents</h3>
      <ul>
        {hire.documents.map((d) => (
          <li key={d.id}>{d.name} - {d.status}</li>
        ))}
      </ul>
      {hire.exceptions.filter((x) => !x.resolved).map((x) => (
        <div key={x.id} style={{ color: 'red' }}>{x.message}</div>
      ))}
      <hr />
      {pii}
    </div>
  );
}

function ManagerPage() {
  const [data, setData] = useState<ManagerSummary | null>(null);
  useEffect(() => {
    api.managerSummary().then(setData);
  }, []);
  return (
    <div style={{ width: 1180, padding: 10 }}>
      {data?.items.map((i) => (
        <div key={i.hireId} style={{ borderLeft: `6px solid ${colors[i.status]}`, padding: 6, margin: 4 }}>
          {i.displayName} ({i.roleTitle}) - {i.blockers} - {i.nextAction?.label}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/hires" replace />} />
        <Route path="/hires" element={<HiresPage />} />
        <Route path="/hires/:id" element={<HirePage />} />
        <Route path="/manager" element={<ManagerPage />} />
      </Routes>
    </>
  );
}
