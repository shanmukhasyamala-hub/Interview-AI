import React from "react";

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatusCard({ title, value, subtitle, icon, trend }: StatusCardProps) {
  return (
    <div id={`status-card-${title.toLowerCase().replace(/\s+/g, "-")}`} className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-indigo-400">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
          <span className={trend.isPositive ? "text-emerald-400" : "text-rose-400"}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500">vs last attempt</span>
        </div>
      )}
    </div>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  glowColor?: string;
}

export function ProgressRing({ percentage, size = 120, strokeWidth = 8, label, glowColor = "stroke-indigo-500" }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow effect backdrops */}
        <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            className="stroke-white/10"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={`transition-all duration-1000 ease-out fill-transparent ${glowColor}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-white tracking-tight">{percentage}%</span>
          {label && <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">{label}</span>}
        </div>
      </div>
    </div>
  );
}

interface MiniGaugeProps {
  label: string;
  score: number;
  color?: string;
}

export function MiniGauge({ label, score, color = "bg-indigo-500" }: MiniGaugeProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-300">{label}</span>
        <span className="text-white">{score}/100</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
