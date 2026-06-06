import React, { useEffect, useState, useRef } from "react";
import { User, ShieldAlert, Cpu, Heart, Sparkles, UserCheck } from "lucide-react";

export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  description: string;
  voice: string;
  accent: string;
  bgColor: string;
  icon: React.ReactNode;
}

export const AVATARS: AvatarOption[] = [
  {
    id: "marcus-tech",
    name: "Marcus",
    role: "Principal AI Architect",
    description: "Evaluates hard system metrics, custom LLM scalability, core data structures, and production-architected pipeline integrations.",
    voice: "Google US English Male (or standard prebuilt voice)",
    accent: "Deep, crisp, deliberate pacing",
    bgColor: "from-blue-600/30 to-indigo-900/30",
    icon: <Cpu className="w-5 h-5 text-blue-400" />
  },
  {
    id: "olivia-talent",
    name: "Olivia",
    role: "Global HR Partner",
    description: "Focuses on strategic fit, operational culture ownership, cross-functional engineering processes, and professional executive maturity.",
    voice: "Google US English Female",
    accent: "Encouraging, articular, fast-paced",
    bgColor: "from-purple-600/30 to-pink-900/30",
    icon: <UserCheck className="w-5 h-5 text-purple-400" />
  },
  {
    id: "vikram-founder",
    name: "Vikram",
    role: "Unicorn Founder & CEO",
    description: "Tests strategic problem framing, commercial scaling empathy, hyper-growth agility, product delivery trade-offs, and critical leadership drives.",
    voice: "Google UK English Male",
    accent: "High excitement, direct, entrepreneurial",
    bgColor: "from-rose-600/30 to-amber-900/30",
    icon: <Sparkles className="w-5 h-5 text-rose-400" />
  },
  {
    id: "sophia-people",
    name: "Sophia",
    role: "People Operations Lead",
    description: "Susses out teamwork dynamics, empathy indicators, conflict resolution methodologies, and career timeline aspirations.",
    voice: "Google US English Female",
    accent: "Calm, welcoming, precise phrasing",
    bgColor: "from-emerald-600/30 to-teal-900/30",
    icon: <Heart className="w-5 h-5 text-emerald-400" />
  }
];

interface AvatarPanelProps {
  selectedAvatarId: string;
  onSelectAvatar?: (id: string) => void;
  state?: "idle" | "speaking" | "listening" | "thinking";
  interactive?: boolean;
}

export function AvatarPanel({ selectedAvatarId, onSelectAvatar, state = "idle", interactive = false }: AvatarPanelProps) {
  const activeAvatar = AVATARS.find((a) => a.id === selectedAvatarId) || AVATARS[0];
  const [pulseScale, setPulseScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate dynamic voice ripple line on visual canvas for real speech modeling
  useEffect(() => {
    let animationId: number;
    let phase = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = state === "speaking" ? "#6366f1" : state === "listening" ? "#10b981" : state === "thinking" ? "#e11d48" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        let y = h / 2;
        if (state === "speaking") {
          y += Math.sin(x * 0.05 + phase) * Math.cos(x * 0.01) * 15 * Math.sin(phase * 2);
        } else if (state === "listening") {
          y += Math.sin(x * 0.08 + phase) * 3;
        } else if (state === "thinking") {
          y += Math.sin(x * 0.02 + phase) * Math.sin(x * 0.1) * 6;
        } else {
          y += Math.sin(x * 0.01 + phase) * 1.5;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += state === "speaking" ? 0.15 : state === "listening" ? 0.08 : state === "thinking" ? 0.05 : 0.02;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state]);

  return (
    <div className="flex flex-col gap-6" id="avatar-panel-container">
      {interactive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVATARS.map((av) => (
            <button
              key={av.id}
              onClick={() => onSelectAvatar && onSelectAvatar(av.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
                selectedAvatarId === av.id
                  ? "bg-white/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex gap-4 items-start relative z-10">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                  {av.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{av.name}</h4>
                  <p className="text-xs font-semibold text-indigo-400 mt-0.5">{av.role}</p>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-3">{av.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-gray-400 tracking-wide uppercase">
                    <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">Voice: {av.name} Preset</span>
                    <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">{av.accent}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-xl">
          {/* Animated glow orb */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl wave-pulse pointer-events-none" />
          
          <div className="relative mt-4">
            {/* Pulsing Status Outer Rings */}
            <div className={`absolute -inset-4 rounded-full border-2 transition-all duration-700 ease-out ${
              state === "speaking" ? "border-indigo-500/40 animate-ping opacity-100 scale-125" :
              state === "listening" ? "border-emerald-500/40 animate-pulse opacity-100 scale-110" :
              state === "thinking" ? "border-rose-500/40 animate-pulse opacity-100 scale-105" :
              "border-white/5 scale-100 opacity-20"
            }`} />

            <div className={`absolute -inset-2 rounded-full border border-dashed transition-all duration-500 ${
              state === "speaking" ? "border-indigo-400/30 animate-spin" :
              state === "listening" ? "border-emerald-400/30 animate-pulse" :
              state === "thinking" ? "border-rose-400/30 animate-pulse" :
              "border-white/5"
            }`} />

            {/* Avatar Frame visualizer container */}
            <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${activeAvatar.bgColor} flex items-center justify-center border-4 relative overflow-hidden ${
              state === "speaking" ? "border-indigo-500" :
              state === "listening" ? "border-emerald-500" :
              state === "thinking" ? "border-rose-500" :
              "border-white/20"
            }`}>
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-white shadow-lg mb-2">
                  {activeAvatar.icon}
                </div>
                <span className="text-white font-extrabold text-sm uppercase tracking-wider">{activeAvatar.name}</span>
                <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">{state === "idle" ? "idle" : state}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center z-10">
            <h4 className="font-extrabold text-2xl text-white flex items-center justify-center gap-2">
              Interviewer: {activeAvatar.name}
            </h4>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mt-1">{activeAvatar.role}</p>
          </div>

          {/* Voice Synchronizer HUD Canvas element */}
          <div className="w-full max-w-xs h-14 mt-6 bg-black/30 border border-white/10 rounded-2xl overflow-hidden relative">
            <div className="absolute top-2 left-3 flex gap-1.5 items-center">
              <span className={`w-2.5 h-2.5 rounded-full ${
                state === "speaking" ? "bg-indigo-500 animate-pulse" :
                state === "listening" ? "bg-emerald-500" :
                state === "thinking" ? "bg-rose-500 animate-pulse" :
                "bg-gray-600"
              }`} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {state === "speaking" ? "AI Vocal Transmission" : 
                 state === "listening" ? "Analyzing Candidate Transcript" : 
                 state === "thinking" ? "Formulating Evaluation" : "Vocal Link Ready"}
              </span>
            </div>
            <canvas ref={canvasRef} className="w-full h-full" width={320} height={56} />
          </div>
        </div>
      )}
    </div>
  );
}
