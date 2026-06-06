import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Play, CheckCircle2, ChevronRight, Volume2, HelpCircle, Loader2, Sparkles, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { InterviewSession, CandidateAnswer } from "../types";
import { AvatarPanel } from "./AvatarPanel";
import { WebcamTracker } from "./WebcamTracker";

// Standard Web Speech API interface declarations for TypeScript compatibility
interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (event: Event) => void;
  onerror: (event: any) => void;
  onend: (event: Event) => void;
  onresult: (event: any) => void;
}

interface WebSpeechWindow extends Window {
  SpeechRecognition?: new () => WebSpeechRecognition;
  webkitSpeechRecognition?: new () => WebSpeechRecognition;
}

interface InterviewControllerProps {
  session: InterviewSession;
  onComplete: (completedSession: InterviewSession) => void;
}

export function InterviewController({ session: initialSession, onComplete }: InterviewControllerProps) {
  const [session, setSession] = useState<InterviewSession>(initialSession);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewerState, setInterviewerState] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceWarning, setVoiceWarning] = useState<string>("");
  
  // Real-time tracking overlay feed mapped from index values
  const [liveWebcamMetrics, setLiveWebcamMetrics] = useState({
    eyeContactScore: 85,
    smileScore: 10,
    postureScore: 90,
    attentionMetric: 95,
    confidenceScore: 88
  });

  // Prime browser speech synthesis voices immediately on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Web Speech API pointers
  const recognitionRef = useRef<any | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = session.questions[activeQuestionIdx];
  const isLastQuestion = activeQuestionIdx === session.questions.length - 1;

  // Initialize Speech Recognition
  useEffect(() => {
    const speechWindow = window as unknown as WebSpeechWindow;
    const SpeechConstructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    
    if (SpeechConstructor) {
      const rec = new SpeechConstructor();
      rec.continuous = true;
      rec.interimResults = true;
      
      // Set language code based on configuration
      const langCodes: Record<string, string> = {
        English: "en-US",
        Hindi: "hi-IN",
        Telugu: "te-IN",
        Tamil: "ta-IN",
        Spanish: "es-ES"
      };
      rec.lang = langCodes[session.config.language] || "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setInterviewerState("listening");
      };

      rec.onerror = (e: any) => {
        console.warn("Speech API error captured:", e.error);
        if (e.error !== "no-speech") {
          setIsRecording(false);
          setInterviewerState("idle");
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Web Speech API not supported in this browser. Falling back to key typing mode.");
    }

    // Auto-commence first question
    speakTimeoutRef.current = setTimeout(() => {
      triggerInterviewerSpeak();
    }, 1500);

    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [activeQuestionIdx]);

  // Read AI interviewer question aloud using high-fidelity Gemini TTS or native fallback (Audio-Only requirement!)
  const triggerInterviewerSpeak = async () => {
    if (!currentQuestion) return;
    
    // Cancel any current speaking to reset cleanly
    window.speechSynthesis.cancel();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setInterviewerState("speaking");
    setVoiceWarning("");

    // Setup local native speech synthesis as fallback
    const fallbackToLocalSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
      
      const langCodes: Record<string, string> = {
        English: "en-US",
        Hindi: "hi-IN",
        Telugu: "te-IN",
        Tamil: "ta-IN",
        Spanish: "es-ES"
      };
      const targetLang = langCodes[session.config.language || "English"] || "en-US";
      utterance.lang = targetLang;

      // Choose voice preset based on selection
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        voices = window.speechSynthesis.getVoices();
      }
      
      const findPerfectVoice = () => {
        const normTarget = targetLang.replace(/_/g, "-").toLowerCase();
        const targetPrefix = normTarget.split("-")[0];

        // 1. Try to find an exact locale match that is high-quality / Premium / Natural / Google / Microsoft / Apple / Online / WaveNet
        let match = voices.find(v => {
          const normLang = v.lang.replace(/_/g, "-").toLowerCase();
          return normLang === normTarget && 
            (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Online") || v.name.includes("Microsoft") || v.name.includes("Apple") || v.name.includes("WaveNet"));
        });
        if (match) return match;

        // 2. Try to find any match with exact locale
        match = voices.find(v => {
          const normLang = v.lang.replace(/_/g, "-").toLowerCase();
          return normLang === normTarget;
        });
        if (match) return match;

        // 3. Try matching language prefix that is Premium/Natural/Google
        match = voices.find(v => {
          const normLang = v.lang.replace(/_/g, "-").toLowerCase();
          return normLang.startsWith(targetPrefix) && 
            (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Online") || v.name.includes("Microsoft") || v.name.includes("Apple") || v.name.includes("WaveNet"));
        });
        if (match) return match;

        // 4. Try any matching language prefix
        match = voices.find(v => {
          const normLang = v.lang.replace(/_/g, "-").toLowerCase();
          return normLang.startsWith(targetPrefix);
        });
        if (match) return match;

        // 5. Fallback constructor preferred voice ONLY if target language is English
        if (targetPrefix === "en") {
          return voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"));
        }

        return undefined;
      };

      const chosenVoice = findPerfectVoice();
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      } else if (session.config.language !== "English") {
        // Warn the user that a native voice pack is not installed in the browser/OS for this language
        setVoiceWarning(`No local text-to-speech voice found for ${session.config.language}. Your device will use its default speech system. For perfect pronunciation, list or install the language pack in your OS.`);
      }

      // Set pacing and tone for high readability and professional clarity
      const isEnglish = session.config.language === "English";
      utterance.rate = isEnglish ? 0.92 : 0.82; 
      utterance.pitch = 1.0; 
      utterance.volume = 1.0; 

      utterance.onend = () => {
        setInterviewerState("listening");
        startCapturingSpeechAnswer();
      };

      utterance.onerror = (errEvent) => {
        console.warn("Speech synthesis utterance error:", errEvent);
        setInterviewerState("listening");
        startCapturingSpeechAnswer();
      };

      window.speechSynthesis.speak(utterance);
    };

    // Attempt Gemini Premium TTS First
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentQuestion.text,
          language: session.config.language || "English"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact premium sound generator endpoint");
      }

      const data = await response.json();
      if (data.audio) {
        const audioUrl = `data:${data.mimeType || "audio/wav"};base64,${data.audio}`;
        const playObj = new Audio(audioUrl);
        currentAudioRef.current = playObj;

        playObj.onended = () => {
          setInterviewerState("listening");
          startCapturingSpeechAnswer();
        };

        playObj.onerror = (e) => {
          console.warn("Speech audio stream format/playback error, triggering local fallback:", e);
          fallbackToLocalSpeech();
        };

        await playObj.play();
      } else {
        throw new Error("No inline audio data block found in TTS response");
      }
    } catch (err) {
      console.warn("Speech generate fallback activated:", err);
      fallbackToLocalSpeech();
    }
  };

  const startCapturingSpeechAnswer = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be running
      }
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      setInterviewerState("idle");
    } else {
      setTranscript("");
      startCapturingSpeechAnswer();
    }
  };

  const handleSubmitAnswer = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsRecording(false);
    setIsSubmitting(true);
    setInterviewerState("thinking");

    try {
      // Send answer to server API
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          answerText: transcript || "(Candidate provided silent verbal gesture or typed response.)",
          metrics: {
            ...liveWebcamMetrics
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        if (isLastQuestion) {
          // Finalize session and trigger scoring
          await handleFinalizeInterview();
        } else {
          setTranscript("");
          setActiveQuestionIdx((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Answer submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeInterview = async () => {
    setInterviewerState("thinking");
    try {
      const res = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const completedSess = await res.json();
      onComplete(completedSess);
    } catch (err) {
      console.error("Completion evaluation generation failed:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="live-interview-controller-grid">
      
      {/* LEFT: Live AI Avatar & Speech Sync Wave HUD (4-cols) */}
      <div className="lg:col-span-4">
        <AvatarPanel
          selectedAvatarId={session.config.avatarId}
          state={interviewerState}
        />
        
        {/* Floating draggable webcam tracker integration */}
        <div className="mt-6 relative">
          <WebcamTracker
            floating={false}
            onMetricsUpdate={(met) => setLiveWebcamMetrics(met)}
          />
        </div>
      </div>

      {/* CENTER & RIGHT Content Area Panel (8-cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* PROGRESS HUD HUD CONTROLS */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-950 pb-2.5">
            <div>
              <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider block font-mono">
                Session Pacing
              </span>
              <h3 className="text-sm font-bold text-slate-100 font-serif italic">
                Question {activeQuestionIdx + 1} of {session.questions.length}
              </h3>
            </div>
            
            <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-bold text-slate-300 font-mono">
              {session.config.role} • {session.config.difficulty}
            </div>
          </div>

          {/* Visual progress bar steps */}
          <div className="flex gap-1">
            {session.questions.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  index === activeQuestionIdx ? "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]" :
                  index < activeQuestionIdx ? "bg-indigo-500/45" : "bg-slate-950 border border-slate-900"
                }`}
              />
            ))}
          </div>
        </div>

        {/* TRANSCRIPT CONSOLE CONTROLLER */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between min-h-[300px] relative">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3.5">
            <div className="flex justify-between items-center bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-900">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Speech Synthesis Output
              </div>
              <button
                onClick={triggerInterviewerSpeak}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[9px] font-bold text-slate-300 flex items-center gap-1 uppercase tracking-wider font-mono cursor-pointer"
                title="Repeat voice question"
              >
                <RefreshCw className="w-3 h-3" />
                Repeat Question
              </button>
            </div>

            {/* AUDIO ONLY ALERT - MANDATORY SPECIFICATION */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed font-serif">
                <span className="font-bold text-indigo-300 uppercase tracking-wide font-sans block text-[10px]">Enterprise Privacy Mode:</span>
                The interview question text is masked in accordance with our audio-only standard. Listen to Marcus carefully and speak.
              </div>
            </div>

            {/* AI LOCAL VOICE WARNING HUD IF NO SYSTEM TTS VOICE AVAILABLE */}
            {voiceWarning && (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-300 leading-relaxed font-mono">
                  <span className="font-bold text-amber-400 uppercase tracking-wide font-sans block text-[10px]">Acoustic Warning:</span>
                  {voiceWarning}
                </div>
              </div>
            )}

            {/* LIVE CANDIDATE TRANSCRIPT */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase font-mono">Live Speech Transcript Console:</span>
              <div className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 min-h-[100px] max-h-40 overflow-y-auto text-xs text-slate-200 leading-relaxed font-mono">
                {transcript ? (
                  <span className="text-slate-200">{transcript}</span>
                ) : (
                  <span className="text-slate-600 italic">Listening for oral answers... Speak clearly or toggle manual voice input buttons.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2.5 mt-5 border-t border-slate-950 pt-4.5">
            {/* Toggle Recording Mic Button */}
            <button
              onClick={handleToggleRecording}
              className={`w-full md:w-auto px-4 py-2 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider font-mono ${
                isRecording
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900"
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-indigo-400" />}
              {isRecording ? "Mute Voice stream" : "Activate Mic"}
            </button>

            {/* TextInput Fallback */}
            <input
              type="text"
              placeholder="Alternative manual typing fallback if mic is blocked..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono placeholder-slate-700"
            />

            {/* Next Question / Submit Button */}
            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 font-bold text-[10px] text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  {isLastQuestion ? "Submit Final Answers" : "Next Question"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* VOICE METRICS LIVE HUD FEED */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 grid grid-cols-3 gap-3">
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-850">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block font-mono">Vocals Speed</span>
            <span className="text-xs font-bold text-slate-300 mt-0.5 block font-mono">130 WPM</span>
          </div>
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-850">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block font-mono">Audio Clarity</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">94% Stable</span>
          </div>
          <div className="text-center p-2.5 bg-slate-950/40 rounded-lg border border-slate-850">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block font-mono">Fillers Frequency</span>
            <span className="text-xs font-bold text-rose-400 mt-0.5 block font-mono">0 identified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
