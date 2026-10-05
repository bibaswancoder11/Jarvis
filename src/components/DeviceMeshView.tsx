import React, { useState } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Radio, 
  Lock, 
  Unlock, 
  Power, 
  RefreshCw, 
  Laptop, 
  Server, 
  Smartphone, 
  Bot, 
  Activity, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  SlidersHorizontal,
  HardDrive,
  Volume2,
  VolumeX,
  Sun,
  Zap,
  BellRing,
  Key,
  X,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Send,
  Eye,
  Battery,
  BatteryCharging,
  UserPlus,
  Users,
  Check
} from 'lucide-react';
import { ConnectedDevice, InstalledApp, JarvisContact } from '../types';
import { 
  getSavedContacts, 
  saveContactToDirectory, 
  cleanPhoneNumberForWhatsApp, 
  resolveRecipientContact, 
  DEFAULT_JARVIS_CONTACTS 
} from '../utils/contacts';
import { 
  playTechBeep, 
  playAuthSuccessSound, 
  playDeviceUnlockSound, 
  playDeviceLockSound, 
  playPhoneRingSound 
} from '../utils/audio';
import {
  toggleHardwareTorch,
  vibrateMobileDevice,
  queryHardwareBattery,
  toggleScreenWakeLock,
  isWakeLockActive,
  dialCellularCallOnPhone,
  dispatchNativeMessageOnPhone,
  getHostMobilePlatformName
} from '../utils/mobileHardware';

interface DeviceMeshViewProps {
  devices: ConnectedDevice[];
  onDeviceAction: (deviceId: string, action: string, params?: any) => void;
  onScanDevices: () => void;
  isScanning: boolean;
  discoveredDevices: Array<Partial<ConnectedDevice>>;
  onPairDevice: (device: Partial<ConnectedDevice>) => void;
  onOpenPairing?: () => void;
  onOpenMobileSimulator?: () => void;
  isMobilePaired?: boolean;
}

export const DeviceMeshView: React.FC<DeviceMeshViewProps> = ({
  devices,
  onDeviceAction,
  onScanDevices,
  isScanning,
  discoveredDevices,
  onPairDevice,
  onOpenPairing,
  onOpenMobileSimulator,
  isMobilePaired = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [targetCategory, setTargetCategory] = useState<'all' | 'host' | 'paired'>('all');
  const [isTorchActive, setIsTorchActive] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [realBattery, setRealBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [dialNumberInput, setDialNumberInput] = useState('+1 (212) 555-0199');
  const [messageTextInput, setMessageTextInput] = useState('JARVIS status nominal.');
  const [messageRecipientInput, setMessageRecipientInput] = useState('Pepper Potts');
  const [messagePhoneNumber, setMessagePhoneNumber] = useState('+12125550144');
  const [contactsList, setContactsList] = useState<JarvisContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('contact-pepper');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');

  const [expandedDeviceApps, setExpandedDeviceApps] = useState<Record<string, boolean>>({
    'dev-phone-01': true, // Auto-expand phone apps for high visibility
  });

  // Query actual hardware sensors & load contact directory on client mount
  React.useEffect(() => {
    const contacts = getSavedContacts();
    setContactsList(contacts);
    if (contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
      setMessageRecipientInput(contacts[0].name);
      setMessagePhoneNumber(contacts[0].phoneNumber);
      setDialNumberInput(contacts[0].phoneNumber);
    }
    queryHardwareBattery().then((b) => {
      if (b) setRealBattery(b);
    });
    setWakeLockActive(isWakeLockActive());
  }, []);

  const handleSelectContact = (contactId: string) => {
    playTechBeep(1200, 0.02);
    setSelectedContactId(contactId);
    if (contactId === 'custom') {
      return;
    }
    const found = contactsList.find((c) => c.id === contactId);
    if (found) {
      setMessageRecipientInput(found.name);
      setMessagePhoneNumber(found.phoneNumber);
      setDialNumberInput(found.phoneNumber);
    }
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    playAuthSuccessSound();
    const created: JarvisContact = {
      id: `contact-${Date.now()}`,
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim(),
      role: newContactRole.trim() || 'Personal Contact',
      isFavorite: true,
    };
    const updated = saveContactToDirectory(created);
    setContactsList(updated);
    setSelectedContactId(created.id);
    setMessageRecipientInput(created.name);
    setMessagePhoneNumber(created.phoneNumber);
    setDialNumberInput(created.phoneNumber);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRole('');
    setIsContactModalOpen(false);
  };

  const handleToggleTorch = async () => {
    playTechBeep(1400, 0.03);
    const nextState = await toggleHardwareTorch(!isTorchActive);
    setIsTorchActive(nextState);
    onDeviceAction('dev-phone-01', 'toggle_flashlight', { state: nextState });
  };

  const handleToggleWakeLock = async () => {
    playTechBeep(1300, 0.03);
    const active = await toggleScreenWakeLock(!wakeLockActive);
    setWakeLockActive(active);
  };

  const handleVibratePhone = () => {
    playTechBeep(1200, 0.04);
    vibrateMobileDevice([300, 150, 300, 150, 600]);
  };

  const handleRingHostPhone = () => {
    playPhoneRingSound();
    vibrateMobileDevice([400, 200, 400, 200, 800]);
    setRingingDeviceId('dev-phone-01');
    onDeviceAction('dev-phone-01', 'ring_phone');
    setTimeout(() => setRingingDeviceId(null), 3000);
  };

  const handleHostDialCall = () => {
    playTechBeep(1500, 0.03);
    dialCellularCallOnPhone(dialNumberInput);
    onDeviceAction('dev-phone-01', 'initiate_call', {
      phoneNumber: dialNumberInput,
      contact: messageRecipientInput || 'Cellular Outgoing',
    });
  };

  const handleHostSendMessage = (app: 'whatsapp' | 'sms') => {
    playTechBeep(1400, 0.03);
    dispatchNativeMessageOnPhone(
      app, 
      messageRecipientInput, 
      messageTextInput,
      messagePhoneNumber
    );
    onDeviceAction('dev-phone-01', 'send_message', {
      app,
      recipient: messageRecipientInput,
      phoneNumber: messagePhoneNumber,
      content: messageTextInput,
    });
  };

  // Modal for unlocking device or app with specified lock
  const [unlockModal, setUnlockModal] = useState<{
    isOpen: boolean;
    deviceId: string;
    deviceName: string;
    type: 'device' | 'app';
    appId?: string;
    appName?: string;
    expectedLockType?: string;
    lockCodeHint?: string;
  } | null>(null);

  const [enteredCode, setEnteredCode] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [ringingDeviceId, setRingingDeviceId] = useState<string | null>(null);

  const getDeviceIcon = (type: ConnectedDevice['type']) => {
    switch (type) {
      case 'laptop':
        return Laptop;
      case 'server':
        return Server;
      case 'phone':
        return Smartphone;
      case 'smart_lock':
        return Lock;
      case 'robot_unit':
        return Bot;
      case 'sensor_hub':
        return Activity;
      default:
        return Radio;
    }
  };

  const hostDevice = devices.find((d) => d.isHostDevice || d.id === 'dev-phone-01');
  const pairedDevices = devices.filter((d) => !d.isHostDevice && d.id !== 'dev-phone-01');

  const categoryFiltered = targetCategory === 'host'
    ? devices.filter((d) => d.isHostDevice || d.id === 'dev-phone-01')
    : targetCategory === 'paired'
    ? devices.filter((d) => !d.isHostDevice && d.id !== 'dev-phone-01')
    : devices;

  const filteredDevices = filterType === 'all' 
    ? categoryFiltered 
    : categoryFiltered.filter((d) => d.type === filterType);

  const toggleAppsExpand = (deviceId: string) => {
    playTechBeep(1100, 0.02);
    setExpandedDeviceApps((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const handleOpenDeviceUnlockModal = (device: ConnectedDevice) => {
    playTechBeep(1400, 0.03);
    setUnlockError(null);
    setEnteredCode('');
    setUnlockModal({
      isOpen: true,
      deviceId: device.id,
      deviceName: device.name,
      type: 'device',
      expectedLockType: device.lockType || 'pin',
      lockCodeHint: device.lockCode || '4892',
    });
  };

  const handleOpenAppUnlockModal = (device: ConnectedDevice, app: InstalledApp) => {
    playTechBeep(1400, 0.03);
    setUnlockError(null);
    setEnteredCode('');
    setUnlockModal({
      isOpen: true,
      deviceId: device.id,
      deviceName: device.name,
      type: 'app',
      appId: app.id,
      appName: app.name,
      expectedLockType: app.lockType || 'passcode',
      lockCodeHint: app.lockCode || '',
    });
  };

  const handleConfirmUnlock = async () => {
    if (!unlockModal) return;
    setUnlockError(null);

    const codeToTest = enteredCode.trim();
    if (!codeToTest) {
      setUnlockError('Please specify the lock credential to proceed.');
      return;
    }

    if (unlockModal.type === 'device') {
      try {
        const res = await fetch('/api/jarvis/devices/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: unlockModal.deviceId,
            action: 'unlock_device',
            params: { lockCode: codeToTest },
          }),
        });
        const data = await res.json();
        if (data.success) {
          playDeviceUnlockSound();
          onDeviceAction(unlockModal.deviceId, 'unlock_device', { lockCode: codeToTest });
          setUnlockModal(null);
        } else {
          setUnlockError(data.error || 'Invalid device lock code.');
          playTechBeep(300, 0.1, 'sawtooth');
        }
      } catch {
        setUnlockError('Communication failure with device enclave.');
      }
    } else if (unlockModal.type === 'app') {
      try {
        const res = await fetch('/api/jarvis/devices/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: unlockModal.deviceId,
            action: 'unlock_app',
            params: { appId: unlockModal.appId, lockCode: codeToTest },
          }),
        });
        const data = await res.json();
        if (data.success) {
          playDeviceUnlockSound();
          onDeviceAction(unlockModal.deviceId, 'unlock_app', { appId: unlockModal.appId, lockCode: codeToTest });
          setUnlockModal(null);
        } else {
          setUnlockError(data.error || 'Invalid application lock passcode.');
          playTechBeep(300, 0.1, 'sawtooth');
        }
      } catch {
        setUnlockError('Error validating app credential.');
      }
    }
  };

  const handleRingPhone = (deviceId: string) => {
    playPhoneRingSound();
    setRingingDeviceId(deviceId);
    onDeviceAction(deviceId, 'ring_phone');
    setTimeout(() => setRingingDeviceId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Centralized Sovereign Device Management */}
      <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-slate-100 tracking-wider uppercase">
              AUTHORIZED PERIPHERAL & SMART DEVICE MESH
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Complete autonomous device control: unlock phones, launch and unlock apps with specified passcodes, manage hardware peripherals, and audit zero-trust security.
          </p>
        </div>

        {/* Discovery & Real-Time Pairing Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPairing && (
            <button
              onClick={() => {
                playTechBeep(1400, 0.03);
                onOpenPairing();
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-sans font-bold transition-all shadow-md active:scale-95 border ${
                isMobilePaired
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-cyan-200 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>{isMobilePaired ? 'MOBILE TETHERED' : 'PAIR REAL PHONE (QR / BLE)'}</span>
            </button>
          )}

          {onOpenMobileSimulator && (
            <button
              onClick={() => {
                playTechBeep(1300, 0.03);
                onOpenMobileSimulator();
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans font-medium text-slate-300 hover:text-cyan-300 transition-all"
              title="Open real-time interactive mobile phone client preview"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mobile Deck</span>
            </button>
          )}

          <button
            onClick={() => {
              playTechBeep(1400, 0.04);
              onScanDevices();
            }}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'SCANNING SPECTRUM...' : 'DISCOVER BEACONS'}</span>
          </button>
        </div>
      </div>

      {/* Natural Language Voice Directives Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 backdrop-blur-md border border-cyan-400/20 text-xs font-sans flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-cyan-100">
            <strong className="text-cyan-300 font-semibold">Hands-Free Device Control:</strong> Ask JARVIS in chat or voice:
            <em className="text-slate-300 ml-1">"Turn on flashlight"</em> • 
            <em className="text-slate-300 ml-1">"Ring this phone"</em> • 
            <em className="text-slate-300 ml-1">"Lock paired deadbolt"</em> • 
            <em className="text-slate-300 ml-1">"Where am I?"</em>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-mono-tech">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTONOMY: LOCAL & PAIRED READY</span>
        </div>
      </div>

      {/* Target Category Selector: This Phone vs Paired Devices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-sans">
        <button
          onClick={() => {
            playTechBeep(1200, 0.02);
            setTargetCategory('host');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold uppercase transition-all ${
            targetCategory === 'host'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>OPERATE THIS PHONE (DOWNLOADED HOST)</span>
        </button>

        <button
          onClick={() => {
            playTechBeep(1200, 0.02);
            setTargetCategory('paired');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold uppercase transition-all ${
            targetCategory === 'paired'
              ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bluetooth className="w-4 h-4 text-cyan-300" />
          <span>OPERATE PAIRED DEVICES ({pairedDevices.length})</span>
        </button>

        <button
          onClick={() => {
            playTechBeep(1200, 0.02);
            setTargetCategory('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold uppercase transition-all ${
            targetCategory === 'all'
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4 text-slate-400" />
          <span>ALL NODES ({devices.length})</span>
        </button>
      </div>

      {/* Dedicated Host Mobile Phone Command Deck */}
      {(targetCategory === 'host' || targetCategory === 'all') && hostDevice && (
        <div className="p-5 rounded-3xl bg-cyan-950/20 backdrop-blur-xl border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                <Smartphone className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                    {hostDevice.name}
                  </h3>
                  <span className="text-[9px] uppercase font-mono-tech px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>THIS MOBILE PHONE (HOST)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Direct hardware operation: trigger flashlight torch, haptic vibration, phone calls, WhatsApp messages, and screen wake lock on this phone.
                </p>
              </div>
            </div>

            {/* Hardware Status Badges */}
            <div className="flex items-center gap-2 text-xs font-mono-tech">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300">
                {realBattery?.charging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{realBattery?.level ?? hostDevice.batteryPercent}% BATTERY</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NATIVE API: READY</span>
              </div>
            </div>
          </div>

          {/* Quick Hardware Action Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
            {/* Flashlight / Torch Toggle */}
            <button
              onClick={handleToggleTorch}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                isTorchActive || hostDevice.features?.flashlight
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-amber-300'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="font-semibold">
                Flashlight: {isTorchActive || hostDevice.features?.flashlight ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Haptic Vibration */}
            <button
              onClick={handleVibratePhone}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold">Vibrate Motor</span>
            </button>

            {/* Audible Locator Siren */}
            <button
              onClick={handleRingHostPhone}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                ringingDeviceId === hostDevice.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 animate-bounce shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-cyan-300'
              }`}
            >
              <BellRing className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold">{ringingDeviceId === hostDevice.id ? 'Ringing Phone...' : 'Ring This Phone'}</span>
            </button>

            {/* Screen Wake Lock */}
            <button
              onClick={handleToggleWakeLock}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                wakeLockActive
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <Eye className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold">Screen Wake: {wakeLockActive ? 'LOCKED ON' : 'AUTO'}</span>
            </button>
          </div>

          {/* Cellular Dialer & Quick Messenger on This Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Cellular Phone Dialer */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CELLULAR TELEPHONY (TEL:)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono-tech">DIRECT CALL</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dialNumberInput}
                  onChange={(e) => setDialNumberInput(e.target.value)}
                  placeholder="Enter phone number..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400/50 rounded-xl px-3 py-2 text-xs font-mono-tech text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={handleHostDialCall}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-sans flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>
            </div>

            {/* Direct Instant Messaging (WhatsApp / SMS) with Direct Contact Lock */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DIRECT WHATSAPP & SMS DISPATCH</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTechBeep(1200, 0.02);
                    setIsContactModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 transition-colors font-mono-tech"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ ADD CONTACT</span>
                </button>
              </div>

              {/* Target Contact Selector & Direct Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono-tech block mb-0.5">TARGET CONTACT:</label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400/50 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-sans focus:outline-none"
                  >
                    {contactsList.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                        {c.name} ({c.phoneNumber})
                      </option>
                    ))}
                    <option value="custom" className="bg-slate-900 text-slate-100">
                      + Custom Direct Number
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono-tech block mb-0.5">DIRECT PHONE NUMBER:</label>
                  <input
                    type="text"
                    value={messagePhoneNumber}
                    onChange={(e) => {
                      setMessagePhoneNumber(e.target.value);
                      setSelectedContactId('custom');
                    }}
                    placeholder="+12125550144 or 9876543210"
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400/50 rounded-xl px-2.5 py-1.5 text-xs font-mono-tech text-emerald-300 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message Payload & Direct Send Buttons */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageTextInput}
                  onChange={(e) => setMessageTextInput(e.target.value)}
                  placeholder="Enter message text for WhatsApp..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-emerald-400/50 rounded-xl px-3 py-2 text-xs font-mono-tech text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleHostSendMessage('whatsapp')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-sans flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 shrink-0"
                  title="Directly opens WhatsApp chat with this exact contact"
                >
                  <Send className="w-3 h-3" />
                  <span>Direct WhatsApp</span>
                </button>
                <button
                  onClick={() => handleHostSendMessage('sms')}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-sans flex items-center gap-1 transition-all shadow-md active:scale-95 shrink-0"
                  title="Open in SMS"
                >
                  <Send className="w-3 h-3" />
                  <span>SMS</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                <span className="text-emerald-400 font-semibold">Direct Target Lock:</span> Message opens directly inside <strong className="text-slate-200">{messageRecipientInput}</strong>'s conversation without asking you to choose who to share with.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Beacons Banner */}
      {discoveredDevices.length > 0 && (
        <div className="p-5 rounded-3xl bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-200 font-sans text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>UNAUTHORIZED NEARBY BEACONS DETECTED ({discoveredDevices.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {discoveredDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 font-sans">{dev.name}</h4>
                  <p className="text-[11px] font-mono-tech text-cyan-300 mt-0.5">
                    {dev.protocol} • {dev.address} • RSSI: {dev.signalStrengthDbm} dBm
                  </p>
                </div>
                <button
                  onClick={() => {
                    playAuthSuccessSound();
                    onPairDevice(dev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-sans flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pair & Authorize</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-sans">
        {['all', 'phone', 'laptop', 'smart_lock', 'server', 'sensor_hub', 'robot_unit'].map((type) => (
          <button
            key={type}
            onClick={() => {
              playTechBeep(1200, 0.02);
              setFilterType(type);
            }}
            className={`px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all text-xs font-medium ${
              filterType === type
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/40 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Device Mesh Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map((dev) => {
          const Icon = getDeviceIcon(dev.type);
          const isLocked = Boolean(dev.isLocked || dev.data?.isLocked);
          const isPowerOn = dev.data?.state !== false;
          const hasApps = dev.installedApps && dev.installedApps.length > 0;
          const appsExpanded = expandedDeviceApps[dev.id];
          const isRinging = ringingDeviceId === dev.id;

          return (
            <div
              key={dev.id}
              className={`p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border transition-all group flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
                isRinging 
                  ? 'border-cyan-400 animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.5)]' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-cyan-300 group-hover:scale-105 transition-transform shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-100 font-sans tracking-wide">
                          {dev.name}
                        </h3>
                        {dev.isHostDevice && (
                          <span className="text-[9px] uppercase font-mono-tech px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span>THIS DEVICE (HOST)</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono-tech text-slate-400">
                        <span className="text-cyan-400">{dev.protocol}</span>
                        <span>•</span>
                        <span>{dev.address}</span>
                        <span>•</span>
                        <span className="text-slate-400">{dev.isHostDevice ? 'Host Hardware Direct' : 'Paired via Mesh'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[10px] uppercase font-mono-tech px-2.5 py-0.5 rounded-full border ${
                    dev.status === 'connected'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : dev.status === 'syncing'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    {dev.isHostDevice ? 'HOST ONLINE' : dev.status}
                  </span>
                </div>

                {/* Device Screen Lock Status Banner */}
                {(dev.type === 'phone' || dev.type === 'laptop' || dev.type === 'smart_lock') && (
                  <div className={`p-2.5 mb-3 rounded-2xl border flex items-center justify-between text-xs font-sans ${
                    isLocked
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">
                          {isLocked ? 'SCREEN LOCKED' : 'SCREEN UNLOCKED'}
                        </span>
                        {dev.lockCode && isLocked && (
                          <span className="ml-1 text-[10px] text-slate-400 font-mono-tech">
                            ({dev.lockType?.toUpperCase() || 'PIN'}: {dev.lockCode})
                          </span>
                        )}
                      </div>
                    </div>

                    {isLocked ? (
                      <button
                        onClick={() => handleOpenDeviceUnlockModal(dev)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[10px] font-sans flex items-center gap-1 transition-all shadow-sm active:scale-95"
                      >
                        <Key className="w-3 h-3" />
                        <span>Unlock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          playDeviceLockSound();
                          onDeviceAction(dev.id, 'lock_device');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-rose-300 font-medium text-[10px] font-sans flex items-center gap-1 transition-all"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Telemetry Chips */}
                <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono-tech">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Ping:</span>
                    <span className="text-cyan-300 font-semibold">{dev.lastPingMs} ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Signal:</span>
                    <span className="text-slate-300">{dev.signalStrengthDbm} dBm</span>
                  </div>
                  {dev.batteryPercent !== undefined && (
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">Battery:</span>
                      <span className="text-emerald-400 font-semibold">{dev.batteryPercent}%</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Security:</span>
                    <span className="text-amber-300 font-semibold">Tier L{dev.requiredSecurityLevel}</span>
                  </div>
                </div>

                {/* Dedicated Phone Hardware Quick Actions */}
                {dev.type === 'phone' && (
                  <div className="p-3 mb-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-300">
                      <span>HARDWARE FUNCTIONS</span>
                      <span className="text-[10px] text-cyan-400 font-mono-tech">PERMITTED</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-sans">
                      {/* Ring Phone */}
                      <button
                        onClick={() => handleRingPhone(dev.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isRinging
                            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 animate-bounce'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-cyan-300'
                        }`}
                        title="Play loud audible beacon on phone"
                      >
                        <BellRing className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isRinging ? 'Ringing...' : 'Ring Phone'}</span>
                      </button>

                      {/* Flashlight Toggle */}
                      <button
                        onClick={() => {
                          playTechBeep(1300, 0.03);
                          onDeviceAction(dev.id, 'toggle_flashlight');
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          dev.features?.flashlight
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                        title="Toggle rear LED flashlight"
                      >
                        <Zap className={`w-3.5 h-3.5 ${dev.features?.flashlight ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span>Flashlight: {dev.features?.flashlight ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Do Not Disturb Toggle */}
                      <button
                        onClick={() => {
                          playTechBeep(1200, 0.02);
                          onDeviceAction(dev.id, 'toggle_dnd');
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          dev.features?.dnd
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                        title="Toggle Do Not Disturb profile"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>DND: {dev.features?.dnd ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    {/* Remote Telecom & Cellular Call Deck */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-tech text-cyan-300 font-bold flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>REMOTE TELECOM & CELLULAR</span>
                        </span>
                        {dev.features?.activeCall ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-mono">
                            LIVE CALL • {dev.features.activeCall.status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono">STANDBY</span>
                        )}
                      </div>

                      {dev.features?.activeCall ? (
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span className="text-xs font-bold text-white truncate">
                                {dev.features.activeCall.contactName}
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-300 font-mono">
                              {dev.features.activeCall.phoneNumber} • {dev.features.activeCall.direction === 'incoming' ? 'Incoming' : 'Connected'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {dev.features.activeCall.status === 'ringing' && dev.features.activeCall.direction === 'incoming' && (
                              <button
                                onClick={() => {
                                  playTechBeep(1400, 0.03);
                                  onDeviceAction(dev.id, 'answer_call');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Answer</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                playTechBeep(1100, 0.04);
                                onDeviceAction(dev.id, 'cut_call');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-md active:scale-95"
                              title="Cut ongoing call remotely"
                            >
                              <PhoneOff className="w-3 h-3" />
                              <span>Cut Call</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <button
                            onClick={() => {
                              playTechBeep(1300, 0.03);
                              onDeviceAction(dev.id, 'initiate_call', { contact: 'Tony Stark', phoneNumber: '+1 (212) 555-0199' });
                            }}
                            className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <PhoneCall className="w-3 h-3 text-cyan-400" />
                            <span>Dial Tony Stark</span>
                          </button>
                          <button
                            onClick={() => {
                              playTechBeep(1300, 0.03);
                              onDeviceAction(dev.id, 'simulate_incoming_call', { contact: 'Pepper Potts', phoneNumber: '+1 (212) 555-0144' });
                            }}
                            className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>Simulate Incoming</span>
                          </button>
                        </div>
                      )}

                      {/* Quick 3rd Party Message Trigger */}
                      <div className="pt-1 flex items-center gap-1 text-[10px]">
                        <button
                          onClick={() => {
                            playTechBeep(1400, 0.02);
                            onDeviceAction(dev.id, 'send_message', { 
                              app: 'whatsapp', 
                              recipient: 'Pepper Potts', 
                              content: 'Lab status 100% nominal. JARVIS Core standing by.' 
                            });
                          }}
                          className="flex-1 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-medium text-center truncate px-1 transition-colors"
                          title="Send message via WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            playTechBeep(1400, 0.02);
                            onDeviceAction(dev.id, 'send_message', { 
                              app: 'signal', 
                              recipient: 'Dr. Bruce Banner', 
                              content: 'Quantum telemetry array online.' 
                            });
                          }}
                          className="flex-1 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-medium text-center truncate px-1 transition-colors"
                          title="Send message via Signal"
                        >
                          🛡️ Signal
                        </button>
                        <button
                          onClick={() => {
                            playTechBeep(1400, 0.02);
                            onDeviceAction(dev.id, 'send_message', { 
                              app: 'telegram', 
                              recipient: 'Col. Rhodes', 
                              content: 'Avionics protocol sync verified.' 
                            });
                          }}
                          className="flex-1 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 font-medium text-center truncate px-1 transition-colors"
                          title="Send message via Telegram"
                        >
                          ✈️ Telegram
                        </button>
                      </div>
                    </div>

                    {/* Sliders for Volume & Brightness */}
                    <div className="space-y-1.5 pt-1 text-[11px] font-mono-tech text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>Volume:</span>
                        </span>
                        <span className="text-cyan-300">{dev.features?.volume ?? 75}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={dev.features?.volume ?? 75}
                        onChange={(e) => onDeviceAction(dev.id, 'set_volume', { volume: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1.5">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Brightness:</span>
                        </span>
                        <span className="text-amber-300">{dev.features?.brightness ?? 85}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={dev.features?.brightness ?? 85}
                        onChange={(e) => onDeviceAction(dev.id, 'set_brightness', { brightness: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Installed Applications Deck & App-Level Locks */}
                {hasApps && (
                  <div className="mb-3 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
                    <button
                      onClick={() => toggleAppsExpand(dev.id)}
                      className="w-full p-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between text-xs font-sans font-semibold text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        <span>INSTALLED APPS & LOCKS ({dev.installedApps?.length})</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono-tech">
                        {appsExpanded ? '▲ HIDE' : '▼ VIEW'}
                      </span>
                    </button>

                    {appsExpanded && (
                      <div className="p-3 space-y-2 max-h-60 overflow-y-auto font-sans">
                        {dev.installedApps?.map((app) => (
                          <div
                            key={app.id}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-200 truncate">{app.name}</span>
                                {app.isRunning && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono-tech text-slate-400">
                                <span>{app.category}</span>
                                <span>•</span>
                                <span className={app.isLocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-medium'}>
                                  {app.isLocked 
                                    ? `LOCKED (${app.lockType?.toUpperCase() || 'PIN'}: ${app.lockCode || '****'})` 
                                    : 'UNLOCKED / ACTIVE'}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              {app.isLocked ? (
                                <button
                                  onClick={() => handleOpenAppUnlockModal(dev, app)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
                                  title={`Unlock ${app.name} with code`}
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Unlock App</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      playTechBeep(1400, 0.02);
                                      onDeviceAction(dev.id, 'launch_app', { appId: app.id });
                                    }}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-medium text-[10px] flex items-center gap-1 transition-all"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Launch</span>
                                  </button>
                                  {app.lockCode && (
                                    <button
                                      onClick={() => {
                                        playDeviceLockSound();
                                        onDeviceAction(dev.id, 'lock_app', { appId: app.id });
                                      }}
                                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-300 transition-colors"
                                      title="Lock App"
                                    >
                                      <Lock className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                {dev.type === 'smart_lock' ? (
                  <button
                    onClick={() => {
                      if (isLocked) {
                        playDeviceUnlockSound();
                      } else {
                        playDeviceLockSound();
                      }
                      onDeviceAction(dev.id, 'toggle_lock');
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                      isLocked
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>{isLocked ? 'LOCKED — TAP TO UNLOCK' : 'UNLOCKED — TAP TO SECURE'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        playTechBeep(1200, 0.02);
                        onDeviceAction(dev.id, 'ping');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono-tech text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                    >
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>Ping</span>
                    </button>

                    <button
                      onClick={() => {
                        playTechBeep(1300, 0.02);
                        onDeviceAction(dev.id, 'sync');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-[11px] font-mono-tech text-cyan-200 transition-all flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span>Sync Files</span>
                    </button>

                    <button
                      onClick={() => {
                        playTechBeep(1100, 0.03);
                        onDeviceAction(dev.id, 'toggle_power');
                      }}
                      className={`p-2 rounded-xl border transition-all ${
                        isPowerOn
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                      title={isPowerOn ? 'Power State: Active' : 'Power State: Suspended'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Unlock Modal for Device Screen or Application */}
      {unlockModal && unlockModal.isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1d]/90 backdrop-blur-2xl border border-cyan-400/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-slate-100 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-cyan-200">
                    {unlockModal.type === 'device' ? 'SPECIFY DEVICE UNLOCK CODE' : 'SPECIFY APPLICATION LOCK CODE'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono-tech mt-0.5">
                    Target: {unlockModal.type === 'device' ? unlockModal.deviceName : `${unlockModal.appName} (${unlockModal.deviceName})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModal(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Body */}
            <div className="my-5 space-y-3 font-sans">
              <p className="text-xs text-slate-300 leading-relaxed">
                JARVIS is permitted to execute the unlock routine across your device hardware and cryptographic containers. Please provide the authorized security {unlockModal.expectedLockType?.toUpperCase() || 'PIN'}:
              </p>

              {/* Code Input */}
              <div className="relative">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder={`Enter ${unlockModal.expectedLockType || 'PIN'} (e.g. ${unlockModal.lockCodeHint || '1234'})...`}
                  className="w-full bg-white/[0.06] border border-cyan-400/40 focus:border-cyan-400 rounded-2xl px-4 py-3 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono-tech tracking-widest text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmUnlock();
                  }}
                />
              </div>

              {/* One-tap authorized hint button */}
              {unlockModal.lockCodeHint && (
                <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 px-1">
                  <span>Authorized Enclave Credential:</span>
                  <button
                    type="button"
                    onClick={() => {
                      playTechBeep(1500, 0.02);
                      setEnteredCode(unlockModal.lockCodeHint || '');
                    }}
                    className="text-cyan-400 hover:text-cyan-200 underline font-semibold transition-colors"
                  >
                    Auto-Fill "{unlockModal.lockCodeHint}"
                  </button>
                </div>
              )}

              {/* Error indicator */}
              {unlockError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{unlockError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setUnlockModal(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Validate & Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Direct Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900/95 border border-cyan-400/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-sans font-bold text-sm">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>ADD DIRECT WHATSAPP CONTACT</span>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Save contacts with country code so JARVIS sends WhatsApp messages directly to their chat thread without asking you to choose who to share with.
            </p>
            <form onSubmit={handleAddNewContact} className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Mom, Office Lead"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 212 555 0199 or +91 98765 43210"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono-tech text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Role / Relationship (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Executive, Family, Colleague"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
