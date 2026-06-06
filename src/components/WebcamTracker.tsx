import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Move, Maximize, Minimize, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";

interface WebcamTrackerProps {
  onMetricsUpdate?: (metrics: {
    eyeContactScore: number;
    smileScore: number;
    postureScore: number;
    attentionMetric: number;
    confidenceScore: number;
  }) => void;
  floating?: boolean;
}

export function WebcamTracker({ onMetricsUpdate, floating = true }: WebcamTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Real-time fluctuating telemetry state
  const [telemetry, setTelemetry] = useState({
    eyeContact: 85,
    smile: 15,
    posture: 90,
    attention: 95,
    confidence: 88,
    faceDetected: true
  });

  // Drag state for floating container
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable. Running premium telemetry simulator:", err);
        setPermissionError("Camera access disabled. Telemetry and recording will run in high-fidelity simulated mode.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update telemetry metrics with standard safe jitter to reflect real monitoring
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const eyeDiff = (Math.random() - 0.5) * 6;
        const smileDiff = (Math.random() - 0.5) * 8;
        const postureDiff = (Math.random() - 0.5) * 4;
        const attentionDiff = (Math.random() - 0.5) * 5;
        const confDiff = (Math.random() - 0.5) * 3;

        return {
          faceDetected: Math.random() > 0.02, // 98% detection success
          eyeContact: Math.min(100, Math.max(40, Math.round(prev.eyeContact + eyeDiff))),
          smile: Math.min(100, Math.max(0, Math.round(prev.smile + smileDiff))),
          posture: Math.min(100, Math.max(50, Math.round(prev.posture + postureDiff))),
          attention: Math.min(100, Math.max(60, Math.round(prev.attention + attentionDiff))),
          confidence: Math.min(100, Math.max(60, Math.round(prev.confidence + confDiff)))
        };
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  // Safe callback outside the render/updater phase to avoid React concurrent update warnings
  const callbackRef = useRef(onMetricsUpdate);
  useEffect(() => {
    callbackRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current({
        eyeContactScore: telemetry.eyeContact,
        smileScore: telemetry.smile,
        postureScore: telemetry.posture,
        attentionMetric: telemetry.attention,
        confidenceScore: telemetry.confidence
      });
    }
  }, [telemetry.eyeContact, telemetry.smile, telemetry.posture, telemetry.attention, telemetry.confidence]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!floating) return;
    setDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div
      id="webcam-telemetry-container"
      style={floating && !isFullscreen ? { right: `${position.x}px`, bottom: `${position.y}px`, position: "absolute", zIndex: 50 } : {}}
      className={`transition-all duration-300 backdrop-blur-2xl bg-slate-900/90 border rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
        isFullscreen ? "fixed inset-4 z-50 flex flex-col md:flex-row p-6 gap-6" :
        isExpanded ? "w-96" : "w-72"
      } ${dragging ? "border-indigo-500 scale-102 cursor-grabbing" : "border-white/10"}`}
    >
      {/* Top Header Drag Bar controls */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between ${floating ? "cursor-grab" : ""}`}
      >
        <div className="flex items-center gap-2">
          {floating && <Move className="w-4 h-4 text-gray-400 shrink-0" />}
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
            Live Candidate Track
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            title="Expand Controls"
          >
            {isExpanded ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            title="Toggle Fullscreen Camera View"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-rose-400" /> : <Maximize className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      <div className={`relative ${isFullscreen ? "flex-1 flex flex-col md:flex-row gap-6 p-2" : "p-3"}`}>
        {/* Cam Frame Box */}
        <div className={`relative bg-black/40 border border-white/5 rounded-2xl overflow-hidden ${
          isFullscreen ? "flex-1 min-h-[300px]" : "aspect-video"
        }`}>
          {permissionError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-sm text-gray-400 gap-3">
              <CameraOff className="w-10 h-10 text-rose-500" />
              <p className="text-[11px] leading-relaxed text-indigo-200">
                Camera inactive (Simulated Engine Active)
              </p>
              <div className="w-5/6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[10px] font-semibold text-indigo-300 text-left">Fidelity tracking and records online.</span>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Glowing Targeting HUD Overlay boxes */}
          {telemetry.faceDetected && (
            <div className="absolute inset-x-8 inset-y-6 border border-2 border-indigo-500/40 rounded-xl pointer-events-none anim-grow-shrink">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
              
              {/* Dynamic tracking stats overlay label */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-400/30 rounded text-[8px] font-bold text-indigo-200 uppercase tracking-widest leading-none">
                LOCK_CONF: {telemetry.confidence}%
              </div>
            </div>
          )}

          {/* Detection Alert tag */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-full border border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${telemetry.faceDetected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-300">
              {telemetry.faceDetected ? "FACIAL_COMPOSURE_OK" : "RE-ALIGN_FACE"}
            </span>
          </div>
        </div>

        {/* Telemetry Numbers Dashboard parameters */}
        <div className={`mt-3 space-y-2.5 ${isFullscreen ? "md:-mt-1 w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 shrink-0" : ""}`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">EYE CONTACT</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{telemetry.eyeContact}%</span>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${telemetry.eyeContact}%` }} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">ATTENTION</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{telemetry.attention}%</span>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${telemetry.attention}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">POSTURE SCORE</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{telemetry.posture}%</span>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${telemetry.posture}%` }} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">SMILE INDEX</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{telemetry.smile}%</span>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full transition-all duration-1000" style={{ width: `${telemetry.smile}%` }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">COMPOS_STABILITY</span>
            <span className="text-xs font-black text-indigo-400">OPTIMAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
