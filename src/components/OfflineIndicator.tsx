import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return isOnline ? null : (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-mono-tech text-slate-950 shadow-2xl animate-pulse border border-amber-300">
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span className="font-bold">OFFLINE SOVEREIGN MODE</span>
      <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-slate-950">Local Enclave Active</span>
    </div>
  );
};
