import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { CaseDetail, CaseSummary, DecisionKind, ServiceType } from './api/types';

function CaseList() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [assignee, setAssignee] = useState<'all' | 'me'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.serviceTypes().then(setTypes);
  }, []);
  useEffect(() => {
    api.cases({ assignee }).then(setCases);
  }, [assignee]);

  return (
    <div style={{ width: 1280, padding: 20 }}>
      <h1>Cases</h1>
      <p>
        Show:{' '}
        <select data-testid="assignee-filter" value={assignee} onChange={(e) => setAssignee(e.target.value as 'all' | 'me')}>
          <option value="all">All cases</option>
          <option value="me">My cases</option>
        </select>
      </p>
      <table style={{ width: 1280 }}>
        <tbody>
          <tr>
            <td style={{ width: 150 }}>Case No.</td>
            <td style={{ width: 260 }}>Service</td>
            <td style={{ width: 330 }}>Applicant</td>
            <td style={{ width: 120 }}>State</td>
            <td style={{ width: 170 }}>Assignee</td>
            <td style={{ width: 125 }}>Submitted</td>
            <td style={{ width: 125 }}>SLA Due</td>
          </tr>
          {cases.map((c) => (
            <tr key={c.id} data-testid="case-row" onClick={() => navigate(`/cases/${c.id}`)}>
              <td>{c.id}</td>
              <td>{types.find((t) => t.id === c.serviceType)?.name.en}</td>
              <td>{c.applicantName.en ?? c.applicantName.th}</td>
              <td>{c.state}</td>
              <td>{c.assignee?.name.en}</td>
              <td>{c.submittedAt.slice(0, 10)}</td>
              <td style={{ color: c.slaStatus === 'breached' ? 'red' : c.slaStatus === 'due_soon' ? 'orange' : 'green' }}>
                {c.slaDueAt.slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CasePage() {
  const { caseId = '' } = useParams();
  const [c, setCase] = useState<CaseDetail | null>(null);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [message, setMessage] = useState('');
  const [decision, setDecision] = useState<DecisionKind>('approve');

  useEffect(() => {
    api.case(caseId).then(setCase);
    api.serviceTypes().then(setTypes);
  }, [caseId]);
  if (!c) return null;
  const type = types.find((t) => t.id === c.serviceType);

  const requestInfo = () => {
    const due = new Date(Date.now() + 7 * 86_400_000).toISOString();
    api.requestInfo(c.id, { version: c.version, items: [], messageTh: message, messageEn: message, responseDueAt: due }).then(setCase);
  };
  const decide = () => {
    const reason = window.prompt('Reason') || '';
    api.decide(c.id, { version: c.version, decision, reasonTh: reason, reasonEn: reason }).then(setCase);
  };

  return (
    <div style={{ width: 1280, padding: 20 }}>
      <h2>Case {c.id}</h2>
      <div>Service: {type?.name.en}</div>
      <div>State: {c.state}</div>
      <div>Applicant: {c.applicant.name.en ?? c.applicant.name.th}</div>
      <h3>Application</h3>
      {c.fields.map((f) => (
        <div key={f.key}>
          {f.label.en}: {f.value.en ?? f.value.th}
        </div>
      ))}
      <h3>Evidence</h3>
      {c.evidence.map((d) => (
        <div key={d.id}>
          {d.id} {d.kind} {d.name.en} {d.sizeKb}KB {d.uploadedAt} {String(d.verified)}
        </div>
      ))}
      <h3>Request info</h3>
      <textarea style={{ width: 600, height: 80 }} value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={requestInfo}>Send request</button>
      <h3>Decision</h3>
      <select value={decision} onChange={(e) => setDecision(e.target.value as DecisionKind)}>
        {type?.decisions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <button onClick={decide}>Submit decision</button>
      <Link to={`/cases/${c.id}/audit`}>Audit trail</Link>
    </div>
  );
}

function AuditPage() {
  const { caseId = '' } = useParams();
  const [c, setCase] = useState<CaseDetail | null>(null);
  useEffect(() => {
    api.case(caseId).then(setCase);
  }, [caseId]);
  if (!c) return null;
  return (
    <div style={{ width: 1280, padding: 20 }}>
      <h2>Audit trail {c.id}</h2>
      <table>
        <tbody>
          {c.audit.map((a) => (
            <tr key={a.id}>
              <td>{a.at}</td>
              <td>{a.actor.name.en}</td>
              <td>{a.action}</td>
              <td>{a.details.en}</td>
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
      <Route path="/" element={<Navigate to="/cases" replace />} />
      <Route path="/cases" element={<CaseList />} />
      <Route path="/cases/:caseId" element={<CasePage />} />
      <Route path="/cases/:caseId/audit" element={<AuditPage />} />
    </Routes>
  );
}
