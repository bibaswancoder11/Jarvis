import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Fingerprint, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { ExecutionTask, SecurityLevel } from '../types';
import { playTechBeep, playAuthSuccessSound, playAlertSound } from '../utils/audio';

interface SecurityAuthModalProps {
  task: ExecutionTask;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
}

export const SecurityAuthModal: React.FC<SecurityAuthModalProps> = ({
  task,
  onApprove,
  onReject,
}) => {
  const [pin, setPin] = useState('');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);

  const handleFingerprintAuth = () => {
    setIsScanningFingerprint(true);
    playTechBeep(1800, 0.08);

    setTimeout(() => {
      setIsScanningFingerprint(false);
      playAuthSuccessSound();
      onApprove(task.id);
    }, 900);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    playAuthSuccessSound();
    onApprove(task.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950/80 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-amber-200 uppercase tracking-wider">
              ZERO-TRUST SECURITY CHALLENGE
            </h3>
            <span className="text-[10px] font-mono-tech text-amber-300 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              CLEARANCE TIER L{task.requiredSecurityLevel} REQUIRED
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="my-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono-tech space-y-2">
          <div>
            <span className="text-slate-400">Target Action:</span>{' '}
            <span className="text-slate-100 font-bold font-sans">{task.title}</span>
          </div>
          <div>
            <span className="text-slate-400">Tool Interface:</span>{' '}
            <span className="text-cyan-300">{task.tool}</span>
          </div>
          <div>
            <span className="text-slate-400">Parameters:</span>{' '}
            <code className="text-amber-300 text-[11px]">{JSON.stringify(task.parameters)}</code>
          </div>
        </div>

        {/* Biometric Fingerprint Button */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 my-3">
          <button
            type="button"
            onClick={handleFingerprintAuth}
            disabled={isScanningFingerprint}
            className={`p-4 rounded-full border transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 ${
              isScanningFingerprint
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/50 text-cyan-300 hover:text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]'
            }`}
          >
            <Fingerprint className="w-10 h-10 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[11px] font-sans font-bold text-cyan-200 uppercase tracking-wider mt-3">
            {isScanningFingerprint ? 'VERIFYING BIOMETRICS...' : 'TOUCH FOR INSTANT BIOMETRIC APPROVAL'}
          </span>
        </div>

        {/* Or PIN Challenge */}
        <form onSubmit={handlePinSubmit} className="space-y-2 text-xs font-mono-tech">
          <div className="flex items-center gap-2">
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Or enter 4-6 digit operator token..."
              className="flex-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-center font-mono-tech"
            />
            <button
              type="submit"
              disabled={pin.length < 4}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold font-sans shadow-md"
            >
              CONFIRM
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              playAlertSound();
              onReject(task.id);
            }}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-sans text-xs font-bold transition-all shadow-sm"
          >
            DENY DIRECTIVE
          </button>
        </div>
      </div>
    </div>
  );
};
