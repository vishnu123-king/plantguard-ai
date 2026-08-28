import { Layer1Analysis } from './layer1.types';
import { EnvironmentalProfile } from './environment.types';
import { FarmContext } from './farm.types';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface EnvironmentalFactorImpact {
  factor: string;
  label: string;
  observedValue: string | number;
  optimalRangeDescription: string;
  impactLevel: 'low' | 'moderate' | 'high' | 'critical';
  contributionWeight: number; // 0 to 1
  rationale: string;
}

export interface DiseaseVulnerabilityProfile {
  pathogen: string;
  commonName: string;
  targetCrops: string[];
  optimalTempRangeC: [number, number]; // [min, max]
  criticalHumidityThresholdPercent: number;
  favorableRainfallCondition: 'high' | 'moderate' | 'dry' | 'any';
  susceptibleGrowthStages: string[];
  soilTextureSusceptibility?: string[];
  soilPhRange?: [number, number];
}

export interface RiskResult {
  environmentalRiskScore: number; // 0.0 to 1.0
  environmentalRiskLevel: RiskLevel;
  overallCombinedRiskScore: number; // 0 to 100
  overallCombinedRiskLevel: RiskLevel;
  suitabilityScore: number; // 0 to 100
  factors: EnvironmentalFactorImpact[];
  summaryExplanation: string[];
  agronomicActionAdvice: string[];
  calculatedAt: string;
  methodology: 'knowledge-based-environmental-rules-v1';
}

export interface EnhancedCropHealthAnalysis {
  analysisId: string;
  farmContext: FarmContext;
  layer1: Layer1Analysis;
  layer2: EnvironmentalProfile;
  riskEvaluation: RiskResult;
  createdAt: string;
}

export interface RiskEngine {
  calculateRisk(
    layer1: Layer1Analysis,
    environment: EnvironmentalProfile,
    farm: FarmContext
  ): RiskResult;
}
