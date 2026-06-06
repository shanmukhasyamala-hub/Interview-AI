export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  token?: string;
}

export interface Resume {
  id: string;
  name: string;
  content: string;
  tags: string[];
  industry: string;
  uploadDate: string;
  isCustom?: boolean;
}

export interface ResumeAnalysis {
  resumeId: string;
  skills: {
    technical: { name: string; score: number }[];
    soft: { name: string; score: number }[];
    leadership: { name: string; score: number }[];
    communication: { name: string; score: number }[];
  };
  ats: {
    score: number;
    keywordMatch: string[];
    missingKeywords: string[];
    formattingQuality: string;
  };
  quality: {
    strengths: string[];
    weaknesses: string[];
    missingSections: string[];
    suggestions: string[];
  };
  readiness: {
    overallScore: number;
    atsScore: number;
    technicalReadiness: number;
    interviewReadiness: number;
  };
}

export interface ResumeComparison {
  primaryId: string;
  secondaryId: string;
  recommendedId: string;
  confidencePercentage: number;
  explanation: string;
  atsComparison: { name: string; primaryScore: number; secondaryScore: number }[];
  skillCoverage: { skill: string; primaryHas: boolean; secondaryHas: boolean }[];
  keywordRelevance: number;
  industryRelevance: number;
}

export interface JobMatch {
  resumeId: string;
  jobDescription: string;
  matchPercentage: number;
  missingSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
  recommendedChanges: string[];
}

export interface InterviewConfig {
  questionCount: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  type: "Technical" | "HR" | "Behavioral" | "Product" | "Startup" | "Custom";
  role: string;
  language: "English" | "Hindi" | "Telugu" | "Tamil" | "Spanish";
  avatarId: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  category: "Resume-Based" | "Technical" | "Behavioral" | "Situational";
}

export interface CandidateAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  fillerWordsCount: number;
  fillerWordsList: string[];
  speechSpeed: number; // words per min
  speechClarity: number; // 0 to 100
  confidenceScore: number; // 0 to 100
  eyeContactScore: number; // 0 to 100
  smileScore: number; // 0 to 100
  postureScore: number; // 0 to 100
  attentionMetric: number; // 0 to 100
}

export interface InterviewSession {
  id: string;
  userId: string;
  resumeId: string;
  config: InterviewConfig;
  status: "configuring" | "ongoing" | "completed";
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: CandidateAnswer[];
  startedAt: string;
  completedAt?: string;
  scores?: InterviewScores;
  recruiterNotes?: RecruiterReport;
  weeklyPlan?: WeeklyPlan;
  successPrediction?: SuccessPrediction;
}

export interface InterviewScores {
  overall: number;
  resumeKnowledge: number;
  technical: number;
  behavioral: number;
  problemSolving: number;
  communication: number;
}

export interface RecruiterReport {
  hireRecommendation: "Strong Hire" | "Hire" | "No Hire" | "Elite Match";
  recruiterNotes: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface SuccessPrediction {
  successProbability: number;
  hiringByLevel: {
    internship: number;
    entryLevel: number;
    midLevel: number;
    seniorLevel: number;
  };
  marketReadiness: number;
}

export interface WeeklyPlan {
  days: {
    dayNum: number;
    title: string;
    techTask: string;
    communicationTask: string;
    resumeFocus: string;
    mockTask: string;
  }[];
}

export interface BenchmarkMetrics {
  technical: number;
  behavioral: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  overall: number;
}

export interface BenchmarkStats {
  role: string;
  yourScores: BenchmarkMetrics;
  avgScores: BenchmarkMetrics;
  top10Scores: BenchmarkMetrics;
  eliteScores: BenchmarkMetrics;
  globalRank: number;
  roleRank: number;
  totalCandidates: number;
  percentile: number;
  readinessScore: number;
  readinessClass: "Needs Improvement" | "Developing" | "Interview Ready" | "Strong Candidate" | "Elite Candidate";
  hiringProbabilities: {
    internship: number;
    entry: number;
    mid: number;
    senior: number;
  };
  marketCompetitiveness: number;
  skillGapAnalysis: { skill: string; gap: number; description: string }[];
  aboveAverageSkills: string[];
  belowAverageSkills: string[];
  insights: string;
}
