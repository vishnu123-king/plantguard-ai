export interface PestDetectionItem {
  commonName: string;
  scientificName: string;
  category: string;
  lifeStage: string;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  confidenceScore: number;
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized to 0-1000
  approximateVisibleCount: number;
  visualEvidence: string[];
  identificationUncertainty: string;
  alternativeIdentifications?: Array<{ name: string; confidence: number }>;
}

export interface PestDamageInfo {
  damageType: string;
  symptoms: string[];
  affectedPlantPart: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";
}

export interface PestInfestationInfo {
  visibleLevel: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";
  explanation: string;
}

export interface PestRiskInfo {
  level: "LOW" | "MODERATE" | "HIGH";
  score: number | null;
  explanation: string;
}

export interface PestRecommendations {
  immediate: string[];
  monitoring: string[];
  cultural: string[];
  biological: string[];
  chemical: string[];
  prevention: string[];
}

export interface PestImageQuality {
  status: "GOOD" | "FAIR" | "INSUFFICIENT";
  score: number;
  issues: string[];
  suggestions?: string;
}

export interface PestDetectionResult {
  id: number;
  status: "success" | "image_quality_insufficient" | "no_confident_pest_detected";
  plant?: {
    name: string;
    confidence: number;
  };
  imageQuality: PestImageQuality;
  pests: PestDetectionItem[];
  damage: PestDamageInfo;
  infestation: PestInfestationInfo;
  risk: PestRiskInfo;
  recommendations: PestRecommendations;
  classification: "DISEASE" | "PEST" | "NUTRIENT_STRESS" | "ENVIRONMENTAL_STRESS" | "MULTIPLE_FACTORS" | "UNCERTAIN";
  disclaimer: string;
  image_filename?: string;
  created_at?: string;
}
