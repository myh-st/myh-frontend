type Field = { name: string; extracted: string; confidence: number; sourcePage: number };
export default function RecordReview({ fields }: { fields: Field[] }) {
  return <table>{fields.map(f => <tr key={f.name}><td>{f.name}</td><td><input defaultValue={f.extracted} /></td><td>{f.confidence}</td><td>p.{f.sourcePage}</td></tr>)}</table>;
}
