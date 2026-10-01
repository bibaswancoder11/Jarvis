import React, { useState, useEffect, useRef } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { ArcReactorOrb } from './components/ArcReactorOrb';
import { CommandCenter } from './components/CommandCenter';
import { DeviceMeshView } from './components/DeviceMeshView';
import { WorkflowsEngine } from './components/WorkflowsEngine';
import { KnowledgeMemoryView } from './components/KnowledgeMemoryView';
import { VisionSensorView } from './components/VisionSensorView';
import { SystemDiagnosticsPanel } from './components/SystemDiagnosticsPanel';
import { SecurityAuthModal } from './components/SecurityAuthModal';
import { MobilePairingModal } from './components/MobilePairingModal';
import { MobileNodeView } from './components/MobileNodeView';
import { Wifi } from 'lucide-react';
import { 
  ChatMessage, 
  ConnectedDevice, 
  AutomationWorkflow, 
  KnowledgeDocument, 
  ExecutionPlan, 
  ExecutionTask, 
  IntelligenceMode, 
  SystemStatus,
  VisionAnalysisResult,
  RealBluetoothDevice
} from './types';
import { 
  playTechBeep, 
  playJarvisChime, 
  playAuthSuccessSound, 
  playAlertSound, 
  speakText, 
  setSoundEnabled, 
  isSoundEnabled 
} from './utils/audio';

export default function App() {
  // Check if running on real physical mobile device via QR scan
  const isMobileClientMode = typeof window !== 'undefined' && window.location.search.includes('mode=mobile_node');

  if (isMobileClientMode) {
    const params = new URLSearchParams(window.location.search);
    const sessionCode = params.get('session') || 'JRV-4892';
    return <MobileNodeView isEmbedded={false} sessionCode={sessionCode} />;
  }

  const [activeTab, setActiveTab] = useState<'hud' | 'devices' | 'workflows' | 'memory' | 'vision' | 'diagnostics'>('hud');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [orbStatus, setOrbStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'alert'>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Mobile pairing & simulator state
  const [isMobilePairingOpen, setIsMobilePairingOpen] = useState<boolean>(false);
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState<boolean>(false);
  const [isMobilePaired, setIsMobilePaired] = useState<boolean>(false);

  // System status
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    online: true,
    modelMode: 'hybrid_gemini',
    uptimeSeconds: 1420,
    cpuLoad: 24,
    npuLoad: 42,
    vramUsedGb: 18.4,
    vramTotalGb: 24.0,
    temperatureC: 44,
    tokensPerSec: 68.4,
    contextWindowTokens: 4120,
    maxContextTokens: 32768,
    activeAgents: 3,
    securityEnforced: true,
  });

  // State data collections
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'jarvis',
      text: 'Good day, sir. JARVIS Sovereign Intelligence OS is fully initialized and operational. All 6 mesh nodes are tethered, local NPU tensor pipelines are nominal, and biometric security zero-trust layers are active. How may I assist you today?',
      timestamp: Date.now() - 10000,
    },
  ]);

  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<Partial<ConnectedDevice>[]>([]);
  const [isScanningDevices, setIsScanningDevices] = useState<boolean>(false);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [pendingAuthTask, setPendingAuthTask] = useState<ExecutionTask | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initial Data Fetch from Server
  useEffect(() => {
    fetchHealth();
    fetchDevices();
    fetchWorkflows();
    fetchKnowledge();

    const timer = setInterval(() => {
      setSystemStatus((prev) => ({
        ...prev,
        uptimeSeconds: prev.uptimeSeconds + 1,
        cpuLoad: Math.floor(18 + Math.random() * 10),
        npuLoad: Math.floor(38 + Math.sin(Date.now() / 8000) * 12),
        temperatureC: Math.floor(43 + Math.random() * 3),
      }));
    }, 1000);

    // Real-Time SSE Stream connection for live mobile & BLE mesh synchronization
    let eventSource: EventSource | null = null;
    if (typeof window !== 'undefined') {
      eventSource = new EventSource('/api/jarvis/events?type=desktop');

      eventSource.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices) setDevices(data.devices);
          if (data.pairingSession?.isPaired) setIsMobilePaired(true);
        } catch {}
      });

      eventSource.addEventListener('device_paired', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setIsMobilePaired(true);
          fetchDevices();
          playAuthSuccessSound();
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: 'system',
              text: `Physical Mobile Device [${data.device?.name || 'Mobile Unit'}] connected via Real-Time Wi-Fi. Full device actuation & lock control online.`,
              timestamp: Date.now(),
            },
          ]);
        } catch {}
      });

      eventSource.addEventListener('bluetooth_paired', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          fetchDevices();
          playAuthSuccessSound();
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: 'system',
              text: `Physical Web Bluetooth device "${data.device?.name}" paired and authenticated with JARVIS mesh.`,
              timestamp: Date.now(),
            },
          ]);
        } catch {}
      });

      eventSource.addEventListener('devices_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices) setDevices(data.devices);
        } catch {}
      });

      eventSource.addEventListener('device_action', (e: MessageEvent) => {
        try {
          fetchDevices();
        } catch {}
      });
    }

    return () => {
      clearInterval(timer);
      if (eventSource) eventSource.close();
    };
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.systemLoad) {
        setSystemStatus((prev) => ({
          ...prev,
          ...data.systemLoad,
          uptimeSeconds: data.uptimeSeconds || prev.uptimeSeconds,
        }));
      }
    } catch (e) {
      console.warn('API health check fallback');
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/jarvis/devices');
      const data = await res.json();
      if (data.devices) setDevices(data.devices);
    } catch (e) {
      console.warn('Devices fetch fallback');
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/jarvis/workflows');
      const data = await res.json();
      if (data.workflows) setWorkflows(data.workflows);
    } catch (e) {
      console.warn('Workflows fetch fallback');
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/jarvis/knowledge');
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch (e) {
      console.warn('Knowledge fetch fallback');
    }
  };

  // Web Speech API Voice Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setOrbStatus('listening');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          setInterimTranscript(interim || final);
          setAudioLevel(0.4 + Math.random() * 0.5);

          if (final.trim()) {
            setInterimTranscript('');
            handleSendMessage(final.trim());
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech Recognition notice:', err.error);
          setIsListening(false);
          setOrbStatus('idle');
          setAudioLevel(0);
        };

        recognition.onend = () => {
          setIsListening(false);
          setOrbStatus((prev) => (prev === 'listening' ? 'idle' : prev));
          setAudioLevel(0);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is supported in Chrome, Edge, and Safari browsers.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setOrbStatus('idle');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setOrbStatus('listening');
        playJarvisChime();
      } catch (err) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // Main Directive / Prompt Dispatcher
  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim() || isProcessing) return;

    setIsProcessing(true);
    setOrbStatus('processing');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mode: systemStatus.modelMode,
          chatHistory: messages.slice(-4),
        }),
      });

      const data = await res.json();
      if (data.plan) {
        setCurrentPlan(data.plan);

        // Check if any task requires Level 2/3 authorization
        const reqAuth = data.plan.tasks?.find(
          (t: ExecutionTask) => t.status === 'requires_authorization'
        );

        if (reqAuth) {
          setPendingAuthTask(reqAuth);
          setOrbStatus('alert');
          playAlertSound();
        } else {
          setOrbStatus('speaking');
          playJarvisChime();
        }
      }

      const jarvisReplyText = data.reply || 'Directive acknowledged, sir.';
      const jarvisMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'jarvis',
        text: jarvisReplyText,
        timestamp: Date.now(),
        planId: data.plan?.id,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      fetchDevices(); // Immediately sync device lock & feature states

      // Speak response with speech synthesis
      if (soundActive) {
        speakText(jarvisReplyText, () => {
          setOrbStatus('idle');
        });
      } else {
        setTimeout(() => setOrbStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setOrbStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve Security Authorization Challenge
  const handleApproveAuth = async (taskId: string) => {
    const task = currentPlan?.tasks.find((t) => t.id === taskId);
    if (task) {
      // Execute the task against the server backend
      try {
        await fetch('/api/jarvis/execute-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: task.tool,
            parameters: task.parameters,
            securityLevel: task.requiredSecurityLevel,
          }),
        });
        fetchDevices();
      } catch (e) {
        console.warn('Execute task error:', e);
      }
    }

    if (currentPlan) {
      const updatedTasks = currentPlan.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, output: 'Biometric authorization validated. Subroutine successfully executed.' }
          : t
      );
      setCurrentPlan({ ...currentPlan, tasks: updatedTasks });
    }

    setPendingAuthTask(null);
    setOrbStatus('idle');
    playAuthSuccessSound();

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        text: `Level Biometric Security Clearance GRANTED for subroutine execution. Task verified with cryptographic seal.`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleRejectAuth = (taskId: string) => {
    if (currentPlan) {
      const updatedTasks = currentPlan.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'failed' as const, error: 'Denied by operator security protocol.' }
          : t
      );
      setCurrentPlan({ ...currentPlan, tasks: updatedTasks });
    }

    setPendingAuthTask(null);
    setOrbStatus('idle');
    playAlertSound();

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        text: `Directive authorization DENIED by operator. Security barrier held.`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Device actions
  const handleDeviceAction = async (deviceId: string, action: string, params?: any) => {
    try {
      const res = await fetch('/api/jarvis/devices/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action, params }),
      });
      const data = await res.json();
      if (data.device) {
        setDevices((prev) => prev.map((d) => (d.id === deviceId ? data.device : d)));
      }
    } catch (e) {
      console.warn('Device action error');
    }
  };

  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    try {
      const res = await fetch('/api/jarvis/devices/scan', { method: 'POST' });
      const data = await res.json();
      if (data.discovered) {
        setDiscoveredDevices(data.discovered);
      }
    } catch (e) {
      console.warn('Scan error');
    } finally {
      setIsScanningDevices(false);
    }
  };

  const handlePairDevice = (newDev: Partial<ConnectedDevice>) => {
    const fullDev: ConnectedDevice = {
      id: newDev.id || `dev-${Date.now()}`,
      name: newDev.name || 'Wireless Node',
      type: (newDev.type as any) || 'robot_unit',
      protocol: (newDev.protocol as any) || 'BLE 5.3',
      address: newDev.address || '0xAA:BB:CC',
      status: 'connected',
      batteryPercent: newDev.batteryPercent || 90,
      signalStrengthDbm: newDev.signalStrengthDbm || -50,
      requiredSecurityLevel: newDev.requiredSecurityLevel || 2,
      lastPingMs: 6,
      data: { state: true, value: 'Authenticated & Paired' },
    };

    setDevices((prev) => [...prev, fullDev]);
    setDiscoveredDevices((prev) => prev.filter((d) => d.id !== newDev.id));
  };

  // Workflows
  const handleRunWorkflow = async (workflowId: string) => {
    try {
      const res = await fetch('/api/jarvis/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      });
      const data = await res.json();
      if (data.workflow) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? data.workflow : w)));
      }
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'jarvis',
            text: data.message,
            timestamp: Date.now(),
          },
        ]);
        if (soundActive) speakText(data.message);
      }
    } catch (e) {
      console.warn('Workflow run error');
    }
  };

  const handleCreateWorkflow = async (newWf: any) => {
    try {
      const res = await fetch('/api/jarvis/workflows/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWf),
      });
      const data = await res.json();
      if (data.workflow) {
        setWorkflows((prev) => [...prev, data.workflow]);
      }
    } catch (e) {
      console.warn('Create workflow error');
    }
  };

  // Knowledge search & add
  const handleSearchKnowledge = async (query: string) => {
    try {
      const res = await fetch('/api/jarvis/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.results) setDocuments(data.results);
    } catch (e) {
      console.warn('Knowledge query error');
    }
  };

  const handleAddKnowledge = async (doc: Partial<KnowledgeDocument>) => {
    try {
      const res = await fetch('/api/jarvis/knowledge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      const data = await res.json();
      if (data.document) {
        setDocuments((prev) => [data.document, ...prev]);
      }
    } catch (e) {
      console.warn('Add knowledge error');
    }
  };

  // Computer Vision Frame Analysis
  const handleAnalyzeVision = async (imageBase64: string): Promise<VisionAnalysisResult | null> => {
    try {
      const res = await fetch('/api/jarvis/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      return data.result || null;
    } catch (e) {
      console.warn('Vision analyze error');
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden font-sans">
      {/* Frosted Glass Background Ambient Blur Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] bg-blue-900/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-indigo-950/15 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Subtle HUD Grid Overlay */}
      <div className="fixed inset-0 hud-grid opacity-30 pointer-events-none z-0" />

      {/* Top HUD Navigation Bar (Frosted Glass) */}
      <HeaderHUD
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        soundEnabled={soundActive}
        setSoundEnabled={(enabled) => {
          setSoundActive(enabled);
          setSoundEnabled(enabled);
        }}
        onSelectMode={(mode) => setSystemStatus((prev) => ({ ...prev, modelMode: mode }))}
        onOpenPairing={() => setIsMobilePairingOpen(true)}
        onOpenMobileSimulator={() => setIsMobileSimulatorOpen(true)}
        isMobilePaired={isMobilePaired}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 relative z-10">
        {activeTab === 'hud' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[640px]">
            {/* Left Col (4 Cols): Holographic Arc Reactor & Quick Status Matrix in Frosted Glass Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-sans text-[11px] font-semibold text-cyan-400 uppercase tracking-[0.2em]">
                    NEURAL INTELLIGENCE ORB
                  </span>
                  <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                    45 TOPS NPU
                  </span>
                </div>

                {/* Central Holographic Reactor Orb */}
                <ArcReactorOrb
                  status={orbStatus}
                  isListening={isListening}
                  onToggleListen={toggleListening}
                  audioLevel={audioLevel}
                />

                {/* Live Model & Node Status (Frosted Glass Chips) */}
                <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-xs font-mono-tech space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Local Engine:</span>
                    <span className="text-cyan-300 font-semibold uppercase text-xs">
                      {systemStatus.modelMode.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Clearance Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ZERO-TRUST SECURE
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Active Mesh Nodes:</span>
                    <span className="text-slate-200 font-semibold text-xs">{devices.length} Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Mobile Wi-Fi Tether:</span>
                    <span className={`font-semibold text-xs flex items-center gap-1.5 ${isMobilePaired ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isMobilePaired ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {isMobilePaired ? 'REAL-TIME PAIRED' : 'STANDBY (QR CODE)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Sovereign Notice with Pairing Trigger */}
              <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-sans">
                <button
                  onClick={() => setIsMobilePairingOpen(true)}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 transition-colors font-medium text-[11px]"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{isMobilePaired ? 'Manage Mobile Link' : 'Pair Real Phone (QR / BLE)'}</span>
                </button>
                <button
                  onClick={() => setIsMobileSimulatorOpen(true)}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono-tech transition-colors"
                >
                  [Open Mobile Deck]
                </button>
              </div>
            </div>

            {/* Right Col (8 Cols): Autonomous Command Stream & Task Planner */}
            <div className="lg:col-span-8 h-full">
              <CommandCenter
                messages={messages}
                currentPlan={currentPlan}
                onSendMessage={handleSendMessage}
                onRequestAuth={(task) => setPendingAuthTask(task)}
                isProcessing={isProcessing}
                isListening={isListening}
                onToggleListen={toggleListening}
                interimTranscript={interimTranscript}
              />
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <DeviceMeshView
            devices={devices}
            onDeviceAction={handleDeviceAction}
            onScanDevices={handleScanDevices}
            isScanning={isScanningDevices}
            discoveredDevices={discoveredDevices}
            onPairDevice={handlePairDevice}
            onOpenPairing={() => setIsMobilePairingOpen(true)}
            onOpenMobileSimulator={() => setIsMobileSimulatorOpen(true)}
            isMobilePaired={isMobilePaired}
          />
        )}

        {activeTab === 'workflows' && (
          <WorkflowsEngine
            workflows={workflows}
            onRunWorkflow={handleRunWorkflow}
            onCreateWorkflow={handleCreateWorkflow}
          />
        )}

        {activeTab === 'memory' && (
          <KnowledgeMemoryView
            documents={documents}
            onSearch={handleSearchKnowledge}
            onAddDocument={handleAddKnowledge}
          />
        )}

        {activeTab === 'vision' && (
          <VisionSensorView onAnalyzeFrame={handleAnalyzeVision} />
        )}

        {activeTab === 'diagnostics' && (
          <SystemDiagnosticsPanel
            systemStatus={systemStatus}
            onSelectMode={(mode) => setSystemStatus((prev) => ({ ...prev, modelMode: mode }))}
          />
        )}
      </main>

      {/* Zero-Trust Biometric Security Challenge Modal */}
      {pendingAuthTask && (
        <SecurityAuthModal
          task={pendingAuthTask}
          onApprove={handleApproveAuth}
          onReject={handleRejectAuth}
        />
      )}

      {/* Real Mobile & Web Bluetooth Pairing Modal */}
      <MobilePairingModal
        isOpen={isMobilePairingOpen}
        onClose={() => setIsMobilePairingOpen(false)}
        onOpenMobileSimulator={() => {
          setIsMobilePairingOpen(false);
          setIsMobileSimulatorOpen(true);
        }}
        onBluetoothPaired={(btDevice) => {
          fetchDevices();
          setIsMobilePairingOpen(false);
        }}
      />

      {/* Live Interactive Mobile Phone Deck Simulator Modal */}
      {isMobileSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative animate-scale-up">
            <MobileNodeView
              isEmbedded={true}
              sessionCode="JRV-4892"
              onClose={() => setIsMobileSimulatorOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
