export interface Layer1PlantInfo {
  name: string;
  confidence?: number;
}

export interface Layer1DiseaseInfo {
  name: string;
  confidence?: number;
  status: 'healthy' | 'diseased' | 'stressed' | 'unknown';
}

export interface Layer1SeverityInfo {
  severityLevel: 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
  riskScore?: number;
  affectedRatePercent?: number;
}

export interface Layer1Treatments {
  organic?: string[];
  chemical?: string[];
  prevention?: string[];
}

export interface Layer1Analysis {
  crop: Layer1PlantInfo;
  disease: Layer1DiseaseInfo;
  severity: Layer1SeverityInfo;
  symptoms?: string[];
  treatments?: Layer1Treatments;
  warnings?: string[];
  imageQualityScore?: number;
  analyzedAt?: string;
  rawDiagnosisId?: number;
}
