import { useState } from 'react';
type Node = { id: string; x: number; y: number; label: string };
export default function WorkflowEditor() {
  const [nodes, setNodes] = useState<Node[]>([{ id: 'a', x: 40, y: 40, label: 'Trigger' }, { id: 'b', x: 260, y: 40, label: 'Approve' }]);
  return <svg width={1400} height={800}>{nodes.map(n => <g key={n.id} onMouseDown={() => setNodes([...nodes])}><rect x={n.x} y={n.y} width={160} height={60} fill="#eef" /><text x={n.x + 10} y={n.y + 35}>{n.label}</text></g>)}</svg>;
}
