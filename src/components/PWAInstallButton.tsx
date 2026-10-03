import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, Apple } from 'lucide-react';
import { playTechBeep } from '../utils/audio';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  return (
    <>
      {isInstalled ? (
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono-tech text-emerald-400"
          title="Running in Standalone Native / APK Mode"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>OFFLINE STANDALONE</span>
        </div>
      ) : isInstallable ? (
        <button
          onClick={async () => {
            playTechBeep(1400, 0.03);
            const ok = await install();
            if (ok) setInstallSuccess(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] font-sans transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
          title="Install JARVIS as a Native Offline Android / Desktop App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">INSTALL APP (APK)</span>
          <span className="sm:hidden">INSTALL</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => {
            playTechBeep(1200, 0.02);
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-cyan-200 text-[11px] font-sans font-medium transition-all"
        >
          <Apple className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Add to Home Screen</span>
        </button>
      ) : (
        <button
          onClick={() => {
            playTechBeep(1200, 0.02);
            setShowAndroidGuide(true);
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-sans font-medium transition-all"
          title="Installable Progressive Web App (Offline APK Supported)"
        >
          <Download className="w-3 h-3 text-cyan-400" />
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Home Screen Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#091122] border border-cyan-400/40 p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-center text-white font-sans uppercase tracking-wider">
              Install JARVIS on iPhone / iPad
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              To install JARVIS as a sovereign offline app:
            </p>
            <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span>Launch JARVIS from your home screen for full standalone offline access.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 transition-colors"
            >
              Understood, Sir
            </button>
          </div>
        </div>
      )}

      {/* Android & PC Installation Guide */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#091122] border border-cyan-400/40 p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-center text-white font-sans uppercase tracking-wider">
              Install JARVIS (Offline WebAPK & Android App)
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed text-center">
              JARVIS is fully PWA and WebAPK compliant. You can install it on your device for complete offline operation without an internet connection:
            </p>
            <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-white">On Android (Chrome / Edge / Brave):</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tap the <strong>⋮ (three dots)</strong> menu in your browser, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Android will compile an offline WebAPK.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-white">On PC / Mac / Chromebook:</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click the <strong>Install JARVIS icon</strong> in your browser address bar (top right) or menu.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-white">Build Standalone APK (.apk file):</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the included <code>capacitor.config.json</code> or run PWABuilder to generate a signed Android APK package.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-5 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 transition-colors"
            >
              Understood, Sir
            </button>
          </div>
        </div>
      )}
    </>
  );
};
