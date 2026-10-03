import React from 'react';
import { 
  Shield, 
  Cpu, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Activity, 
  Terminal, 
  Layers, 
  Eye, 
  Database, 
  Zap,
  Lock,
  Download,
  Smartphone
} from 'lucide-react';
import { IntelligenceMode, SecurityLevel, SystemStatus } from '../types';
import { playTechBeep } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderHUDProps {
  activeTab: 'hud' | 'devices' | 'workflows' | 'memory' | 'vision' | 'diagnostics';
  setActiveTab: (tab: 'hud' | 'devices' | 'workflows' | 'memory' | 'vision' | 'diagnostics') => void;
  systemStatus: SystemStatus;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onSelectMode: (mode: IntelligenceMode) => void;
  onOpenPairing?: () => void;
  onOpenMobileSimulator?: () => void;
  isMobilePaired?: boolean;
  onOpenOfflineGuide?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  soundEnabled,
  setSoundEnabled,
  onSelectMode,
  onOpenPairing,
  onOpenMobileSimulator,
  isMobilePaired = false,
  onOpenOfflineGuide,
}) => {
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'hud', label: 'NEURAL CORE', icon: Activity },
    { id: 'devices', label: 'DEVICE MESH', icon: Wifi },
    { id: 'workflows', label: 'AUTOMATION', icon: Zap },
    { id: 'memory', label: 'LOCAL MEMORY', icon: Database },
    { id: 'vision', label: 'OPTICAL SENSORS', icon: Eye },
    { id: 'diagnostics', label: 'NPU TELEMETRY', icon: Cpu },
  ] as const;

  return (
    <header className="sticky top-0 z-40 px-4 lg:px-6 pt-4 pb-2">
      <div className="max-w-7xl mx-auto bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity & Frosted Badge */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <div className="w-5 h-5 border-2 border-white rounded-xs rotate-45 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                  JARVIS CORE
                </h1>
                <span className="text-[10px] uppercase font-mono-tech px-2 py-0.5 rounded-full bg-white/5 text-cyan-300 border border-white/10">
                  v4.2 LOCAL
                </span>
              </div>
              <p className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-semibold">
                Autonomous Intelligence System
              </p>
            </div>
          </div>

          {/* Model Selector Pill (Frosted Glass) */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <button
              onClick={() => {
                playTechBeep(1400, 0.03);
                onSelectMode('local_8b');
              }}
              className={`text-[11px] font-mono-tech px-2.5 py-1 rounded-lg transition-all ${
                systemStatus.modelMode === 'local_8b'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Locally hosted 8B Quantized Model (Zero latency, full privacy)"
            >
              8B Local
            </button>
            <button
              onClick={() => {
                playTechBeep(1400, 0.03);
                onSelectMode('local_14b');
              }}
              className={`text-[11px] font-mono-tech px-2.5 py-1 rounded-lg transition-all ${
                systemStatus.modelMode === 'local_14b'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Local 14B High-Density Neural Mesh (100% Free, Zero Cloud APIs, Full Privacy)"
            >
              14B Neural
            </button>
          </div>
        </div>

        {/* Center: Main Navigation Tabs (Frosted Capsules) */}
        <nav className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 scrollbar-none justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playTechBeep(1200, 0.03);
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-sans font-medium tracking-wide whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] font-semibold'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry & Controls */}
        <div className="flex items-center gap-5 text-xs font-mono-tech">
          {/* Uptime */}
          <div className="hidden lg:block text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Local Uptime</p>
            <p className="text-xs font-mono text-cyan-300">{formatUptime(systemStatus.uptimeSeconds)}</p>
          </div>

          {/* Security Status */}
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Status</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              SECURE / SOVEREIGN
            </p>
          </div>

          {/* Mobile & Bluetooth Real-Time Link Trigger */}
          {onOpenPairing && (
            <button
              onClick={() => {
                playTechBeep(1400, 0.03);
                onOpenPairing();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-sans font-semibold transition-all shadow-sm active:scale-95 ${
                isMobilePaired
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/30 text-cyan-200 hover:text-white'
              }`}
              title="Pair physical mobile phone via Wi-Fi/QR or connect Web Bluetooth devices"
            >
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{isMobilePaired ? 'MOBILE TETHERED' : 'MOBILE & BLE LINK'}</span>
            </button>
          )}

          {/* Offline APK & GitHub Pages Packaging Guide Launcher */}
          {onOpenOfflineGuide && (
            <button
              onClick={() => {
                playTechBeep(1400, 0.03);
                onOpenOfflineGuide();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-200 hover:text-white text-[11px] font-sans font-semibold transition-all shadow-sm active:scale-95"
              title="Publish to GitHub Pages or Build Offline Android APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">APK & GITHUB</span>
            </button>
          )}

          {/* In-App PWA / WebAPK Install Prompt Button */}
          <PWAInstallButton />

          {/* Audio Master Toggle (Frosted Glass Button) */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playTechBeep(900, 0.05);
            }}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-white/10 border-white/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? 'Synthesizer Audio Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
