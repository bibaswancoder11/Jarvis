import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Smartphone, 
  Wifi, 
  Battery, 
  BellRing, 
  Zap, 
  Volume2, 
  ShieldCheck, 
  Camera, 
  MessageSquare, 
  DollarSign, 
  Image, 
  FileText, 
  Terminal, 
  Compass, 
  Settings, 
  Activity, 
  X, 
  Key, 
  Sparkles,
  ArrowLeft,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Phone,
  PhoneCall,
  PhoneOff,
  Send,
  MessageCircle,
  User
} from 'lucide-react';
import { 
  playTechBeep, 
  playDeviceUnlockSound, 
  playDeviceLockSound, 
  playPhoneRingSound, 
  playCallDialTone,
  playCallEndedTone,
  speakText 
} from '../utils/audio';
import { PhoneCallState, PhoneMessage } from '../types';
import { resolveRecipientContact } from '../utils/contacts';

interface MobileNodeViewProps {
  isEmbedded?: boolean;
  sessionCode?: string;
  onClose?: () => void;
}

export const MobileNodeView: React.FC<MobileNodeViewProps> = ({
  isEmbedded = false,
  sessionCode = 'JRV-4892',
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [appUnlockCode, setAppUnlockCode] = useState<string>('');
  const [appUnlockTarget, setAppUnlockTarget] = useState<any | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ringerAudioInterval = useRef<any>(null);

  // Active Phone Call state
  const [activeCall, setActiveCall] = useState<PhoneCallState | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const callTimerRef = useRef<any>(null);

  // Messaging state
  const [messagesList, setMessagesList] = useState<PhoneMessage[]>([
    {
      id: 'm-1',
      app: 'signal',
      sender: 'Dr. Bruce Banner',
      recipient: 'You',
      content: 'Quantum telemetry array synchronized. Ready for deployment.',
      timestamp: Date.now() - 3600000 * 2,
      status: 'read',
    },
    {
      id: 'm-2',
      app: 'whatsapp',
      sender: 'Pepper Potts',
      recipient: 'You',
      content: 'Security perimeter lockdown scheduled for 22:00.',
      timestamp: Date.now() - 1800000,
      status: 'delivered',
    },
  ]);
  const [composerApp, setComposerApp] = useState<'signal' | 'whatsapp' | 'telegram' | 'sms'>('whatsapp');
  const [composerRecipient, setComposerRecipient] = useState<string>('Pepper Potts');
  const [composerText, setComposerText] = useState<string>('');

  // Installed applications state on mobile
  const [apps, setApps] = useState([
    {
      id: 'app-signal',
      name: 'Signal Messenger',
      category: 'Secure Messaging',
      icon: MessageSquare,
      color: 'bg-blue-600',
      isLocked: true,
      lockType: 'pin',
      lockCode: '7701',
    },
    {
      id: 'app-whatsapp',
      name: 'WhatsApp Messenger',
      category: 'Instant Messaging',
      icon: MessageCircle,
      color: 'bg-emerald-600',
      isLocked: false,
    },
    {
      id: 'app-telegram',
      name: 'Telegram Messenger',
      category: 'Cloud Messaging',
      icon: Send,
      color: 'bg-sky-600',
      isLocked: false,
    },
    {
      id: 'app-phone-dialer',
      name: 'Phone & Telecom',
      category: 'Telecom',
      icon: Phone,
      color: 'bg-teal-600',
      isLocked: false,
    },
    {
      id: 'app-banking',
      name: 'Stark Financial',
      category: 'Finance & Vault',
      icon: DollarSign,
      color: 'bg-emerald-600',
      isLocked: true,
      lockType: 'code',
      lockCode: 'ALPHA9',
    },
    {
      id: 'app-photos',
      name: 'Private Gallery',
      category: 'Encrypted Media',
      icon: Image,
      color: 'bg-purple-600',
      isLocked: true,
      lockType: 'pin',
      lockCode: '1234',
    },
    {
      id: 'app-notes',
      name: 'Notes & Keychain',
      category: 'Productivity',
      icon: FileText,
      color: 'bg-amber-600',
      isLocked: true,
      lockType: 'password',
      lockCode: 'stark',
    },
    {
      id: 'app-camera',
      name: 'Pro Camera',
      category: 'Optical System',
      icon: Camera,
      color: 'bg-slate-700',
      isLocked: false,
    },
    {
      id: 'app-maps',
      name: 'Satellite GPS',
      category: 'Navigation',
      icon: Compass,
      color: 'bg-cyan-600',
      isLocked: false,
    },
    {
      id: 'app-terminal',
      name: 'Termux Shell',
      category: 'Developer',
      icon: Terminal,
      color: 'bg-zinc-800',
      isLocked: false,
    },
    {
      id: 'app-health',
      name: 'Neural Health',
      category: 'Biometrics',
      icon: Activity,
      color: 'bg-rose-600',
      isLocked: true,
      lockType: 'pin',
      lockCode: '9900',
    },
    {
      id: 'app-settings',
      name: 'OS Settings',
      category: 'System Enclave',
      icon: Settings,
      color: 'bg-slate-600',
      isLocked: false,
    },
  ]);

  // Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real device battery reading via navigator.getBattery
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Handshake with backend & connect real-time SSE stream
  useEffect(() => {
    // 1. Send pair registration
    const registerPair = async () => {
      try {
        await fetch('/api/jarvis/mobile/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pairingCode: sessionCode,
            deviceName: 'Pixel 9 Pro Mobile Unit (Live)',
            batteryPercent: batteryLevel,
            screenResolution: `${window.innerWidth}x${window.innerHeight}`,
            platform: navigator.platform || 'Android',
            userAgent: navigator.userAgent,
          }),
        });
      } catch (err) {
        console.warn('Pair handshake error:', err);
      }
    };
    registerPair();

    // 2. Open real-time SSE connection
    const eventSource = new EventSource(`/api/jarvis/events?type=mobile&session=${sessionCode}`);

    eventSource.addEventListener('init', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const phone = data.devices?.find((d: any) => d.id === 'dev-phone-01');
        if (phone) {
          setIsLocked(Boolean(phone.isLocked));
        }
      } catch {}
    });

    eventSource.addEventListener('device_action', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const { action, params } = payload;

        if (action === 'ring_phone') {
          triggerAlarmSound();
        } else if (action === 'unlock_device') {
          handleUnlockSuccess();
        } else if (action === 'lock_device') {
          setIsLocked(true);
          playDeviceLockSound();
        } else if (action === 'toggle_flashlight') {
          setIsTorchOn((prev) => !prev);
        } else if (action === 'unlock_app') {
          const targetId = params?.appId;
          if (targetId) {
            setApps((prev) =>
              prev.map((a) => (a.id === targetId ? { ...a, isLocked: false } : a))
            );
            setActiveApp(targetId);
            playDeviceUnlockSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(80);
            }
          }
        } else if (action === 'initiate_call' || action === 'make_call') {
          playCallDialTone();
          const callData: PhoneCallState = {
            isActive: true,
            contactName: params?.contact || 'Tony Stark',
            phoneNumber: params?.phoneNumber || '+1 (212) 555-0199',
            direction: 'outgoing',
            status: 'ringing',
            durationSeconds: 0,
            timestamp: Date.now(),
          };
          setActiveCall(callData);
          setCallDuration(0);
          if (callTimerRef.current) clearInterval(callTimerRef.current);
          setTimeout(() => {
            setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
            callTimerRef.current = setInterval(() => {
              setCallDuration((d) => d + 1);
            }, 1000);
          }, 2500);
        } else if (action === 'simulate_incoming_call') {
          playPhoneRingSound();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
          }
          const callData: PhoneCallState = {
            isActive: true,
            contactName: params?.contact || 'Tony Stark',
            phoneNumber: params?.phoneNumber || '+1 (212) 555-0199',
            direction: 'incoming',
            status: 'ringing',
            durationSeconds: 0,
            timestamp: Date.now(),
          };
          setActiveCall(callData);
          setCallDuration(0);
        } else if (action === 'answer_call') {
          playTechBeep(1400, 0.04);
          setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
          if (callTimerRef.current) clearInterval(callTimerRef.current);
          callTimerRef.current = setInterval(() => {
            setCallDuration((d) => d + 1);
          }, 1000);
        } else if (action === 'cut_call' || action === 'end_call' || action === 'hangup_call') {
          playCallEndedTone();
          setActiveCall(null);
          setCallDuration(0);
          if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
          }
        } else if (action === 'send_message') {
          playTechBeep(1500, 0.03);
          const newMsg: PhoneMessage = {
            id: `msg-${Date.now()}`,
            app: params?.app || 'signal',
            sender: 'You (JARVIS)',
            recipient: params?.recipient || 'Contact',
            content: params?.content || 'Status synchronized.',
            timestamp: Date.now(),
            status: 'delivered',
          };
          setMessagesList((prev) => [newMsg, ...prev]);
        }
      } catch (err) {
        console.warn('SSE action parse error:', err);
      }
    });

    return () => {
      eventSource.close();
      if (ringerAudioInterval.current) clearInterval(ringerAudioInterval.current);
    };
  }, [sessionCode]);

  // Real Audible Alarm & Haptic Vibration on Phone
  const triggerAlarmSound = () => {
    setIsRinging(true);
    playPhoneRingSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 800]);
    }

    if (ringerAudioInterval.current) clearInterval(ringerAudioInterval.current);
    ringerAudioInterval.current = setInterval(() => {
      playPhoneRingSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 200, 400, 200, 800]);
      }
    }, 1200);

    setTimeout(() => {
      stopAlarmSound();
    }, 12000);
  };

  const stopAlarmSound = () => {
    setIsRinging(false);
    if (ringerAudioInterval.current) {
      clearInterval(ringerAudioInterval.current);
      ringerAudioInterval.current = null;
    }
  };

  // Real Camera Activation when opening Pro Camera app
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera sensor fallback:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  const handleUnlockSuccess = () => {
    setIsLocked(false);
    setEnteredPin('');
    setPinError(false);
    playDeviceUnlockSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  };

  const handleKeypadPress = (digit: string) => {
    playTechBeep(1400, 0.02);
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === 4) {
        if (next === '4892') {
          handleUnlockSuccess();
          // Report unlock to backend
          fetch('/api/jarvis/devices/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: 'dev-phone-01',
              action: 'unlock_device',
              params: { lockCode: '4892' },
            }),
          });
        } else {
          setPinError(true);
          playTechBeep(320, 0.15, 'sawtooth');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
          }
          setTimeout(() => {
            setEnteredPin('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handleKeypadDelete = () => {
    playTechBeep(1000, 0.02);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleOpenApp = (app: any) => {
    playTechBeep(1300, 0.02);
    if (app.isLocked) {
      setAppUnlockTarget(app);
      setAppUnlockCode('');
      setAppError(null);
    } else {
      setActiveApp(app.id);
      if (app.id === 'app-camera') {
        startCamera();
      }
    }
  };

  const handleValidateAppUnlock = () => {
    if (!appUnlockTarget) return;
    const isMatch = appUnlockCode.trim().toLowerCase() === (appUnlockTarget.lockCode || '').toLowerCase() ||
                    appUnlockCode.trim().toUpperCase() === (appUnlockTarget.lockCode || '').toUpperCase();

    if (isMatch) {
      setApps((prev) =>
        prev.map((a) => (a.id === appUnlockTarget.id ? { ...a, isLocked: false } : a))
      );
      setActiveApp(appUnlockTarget.id);
      setAppUnlockTarget(null);
      playDeviceUnlockSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
      // Report app unlock to backend
      fetch('/api/jarvis/devices/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'dev-phone-01',
          action: 'unlock_app',
          params: { appId: appUnlockTarget.id, lockCode: appUnlockCode.trim() },
        }),
      });
    } else {
      setAppError('Invalid passcode. Security sandbox intact.');
      playTechBeep(320, 0.15, 'sawtooth');
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center font-sans ${isEmbedded ? 'w-full h-full p-2' : 'min-h-screen bg-[#030712] p-4'}`}>
      {/* Full-Screen Pure White Flashlight Mode */}
      {isTorchOn && (
        <div 
          onClick={() => setIsTorchOn(false)}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-8 text-black cursor-pointer animate-fade-in"
          title="Tap anywhere to extinguish torch"
        >
          <div className="flex items-center justify-between w-full font-mono text-xs font-bold uppercase tracking-wider">
            <span>JARVIS OPTICAL TORCH ENGAGED</span>
            <span>100% LUMEN</span>
          </div>
          <div className="text-center">
            <Zap className="w-16 h-16 mx-auto mb-2 text-amber-500 fill-amber-400" />
            <h2 className="text-2xl font-black">TORCH ACTIVE</h2>
            <p className="text-xs text-slate-600 mt-1">Tap screen to turn off</p>
          </div>
          <span className="text-[11px] font-mono">SOVEREIGN HARDWARE OVERRIDE</span>
        </div>
      )}

      {/* Audible Locator Beacon Alarm Overlay */}
      {isRinging && (
        <div className="fixed inset-0 z-50 bg-rose-600/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-white text-rose-600 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <BellRing className="w-12 h-12 animate-spin" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">
            AUDIBLE BEACON ACTIVE!
          </h2>
          <p className="text-sm font-medium max-w-xs mb-8 text-rose-100">
            JARVIS is locating this mobile device at maximum audio gain and continuous haptic vibration.
          </p>
          <button
            onClick={stopAlarmSound}
            className="px-8 py-4 rounded-2xl bg-white text-rose-700 font-bold text-sm uppercase tracking-wider shadow-2xl active:scale-95 transition-transform"
          >
            SILENCE BEACON
          </button>
        </div>
      )}

      {/* Mobile Device Frame Container */}
      <div className={`w-full max-w-[390px] h-[780px] bg-slate-950 border-[6px] border-slate-800 rounded-[50px] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col relative text-slate-100 select-none ${isEmbedded ? 'scale-[0.92] origin-top' : ''}`}>
        {/* Dynamic Island / Top Camera Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111827] border border-cyan-500/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>

        {/* ACTIVE CALL OVERLAY (Incoming, Dialing, or Ongoing Connected Call) */}
        {activeCall && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-6 animate-scale-up text-white select-none">
            {/* Call Header */}
            <div className="text-center pt-10 space-y-1">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-cyan-400 font-semibold">
                {activeCall.status === 'connected' ? 'CELLULAR CALL ACTIVE' : activeCall.direction === 'incoming' ? 'INCOMING CALL' : 'DIALING OUTGOING CALL...'}
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                {activeCall.contactName}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {activeCall.phoneNumber}
              </p>
              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium ${
                  activeCall.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>
                    {activeCall.status === 'connected' 
                      ? `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`
                      : 'Connecting...'}
                  </span>
                </span>
              </div>
            </div>

            {/* Caller Avatar Graphic */}
            <div className="my-auto flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-3xl font-black shadow-[0_0_40px_rgba(6,182,212,0.4)] border-2 border-white/20 mb-3 animate-pulse">
                {activeCall.contactName.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-slate-400 font-sans">
                Voice Link HD • Sovereign Encryption
              </span>
            </div>

            {/* Call Control Buttons */}
            <div className="pb-8 space-y-4">
              {activeCall.status === 'ringing' && activeCall.direction === 'incoming' ? (
                <div className="flex items-center justify-around max-w-[280px] mx-auto">
                  {/* Reject / Cut Button */}
                  <button
                    onClick={() => {
                      playCallEndedTone();
                      setActiveCall(null);
                      setCallDuration(0);
                      fetch('/api/jarvis/devices/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deviceId: 'dev-phone-01', action: 'cut_call' }),
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform"
                    title="Reject / Cut Call"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>

                  {/* Accept / Answer Button */}
                  <button
                    onClick={() => {
                      playTechBeep(1400, 0.04);
                      setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
                      if (callTimerRef.current) clearInterval(callTimerRef.current);
                      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
                      fetch('/api/jarvis/devices/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deviceId: 'dev-phone-01', action: 'answer_call' }),
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform animate-bounce"
                    title="Answer Call"
                  >
                    <PhoneCall className="w-7 h-7" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {/* Cut / End Ongoing Call Button */}
                  <button
                    onClick={() => {
                      playCallEndedTone();
                      setActiveCall(null);
                      setCallDuration(0);
                      if (callTimerRef.current) {
                        clearInterval(callTimerRef.current);
                        callTimerRef.current = null;
                      }
                      fetch('/api/jarvis/devices/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deviceId: 'dev-phone-01', action: 'cut_call' }),
                      });
                    }}
                    className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all border-2 border-rose-400"
                    title="Cut Ongoing Call"
                  >
                    <PhoneOff className="w-8 h-8" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">CUT CALL</span>
                  </button>
                </div>
              )}
              <div className="text-center text-[10px] font-mono-tech text-slate-500">
                JARVIS VOICE PIPELINE • REMOTE CONTROLLED
              </div>
            </div>
          </div>
        )}

        {/* Mobile Top Status Bar */}
        <div className="pt-3 pb-1 px-7 flex items-center justify-between text-[11px] font-sans font-medium text-slate-200 z-30">
          <span className="font-semibold">{currentTime || '09:41'}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-tech text-cyan-400 font-bold">5G Ultra</span>
            <Wifi className="w-3.5 h-3.5 text-slate-200" />
            <div className="flex items-center gap-1 font-mono-tech text-[10px]">
              <span>{batteryLevel}%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Embedded Close Button */}
        {isEmbedded && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-4 z-40 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* VIEW 1: LOCK SCREEN */}
        {isLocked ? (
          <div className="flex-1 flex flex-col justify-between p-6 z-20 bg-gradient-to-b from-slate-950 via-[#061226] to-slate-950">
            {/* Top Lock Status & Clock */}
            <div className="text-center pt-8 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono-tech mb-2">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>LOCKED • PIN: 4892</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white font-mono">
                {currentTime || '09:41'}
              </h1>
              <p className="text-xs text-slate-400 font-sans tracking-wide">
                {currentDate || 'Thursday, Oct 1'}
              </p>
            </div>

            {/* PIN Entry Dots */}
            <div className="my-auto text-center space-y-4">
              <span className="text-xs font-sans text-slate-400">
                Enter 4-Digit Security PIN or command JARVIS:
              </span>
              <div className="flex items-center justify-center gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pinError
                        ? 'border-rose-500 bg-rose-500'
                        : enteredPin.length > idx
                        ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                        : 'border-white/30 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* One-Tap Auto Fill Hint Button */}
              <button
                onClick={() => {
                  setEnteredPin('4892');
                  setTimeout(() => handleUnlockSuccess(), 100);
                }}
                className="text-[11px] font-mono-tech text-cyan-400 hover:text-cyan-200 underline pt-1 block mx-auto transition-colors"
              >
                Auto-Unlock with PIN (4892)
              </button>
            </div>

            {/* Numeric Keypad */}
            <div className="space-y-3 pb-4">
              <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xl font-bold font-mono text-slate-100 flex items-center justify-center transition-all active:scale-90"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xl font-bold font-mono text-slate-100 flex items-center justify-center transition-all active:scale-90"
                >
                  0
                </button>
                <button
                  onClick={handleKeypadDelete}
                  className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-sans text-slate-400 flex items-center justify-center transition-all active:scale-90"
                >
                  Delete
                </button>
              </div>

              <div className="pt-2 text-center text-[10px] font-mono-tech text-slate-500">
                JARVIS SOVEREIGN MOBILE LINK • REAL TIME
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: UNLOCKED HOME SCREEN & APPS */
          <div className="flex-1 flex flex-col justify-between p-5 z-20 bg-gradient-to-b from-[#040915] via-[#051124] to-[#040915] overflow-y-auto">
            {/* Header Widget */}
            <div>
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-200">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>JARVIS MOBILE NODE</span>
                  </div>
                  <button
                    onClick={() => {
                      playDeviceLockSound();
                      setIsLocked(true);
                      fetch('/api/jarvis/devices/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deviceId: 'dev-phone-01', action: 'lock_device' }),
                      });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-slate-300 flex items-center gap-1 font-mono-tech"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Lock</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-sans">
                  Sovereign bidirectional tethering active. All system commands synchronize in &lt;10ms.
                </p>
              </div>

              {/* Hardware Quick Toggles */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] font-sans">
                <button
                  onClick={() => setIsTorchOn((prev) => !prev)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isTorchOn
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isTorchOn ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>Torch: {isTorchOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={triggerAlarmSound}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <BellRing className="w-4 h-4 text-cyan-400" />
                  <span>Test Alarm</span>
                </button>

                <button
                  onClick={() => {
                    playTechBeep(1500, 0.03);
                    speakText('JARVIS Sovereign Mobile Interface online, sir.');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Voice Synth</span>
                </button>
              </div>

              {/* Installed Apps Grid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 px-1 mb-2">
                  <span>ENCRYPTED APP ENCLAVES</span>
                  <span className="text-cyan-400">9 APPS</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {apps.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleOpenApp(app)}
                        className="flex flex-col items-center p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group relative active:scale-95"
                      >
                        {/* Lock Badge */}
                        {app.isLocked && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-500/80 text-white shadow-sm">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        )}

                        <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center text-white mb-1.5 shadow-md group-hover:scale-105 transition-transform`}>
                          <AppIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-200 truncate w-full text-center">
                          {app.name}
                        </span>
                        <span className="text-[9px] font-mono-tech text-slate-400">
                          {app.isLocked ? `${app.lockCode}` : 'Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Dock Bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-around mt-4">
              <button
                onClick={() => handleOpenApp(apps.find((a) => a.id === 'app-signal'))}
                className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md active:scale-90 transition-transform"
                title="Signal"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenApp(apps.find((a) => a.id === 'app-banking'))}
                className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md active:scale-90 transition-transform"
                title="Stark Financial"
              >
                <DollarSign className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenApp(apps.find((a) => a.id === 'app-camera'))}
                className="p-2.5 rounded-xl bg-slate-700 text-white shadow-md active:scale-90 transition-transform"
                title="Camera"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenApp(apps.find((a) => a.id === 'app-terminal'))}
                className="p-2.5 rounded-xl bg-zinc-800 text-white shadow-md active:scale-90 transition-transform"
                title="Terminal"
              >
                <Terminal className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE APP OVERLAY (When app is opened) */}
        {activeApp && (
          <div className="absolute inset-0 bg-slate-950 z-40 flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <button
                onClick={() => {
                  stopCamera();
                  setActiveApp(null);
                }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                {apps.find((a) => a.id === activeApp)?.name}
              </span>
              <div className="w-6" />
            </div>

            {/* App Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              {activeApp === 'app-camera' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-full flex-1 rounded-2xl bg-black border border-white/10 overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {!cameraStream && (
                      <div className="text-center p-4 text-slate-400">
                        <Camera className="w-10 h-10 mx-auto mb-2 text-cyan-400 animate-pulse" />
                        <span className="text-xs">Live Optical Lens Sensor Ready</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      playTechBeep(1600, 0.05);
                      speakText('Frame captured and hashed to memory.');
                    }}
                    className="mt-3 px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Sensor Frame</span>
                  </button>
                </div>
              ) : (activeApp === 'app-signal' || activeApp === 'app-whatsapp' || activeApp === 'app-telegram') ? (
                /* 3rd Party Encrypted Messaging Client */
                <div className="w-full h-full flex flex-col text-left">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-2 p-1 font-sans text-xs">
                    {messagesList
                      .filter((m) => {
                        if (activeApp === 'app-signal') return m.app === 'signal';
                        if (activeApp === 'app-whatsapp') return m.app === 'whatsapp';
                        return m.app === 'telegram' || m.app === 'sms';
                      })
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-2xl max-w-[85%] ${
                            msg.sender.includes('You')
                              ? 'ml-auto bg-cyan-600 text-white rounded-br-none'
                              : 'mr-auto bg-white/10 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-cyan-200/80 mb-0.5 font-mono">
                            <span>{msg.sender}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs font-normal leading-snug">{msg.content}</p>
                        </div>
                      ))}
                    {messagesList.filter(m => activeApp.includes(m.app)).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No previous messages in encrypted thread. Send one below or instruct JARVIS via voice.
                      </div>
                    )}
                  </div>

                  {/* Message Composer */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder="Type encrypted message..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && composerText.trim()) {
                          const targetAppType = activeApp === 'app-signal' ? 'signal' : activeApp === 'app-whatsapp' ? 'whatsapp' : 'telegram';
                          const newMsg: PhoneMessage = {
                            id: `msg-${Date.now()}`,
                            app: targetAppType,
                            sender: 'You (JARVIS)',
                            recipient: composerRecipient,
                            content: composerText.trim(),
                            timestamp: Date.now(),
                            status: 'delivered',
                          };
                          setMessagesList((prev) => [newMsg, ...prev]);
                          setComposerText('');
                          playTechBeep(1400, 0.03);
                          fetch('/api/jarvis/devices/action', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              deviceId: 'dev-phone-01',
                              action: 'send_message',
                              params: { app: targetAppType, recipient: composerRecipient, content: newMsg.content },
                            }),
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!composerText.trim()) return;
                        const targetAppType = activeApp === 'app-signal' ? 'signal' : activeApp === 'app-whatsapp' ? 'whatsapp' : 'telegram';
                        const resolved = resolveRecipientContact(composerRecipient);
                        const finalRecipient = resolved.isResolved ? resolved.name : composerRecipient;
                        const finalPhone = resolved.phoneNumber;
                        const newMsg: PhoneMessage = {
                          id: `msg-${Date.now()}`,
                          app: targetAppType,
                          sender: 'You (JARVIS)',
                          recipient: finalRecipient,
                          phoneNumber: finalPhone,
                          content: composerText.trim(),
                          timestamp: Date.now(),
                          status: 'delivered',
                        };
                        setMessagesList((prev) => [newMsg, ...prev]);
                        setComposerText('');
                        playTechBeep(1400, 0.03);
                        fetch('/api/jarvis/devices/action', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            deviceId: 'dev-phone-01',
                            action: 'send_message',
                            params: { 
                              app: targetAppType, 
                              recipient: finalRecipient, 
                              phoneNumber: finalPhone,
                              content: newMsg.content 
                            },
                          }),
                        });
                      }}
                      className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md active:scale-90"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : activeApp === 'app-phone-dialer' ? (
                /* Phone Dialer & Telecom Hub */
                <div className="w-full h-full flex flex-col justify-between text-center p-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-widest">
                      TELECOM CELLULAR CORE
                    </span>
                    <h3 className="text-xl font-bold font-mono text-white tracking-widest mt-1">
                      +1 (212) 555-0199
                    </h3>
                    <p className="text-[11px] text-slate-400">Direct Line: Tony Stark</p>
                  </div>

                  <div className="my-auto grid grid-cols-2 gap-3 max-w-[280px] mx-auto w-full">
                    <button
                      onClick={() => {
                        playCallDialTone();
                        const callData: PhoneCallState = {
                          isActive: true,
                          contactName: 'Tony Stark',
                          phoneNumber: '+1 (212) 555-0199',
                          direction: 'outgoing',
                          status: 'ringing',
                          durationSeconds: 0,
                          timestamp: Date.now(),
                        };
                        setActiveCall(callData);
                        fetch('/api/jarvis/devices/action', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            deviceId: 'dev-phone-01',
                            action: 'initiate_call',
                            params: { contact: 'Tony Stark', phoneNumber: '+1 (212) 555-0199' },
                          }),
                        });
                      }}
                      className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-6 h-6 text-emerald-400" />
                      <span className="text-xs font-bold">Call Stark</span>
                    </button>

                    <button
                      onClick={() => {
                        playPhoneRingSound();
                        const callData: PhoneCallState = {
                          isActive: true,
                          contactName: 'Pepper Potts',
                          phoneNumber: '+1 (212) 555-0144',
                          direction: 'incoming',
                          status: 'ringing',
                          durationSeconds: 0,
                          timestamp: Date.now(),
                        };
                        setActiveCall(callData);
                        fetch('/api/jarvis/devices/action', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            deviceId: 'dev-phone-01',
                            action: 'simulate_incoming_call',
                            params: { contact: 'Pepper Potts', phoneNumber: '+1 (212) 555-0144' },
                          }),
                        });
                      }}
                      className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <Phone className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">Incoming Call</span>
                    </button>
                  </div>

                  <div className="text-[10px] font-mono-tech text-slate-500">
                    VOICE CHANNELS ENCRYPTED • HARDWARE BASEBAND ACTIVE
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mx-auto shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    {apps.find((a) => a.id === activeApp)?.name} Container
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs font-mono-tech">
                    Application decrypted with sovereign clearance. Live data streams synchronized with JARVIS Core.
                  </p>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left text-xs font-mono-tech text-cyan-300 space-y-1">
                    <div>Status: ACTIVE SESSION</div>
                    <div>Integrity: SHA-256 VERIFIED</div>
                    <div>Node Link: WI-FI 6E REAL-TIME</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* APP SPECIFIC UNLOCK DIALOG MODAL */}
        {appUnlockTarget && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full bg-[#091122] border border-cyan-400/40 rounded-3xl p-5 text-slate-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    SPECIFY APP PASSCODE
                  </h4>
                </div>
                <button
                  onClick={() => setAppUnlockTarget(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-300">
                Enter the security {appUnlockTarget.lockType?.toUpperCase() || 'PASSCODE'} to unlock {appUnlockTarget.name}:
              </p>

              <input
                type="text"
                value={appUnlockCode}
                onChange={(e) => setAppUnlockCode(e.target.value)}
                placeholder={`Passcode (Hint: ${appUnlockTarget.lockCode})`}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-cyan-400/40 text-center font-mono text-xs text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleValidateAppUnlock();
                }}
              />

              <button
                type="button"
                onClick={() => setAppUnlockCode(appUnlockTarget.lockCode || '')}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 font-mono-tech underline block text-center"
              >
                Auto-Fill Code: "{appUnlockTarget.lockCode}"
              </button>

              {appError && (
                <div className="text-[10px] text-rose-300 font-mono-tech text-center">
                  {appError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setAppUnlockTarget(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidateAppUnlock}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Unlock App
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
