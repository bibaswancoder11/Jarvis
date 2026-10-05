import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Terminal, 
  ChevronRight, 
  ChevronDown, 
  Volume2, 
  Play, 
  RefreshCw,
  Sliders,
  CornerDownLeft,
  Lock,
  Layers
} from 'lucide-react';
import { ChatMessage, ExecutionPlan, ExecutionTask, SecurityLevel } from '../types';
import { playTechBeep, playJarvisChime, speakText } from '../utils/audio';

interface CommandCenterProps {
  messages: ChatMessage[];
  currentPlan: ExecutionPlan | null;
  onSendMessage: (prompt: string) => void;
  onRequestAuth: (task: ExecutionTask) => void;
  isProcessing: boolean;
  isListening: boolean;
  onToggleListen: () => void;
  interimTranscript: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  messages,
  currentPlan,
  onSendMessage,
  onRequestAuth,
  isProcessing,
  isListening,
  onToggleListen,
  interimTranscript,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, currentPlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    playTechBeep(1600, 0.04);
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const toggleTaskExpand = (taskId: string) => {
    playTechBeep(1100, 0.02);
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const quickDirectives = [
    { label: 'Where Am I?', prompt: 'Where am I?', icon: '📍' },
    { label: 'Call Tony Stark', prompt: 'Call Tony Stark on my Pixel phone', icon: '📞' },
    { label: 'Cut Ongoing Call', prompt: 'Cut the ongoing call and disconnect phone line', icon: '🔴' },
    { label: 'Message on WhatsApp', prompt: 'Send message to Pepper Potts on WhatsApp saying: Lab systems are 100% nominal', icon: '💬' },
    { label: 'Message on Signal', prompt: 'Send message to Dr. Bruce Banner on Signal saying: Quantum core calibration complete', icon: '🛡️' },
    { label: 'Unlock Phone (PIN: 4892)', prompt: 'Unlock my Pixel phone with PIN 4892', icon: '📱' },
    { label: 'Unlock Signal (PIN: 7701)', prompt: 'Unlock Signal app with code 7701 and open it', icon: '🔓' },
    { label: 'Ring My Phone', prompt: 'Ring my phone at maximum volume to locate it', icon: '🔔' },
    { label: 'Phone Flashlight', prompt: 'Turn on phone flashlight at full brightness', icon: '💡' },
    { label: 'Lock All Devices & Apps', prompt: 'Lock my phone, lock all secure apps, and engage deadbolts', icon: '🔒' },
    { label: 'Security Lockdown', prompt: 'Execute Facility Lockdown and seal all smart deadbolts', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col h-full bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] overflow-hidden">
      {/* Top Banner: Autonomous Task Planning Pipeline Indicator */}
      <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="font-sans tracking-wider text-xs text-cyan-200 font-semibold uppercase">
            AUTONOMOUS COMMAND & REASONING STREAM
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono-tech text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-300 font-medium">PLANNER: ACTIVE</span>
        </div>
      </div>

      {/* Messages & Execution Stream */}
      <div 
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 font-mono-tech scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-7 h-7 animate-pulse text-cyan-300" />
            </div>
            <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
              JARVIS Neural Core Ready
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 font-sans">
              Speak via voice interface or select a directive to plan multi-step workflows, control devices, or retrieve sovereign memory.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          return (
            <div
              key={`${msg.id || 'msg'}-${index}-${msg.timestamp || ''}`}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400 px-1 font-sans">
                <span className="font-semibold text-cyan-400 uppercase">
                  {isUser ? 'OPERATOR' : isSystem ? 'SYSTEM DAEMON' : 'JARVIS CORE'}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>

              <div
                className={`p-4 rounded-2xl text-xs max-w-[90%] md:max-w-[80%] leading-relaxed ${
                  isUser
                    ? 'bg-cyan-500/15 backdrop-blur-md border border-cyan-400/30 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-br-xs'
                    : isSystem
                    ? 'bg-white/[0.04] backdrop-blur-md border border-white/10 text-slate-200 rounded-bl-xs'
                    : 'bg-white/[0.06] backdrop-blur-lg border border-white/15 text-slate-100 shadow-[0_0_25px_rgba(0,0,0,0.2)] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap font-sans text-[13px]">{msg.text}</p>

                {/* Speak button for JARVIS messages */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-sans">
                    <button
                      onClick={() => {
                        playTechBeep(1300, 0.03);
                        speakText(msg.text);
                      }}
                      className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-100 transition-colors py-0.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Play Voice Output</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">VOICE SYNTHESIS: READY</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Active Plan Visualizer */}
        {currentPlan && (
          <div className="my-3 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-sans font-bold text-cyan-300 uppercase tracking-wider">
                  MULTI-STEP DECONSTRUCTED EXECUTION PLAN
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-mono-tech">
                  CONFIDENCE: {Math.round(currentPlan.confidence * 100)}%
                </span>
                <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono-tech">
                  {currentPlan.status}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-sans mb-3">
              <span className="text-cyan-400 font-semibold">INTENT: </span>
              {currentPlan.intent}
            </div>

            {/* Tasks Chain */}
            <div className="space-y-2">
              {currentPlan.tasks.map((task, taskIdx) => {
                const isExpanded = expandedTasks[task.id];
                const isAuthReq = task.status === 'requires_authorization';
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={`${task.id || 'task'}-${taskIdx}-${task.step || 0}`}
                    className={`rounded-xl border text-xs transition-all ${
                      isAuthReq
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : isCompleted
                        ? 'bg-white/[0.02] border-white/10 text-slate-200'
                        : 'bg-white/[0.04] border-white/10 text-slate-300'
                    }`}
                  >
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleTaskExpand(task.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                          {task.step}
                        </span>

                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isAuthReq ? (
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                        ) : (
                          <Clock className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                        )}

                        <span className="font-medium text-xs text-slate-100 font-sans">{task.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Security Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-tech ${
                          task.requiredSecurityLevel >= 2
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold'
                            : 'bg-white/5 text-slate-400'
                        }`}>
                          SEC L{task.requiredSecurityLevel}
                        </span>

                        {/* Tool Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-mono-tech">
                          {task.tool}
                        </span>

                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-white/10 bg-black/20 text-[11px] font-mono-tech space-y-1.5 rounded-b-xl">
                        <div>
                          <span className="text-slate-400">Parameters:</span>{' '}
                          <code className="text-cyan-300">{JSON.stringify(task.parameters)}</code>
                        </div>
                        {task.output && (
                          <div>
                            <span className="text-slate-400">Execution Output:</span>{' '}
                            <span className="text-emerald-300">{task.output}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Authorization Action Button */}
                    {isAuthReq && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-amber-500/20 bg-amber-500/10 flex items-center justify-between rounded-b-xl">
                        <div className="text-[11px] text-amber-300 flex items-center gap-1.5 font-sans">
                          <Lock className="w-3 h-3" />
                          <span>Explicit Level {task.requiredSecurityLevel} Biometric Token Required</span>
                        </div>
                        <button
                          onClick={() => {
                            playTechBeep(1800, 0.05);
                            onRequestAuth(task);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-sans flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>GRANT BIOMETRIC AUTHORIZATION</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interim Speech Transcript while listening */}
        {isListening && interimTranscript && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-200 text-xs italic flex items-center gap-2 animate-pulse backdrop-blur-md">
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-ping" />
            <span>Hearing: "{interimTranscript}"</span>
          </div>
        )}
      </div>

      {/* Quick Directives Chips */}
      <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest shrink-0">
          DIRECTIVES:
        </span>
        {quickDirectives.map((d, idx) => (
          <button
            key={idx}
            onClick={() => {
              playTechBeep(1300, 0.02);
              onSendMessage(d.prompt);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-200 text-xs font-sans whitespace-nowrap transition-all active:scale-95 backdrop-blur-md"
          >
            <span>{d.icon}</span>
            <span>{d.label}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-4 bg-white/[0.03] border-t border-white/10 backdrop-blur-xl flex items-center gap-3">
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={() => {
            playJarvisChime();
            onToggleListen();
          }}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            isListening
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.4)]'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300 shadow-sm'
          }`}
          title={isListening ? 'Stop Voice Listening' : 'Voice Command (Push to Talk)'}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Enter directive or natural language command for JARVIS..."}
            className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 focus:border-cyan-400/60 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono-tech transition-all"
            disabled={isProcessing}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 transition-all font-bold flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
          title="Send Directive (Enter)"
        >
          {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};
