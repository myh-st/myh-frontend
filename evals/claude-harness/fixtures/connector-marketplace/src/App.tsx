import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api, isOAuthPending } from './api/client';
import type { Connection, ConnectionDetail, ConnectorType, Direction, Me } from './api/types';

const dot = (s: string) => (s === 'connected' ? 'green' : s === 'degraded' ? 'orange' : s === 'expired' ? 'red' : 'gray');

function ConnectionList() {
  const [me, setMe] = useState<Me | null>(null);
  const [catalog, setCatalog] = useState<ConnectorType[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState('');
  const [direction, setDirection] = useState('inbound');
  const [endpoint, setEndpoint] = useState('');
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState('');
  const navigate = useNavigate();

  const load = () => api.connections().then(setConnections);
  useEffect(() => {
    api.me().then(setMe);
    api.catalog().then(setCatalog);
    api.connections().then(setConnections);
  }, []);

  const selected = catalog.find((c) => c.type === type);

  const add = () => {
    api
      .create({
        type,
        displayName: name,
        scopes: scopes.split(',').map((s) => s.trim()),
        direction: direction as Direction,
        endpoint: endpoint || undefined,
        credentials: selected?.authMethod === 'oauth' ? undefined : creds,
      })
      .then((res) => {
        if (isOAuthPending(res)) window.open(res.authorizationUrl);
        setSaved(creds.apiKey || creds.password || creds.secretAccessKey || '');
        load();
      });
  };

  return (
    <div style={{ width: 1200, padding: 20 }}>
      <h1>Bridge Connectors</h1>
      <div style={{ fontSize: 12 }}>
        {me?.name} ({me?.role}) - {me?.orgName}
      </div>
      <table style={{ width: 1200, marginTop: 10 }}>
        <tbody>
          {connections.map((c) => (
            <tr key={c.id} data-testid="connection-row">
              <td style={{ width: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: dot(c.status) }} />
              </td>
              <td style={{ width: 300 }} onClick={() => navigate(`/connectors/${c.id}`)}>
                {c.displayName}
              </td>
              <td style={{ width: 120 }}>{catalog.find((t) => t.type === c.type)?.name}</td>
              <td style={{ width: 280 }}>{c.account}</td>
              <td style={{ width: 90 }}>{c.direction}</td>
              <td style={{ width: 200 }}>{c.lastSuccessfulSyncAt}</td>
              <td>
                <button onClick={() => api.disconnect(c.id, c.version).then(load)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Add</h3>
      <div data-testid="add-connection-form" style={{ width: 400 }}>
        <div>
          type <select data-testid="connector-type-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="" />
            {catalog.map((c) => (
              <option key={c.type} value={c.type}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          displayName <input data-testid="add-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          scopes <input data-testid="add-scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} />
        </div>
        <div>
          direction <input value={direction} onChange={(e) => setDirection(e.target.value)} />
        </div>
        <div>
          endpoint <input data-testid="add-endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
        </div>
        {selected?.credentialFields.map((f) => (
          <div key={f.key}>
            {f.key}{' '}
            <input data-testid={`cred-${f.key}`} value={creds[f.key] ?? ''} onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })} />
          </div>
        ))}
        <button onClick={add}>Add</button>
        {saved && <div>Saved key: {saved}</div>}
      </div>
    </div>
  );
}

function ConnectionPage() {
  const { connectionId = '' } = useParams();
  const [c, setC] = useState<ConnectionDetail | null>(null);
  const load = () => api.connection(connectionId).then(setC);
  useEffect(() => {
    api.connection(connectionId).then(setC);
  }, [connectionId]);
  if (!c) return null;
  return (
    <div style={{ padding: 20, width: 800 }}>
      <h2>{c.displayName}</h2>
      <div>
        {c.type} / {c.account} / {c.direction} / v{c.version}
      </div>
      <div>scopes: {c.grantedScopes.join(', ')}</div>
      <div>last test: {c.lastTestAt} {c.lastTestResult}</div>
      {c.error && <div style={{ color: 'red' }}>{c.error.message}</div>}
      <button onClick={() => api.test(c.id).then((r) => alert(r.result)).then(load)}>Test</button>
      <button onClick={() => api.reauthorize(c.id).then((r) => (window.location.href = r.authorizationUrl))}>Reauthorize</button>
      <button onClick={() => api.reconnect(c.id, { version: c.version }).then(setC)}>Reconnect</button>
      <h3>Log</h3>
      {c.events.map((e, i) => (
        <div key={i}>
          {e.at} {e.kind} {e.actor} {e.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connectors" replace />} />
      <Route path="/connectors" element={<ConnectionList />} />
      <Route path="/connectors/:connectionId" element={<ConnectionPage />} />
    </Routes>
  );
}
