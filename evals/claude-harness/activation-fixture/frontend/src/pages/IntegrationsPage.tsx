import { useEffect, useState } from 'react';
import { getJson, endpoints } from '../api';
type Integration = { id: string; name: string; status: 'ok' | 'degraded' | 'expired' | 'off'; scopes: string[]; lastSync?: string; error?: string };
export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  useEffect(() => { getJson<Integration[]>(endpoints.integrations).then(setItems); }, []);
  return <ul>{items.map(i => <li key={i.id}><span style={{ background: i.status === 'ok' ? 'green' : 'red', width: 8, height: 8, display: 'inline-block' }} />{i.name}<button>Reconnect</button></li>)}</ul>;
}
