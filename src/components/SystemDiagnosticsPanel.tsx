import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Thermometer, 
  Gauge, 
  Sliders, 
  Zap, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Server
} from 'lucide-react';
import { IntelligenceMode, SystemStatus } from '../types';
import { playTechBeep } from '../utils/audio';

interface SystemDiagnosticsPanelProps {
  systemStatus: SystemStatus;
  onSelectMode: (mode: IntelligenceMode) => void;
}

export const SystemDiagnosticsPanel: React.FC<SystemDiagnosticsPanelProps> = ({
  systemStatus,
  onSelectMode,
}) => {
  const vramPercent = Math.round((systemStatus.vramUsedGb / systemStatus.vramTotalGb) * 100);
  const contextPercent = Math.round((systemStatus.contextWindowTokens / systemStatus.maxContextTokens) * 100);

  const daemons = [
    { name: 'jarvis-neural-core.service', status: 'active', pid: 1420, mem: '14.2 GB', desc: 'Main LLM Context & Planning Daemon' },
    { name: 'ble-mesh-discovery.daemon', status: 'active', pid: 1438, mem: '140 MB', desc: 'Bluetooth 5.3 Beacon Scanner' },
    { name: 'zero-trust-auth.enforcer', status: 'active', pid: 1450, mem: '68 MB', desc: 'Hardware Token Challenge Cryptography' },
    { name: 'optical-vision-tracker.unit', status: 'active', pid: 1472, mem: '840 MB', desc: 'Real-time Object Segmentation & OCR' },
    { name: 'file-diff-sync.vault', status: 'active', pid: 1490, mem: '210 MB', desc: 'SHA-256 Sovereign Storage Integrity Engine' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-slate-100 tracking-wider uppercase">
              LOCAL NPU TELEMETRY & SYSTEM DIAGNOSTICS
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Real-time thermal metrics, quantized model weights, tensor throughput, and background daemons.
          </p>
        </div>

        {/* Intelligence Mode Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl text-xs font-sans">
          <button
            onClick={() => {
              playTechBeep(1300, 0.02);
              onSelectMode('local_8b');
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              systemStatus.modelMode === 'local_8b'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Local 8B Q4_K
          </button>
          <button
            onClick={() => {
              playTechBeep(1300, 0.02);
              onSelectMode('local_14b');
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              systemStatus.modelMode === 'local_14b'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Local 14B Heavy
          </button>
          <button
            onClick={() => {
              playTechBeep(1300, 0.02);
              onSelectMode('hybrid_gemini');
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              systemStatus.modelMode === 'hybrid_gemini'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gemini 3.7 Hybrid
          </button>
        </div>
      </div>

      {/* Primary Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* NPU Inference Load */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>NPU Tensor Load</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono-tech mb-2">
            {systemStatus.npuLoad}%
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              style={{ width: `${systemStatus.npuLoad}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech mt-2">
            Dedicated 45 TOPS Silicon Core
          </span>
        </div>

        {/* VRAM Allocation */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Unified VRAM Usage</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono-tech mb-2">
            {systemStatus.vramUsedGb} <span className="text-sm text-slate-400">/ {systemStatus.vramTotalGb} GB</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
              style={{ width: `${vramPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech mt-2">
            GGUF Q4_K_M Quantized Weights Cached
          </span>
        </div>

        {/* Inference Speed */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Generation Velocity</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300 font-mono-tech mb-2">
            {systemStatus.tokensPerSec} <span className="text-xs text-slate-400">tok/s</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
              style={{ width: `78%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech mt-2">
            Latency: ~14.6 ms to first token
          </span>
        </div>

        {/* Thermal & Clock */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Core Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono-tech mb-2">
            {systemStatus.temperatureC}°C
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
              style={{ width: `${(systemStatus.temperatureC / 85) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech mt-2">
            Cooling Fan: 1,420 RPM (Quiet Profile)
          </span>
        </div>
      </div>

      {/* Context Window & Background Daemons Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Context Window */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
              <span className="font-sans font-bold text-xs text-cyan-200 uppercase tracking-wider">
                ACTIVE CONTEXT WINDOW
              </span>
              <span className="text-[10px] font-mono-tech text-cyan-300">
                {systemStatus.contextWindowTokens} / {systemStatus.maxContextTokens} TOKENS
              </span>
            </div>

            <div className="space-y-3.5 text-xs font-mono-tech">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  style={{ width: `${contextPercent}%` }}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory Graph Tokens:</span>
                  <span className="text-slate-200">1,820</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Mesh State:</span>
                  <span className="text-slate-200">640</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conversation History:</span>
                  <span className="text-slate-200">1,660</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400 font-mono-tech">
            Dynamic KV-Cache with flash attention 2 enabled.
          </div>
        </div>

        {/* Background Daemons Table */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="font-sans font-bold text-xs text-cyan-200 uppercase tracking-wider">
                SOVEREIGN BACKGROUND SERVICES & DAEMONS
              </span>
            </div>
            <span className="text-[10px] font-mono-tech text-emerald-400 font-semibold">ALL 5 HEALTHY</span>
          </div>

          <div className="space-y-2.5">
            {daemons.map((d) => (
              <div
                key={d.pid}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-mono-tech"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    <span className="text-slate-200 font-bold font-sans">{d.name}</span>
                    <span className="text-[10px] text-slate-400">PID: {d.pid}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">{d.desc}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                    {d.mem}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
