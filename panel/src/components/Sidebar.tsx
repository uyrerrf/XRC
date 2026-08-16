import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Settings2, Smartphone, Wrench } from 'lucide-react';
import Logo from './Logo';
import { useDeviceStore } from '@/stores/devices';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/devices', label: 'Devices', icon: Smartphone, end: false },
  { to: '/builder', label: 'Builder', icon: Wrench, end: false },
  { to: '/settings', label: 'Settings', icon: Settings2, end: false },
  { to: '/logs', label: 'Logs', icon: ScrollText, end: false },
];

export default function Sidebar() {
  const devices = useDeviceStore((s) => s.devices);
  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-void flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
        <Logo />
        <div>
          <div className="font-black tracking-[0.25em] text-slate-100 text-lg leading-none">XRC</div>
          <div className="text-[10px] text-slate-500 tracking-[0.25em] mt-0.5">RED CELL RAT</div>
        </div>
      </div>
      <nav className="px-3 py-3 space-y-1 flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-widest text-slate-600 px-2 mb-2">OPERATIONS</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
        <div className="text-[10px] font-bold tracking-widest text-slate-600 px-2 mt-6 mb-2">DEVICES</div>
        {devices.length === 0 && (
          <div className="text-[11px] text-slate-600 px-2">no devices connected</div>
        )}
        {devices.slice(0, 20).map((d) => (
          <NavLink
            key={d.id}
            to={`/devices/${d.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors ${
                isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                d.status === 'online' ? 'bg-emerald-400' : d.status === 'frozen' ? 'bg-rose-400 blink' : 'bg-amber-400 blink'
              }`}
            />
            <span className="truncate flex-1">{d.name}</span>
            <span className="text-[10px] text-slate-600 font-mono">{d.battery}%</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-600">
        <div className="font-mono text-slate-400">XRC v1.0.0</div>
        <div className="mt-0.5">C2 gateway · encrypted WS</div>
      </div>
    </aside>
  );
}
