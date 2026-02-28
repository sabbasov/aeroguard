export interface TopFailure {
  partName: string;
  count: number;
}

export interface AD {
  adNumber: string;
  subject: string;
  adLink: string | null;
  applicable: boolean;
  confidence: number;
  reasoning: string;
}

export interface AnalysisResult {
  tailNumber: string;
  matchType: string;
  registry: Record<string, string> | null;
  count: number;
  topFailures: TopFailure[];
  ads: AD[];
  riskScore: number;
  failedCount: number;
  excessWearCount: number;
  applicableCount: number;
  totalADsMatched: number;
}

export interface Stats {
  sdrCount: number;
  adCount: number;
  aircraftTracked: number;
  supabaseOk: boolean;
}
