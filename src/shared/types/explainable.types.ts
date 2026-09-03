export interface VisualEvidenceItem {
  feature: string;
  importance: "High" | "Medium" | "Low";
  explanation: string;
}

export interface BoundingRegion {
  x: number; // Normalized 0.0 to 1.0 (left)
  y: number; // Normalized 0.0 to 1.0 (top)
  width: number; // Normalized 0.0 to 1.0
  height: number; // Normalized 0.0 to 1.0
  label: string;
}

export interface ImageQualityInfo {
  score: number; // 0 to 100
  status: "GOOD" | "FAIR" | "INSUFFICIENT";
  issues: string[];
  suggestions?: string;
}

export interface AlternativeMatch {
  disease: string;
  confidence: number;
}

export interface ExplainableDiagnosisData {
  visualEvidence: VisualEvidenceItem[];
  symptomsObserved: string[];
  affectedRegionEstimate: number | null; // e.g. 32 or null
  diagnosisExplanation: string;
  confidenceExplanation: string;
  imageQuality: ImageQualityInfo;
  regions?: BoundingRegion[];
  alternativeMatches?: AlternativeMatch[];
}
