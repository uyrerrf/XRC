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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-widest text-slate-500">
