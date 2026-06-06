import React, { useState, useEffect } from "react";
import { Upload, Trash, Tag, FileText, CheckCircle2, ChevronRight, BarChart3, AlertCircle, Copy, ArrowRightLeft, Sparkles } from "lucide-react";
import { Resume, ResumeAnalysis, ResumeComparison, JobMatch } from "../types";
import { ProgressRing, MiniGauge } from "./MetricDisplay";

interface ResumeManagerProps {
  onSelectResume: (resumeId: string) => void;
  selectedResumeId: string;
}

export function ResumeManager({ onSelectResume, selectedResumeId }: ResumeManagerProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ResumeAnalysis | null>(null);
  const [secondaryResumeId, setSecondaryResumeId] = useState<string>("");
  const [comparison, setComparison] = useState<ResumeComparison | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"manage" | "compare" | "jobmatch">("manage");

  // New Resume input form state
  const [resumeName, setResumeName] = useState<string>("");
  const [resumeContent, setResumeContent] = useState<string>("");
  const [resumeIndustry, setResumeIndustry] = useState<string>("Software Engineering");
  const [resumeTags, setResumeTags] = useState<string>("fullstack, react");

  // Drag and Drop files state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsingFile, setParsingFile] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>("");

  // Direct Multipart upload state
  const [directUploading, setDirectUploading] = useState<boolean>(false);
  const [directUploadError, setDirectUploadError] = useState<string>("");

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setDirectUploading(true);
    setDirectUploadError("");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }
      
      // Clear input element file selections
      e.target.value = "";
      
      // Refresh list
      await fetchResumes();
      
      // Auto selection of new resume
      if (data.resume && data.resume.id) {
        onSelectResume(data.resume.id);
      }
    } catch (err: any) {
      console.error("Direct file upload failed:", err);
      setDirectUploadError(err.message || "Failed to upload file");
    } finally {
      setDirectUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setParseError("");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setParseError("");
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setParseError("");
    setResumeName(file.name);
    
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (extension === "txt" || extension === "md" || extension === "json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setResumeContent(text || "");
      };
      reader.readAsText(file);
    } else if (extension === "pdf") {
      setParsingFile(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const result = e.target?.result as string;
            if (!result) {
              setParseError("Could not gather data url.");
              setParsingFile(false);
              return;
            }
            const base64Data = result.split(",")[1];
            
            const res = await fetch("/api/resumes/parse-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                data: base64Data,
                mimeType: "application/pdf"
              })
            });
            
            const response = await res.json();
            if (response.error) {
              setParseError(response.error);
              setResumeContent("Failed to parse PDF using AI Services. " + response.error + "\n\nPlease paste resume text manually here.");
            } else {
              setResumeContent(response.content || "");
            }
          } catch (innerErr: any) {
            setParseError("Parser communication failed.");
          } finally {
            setParsingFile(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        setParseError("File reading failed.");
        setParsingFile(false);
      }
    } else {
      // Direct text fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setResumeContent(text || "");
      };
      reader.readAsText(file);
    }
  };

  // Fetch standard resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  // Auto fetch analysis when selection changes
  useEffect(() => {
    if (selectedResumeId) {
      fetchAnalysis(selectedResumeId);
    } else {
      setSelectedAnalysis(null);
    }
  }, [selectedResumeId]);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resumes");
      const list = await res.json();
      setResumes(list);
      // Auto-select first resume if empty and resumes exist
      if (!selectedResumeId && list.length > 0) {
        onSelectResume(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load resumes:", e);
    }
  };

  const fetchAnalysis = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/analysis/${id}`);
      const data = await res.json();
      if (!data.error) {
        setSelectedAnalysis(data);
      }
    } catch (e) {
      console.error("Failed to load analysis:", e);
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeName || !resumeContent) return;
    setLoading(true);
    try {
      const tagsArray = resumeTags.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resumeName,
          content: resumeContent,
          industry: resumeIndustry,
          tags: tagsArray
        })
      });
      const data = await res.json();
      if (!data.error) {
        setResumeName("");
        setResumeContent("");
        setResumeTags("react, node");
        await fetchResumes();
        onSelectResume(data.resume.id);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (selectedResumeId === id) {
        onSelectResume("");
      }
      await fetchResumes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCompareResumes = async () => {
    if (!selectedResumeId || !secondaryResumeId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resumes/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: selectedResumeId, secondaryId: secondaryResumeId })
      });
      const data = await res.json();
      setComparison(data);
    } catch (e) {
      console.error("Comparison failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleJobMatch = async () => {
    if (!selectedResumeId || !jobDescription) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resumes/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId, jobDescription })
      });
      const data = await res.json();
      setJobMatch(data);
    } catch (e) {
      console.error("Job match failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadPresetText = (type: string) => {
    if (type === "Software Engineer Preset") {
      setResumeName("Senior_Full_Stack_Engineer_Preset.pdf");
      setResumeContent("Sarah Jenkins\nSenior Engineer with 6+ years building microservices and responsive web layers.\nSkills: Node.js, React, Docker, Kubernetes, GraphQL, PostgreSQL, AWS Cloud.\nHighlights: Scaled core routing API platform from 300ms to under 45ms latency bounds. Managed 4 junior engineers on client integrations.");
      setResumeIndustry("Software Engineering");
      setResumeTags("fullstack, react, docker, k8s");
    } else {
      setResumeName("AI_Engineer_Advanced_Preset.pdf");
      setResumeContent("Sarah Jenkins\nAI Specialist focusing on agent workflow topologies and vector database embedding strategies.\nSkills: Python, PyTorch, Hugging Face, NestJS, Pinecone Vector indexes, LangChain, RAG architectures.\nHighlights: Deployed local conversational agentic flow that reduced text analytics customer pipeline latencies by 60%.");
      setResumeIndustry("AI & Data Science");
      setResumeTags("ai, vector, python, langchain");
    }
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden" id="resume-manager-root">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4 gap-1">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 border-b-2 -mb-0.5 ${
            activeTab === "manage" ? "text-indigo-400 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Resumes & Analytics
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 border-b-2 -mb-0.5 ${
            activeTab === "compare" ? "text-indigo-400 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Compare Resumes
        </button>
        <button
          onClick={() => setActiveTab("jobmatch")}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 border-b-2 -mb-0.5 ${
            activeTab === "jobmatch" ? "text-indigo-400 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Resume to Job Match
        </button>
      </div>

      {activeTab === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Upload Form & Listings (5-cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <h3 className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-2.5 flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Select / Upload Resume
              </h3>
              
              <div className="space-y-1.5 mb-3.5 max-h-48 overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onSelectResume(r.id);
                      setSecondaryResumeId("");
                      setComparison(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectResume(r.id);
                        setSecondaryResumeId("");
                        setComparison(null);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      selectedResumeId === r.id
                        ? "bg-indigo-950/45 border-indigo-500/60"
                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/30 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${selectedResumeId === r.id ? "text-indigo-400" : "text-slate-500"}`} />
                      <div className="truncate">
                        <p className="font-bold text-slate-200 text-xs truncate">{r.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{r.industry} • {r.uploadDate}</p>
                      </div>
                    </div>
                    {r.isCustom && (
                      <button
                        onClick={(e) => handleDeleteResume(r.id, e)}
                        className="p-1 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/20 text-slate-500 hover:text-rose-400 transition-all ml-1.5 shrink-0"
                        title="Delete Resume"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Direct Multipart File Upload Component */}
              <div className="mt-4 bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl space-y-2.5">
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
                  <Upload className="w-3.5 h-3.5" />
                  Direct PDF / TXT Instant Upload
                </span>
                
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  Skip copy-pasting. Directly upload your resume file and trigger instant deep-content AI extraction and formatting metrics.
                </p>

                <div 
                  className={`border border-dashed rounded-lg p-3 text-center transition-all cursor-pointer relative ${
                    directUploading 
                      ? "border-emerald-500 bg-emerald-500/10 animate-pulse" 
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-705 hover:bg-slate-950"
                  }`}
                >
                  <input
                    type="file"
                    id="direct-multipart-uploader"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleDirectFileUpload}
                    disabled={directUploading}
                  />
                  <label htmlFor="direct-multipart-uploader" className="cursor-pointer block">
                    <Upload className={`w-5 h-5 mx-auto mb-1.5 ${directUploading ? "text-emerald-400 animate-bounce" : "text-indigo-400"}`} />
                    <span className="text-[10px] font-bold text-slate-200 block font-mono">
                      {directUploading ? "Parser active..." : "Upload File (Multipart)"}
                    </span>
                    <span className="text-[8px] text-slate-500 mt-1 block font-mono">Accepts PDF, TXT, MD</span>
                  </label>
                </div>

                {directUploadError && (
                  <p className="text-[9px] text-rose-400 font-mono text-center mb-0 leading-normal">⚠ {directUploadError}</p>
                )}
              </div>

              {/* Upload interface form */}
              <form onSubmit={handleUploadResume} className="border-t border-slate-800/80 pt-3.5 space-y-2.5">
                <div className="flex gap-1.5 mb-1">
                  <button
                    type="button"
                    onClick={() => loadPresetText("Software Engineer Preset")}
                    className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded hover:bg-indigo-500/20 transition-all text-left font-mono cursor-pointer"
                  >
                    + SWE Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPresetText("AI Engineer Preset")}
                    className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded hover:bg-emerald-500/20 transition-all text-left font-mono cursor-pointer"
                  >
                    + AI Eng Preset
                  </button>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-lg p-3 text-center transition-all relative ${
                    dragActive 
                      ? "border-indigo-400 bg-indigo-500/10" 
                      : parsingFile 
                        ? "border-amber-400 bg-amber-500/5 animate-pulse"
                        : "border-slate-800 bg-slate-950/20 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="file"
                    id="resume-file-picker"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-file-picker" className="cursor-pointer block">
                    <Upload className={`w-5 h-5 mx-auto mb-1 ${parsingFile ? "text-amber-400 animate-spin" : "text-indigo-400"}`} />
                    <p className="text-[10px] font-mono font-bold text-slate-300">
                      {parsingFile ? "AI Extracting Text..." : "Drag & Drop Resume File"}
                    </p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Supports .pdf, .txt, .md</p>
                  </label>
                  
                  {parseError && (
                    <div className="text-[9px] text-rose-400 mt-1 font-mono font-medium animate-pulse">
                      ⚠ {parseError}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Resume Name (e.g., My_SWE_Resume.pdf)"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <textarea
                    required
                    placeholder="Paste parsed resume contents here... Mention experience timeline, academic milestones, core technologies..."
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={resumeTags}
                    onChange={(e) => setResumeTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-700 font-mono"
                  />
                  <select
                    value={resumeIndustry}
                    onChange={(e) => setResumeIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Finance & Operations">Finance & Operations</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !resumeName || !resumeContent}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 font-bold text-[10px] text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {loading ? "Analysing Resume..." : "Upload & AI Parse"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: AI Analyser Detailed Results (7-cols) */}
          <div className="lg:col-span-7">
            {selectedAnalysis ? (
              <div className="space-y-4">
                {/* Visual score rings overview */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-around gap-4">
                  <ProgressRing
                    percentage={selectedAnalysis.readiness.overallScore}
                    label="Overall Match"
                    size={95}
                  />
                  <div className="grid grid-cols-2 gap-2.5 flex-1 w-full">
                    <MiniGauge label="ATS Parsing Index" score={selectedAnalysis.readiness.atsScore} color="bg-emerald-600" />
                    <MiniGauge label="Technical Mastery" score={selectedAnalysis.readiness.technicalReadiness} color="bg-indigo-600" />
                    <MiniGauge label="Interview Fluidity" score={selectedAnalysis.readiness.interviewReadiness} color="bg-purple-600" />
                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center justify-between col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Readiness Class</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Elite Eligible</span>
                    </div>
                  </div>
                </div>                {/* Skills Analysis */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-950 pb-2 font-mono">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    Core Skills Profiling
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">Technical Competency</span>
                      {selectedAnalysis.skills.technical.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/60 text-xs text-slate-300">
                          <span>{s.name}</span>
                          <span className="font-bold text-emerald-400 font-mono">{s.score}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block font-mono">Communication & Delivery</span>
                      {selectedAnalysis.skills.soft.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/60 text-xs text-slate-300">
                          <span>{s.name}</span>
                          <span className="font-bold text-purple-400 font-mono">{s.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ATS Analysis Details */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-950 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    ATS Optimization Tracker
                  </h3>
                  <div>
                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block mb-1 font-mono">Matched Resume Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.ats.keywordMatch.map((kw, i) => (
                        <span key={i} className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-rose-300 uppercase tracking-wider block mb-1 font-mono">Missing Resume Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.ats.missingKeywords.map((kw, i) => (
                        <span key={i} className="text-[9px] bg-rose-500/10 border border-rose-500/25 text-rose-400 px-2 py-0.5 rounded font-mono">
                          ⚠ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-950/50 rounded border border-slate-800 p-2.5 text-xs leading-relaxed text-slate-300">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">Layout & Typography Feedback</span>
                    <p className="font-serif italic text-slate-400">{selectedAnalysis.ats.formattingQuality}</p>
                  </div>
                </div>

                {/* Strengths & Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Primary Formatting Strengths</h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {selectedAnalysis.quality.strengths.map((str, idx) => <li key={idx} className="leading-tight">{str}</li>)}
                    </ul>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Advisory Change Recommendations</h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {selectedAnalysis.quality.suggestions.map((str, idx) => <li key={idx} className="leading-tight">{str}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 bg-slate-900/20 border border-slate-800 rounded-xl border-dashed flex flex-col items-center justify-center text-center p-5 text-slate-500">
                <FileText className="w-10 h-10 text-slate-700 mb-2" />
                <h4 className="font-bold text-sm text-slate-300">No Analysis Available</h4>
                <p className="max-w-xs text-[11px] mt-0.5">Select an existing resume or upload a custom document above to view key telemetry scores.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-2.5 flex items-center gap-1.5 font-mono">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              Compare Secondary Resumes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block mb-1 font-mono">PRIMARY RESUME (A)</span>
                <select
                  value={selectedResumeId}
                  onChange={(e) => onSelectResume(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">Select Primary</option>
                  {resumes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="flex justify-center text-slate-500 text-[10px] font-bold font-mono">
                VS
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold block mb-1 font-mono">SECONDARY RESUME (B)</span>
                <select
                  value={secondaryResumeId}
                  onChange={(e) => setSecondaryResumeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">Select Secondary</option>
                  {resumes.filter((r) => r.id !== selectedResumeId).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompareResumes}
              disabled={loading || !selectedResumeId || !secondaryResumeId}
              className="mt-3.5 w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 font-bold text-[10px] text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              {loading ? "Calculating Comparisons..." : "Compare Resumes & Determine Choice"}
            </button>
          </div>

          {comparison && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Top Choice Recommendation Ribbon (5-cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[9px] font-bold uppercase tracking-wider inline-block mb-3 font-mono">
                    AI Top Recommendation
                  </span>
                  <h4 className="text-base font-bold text-slate-100 mb-1.5 font-serif italic">
                    Winner: {resumes.find((r) => r.id === comparison.recommendedId)?.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-serif">
                    {comparison.explanation}
                  </p>
                </div>
                
                <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Confidence Factor</span>
                  <span className="text-base font-bold text-indigo-400 font-mono">{comparison.confidencePercentage}%</span>
                </div>
              </div>

              {/* Skills Coverage Benchmarks (7-cols) */}
              <div className="lg:col-span-7 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">
                  Side-By-Side Competency Mapping
                </h4>

                <div className="space-y-2.5">
                  {comparison.skillCoverage.map((sc, index) => (
                    <div key={index} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-white">{sc.skill}</span>
                      <div className="flex gap-4 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded ${sc.primaryHas ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                          R_A: {sc.primaryHas ? "YES" : "NO"}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${sc.secondaryHas ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                          R_B: {sc.secondaryHas ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "jobmatch" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form left (5-cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs space-y-3.5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 block border-b border-white/5 pb-2">
                Job Description Audit
              </h3>
              
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">Target Resume</span>
                <select
                  value={selectedResumeId}
                  onChange={(e) => onSelectResume(e.target.value)}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Resume</option>
                  {resumes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">Job Description Requirements</span>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste target job listing text here... e.g. 'We are hiring a Software Engineer fluent in React, Node, experienced with CI/CD models...'"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <button
                onClick={handleJobMatch}
                disabled={loading || !selectedResumeId || !jobDescription}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 font-extrabold text-xs text-white rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Matching Matrix Analytics..." : "Evaluate Match Dynamics"}
              </button>
            </div>
          </div>

          {/* Results right (7-cols) */}
          <div className="lg:col-span-7">
            {jobMatch ? (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-around gap-6">
                  <ProgressRing percentage={jobMatch.matchPercentage} size={110} label="JD MATCH" />
                  
                  <div className="flex-1 w-full space-y-3 font-semibold">
                    <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                      <span className="text-[9px] text-rose-300 block uppercase font-bold">Unmatched Domain Gaps</span>
                      <p className="text-[10px] text-gray-300 mt-1">{jobMatch.missingKeywords.join(", ") || "No significant keyword gaps identified."}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                      <span className="text-[9px] text-amber-300 block uppercase font-bold">Secondary Skills Gaps</span>
                      <p className="text-[10px] text-gray-300 mt-1">{jobMatch.missingSkills.join(", ") || "Skills align reasonably well."}</p>
                    </div>
                  </div>
                </div>

                {/* Suggestions and recommended edits */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400">Step-by-step Revision Advice</h4>
                  <div className="space-y-2">
                    {jobMatch.suggestions.map((s, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/5 flex gap-3 text-xs text-gray-300">
                        <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-black uppercase text-pink-400 mt-4 block">Recommended Bullet Phrasing Changes</h4>
                  <div className="space-y-2">
                    {jobMatch.recommendedChanges.map((change, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-xl border border-pink-500/10 flex gap-3 text-xs text-gray-300">
                        <Copy className="w-4 h-4 text-pink-400 shrink-0" />
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 bg-white/5 border border-white/5 rounded-2xl border-dashed flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <CheckCircle2 className="w-12 h-12 text-gray-600 mb-3" />
                <h4 className="font-bold text-lg text-white">Compare Against Target JD</h4>
                <p className="max-w-xs text-xs mt-1">Input details of a target corporate vacancy role on your left to generate direct algorithmic matching indexes.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
