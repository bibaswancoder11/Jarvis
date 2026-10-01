import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Radio, Cpu, Sparkles } from 'lucide-react';
import { playJarvisChime, playTechBeep } from '../utils/audio';

interface ArcReactorOrbProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'alert';
  isListening: boolean;
  onToggleListen: () => void;
  audioLevel?: number; // 0 to 1
  size?: 'normal' | 'compact';
}

export const ArcReactorOrb: React.FC<ArcReactorOrbProps> = ({
  status,
  isListening,
  onToggleListen,
  audioLevel = 0,
  size = 'normal',
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return {
          glow: 'rgba(6, 182, 212, 0.45)',
          border: 'border-cyan-400',
          text: 'text-cyan-200',
          badgeBg: 'bg-cyan-500/10 border-cyan-400/40 backdrop-blur-md',
          label: 'LISTENING FOR DIRECTIVE...',
        };
      case 'processing':
        return {
          glow: 'rgba(16, 185, 129, 0.45)',
          border: 'border-emerald-400',
          text: 'text-emerald-200',
          badgeBg: 'bg-emerald-500/10 border-emerald-400/40 backdrop-blur-md',
          label: 'NEURAL CONTEXT & TASK PLANNING...',
        };
      case 'speaking':
        return {
          glow: 'rgba(56, 189, 248, 0.5)',
          border: 'border-sky-400',
          text: 'text-sky-200',
          badgeBg: 'bg-sky-500/10 border-sky-400/40 backdrop-blur-md',
          label: 'SYNTHESIZING AUDIO VOCALS...',
        };
      case 'alert':
        return {
          glow: 'rgba(244, 63, 94, 0.45)',
          border: 'border-rose-400',
          text: 'text-rose-200',
          badgeBg: 'bg-rose-500/10 border-rose-400/40 backdrop-blur-md',
          label: 'AUTHORIZATION CHALLENGE REQUIRED',
        };
      default:
        return {
          glow: 'rgba(6, 182, 212, 0.2)',
          border: 'border-white/20',
          text: 'text-slate-300',
          badgeBg: 'bg-white/5 border-white/10 backdrop-blur-md',
          label: 'STANDBY — LISTENING FOR DIRECTIVE',
        };
    }
  };

  const statusConfig = getStatusColor();
  const orbDimension = size === 'compact' ? 'w-32 h-32' : 'w-48 h-48 md:w-56 md:h-56';

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none relative">
      {/* Outer ambient holographic glow */}
      <div
        className="absolute rounded-full filter blur-3xl transition-all duration-700 pointer-events-none opacity-60"
        style={{
          width: size === 'compact' ? '180px' : '300px',
          height: size === 'compact' ? '180px' : '300px',
          backgroundColor: statusConfig.glow,
        }}
      />

      {/* Main Orb Container (Clickable for Voice Activation) */}
      <div
        onClick={() => {
          playTechBeep(1500, 0.05);
          onToggleListen();
        }}
        className={`relative ${orbDimension} rounded-full flex items-center justify-center cursor-pointer group transition-transform active:scale-95`}
        title={isListening ? 'Click to Stop Listening' : 'Click to Activate Voice Command'}
      >
        {/* Layer 1: Outer segmented tech ring */}
        <div
          className="absolute inset-0 rounded-full border border-dashed border-white/20 transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        />

        {/* Layer 2: Counter-rotating geometric tick ring */}
        <div
          className="absolute inset-2 rounded-full border border-dotted border-cyan-400/30 transition-transform"
          style={{ transform: `rotate(-${rotation * 1.5}deg)` }}
        />

        {/* Layer 3: Arc Segments */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none animate-spin"
          style={{ animationDuration: status === 'processing' ? '4s' : '16s' }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(6, 182, 212, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="20 15 35 10"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="40 20 10 15"
          />
        </svg>

        {/* Layer 4: Frequency Waveform Ring (Reactive to audio Level) */}
        <div
          className="absolute inset-4 rounded-full border border-cyan-400/40 flex items-center justify-center transition-all duration-150 backdrop-blur-xs"
          style={{
            transform: `scale(${1 + audioLevel * 0.15})`,
            boxShadow: `0 0 ${15 + audioLevel * 30}px ${statusConfig.glow}`,
          }}
        >
          {/* Inner Core: Frosted Glass Reactor Cell */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.25)]">
            {/* Grid texture inside reactor */}
            <div className="absolute inset-0 hud-grid opacity-30"></div>

            {/* Glowing Core icon or Mic */}
            {isListening ? (
              <div className="relative z-10 flex flex-col items-center">
                <Mic className="w-8 h-8 text-cyan-300 animate-pulse" />
                <span className="text-[9px] font-mono-tech text-cyan-300 font-bold mt-1 tracking-wider">MIC ACTIVE</span>
              </div>
            ) : status === 'processing' ? (
              <div className="relative z-10 flex flex-col items-center">
                <Cpu className="w-8 h-8 text-emerald-300 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-[9px] font-mono-tech text-emerald-300 font-bold mt-1 tracking-wider">NPU ENGINE</span>
              </div>
            ) : status === 'speaking' ? (
              <div className="relative z-10 flex flex-col items-center">
                <Radio className="w-8 h-8 text-sky-300 animate-bounce" />
                <span className="text-[9px] font-mono-tech text-sky-300 font-bold mt-1 tracking-wider">SPEECH</span>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-cyan-300" />
                <span className="text-[9px] font-sans text-cyan-200 font-bold mt-1 tracking-widest">JARVIS</span>
              </div>
            )}

            {/* Pulsing center energy dot */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#38bdf8] animate-ping opacity-75 pointer-events-none" />
          </div>
        </div>

        {/* Hover hint */}
        <div className="absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-cyan-200 text-[10px] font-mono-tech px-2.5 py-0.5 rounded-full border border-white/10 pointer-events-none whitespace-nowrap shadow-md">
          {isListening ? 'Click to Mute' : 'Push to Talk'}
        </div>
      </div>

      {/* Status Badge & Voice Spectrum */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full border text-[11px] font-sans font-medium tracking-wide ${statusConfig.badgeBg} ${statusConfig.text}`}>
          <span className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-cyan-400 animate-ping' : status === 'processing' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
          <span>{statusConfig.label}</span>
        </div>

        {/* Live Audio Visualizer Bars */}
        <div className="flex items-center gap-1 h-3 mt-1">
          {[40, 75, 100, 60, 85, 30, 95, 50, 70, 45, 90, 60].map((h, i) => {
            const dynamicHeight = isListening
              ? Math.max(3, Math.min(12, Math.floor((h / 100) * (audioLevel * 18 + 4))))
              : status === 'speaking'
              ? Math.max(3, Math.floor(Math.sin(Date.now() / 150 + i) * 5 + 6))
              : 3;
            return (
              <div
                key={i}
                className="w-1 bg-cyan-400/80 rounded-full transition-all duration-75"
                style={{ height: `${dynamicHeight}px` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
