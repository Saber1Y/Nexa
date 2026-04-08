// Simplified types for GenLayer interaction via Nexa Bridge
export interface ScreeningResult {
  match_score: number;
  verdict: string;
  seniority: string;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  txHash?: string;
  confidence?: number;
}
