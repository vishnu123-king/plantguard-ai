import { FarmRepository, farmRepository } from './farm.service';
import { EnvironmentService } from './environment.service';
import { KnowledgeBasedRiskEngine, riskEngine } from './risk-engine.service';
import { Layer1Adapter } from './layer1.adapter';
import { Layer1Analysis } from '../shared/types/layer1.types';
import { EnhancedCropHealthAnalysis } from '../shared/types/risk.types';

export class CropHealthAnalysisService {
  private farmRepo: FarmRepository;
  private envService: EnvironmentService;
  private riskEvaluator: KnowledgeBasedRiskEngine;
  private enhancedAnalysesHistory: Map<string, EnhancedCropHealthAnalysis>;

  constructor(
    farmRepo?: FarmRepository,
    envService?: EnvironmentService,
    riskEvaluator?: KnowledgeBasedRiskEngine
  ) {
    this.farmRepo = farmRepo || farmRepository;
    this.envService = envService || new EnvironmentService();
    this.riskEvaluator = riskEvaluator || riskEngine;
    this.enhancedAnalysesHistory = new Map();
  }

  /**
   * Orchestrates the complete Layer 1 + Layer 2 Combined Environmental Intelligence workflow.
   */
  async performEnhancedAnalysis(
    farmId: string,
    rawLayer1Data: any
  ): Promise<EnhancedCropHealthAnalysis> {
    // 1. Fetch Farm context
    let farm = await this.farmRepo.getFarmById(farmId);
    if (!farm) {
      // Fallback default farm if not yet registered
      farm = await this.farmRepo.createFarm({
        name: 'Auto-detected Field',
        latitude: 11.0168,
        longitude: 76.9558,
        accuracyM: 8.0,
        cropType: rawLayer1Data?.plant?.name || 'Tomato',
        growthStage: 'flowering',
        waterSource: 'borewell',
        waterCondition: 'moderate'
      });
    }

    // 2. Normalize and validate Layer 1 data
    const layer1 = Layer1Adapter.normalize(rawLayer1Data);

    // 3. Obtain Environmental Profile (Open-Meteo + SoilGrids)
    const layer2 = await this.envService.getEnvironmentalProfile(farm.id, farm.location);

    // 4. Run Knowledge-Based Explainable Risk Engine
    const riskEvaluation = this.riskEvaluator.calculateRisk(layer1, layer2, farm);

    // 5. Build Unified Enhanced Analysis Record
    const analysisId = `analysis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const result: EnhancedCropHealthAnalysis = {
      analysisId,
      farmContext: farm,
      layer1,
      layer2,
      riskEvaluation,
      createdAt: new Date().toISOString()
    };

    this.enhancedAnalysesHistory.set(analysisId, result);
    return result;
  }

  async getAnalysisById(analysisId: string): Promise<EnhancedCropHealthAnalysis | null> {
    return this.enhancedAnalysesHistory.get(analysisId) || null;
  }

  async listAnalyses(): Promise<EnhancedCropHealthAnalysis[]> {
    return Array.from(this.enhancedAnalysesHistory.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const cropHealthAnalysisService = new CropHealthAnalysisService();
