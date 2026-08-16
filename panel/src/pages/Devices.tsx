import { useEffect } from 'react';
import DeviceCard from '@/components/DeviceCard';
import { useDeviceStore } from '@/stores/devices';

export default function Devices() {
  const devices = useDeviceStore((s) => s.devices);
  const load = useDeviceStore((s) => s.load);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(t);
  }, [load]);

  const byStatus = (s: string) => devices.filter((d) => d.status === s);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[11px] font-mono">
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-emerald-400">● online {byStatus('online').length}</span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-amber-400">⟳ reconnect {byStatus('offline').length}</span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-rose-400">⛔ frozen {byStatus('frozen').length}</span>
        <span className="ml-auto text-slate-600 text-xs">{devices.length} total registered</span>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface p-12 text-center text-sm text-slate-500">
          No devices connected yet.<br />
          <span className="text-xs text-slate-600 mt-2 block">
            Run <code className="text-cyan-300">npm run sim -w @xrc/server</code> to spawn a fake implant,
            or deploy an XRC APK once the builder is wired.
          </span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      )}
    </div>
  );
}
