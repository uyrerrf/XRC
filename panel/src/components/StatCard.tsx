export default function StatCard({
  label, value, accent = 'text-slate-100', sub,
}: {
  label: string;
  value: string | number;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-surface p-4">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold font-mono ${accent}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}
