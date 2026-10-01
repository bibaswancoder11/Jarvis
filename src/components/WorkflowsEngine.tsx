import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  AlertCircle, 
  Layers, 
  ArrowRight, 
  Sliders, 
  Radio, 
  Bell, 
  FileCode, 
  Shield, 
  RotateCw
} from 'lucide-react';
import { AutomationWorkflow, WorkflowNode } from '../types';
import { playTechBeep, playJarvisChime, playAuthSuccessSound } from '../utils/audio';

interface WorkflowsEngineProps {
  workflows: AutomationWorkflow[];
  onRunWorkflow: (workflowId: string) => void;
  onCreateWorkflow: (newWf: any) => void;
}

export const WorkflowsEngine: React.FC<WorkflowsEngineProps> = ({
  workflows,
  onRunWorkflow,
  onCreateWorkflow,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [triggerType, setTriggerType] = useState<'voice_command' | 'time_schedule' | 'sensor_event'>('voice_command');
  const [triggerConfig, setTriggerConfig] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    onCreateWorkflow({
      name: wfName.trim(),
      description: wfDesc.trim() || 'Custom user autonomous workflow',
      trigger: {
        type: triggerType,
        config: triggerConfig.trim() || 'Manual / Voice activation',
      },
      nodes: [
        { id: 'n1', title: 'Verify Local Security Clearance', tool: 'system_command', params: { check: 'biometrics' }, securityLevel: 1 },
        { id: 'n2', title: 'Execute Device Action Sequence', tool: 'device_control', params: { target: 'mesh_devices' }, securityLevel: 2 },
        { id: 'n3', title: 'Log Verification to Sovereign Vault', tool: 'knowledge_retrieval', params: { action: 'log' }, securityLevel: 0 },
      ],
    });

    playAuthSuccessSound();
    setShowBuilder(false);
    setWfName('');
    setWfDesc('');
    setTriggerConfig('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-slate-100 tracking-wider uppercase">
              AUTONOMOUS WORKFLOW & TASK AUTOMATION ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Event-driven DAG orchestrator executing multi-step routines across system functions, files, and IoT devices.
          </p>
        </div>

        <button
          onClick={() => {
            playTechBeep(1400, 0.03);
            setShowBuilder(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>NEW WORKFLOW ROUTINE</span>
        </button>
      </div>

      {/* Workflow Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-sans font-bold text-sm text-cyan-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                CREATE SOVEREIGN AUTOMATION WORKFLOW
              </h3>
              <button
                onClick={() => setShowBuilder(false)}
                className="text-slate-400 hover:text-white text-xs font-mono-tech"
              >
                ✕ CANCEL
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Workflow Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Night Laboratory Lockdown"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono-tech"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Dims lights, seals deadbolts, and syncs neural weights"
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Trigger Mechanism:</label>
                  <select
                    value={triggerType}
                    onChange={(e: any) => setTriggerType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono-tech"
                  >
                    <option value="voice_command">Voice Directive</option>
                    <option value="time_schedule">Scheduled Cron</option>
                    <option value="sensor_event">Sensor Anomaly Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Trigger Parameter:</label>
                  <input
                    type="text"
                    placeholder="e.g. 'Lockdown Lab' or '23:00 Daily'"
                    value={triggerConfig}
                    onChange={(e) => setTriggerConfig(e.target.value)}
                    className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono-tech"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-slate-300 text-[11px] font-sans">
                <span className="text-cyan-300 font-bold">Execution Plan:</span> Automatically compiles 3 verified tool steps with zero-trust local verification.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-sans shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  COMPILE & DEPLOY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="space-y-5">
        {workflows.map((wf) => {
          const isRunning = wf.lastStatus === 'running';

          return (
            <div
              key={wf.id}
              className={`p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
                isRunning ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 font-bold shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-slate-100 tracking-wide">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans">{wf.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[11px] font-mono-tech text-slate-400 text-right">
                    <div>Executions: <span className="text-cyan-300 font-semibold">{wf.executionCount}</span></div>
                    {wf.lastRunTimestamp && (
                      <div className="text-[10px] text-slate-400">
                        Last: {new Date(wf.lastRunTimestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      playJarvisChime();
                      onRunWorkflow(wf.id);
                    }}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'EXECUTING...' : 'RUN PIPELINE'}</span>
                  </button>
                </div>
              </div>

              {/* Trigger Info */}
              <div className="my-3.5 flex items-center gap-2 text-xs font-mono-tech">
                <span className="text-slate-400 font-sans">Trigger:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                  {wf.trigger.type.replace('_', ' ').toUpperCase()} • {wf.trigger.config}
                </span>
              </div>

              {/* Step Sequence DAG Nodes */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {wf.nodes.map((node, idx) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-2xl border text-xs font-mono-tech flex flex-col justify-between ${
                      isRunning
                        ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200 animate-pulse'
                        : 'bg-white/[0.03] border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-amber-300 border border-amber-500/30 font-bold">
                        L{node.securityLevel}
                      </span>
                    </div>

                    <div className="font-medium text-slate-200 font-sans text-xs mb-1.5">
                      {node.title}
                    </div>

                    <div className="text-[10px] text-cyan-400">
                      Tool: {node.tool}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
