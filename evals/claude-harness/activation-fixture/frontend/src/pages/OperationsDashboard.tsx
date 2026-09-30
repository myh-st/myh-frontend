import { useEffect, useState } from 'react';
import { getJson, endpoints } from '../api';
type Item = { id: string; title: string; status: string; owner: string; updatedAt: string };
export default function OperationsDashboard() {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<Item[]>([]);
  useEffect(() => { getJson<Record<string, number>>(endpoints.opsSummary).then(setSummary); getJson<Item[]>(endpoints.opsQueue).then(setQueue); }, []);
  return (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
    {Object.entries(summary).map(([k, v]) => (<div key={k} style={{ width: 240, padding: 20, boxShadow: '0 8px 24px #0003', borderRadius: 20 }}><h3>{k}</h3><h1>{v}</h1></div>))}
    <div style={{ width: 1200 }}><h2>Queue</h2><table>{queue.map(q => <tr key={q.id} onClick={() => alert(q.id)}><td style={{ color: q.status === 'late' ? 'red' : 'green' }}>{q.title}</td><td>{q.owner}</td></tr>)}</table></div>
  </div>);
}
