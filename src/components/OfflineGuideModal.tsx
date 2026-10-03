import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Github, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  Zap,
  PhoneCall,
  PhoneOff,
  MessageSquare
} from 'lucide-react';
import { playTechBeep } from '../utils/audio';

interface OfflineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTestCall?: () => void;
  onRunCutCall?: () => void;
  onRunTestMessage?: () => void;
}

export const OfflineGuideModal: React.FC<OfflineGuideModalProps> = ({
  isOpen,
  onClose,
  onRunTestCall,
  onRunCutCall,
  onRunTestMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'github' | 'telecom'>('apk');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    playTechBeep(1400, 0.03);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const capacitorCommands = `npm run build
npx @capacitor/cli add android
npx @capacitor/cli copy android
cd android && ./gradlew assembleDebug`;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#070e1b] border border-cyan-400/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Download className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase font-sans text-white">
                PUBLISH GITHUB PAGES & BUILD OFFLINE APK
              </h2>
              <p className="text-[11px] font-mono-tech text-cyan-300">
                100% Offline Sovereign Operation • WebAPK & Standalone Packaging
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTechBeep(1000, 0.02);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-white/10 bg-black/20 text-xs font-sans shrink-0">
          <button
            onClick={() => {
              playTechBeep(1200, 0.02);
              setActiveTab('apk');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all border-b-2 ${
              activeTab === 'apk'
                ? 'bg-white/10 text-cyan-300 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Build Android APK</span>
          </button>

          <button
            onClick={() => {
              playTechBeep(1200, 0.02);
              setActiveTab('github');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all border-b-2 ${
              activeTab === 'github'
                ? 'bg-white/10 text-cyan-300 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Github className="w-4 h-4 text-purple-400" />
            <span>GitHub Pages Deploy</span>
          </button>

          <button
            onClick={() => {
              playTechBeep(1200, 0.02);
              setActiveTab('telecom');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all border-b-2 ${
              activeTab === 'telecom'
                ? 'bg-white/10 text-cyan-300 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Calling & Messaging Functions</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 font-sans text-xs">
          
          {/* TAB 1: APK BUILD */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">Zero-Cloud Sovereign Enclave Active</h4>
                  <p className="text-[11px] text-cyan-200 leading-relaxed">
                    JARVIS includes an embedded service worker (<code>sw.js</code>), Web App Manifest, and client-side offline neural planner. It executes all phone calls, cutting calls, 3rd party messaging, and deadbolt security locally even with Wi-Fi and Cellular turned completely OFF!
                  </p>
                </div>
              </div>

              {/* Method 1: Instant WebAPK Install */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                    Method 1: Instant Android WebAPK (Zero-Build Sideload)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">RECOMMENDED</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open your published GitHub Pages URL on any Android device in Chrome, Edge, or Brave:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                  <li>Tap the browser menu <strong>(⋮ three dots)</strong> or the install banner.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Android automatically creates a standalone <strong>WebAPK</strong> in your app drawer with offline caching, hardware vibration, and full-screen kiosk support!</li>
                </ol>
              </div>

              {/* Method 2: Capacitor Native APK Build */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                    Method 2: Standalone .apk Package via Capacitor
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">STANDALONE BINARY</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We have added <code>capacitor.config.json</code> to the root repository. To compile a standalone <code>JARVIS-debug.apk</code>:
                </p>
                
                <div className="relative p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-cyan-300">
                  <pre className="overflow-x-auto whitespace-pre">{capacitorCommands}</pre>
                  <button
                    onClick={() => handleCopy(capacitorCommands, 1)}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] flex items-center gap-1 transition-all"
                  >
                    {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  The compiled binary will be generated at <code>android/app/build/outputs/apk/debug/app-debug.apk</code>.
                </p>
              </div>

              {/* Method 3: 1-Click Online PWABuilder */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                  Method 3: 1-Click APK Generator (PWABuilder)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Visit <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">PWABuilder.com</a>, paste your GitHub Pages link (<code>https://bibaswancoder11.github.io/Jarvis/</code>), and click <strong>"Build APK"</strong> to download a ready-to-install Android APK file!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB PAGES */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Github className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">GitHub Pages CI/CD Pipeline Configured</h4>
                  <p className="text-[11px] text-purple-200 leading-relaxed">
                    Workflow <code>.github/workflows/deploy.yml</code> is configured with automatic build, artifact packaging, and zero-downtime deployment.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px]">How to Enable GitHub Pages in 30 Seconds:</h4>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-300">
                  <li>
                    Push your commits to the <strong>main</strong> branch on GitHub.
                  </li>
                  <li>
                    On GitHub, open your repository <strong>Settings</strong> &gt; <strong>Pages</strong>.
                  </li>
                  <li>
                    Under <strong>"Build and deployment"</strong> &gt; <strong>"Source"</strong>, select:
                    <div className="mt-1 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-cyan-300">
                      GitHub Actions
                    </div>
                  </li>
                  <li>
                    The workflow runs automatically and publishes your app to:
                    <div className="mt-1 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>https://bibaswancoder11.github.io/Jarvis/</span>
                      <button
                        onClick={() => handleCopy('https://bibaswancoder11.github.io/Jarvis/', 2)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] flex items-center gap-1 transition-all"
                      >
                        {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                <span className="text-cyan-300 font-semibold">Universal Relative Base: </span>
                <code>vite.config.ts</code> uses <code>base: './'</code> and <code>public/404.html</code> is included, so all assets resolve perfectly on GitHub Pages without path errors.
              </div>
            </div>
          )}

          {/* TAB 3: TELECOM & MESSAGING */}
          {activeTab === 'telecom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">Full High-Level Remote Phone Control</h4>
                  <p className="text-[11px] text-emerald-200 leading-relaxed">
                    Operate the phone remotely: make calls, answer incoming calls, cut ongoing calls, send messages via 3rd party apps (WhatsApp, Signal, Telegram, SMS), toggle flashlight, adjust volume, and lock/unlock secure apps.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    playTechBeep(1400, 0.03);
                    onRunTestCall?.();
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-left transition-all group"
                >
                  <PhoneCall className="w-4 h-4 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-white text-xs">Initiate Call</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dial Tony Stark or Pepper Potts via cellular line</p>
                </button>

                <button
                  onClick={() => {
                    playTechBeep(1100, 0.04);
                    onRunCutCall?.();
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 text-left transition-all group"
                >
                  <PhoneOff className="w-4 h-4 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-white text-xs">Cut Ongoing Call</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Disconnect cellular call and release audio array</p>
                </button>

                <button
                  onClick={() => {
                    playTechBeep(1500, 0.03);
                    onRunTestMessage?.();
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-left transition-all group"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-white text-xs">3rd Party Message</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dispatch text via WhatsApp, Signal, or Telegram</p>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-[11px] text-slate-300">
                <span className="font-bold text-white">Voice & Text Directive Commands Supported:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><span className="text-cyan-300">"Call Tony Stark on my phone"</span> or <span className="text-cyan-300">"Call Pepper"</span></li>
                  <li><span className="text-rose-300">"Cut the ongoing call and disconnect phone line"</span> or <span className="text-rose-300">"Hang up"</span></li>
                  <li><span className="text-emerald-300">"Send message to Pepper on WhatsApp saying: Systems nominal"</span></li>
                  <li><span className="text-blue-300">"Send message to Dr. Banner on Signal saying: Shielding intact"</span></li>
                  <li><span className="text-amber-300">"Unlock phone with PIN 4892"</span> / <span className="text-amber-300">"Unlock Signal with PIN 7701"</span></li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono-tech text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>PWA & WebAPK: Compliant</span>
          </div>

          <button
            onClick={() => {
              playTechBeep(1000, 0.02);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
