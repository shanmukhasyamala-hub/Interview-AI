import React, { useState, useEffect } from "react";
import { 
  Sparkles, FileText, Globe, Award, Settings, LogOut, CheckCircle2, User, Key, Mail,
  ListTodo, TrendingUp, HelpCircle, Loader2, ArrowRight, Video, RefreshCw, BarChart3,
  Calendar, Info, AlertTriangle, ShieldAlert, Download, Package
} from "lucide-react";
import { User as UserType, InterviewSession, Resume, InterviewConfig, WeeklyPlan } from "./types";
import { ResumeManager } from "./components/ResumeManager";
import { BenchmarkingDashboard } from "./components/BenchmarkingDashboard";
import { InterviewController } from "./components/InterviewController";
import { StatusCard, ProgressRing, MiniGauge } from "./components/MetricDisplay";

// Mock preset configs
const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const INTERVIEW_TYPES = ["Technical", "HR", "Behavioral", "Product", "Startup", "Custom"];
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Spanish"];

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  
  // Navigation
  const [currentMenuTab, setCurrentMenuTab] = useState<"dashboard" | "resume" | "benchmark" | "history">("dashboard");

  // Authentication error
  const [authError, setAuthError] = useState("");

  // Resume states
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumesList, setResumesList] = useState<Resume[]>([]);

  // Export state
  const [zipping, setZipping] = useState(false);

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      const response = await fetch("/api/download-zip");
      if (!response.ok) {
        throw new Error("Could not construct ZIP bundle on the server.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "interviewverse-ai-applet.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Error generating project ZIP: " + e.message);
    } finally {
      setZipping(false);
    }
  };

  // Configure Interview State
  const [config, setConfig] = useState<InterviewConfig>({
    questionCount: 12,
    difficulty: "Advanced",
    type: "Technical",
    role: "AI Engineer",
    language: "English",
    avatarId: "marcus-tech"
  });

  // Active Session states
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [completedSession, setCompletedSession] = useState<InterviewSession | null>(null);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);

  // Check login on startup
  useEffect(() => {
    // Quick auto-fill
    setEmailInput("candidate@interviewverse.ai");
    setPasswordInput("demo_123");
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resumes");
      const list = await res.json();
      setResumesList(list);
    } catch (e) {
      console.error("Failed to load resumes list:", e);
    }
  };

  const handleDemoLogin = () => {
    setUser({
      id: "demo-user",
      email: "candidate@interviewverse.ai",
      name: "Alex Rivera",
      role: "AI Engineer",
    });
    setToken("demo-jwt-token-active");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const url = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload = authMode === "login" 
      ? { email: emailInput, password: passwordInput }
      : { email: emailInput, password: passwordInput, name: nameInput };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setUser(data.user);
        setToken(data.token);
      }
    } catch (err) {
      setAuthError("Failed to communicate with authentication database service.");
    }
  };

  const loadPastSessions = async () => {
    try {
      const res = await fetch("/api/interviews/history");
      const data = await res.json();
      setPastSessions(data);
    } catch (e) {
      console.error("Failed to load historical database session:", e);
    }
  };

  useEffect(() => {
    if (user) {
      loadPastSessions();
    }
  }, [user, activeSession, completedSession]);

  const handleStartInterview = async () => {
    if (!selectedResumeId) {
      alert("A standard selected resume is mandatory before starting any interview simulation.");
      return;
    }
    setLoadingSession(true);
    try {
      const res = await fetch("/api/interview/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          resumeId: selectedResumeId,
          config
        })
      });
      const session = await res.json();
      if (!session.error) {
        setCompletedSession(null);
        setActiveSession(session);
      }
    } catch (err) {
      console.error("Failed to ignite interview workflow:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleCompleteActiveInterview = (completeSess: InterviewSession) => {
    setActiveSession(null);
    setCompletedSession(completeSess);
    setCurrentMenuTab("dashboard");
    loadPastSessions();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* BACKGROUND GRAPHIC HUD - UNDERSTATED & CONSTRAINED */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-indigo-950/10 to-transparent pointer-events-none border-b border-slate-900" />

      {/* HEADER HUD BAR */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-indigo-950 border border-indigo-500/30 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-slate-100 block font-sans">
              InterviewVerse.AI
            </span>
            <span className="text-[9px] font-medium text-slate-400 block tracking-widest uppercase leading-none font-mono">
              COMPETENCY COHORT SIMULATOR
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800 pr-3">
              <div className="w-5.5 h-5.5 rounded bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-black text-[10px] text-indigo-300">
                {user.name.charAt(0)}
              </div>
              <div className="text-left leading-none shrink-0">
                <span className="text-[10px] font-bold text-slate-200 block">{user.name}</span>
                <span className="text-[9px] text-indigo-400 font-mono tracking-wider">{user.role || "Candidate"}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setUser(null);
                setToken("");
                setCompletedSession(null);
                setActiveSession(null);
              }}
              className="p-1.5 bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 rounded-lg text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
              title="Sign Out Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* AUTHENTICATION LOCKSCREEN */}
      {!user ? (
        <main className="max-w-sm mx-auto mt-16 px-4 pb-16 justify-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-center mb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-100 font-serif italic text-center">Unlock Access Platform</h2>
            <p className="text-[10px] text-slate-400 mt-1 mb-5 leading-relaxed text-center">
              Validate credentials to instantiate professional candidate evaluations.
            </p>

            {authError && (
              <div className="p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs text-rose-400 flex items-center gap-1.5 mb-3.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px]">{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Alex Rivera)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Official Email Address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Master Access Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] text-white rounded-lg transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                {authMode === "login" ? "Verify Credentials" : "Create Account"}
              </button>
            </form>

            <div className="border-t border-slate-800 pt-3.5 mt-5 space-y-2.5 text-center">
              <button
                onClick={handleDemoLogin}
                className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verify with Demo Quick Entry
              </button>

              <button
                onClick={() => setAuthMode((m) => (m === "login" ? "signup" : "login"))}
                className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {authMode === "login" ? "Do not have an account yet? Sign up" : "Already registered? Sign in"}
              </button>
            </div>
          </div>
        </main>
      ) : activeSession ? (
        /* ACTIVE INTERVIEW MODE (Voice Only Questions masked from script!) */
        <main className="max-w-7xl mx-auto px-6 py-8">
          <InterviewController
            session={activeSession}
            onComplete={handleCompleteActiveInterview}
          />
        </main>
      ) : (
        /* MAIN APPLICATION WORKSPACE DASHBOARD */
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
          
          {/* NAVIGATION RAIL SIDEBAR (3-cols equivalent) */}
          <nav className="w-full md:w-52 shrink-0 space-y-1">
            {[
              { id: "dashboard", label: "Overview Dashboard", icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { id: "resume", label: "Custom Resume Manager", icon: <FileText className="w-3.5 h-3.5" /> },
              { id: "benchmark", label: "Competitive Benchmarking", icon: <Globe className="w-3.5 h-3.5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCompletedSession(null);
                  setCurrentMenuTab(tab.id as any);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all duration-300 font-bold text-xs cursor-pointer ${
                  currentMenuTab === tab.id && !completedSession
                    ? "bg-indigo-950 border border-indigo-500/35 text-indigo-300 shadow-sm"
                    : "border border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/45"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <div className="pt-5 border-t border-slate-800 mt-5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 font-mono">Workspace standing</span>
              <div className="mt-2.5 pl-3 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Past Attempts:</span>
                  <span className="font-extrabold text-slate-200">{pastSessions.length} sessions</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Optimal Score:</span>
                  <span className="font-extrabold text-indigo-400">
                    {pastSessions.length > 0 
                      ? Math.max(...pastSessions.map((s) => s.scores?.overall || 0))
                      : 0} / 100
                  </span>
                </div>
                
                <div className="pt-3 border-t border-slate-800/60 mt-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block font-mono">External Backup</span>
                  <button
                    onClick={handleDownloadZip}
                    disabled={zipping}
                    className="w-full py-2 px-2.5 bg-indigo-950/45 hover:bg-indigo-900/65 border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-300 disabled:bg-slate-900/40 disabled:border-slate-800/80 disabled:text-slate-600 font-bold text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {zipping ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Export Source (.ZIP)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* MAIN CONTENT COMPONENT PANEL CONTAINER (9-cols) */}
          <section className="flex-1 min-w-0 space-y-8">
            
            {/* 1. MOCK INTERVIEW COMPLETED REPORT VIEW */}
            {completedSession ? (
              <div className="space-y-6" id="interview-completed-report-screen">
                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-5">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1 shrink-1 text-center md:text-left">
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[9px] font-bold uppercase tracking-wider inline-block">
                      Recruitment Insights Active
                    </span>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight font-serif italic">Interview Completed!</h2>
                    <p className="text-[11px] text-slate-400 max-w-xl leading-relaxed">
                      Marcus has structured your performance report comparing speech pacing, visual composure stability, and key technical engineering claims.
                    </p>
                  </div>

                  <div className="shrink-0 flex gap-3">
                    <button
                      onClick={() => setCompletedSession(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 hover:text-slate-100 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-slate-800"
                    >
                      Return to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setSelectedResumeId(completedSession.resumeId);
                        setCurrentMenuTab("benchmark");
                        setCompletedSession(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      Compare Globally
                    </button>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Scores dashboard */}
                  <div className="md:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                    <ProgressRing
                      percentage={completedSession.scores?.overall || 80}
                      label="Composite Index"
                      size={120}
                    />

                    <div className="w-full space-y-2 pt-3 border-t border-slate-800">
                      <MiniGauge label="Technical Expertise" score={completedSession.scores?.technical || 80} color="bg-indigo-600" />
                      <MiniGauge label="Conversational Fluidity" score={completedSession.scores?.communication || 80} color="bg-emerald-600" />
                      <MiniGauge label="Behavioral & Core Fit" score={completedSession.scores?.behavioral || 80} color="bg-purple-600" />
                      <MiniGauge label="Resume Proof Points" score={completedSession.scores?.resumeKnowledge || 85} color="bg-pink-600" />
                      <MiniGauge label="Analytical Case Logic" score={completedSession.scores?.problemSolving || 75} color="bg-amber-600" />
                    </div>
                  </div>

                  {/* Recruiter hiring brief panel */}
                  <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">Recruiter Evaluation Report</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase rounded font-mono">
                          Standing: {completedSession.recruiterNotes?.hireRecommendation || "Strong Hire"}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-slate-200 leading-relaxed font-serif italic">
                        &quot;{completedSession.recruiterNotes?.recruiterNotes}&quot;
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">Identified Highlights</span>
                          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                            {completedSession.recruiterNotes?.strengths.map((str, idx) => <li key={idx} className="leading-snug">{str}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 block font-mono">Growth Areas</span>
                          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                            {completedSession.recruiterNotes?.weaknesses.map((wk, idx) => <li key={idx} className="leading-snug">{wk}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 mt-4">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5 font-mono">Weekly Learning Suggestions (AI Coach Guidance)</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-serif">
                        Improve your performance indices by reviewing the custom 7-Day practice tasks scheduled below. Focus on resolving the database bottlenecks query scenarios.
                      </p>
                    </div>
                  </div>
                </div>

                {/* VISIBLE AFTER INTERVIEW COMPLETION - EXTENDED QUESTION REPLAY */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5">
                    Live Session Question and Response Ledger
                  </h3>

                  <div className="space-y-3">
                    {completedSession.questions.map((q, idx) => {
                      const answerObj = completedSession.answers.find((a) => a.questionId === q.id);
                      return (
                        <div key={q.id} className="bg-black/25 rounded-2xl border border-white/5 p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">Question {idx + 1} ({q.category})</span>
                            <span className="font-semibold text-gray-400">Review complete</span>
                          </div>
                          
                          <p className="text-sm font-semibold text-indigo-300 leading-relaxed font-mono">
                            {q.text}
                          </p>

                          <div className="bg-white/5 rounded-xl p-3 border-l-2 border-indigo-500 text-xs text-gray-300 leading-relaxed">
                            <span className="text-[9px] text-gray-500 block uppercase font-bold mb-1">Your response:</span>
                            {answerObj?.answerText || "(Candidate provided no response.)"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7-DAY IMPROVEMENT ROADMAP TIMELINE */}
                {completedSession.weeklyPlan && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Personalized 7-Day Competency Roadmap
                    </h3>

                    <div className="space-y-4 relative pl-4 border-l border-white/10 ml-2">
                      {completedSession.weeklyPlan.days.map((day) => (
                        <div key={day.dayNum} className="relative space-y-1.5">
                          {/* Circle node on timeline */}
                          <div className="absolute -left-[21px] top-1 bg-indigo-500 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950" />
                          
                          <div className="bg-black/25 rounded-2.5xl border border-white/5 p-4">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                              <span>Day {day.dayNum}: {day.title}</span>
                              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">PENDING ACTION</span>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs leading-relaxed text-gray-300">
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Technical Drill</span>
                                <p className="mt-1">{day.techTask}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Verbal Practice</span>
                                <p className="mt-1">{day.communicationTask}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Resume Optimization</span>
                                <p className="mt-1">{day.resumeFocus}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Practice mock</span>
                                <p className="mt-1">{day.mockTask}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 2. MAIN CONFIGURE DASHBOARD OR SUB-MENU TAB VIEW */}
                {currentMenuTab === "dashboard" && (
                  <div className="space-y-8">
                    {/* Hero Grid standing */}
                    <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-5">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="space-y-1 shrink-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-slate-100 tracking-tight font-serif italic">Mock Interview Launchpad</h2>
                        <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                          Conduct structured, private mock trials with custom avatars syncing spoken queries utilizing enterprise LLM evaluations. Choose a resume below to activate.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={handleStartInterview}
                          disabled={!selectedResumeId || loadingSession}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 font-bold uppercase text-[10px] text-white rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          {loadingSession ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              Launching Simulation...
                            </>
                          ) : (
                            <>
                              Commence Mock Trial
                              <ArrowRight className="w-3.5 h-3.5 text-white" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* SELECT MANDATORY RESUME ACCORDION BOX */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 font-mono">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Selected Resume (Required before start)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {resumesList.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedResumeId(r.id)}
                            className={`p-3 text-left rounded-xl border transition-all duration-300 relative overflow-hidden ${
                              selectedResumeId === r.id
                                ? "bg-indigo-950/45 border-indigo-500/60 shadow-sm"
                                : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/30"
                            }`}
                          >
                            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                              <div>
                                <h4 className="font-extrabold text-slate-200 text-sm truncate">{r.name}</h4>
                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5 block font-mono">
                                  {r.industry}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                {r.tags.map((tg, i) => (
                                  <span key={i} className="text-[8px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Need alternative presets? Access the <b className="text-indigo-400">Custom Resume Manager</b> from the left sidebar panel.</span>
                      </div>
                    </div>

                    {/* INTERVIEW ADVANCED SCHEDULING WIZARD */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                        Interview Mock Configuration Panel
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Selector items */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1 font-mono">Question Density Count</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[8, 12, 16, 24].map((cnt) => (
                                <button
                                  key={cnt}
                                  onClick={() => setConfig((prev) => ({ ...prev, questionCount: cnt }))}
                                  className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                                    config.questionCount === cnt
                                      ? "bg-indigo-950 border-indigo-500/60 text-indigo-300 font-mono"
                                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 font-mono"
                                  }`}
                                >
                                  {cnt} items
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1 font-mono">Target Difficulty</span>
                              <select
                                value={config.difficulty}
                                onChange={(e) => setConfig((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                              >
                                {DIFFICULTY_LEVELS.map((lev) => <option key={lev} value={lev}>{lev}</option>)}
                              </select>
                            </div>

                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1 font-mono">Session Type</span>
                              <select
                                value={config.type}
                                onChange={(e) => setConfig((prev) => ({ ...prev, type: e.target.value as any }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                              >
                                {INTERVIEW_TYPES.map((typ) => <option key={typ} value={typ}>{typ}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1 font-mono">Target Job Role</span>
                              <input
                                type="text"
                                value={config.role}
                                onChange={(e) => setConfig((prev) => ({ ...prev, role: e.target.value }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>

                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1 font-mono">Oral Lang Accent</span>
                              <select
                                value={config.language}
                                onChange={(e) => setConfig((prev) => ({ ...prev, language: e.target.value as any }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                              >
                                {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Question breakdown panel visualizer */}
                        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider block pb-1 border-b border-slate-900 font-mono">
                              Standard Question Distribution Mapping
                            </span>
                            
                            <div className="grid grid-cols-1 gap-1.5 text-[11px] mt-2">
                              <div className="flex justify-between items-center text-slate-300">
                                <span>Resume-Based (Experience, Projects)</span>
                                <span className="font-bold text-slate-200">25% (3 items)</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-300">
                                <span>Technical Domain Expertise</span>
                                <span className="font-bold text-slate-200">25% (3 items)</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-300">
                                <span>Behavioral Storytelling (STAR)</span>
                                <span className="font-bold text-slate-200">25% (3 items)</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-300">
                                <span>Situational Problem Case Analysis</span>
                                <span className="font-bold text-slate-200">25% (3 items)</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-3 bg-slate-900 rounded overflow-hidden flex font-bold text-[8px] text-slate-100 text-center leading-none mt-2">
                            <div className="h-full bg-indigo-600/80 py-0.5" style={{ width: "25%" }}>RES</div>
                            <div className="h-full bg-emerald-600/80 py-0.5" style={{ width: "25%" }}>TECH</div>
                            <div className="h-full bg-purple-600/80 py-0.5" style={{ width: "25%" }}>BEH</div>
                            <div className="h-full bg-amber-600/80 py-0.5" style={{ width: "25%" }}>SIT</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentMenuTab === "resume" && (
                  <ResumeManager
                    selectedResumeId={selectedResumeId}
                    onSelectResume={(id) => setSelectedResumeId(id)}
                  />
                )}

                {currentMenuTab === "benchmark" && (
                  <BenchmarkingDashboard />
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
