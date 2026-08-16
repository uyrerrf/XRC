import type { ApiRes, Command, DeviceInfo, DeviceSummary, LogEntry, StatsRes } from '@xrc/shared';

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
  deviceEvents: (id: string, limit = 100) =>
    api<LogEntry[]>(`/api/devices/${id}/events?limit=${limit}`),
  logs: (params?: { type?: string; deviceId?: string; search?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.deviceId) q.set('deviceId', params.deviceId);
    if (params?.search) q.set('search', params.search);
    q.set('page', String(params?.page ?? 1));
    q.set('pageSize', String(params?.pageSize ?? 50));
    return api<{ logs: LogEntry[]; total: number }>(`/api/logs?${q}`);
  },
  clearLogs: () => api('/api/logs', { method: 'DELETE' }),
  sendCommand: (id: string, command: Command) =>
    api(`/api/devices/${id}/command`, { method: 'POST', body: JSON.stringify({ command }) }),
  bulkCommand: (deviceIds: string[], command: Command) =>
    api<{ id: string; delivered: boolean }[]>('/api/commands/bulk', {
      method: 'POST',
      body: JSON.stringify({ deviceIds, command }),
    }),
  deleteDevice: (id: string) => api(`/api/devices/${id}`, { method: 'DELETE' }),
};
