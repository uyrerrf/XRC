import type {
  ApiRes,
  Command,
  DeviceInfo,
  DeviceSummary,
  LogEntry,
  StatsRes,
} from '@xrc/shared';

async function api<T = unknown>(path: string, init?: RequestInit): Promise<ApiRes<T>> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  let data: ApiRes<T> | null = null;
  try {
    data = (await res.json()) as ApiRes<T>;
  } catch {
    /* no body */
  }
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data ?? { success: true };
}

export const apiClient = {
  health: () => api<{ status: string; version: string }>('/api/health'),
  stats: () => api<StatsRes>('/api/stats'),
  devices: () => api<{ devices: DeviceSummary[]; total: number }>('/api/devices'),
  device: (id: string) => api<DeviceInfo>(`/api/devices/${id}`),
  logs: (deviceId?: string, kind?: string, limit = 200) => {
    const p = new URLSearchParams();
    if (deviceId) p.set('deviceId', deviceId);
    if (kind) p.set('kind', kind);
    p.set('limit', String(limit));
    return api<{ logs: LogEntry[] }>(`/api/logs?${p.toString()}`);
  },
  sendCommand: (deviceId: string, command: Command) =>
    api<{ accepted: boolean; queued: boolean }>(`/api/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify(command),
    }),
};
