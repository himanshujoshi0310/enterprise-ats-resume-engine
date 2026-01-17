
export enum ExperienceLevel {
  FRESHER = 'Fresher (0–1 year)',
  JUNIOR = 'Junior (1–3 years)',
  MID_LEVEL = 'Mid-Level (3–6 years)',
  SENIOR = 'Senior (6+ years)'
}

export interface ScoreBreakdown {
  keywordMatch: number;
  skillsRelevance: number;
  experienceAlignment: number;
  projectImpact: number;
  structureFormatting: number;
  grammarTone: number;
}

export interface CompanyMatch {
  name: string;
  matchPercentage: number;
  status: 'Borderline' | 'Shortlist' | 'Strong Match' | 'Needs Improvement';
  reason: string;
}

export interface ResumeAnalysis {
  atsScore: number;
  readinessLevel: 'Beginner' | 'Industry Ready' | 'FAANG Ready';
  shortlistProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL';
  breakdown: ScoreBreakdown;
  companyMatches: CompanyMatch[];
  strengths: string[];
  weaknesses: string[];
  summarySuggestion: {
    current: string;
    optimized: string;
  };
  skillOptimization: {
    category: string;
    skills: string[];
  }[];
  experienceUpgrades: {
    original: string;
    upgraded: string;
    impactDescription: string;
  }[];
  futureSkills: string[];
  rejectionRisks: string[];
}

export interface JobRole {
  id: string;
  title: string;
}
