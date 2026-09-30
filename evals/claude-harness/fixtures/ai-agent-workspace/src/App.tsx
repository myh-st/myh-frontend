import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client';
import type { ConversationSummary, Me, Message, RunDetail, WorkspaceScope } from './api/types';

const colors: Record<string, string> = {
  queued: '#999',
  running: 'blue',
  awaiting_approval: 'orange',
  completed: 'green',
  partially_failed: 'purple',
  failed: 'red',
  cancelled: '#ccc',
};

function Workspace() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [scope, setScope] = useState<WorkspaceScope | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    api.me().then(setMe);
    api.scope().then(setScope);
    api.conversations().then(setConversations);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    api.messages(conversationId).then((list) => {
      setMessages(list);
      const last = [...list].reverse().find((m) => m.runId);
      setRunId(last ? last.runId : null);
    });
  }, [conversationId]);

  useEffect(() => {
    if (!runId) return;
    api.run(runId).then(setRun);
    const t = setInterval(() => api.run(runId).then(setRun), 1500);
    return () => clearInterval(t);
  }, [runId]);

  const send = () => {
    if (!conversationId) return;
    api.postMessage(conversationId, { content: text, allowActions: true }).then((res) => {
      setText('');
      setRunId(res.runId);
      api.messages(conversationId).then(setMessages);
    });
  };

  const newConversation = () => {
    const title = window.prompt('Title');
    if (!title) return;
    api.createConversation({ title }).then((c) => {
      setConversations([c, ...conversations]);
      navigate(`/c/${c.id}`);
    });
  };

  const approveAll = () => {
    if (!run) return;
    run.proposedActions.forEach((a) => {
      api.approveAction(run.id, a.id, { version: a.version }).then(setRun);
    });
  };

  return (
    <div style={{ display: 'flex', width: 1200 }}>
      <div style={{ width: 260, borderRight: '1px solid #ccc', padding: 10 }}>
        <h2>Atlas</h2>
        <div style={{ fontSize: 11 }}>
          {scope?.tenant.name} · {me?.name}
        </div>
        <div style={{ fontSize: 11 }}>
          ${scope?.budget.usedUsd} / ${scope?.budget.limitUsd}
        </div>
        <button onClick={newConversation}>New</button>
        {conversations.map((c) => (
          <div
            key={c.id}
            data-testid="conversation-item"
            onClick={() => navigate(`/c/${c.id}`)}
            style={{ padding: 6, cursor: 'pointer', borderLeft: `4px solid ${c.lastRunStatus ? colors[c.lastRunStatus] : 'white'}`, fontWeight: c.id === conversationId ? 'bold' : 'normal' }}
          >
            {c.title}
          </div>
        ))}
      </div>
      <div style={{ width: 900, padding: 10 }}>
        {messages.map((m) => (
          <div key={m.id} data-testid="message" style={{ marginBottom: 12 }}>
            <b>{m.role}</b>: {m.content}
          </div>
        ))}
        {run && <div style={{ width: 12, height: 12, background: colors[run.status] }} />}
        {run && run.proposedActions.length > 0 && (
          <div>
            <pre data-testid="proposed-actions" style={{ fontSize: 11, background: '#f4f4f4' }}>
              {JSON.stringify(run.proposedActions, null, 2)}
            </pre>
            <button data-testid="approve-all" onClick={approveAll}>
              Approve all
            </button>
          </div>
        )}
        <textarea data-testid="composer-input" style={{ width: 880, height: 80 }} value={text} onChange={(e) => setText(e.target.value)} />
        <br />
        <button data-testid="send-button" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Workspace />} />
      <Route path="/c/:conversationId" element={<Workspace />} />
    </Routes>
  );
}
