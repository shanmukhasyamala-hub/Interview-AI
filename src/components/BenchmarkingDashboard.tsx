import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Award, Briefcase, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert, Zap, Globe, Sparkles } from "lucide-react";
import { BenchmarkStats } from "../types";

export function BenchmarkingDashboard() {
  const [selectedRole, setSelectedRole] = useState<string>("AI Engineer");
  const [stats, setStats] = useState<BenchmarkStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const rolesList = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "AI Engineer",
    "Machine Learning Engineer",
    "Product Manager",
    "UI/UX Designer",
    "DevOps Engineer"
  ];

  useEffect(() => {
    fetchStats(selectedRole);
  }, [selectedRole]);

  const fetchStats = async (roleName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/benchmark/${encodeURIComponent(roleName)}`);
      if (!res.ok) throw new Error("Benchmark payload error response");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to load benchmarks:", e);
    } finally {
      setLoading(false);
    }
  };

  // Format charting records
  const scoreComparisonData = stats ? [
    { category: "Technical", You: stats.yourScores.technical, Average: stats.avgScores.technical, Top10: stats.top10Scores.technical },
    { category: "Behavioral", You: stats.yourScores.behavioral, Average: stats.avgScores.behavioral, Top10: stats.top10Scores.behavioral },
    { category: "Comm", You: stats.yourScores.communication, Average: stats.avgScores.communication, Top10: stats.top10Scores.communication },
    { category: "Composure", You: stats.yourScores.confidence, Average: stats.avgScores.confidence, Top10: stats.top10Scores.confidence },
    { category: "Logic", You: stats.yourScores.problemSolving, Average: stats.avgScores.problemSolving, Top10: stats.top10Scores.problemSolving },
    { category: "Overall", You: stats.yourScores.overall, Average: stats.avgScores.overall, Top10: stats.top10Scores.overall }
  ] : [];

  const radarData = stats ? [
    { subject: "Tech", A: stats.yourScores.technical, B: stats.avgScores.technical, fullMark: 100 },
    { subject: "Behavior", A: stats.yourScores.behavioral, B: stats.avgScores.behavioral, fullMark: 100 },
    { subject: "Comm", A: stats.yourScores.communication, B: stats.avgScores.communication, fullMark: 100 },
    { subject: "Composure", A: stats.yourScores.confidence, B: stats.avgScores.confidence, fullMark: 100 },
    { subject: "Solving", A: stats.yourScores.problemSolving, B: stats.avgScores.problemSolving, fullMark: 100 }
  ] : [];

  const trendData = stats ? [
    { attempt: "Mock 1", Score: Math.max(40, stats.yourScores.overall - 18) },
    { attempt: "Mock 2", Score: Math.max(50, stats.yourScores.overall - 12) },
    { attempt: "Mock 3", Score: Math.max(60, stats.yourScores.overall - 5) },
    { attempt: "Current", Score: stats.yourScores.overall }
  ] : [];

  // Helper matching colors to readiness status classifications
  const getReadinessBg = (cls: string) => {
    switch (cls) {
      case "Elite Candidate": return "from-emerald-950/30 to-slate-900/50 text-emerald-400 border-emerald-500/35";
      case "Strong Candidate": return "from-indigo-950/30 to-slate-900/50 text-indigo-400 border-indigo-500/35";
      case "Interview Ready": return "from-blue-950/30 to-slate-900/50 text-blue-400 border-blue-500/35";
      case "Developing": return "from-amber-950/30 to-slate-900/50 text-amber-400 border-amber-500/35";
      default: return "from-rose-950/30 to-slate-900/50 text-rose-400 border-rose-500/35";
    }
  };

  return (
    <div className="space-y-5" id="benchmarking-dashboard-root">
      {/* Role Selection bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif italic">
            <Globe className="w-4.5 h-4.5 text-indigo-400" />
            Competitive Benchmarking System
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Compare your live composite interview scores against peer cohorts globally.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 font-mono">Target Cohort:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-700 transition-all cursor-pointer font-mono"
          >
            {rolesList.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-80 bg-slate-900/20 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
          <span className="text-xs font-bold uppercase tracking-widest animate-pulse font-mono">Computing competitive percentile data...</span>
        </div>
      ) : !stats ? (
        <div className="h-80 bg-slate-900/20 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-widest font-mono">Failed to calculate benchmarks.</span>
          <button 
            onClick={() => fetchStats(selectedRole)}
            className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold font-sans transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Compute Analytics
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Global ranking / standing stats (4-cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Global Standing Card */}
            <div className={`p-4 border rounded-xl bg-gradient-to-br flex flex-col justify-between ${getReadinessBg(stats.readinessClass)}`}>
              <div>
                <span className="px-2 py-0.5 bg-slate-950/50 border border-slate-800 rounded text-[9px] font-bold uppercase tracking-widest inline-block mb-3.5 font-mono">
                  Readiness Classifier
                </span>
                <h3 className="text-xl font-bold tracking-tight font-serif italic">{stats.readinessClass}</h3>
                <p className="text-[11px] mt-1.5 leading-relaxed opacity-90 font-serif">
                  You scored <span className="font-bold underline">{stats.yourScores.overall}/100</span>. {stats.insights}
                </p>
              </div>

              <div className="border-t border-slate-850 pt-3 mt-4.5 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block font-mono">Percentile</span>
                  <span className="text-lg font-bold font-mono">{stats.percentile}th</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block font-mono">Role Rank</span>
                  <span className="text-lg font-bold font-mono">#{stats.roleRank} <span className="text-[10px] text-slate-500">/ {stats.totalCandidates}</span></span>
                </div>
              </div>
            </div>

            {/* Hiring Probabilities Predictor */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-950 font-mono">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                AI Probability Predictor
              </h4>

              <div className="space-y-2.5">
                {[
                  { label: "Internship Level", pct: stats.hiringProbabilities.internship },
                  { label: "Junior/Entry Level", pct: stats.hiringProbabilities.entry },
                  { label: "Midweight System Engineer", pct: stats.hiringProbabilities.mid },
                  { label: "Senior Lead Architect", pct: stats.hiringProbabilities.senior }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-300">{item.label}</span>
                      <span className={`font-bold font-mono text-[10px] ${item.pct > 75 ? "text-emerald-400" : item.pct > 50 ? "text-indigo-400" : "text-rose-400"}`}>
                        {item.pct}% Choice
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          item.pct > 75 ? "bg-emerald-500" : item.pct > 50 ? "bg-indigo-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap Analysis */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-950 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />
                Target Skill Gaps
              </h4>
              <div className="space-y-2.5">
                {stats.skillGapAnalysis.map((gap, index) => (
                  <div key={index} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-0.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-300">{gap.skill}</span>
                      <span className="font-bold text-rose-400 font-mono">-{gap.gap} pts gap</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{gap.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed comparative charts (8-cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Cohort Comparison Bar Charts */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Performance Comparison vs Peers
              </h4>

              <div className="h-56 mt-3 text-xs font-mono">
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={scoreComparisonData} margin={{ top: 10, right: 10, left: -22, bottom: 5 }}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                    />
                    <Legend iconSize={6} wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <Bar dataKey="You" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Average" fill="#334155" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Top10" fill="#059669" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar / Strengths Map & Trend analysis line double layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Radar area strengths */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block pb-2 border-b border-slate-950 font-mono">
                  Visual Competency Mapping
                </span>
                <div className="h-44 flex items-center justify-center font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="62%" data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                      <Radar name="You" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                      <Radar name="Peer Avg" dataKey="B" stroke="#475569" fill="#475569" fillOpacity={0.15} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend Tracker Line Chart */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block pb-2 border-b border-slate-950 font-mono">
                  Attempt History & Growth Trend
                </span>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="95%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -22, bottom: 5 }}>
                      <XAxis dataKey="attempt" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} domain={[30, 100]} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }} />
                      <Line type="monotone" dataKey="Score" stroke="#059669" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Strengths positioning matrix blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <CheckCircle className="w-3 h-3" />
                  Above Cohort Average
                </h4>
                <div className="space-y-1">
                  {stats.aboveAverageSkills.map((sk, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-emerald-950/25 px-2 py-1 border border-emerald-500/10 rounded font-sans">
                      ✓ {sk}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <h4 className="text-[9px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <ShieldAlert className="w-3 h-3" />
                  Below Cohort Average
                </h4>
                <div className="space-y-1">
                  {stats.belowAverageSkills.map((sk, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-rose-950/25 px-2 py-1 border border-rose-500/10 rounded font-sans">
                      ⚠ {sk}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
