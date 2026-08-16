import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import type { Command, DeviceInfo, DeviceSummary, ImplantEvent, StatsRes } from '@xrc/shared';
import { apiClient } from '@/api/client';

interface DeviceState {
  devices: DeviceSummary[];
  detail: DeviceInfo | null;
  stats: StatsRes | null;
  events: (ImplantEvent & { localTs: number })[];
  socket: Socket | null;
  connected: boolean;
  busyCommandId: string | null;
  load: () => Promise<void>;
  select: (id: string) => Promise<void>;
  refreshDetail: () => Promise<void>;
  send: (id: string, command: Command) => Promise<boolean>;
  clearEvents: () => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  detail: null,
  stats: null,
  events: [],
  socket: null,
  connected: false,
  busyCommandId: null,

  load: async () => {
    try {
      const [dev, st] = await Promise.all([apiClient.devices(), apiClient.stats()]);
      set({ devices: dev.data?.devices ?? [], stats: st.data ?? null });
    } catch {
      /* keep previous state */
    }
  },

  select: async (id) => {
    set({ detail: null });
    try {
      const r = await apiClient.device(id);
      set({ detail: r.data ?? null });
    } catch {
      set({ detail: null });
    }
  },

  refreshDetail: async () => {
    const id = get().detail?.id;
    if (!id) return;
    try {
      const r = await apiClient.device(id);
      set({ detail: r.data ?? null });
    } catch {
      /* ignore */
    }
  },

  send: async (id, command) => {
    set({ busyCommandId: `${id}:${command.cmd}` });
    try {
      const r = await apiClient.sendCommand(id, command);
      return r.success;
    } catch {
      return false;
    } finally {
      set({ busyCommandId: null });
    }
  },

  clearEvents: () => set({ events: [] }),
}));

let socketInstance: Socket | null = null;

export function connectPanelSocket(): void {
  if (socketInstance) return;
  const socket = io({ transports: ['websocket'] });
  socketInstance = socket;
  useDeviceStore.setState({ socket });

  socket.on('connect', () => {
    useDeviceStore.setState({ connected: true });
    socket.emit('panel:hello');
    void useDeviceStore.getState().load();
  });
  socket.on('disconnect', () => useDeviceStore.setState({ connected: false }));
  socket.on('event', (evt: ImplantEvent) => {
    useDeviceStore.setState((s) => ({
      events: [{ ...evt, localTs: Date.now() }, ...s.events].slice(0, 200),
    }));
    void useDeviceStore.getState().load();
  });
  socket.on('device:status', () => void useDeviceStore.getState().load());
}
