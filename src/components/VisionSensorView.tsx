import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Camera, 
  CameraOff, 
  Scan, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Maximize2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Crosshair
} from 'lucide-react';
import { VisionAnalysisResult } from '../types';
import { playTechBeep, playAuthSuccessSound, playAlertSound } from '../utils/audio';

interface VisionSensorViewProps {
  onAnalyzeFrame: (base64: string) => Promise<VisionAnalysisResult | null>;
}

export const VisionSensorView: React.FC<VisionSensorViewProps> = ({
  onAnalyzeFrame,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>({
    summary: 'Optical perimeter active. Laboratory workspace verified. 0 unauthorized intrusion vectors.',
    detections: [
      { label: 'Primary Operator (Verified)', confidence: 0.98, bbox: [20, 30, 75, 68], category: 'person' },
      { label: 'Workstation Display Matrix', confidence: 0.95, bbox: [45, 10, 85, 40], category: 'device' },
      { label: 'Hardware IoT Hub', confidence: 0.91, bbox: [70, 70, 90, 88], category: 'device' },
    ],
    environmentalAnomalies: ['Ambient light nominal (380 Lux)', 'CO2 baseline steady at 410 ppm'],
    recommendedActions: ['Maintain active biometric mesh tether', 'Workspace level 1 readiness confirmed'],
    timestamp: Date.now(),
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      playTechBeep(1400, 0.04);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access not granted, running in optical simulation mode:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    playTechBeep(1000, 0.04);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCaptureAndAnalyze = async () => {
    setIsAnalyzing(true);
    playTechBeep(1600, 0.05);

    let base64 = '';

    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    const res = await onAnalyzeFrame(base64);
    if (res) {
      setAnalysisResult(res);
      playAuthSuccessSound();
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-slate-100 tracking-wider uppercase">
              COMPUTER VISION & OPTICAL SENSOR HUD
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Real-time object segmentation, perimeter intrusion detection, and multimodal scene reasoning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-sans transition-all"
            >
              <CameraOff className="w-4 h-4 text-rose-400" />
              <span>DISCONNECT CAM</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-cyan-200 text-xs font-sans transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>ENABLE LIVE WEBCAM</span>
            </button>
          )}

          <button
            onClick={handleCaptureAndAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50"
          >
            <Scan className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'ANALYZING FRAME...' : 'ANALYZE OPTICAL FRAME'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Optical Viewport with HUD Overlays */}
        <div className="lg:col-span-2 relative aspect-video rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-white/15 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center">
          {/* Radar Scanline */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" />

          {/* Grid lines */}
          <div className="absolute inset-0 hud-grid-dense opacity-20 pointer-events-none" />

          {/* Camera Feed or Simulated Laboratory Screen */}
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1224]/80 to-[#030712]/90 p-6 text-center">
              {/* Central Crosshair & Reticle */}
              <div className="relative w-48 h-48 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center animate-pulse-slow">
                <div className="w-36 h-36 rounded-full border border-cyan-400/25 flex items-center justify-center">
                  <Crosshair className="w-12 h-12 text-cyan-400/70" />
                </div>
                <div className="absolute top-3 text-[9px] font-mono-tech text-cyan-300">OPTICAL-FEED-01</div>
                <div className="absolute bottom-3 text-[9px] font-mono-tech text-cyan-300">LAT: 37.7749° N</div>
              </div>
              <div className="mt-4 text-xs font-mono-tech text-slate-400">
                <span>SIMULATED OPTICAL MATRIX FEED (HD 1080p 60FPS)</span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlaid Bounding Boxes from Analysis Result */}
          {analysisResult?.detections.map((det, idx) => {
            const [ymin, xmin, ymax, xmax] = det.bbox;
            const top = `${ymin}%`;
            const left = `${xmin}%`;
            const width = `${xmax - xmin}%`;
            const height = `${ymax - ymin}%`;

            return (
              <div
                key={idx}
                className="absolute border-2 border-cyan-400 bg-cyan-500/15 backdrop-blur-[2px] transition-all rounded-lg pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                style={{ top, left, width, height }}
              >
                {/* Target Corners */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-200" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-200" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-200" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-200" />

                {/* Tag label */}
                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-cyan-400/60 text-cyan-200 text-[10px] font-mono-tech whitespace-nowrap shadow-md">
                  {det.label} ({Math.round(det.confidence * 100)}%)
                </div>
              </div>
            );
          })}

          {/* HUD Corner Badges */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/15 text-[11px] font-mono-tech text-cyan-300 flex items-center gap-2 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HUD TRACKER: LOCK ON</span>
          </div>

          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/15 text-[11px] font-mono-tech text-slate-300 backdrop-blur-md shadow-lg">
            FPS: 60 • FOV: 92° • RECOGNITION: ACTIVE
          </div>
        </div>

        {/* Right Col: Deep Vision Scene Analysis Card */}
        <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 space-y-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-cyan-300 font-sans text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>SCENE ANALYSIS INTEL</span>
              </div>
              <span className="text-[10px] font-mono-tech text-slate-400">
                {analysisResult ? new Date(analysisResult.timestamp).toLocaleTimeString() : 'N/A'}
              </span>
            </div>

            {/* Summary */}
            <div className="my-3.5 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-xs font-sans text-slate-200 leading-relaxed">
              <span className="text-cyan-300 font-mono-tech text-[11px] font-bold block mb-1">
                SUMMARY:
              </span>
              {analysisResult?.summary || 'No frame analyzed yet.'}
            </div>

            {/* Detected Entities List */}
            <div className="space-y-2 mb-3.5">
              <h4 className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                IDENTIFIED OBJECTS ({analysisResult?.detections.length || 0})
              </h4>
              {analysisResult?.detections.map((d, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-mono-tech"
                >
                  <span className="text-slate-200">{d.label}</span>
                  <span className="text-cyan-300 font-bold">{Math.round(d.confidence * 100)}%</span>
                </div>
              ))}
            </div>

            {/* Anomalies */}
            {analysisResult?.environmentalAnomalies && analysisResult.environmentalAnomalies.length > 0 && (
              <div className="space-y-1.5 mb-3.5">
                <h4 className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                  ENVIRONMENTAL CONDITIONS
                </h4>
                {analysisResult.environmentalAnomalies.map((a, i) => (
                  <div key={i} className="text-xs font-mono-tech text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Autonomous Actions */}
          {analysisResult?.recommendedActions && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono-tech text-cyan-300 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                RECOMMENDED PROACTIVE ACTIONS:
              </span>
              {analysisResult.recommendedActions.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300">
                  <span className="text-cyan-400 font-bold">›</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
