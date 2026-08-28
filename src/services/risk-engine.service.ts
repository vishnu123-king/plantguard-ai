import fs from 'fs';
import path from 'path';
import { Layer1Analysis } from '../shared/types/layer1.types';
import { EnvironmentalProfile } from '../shared/types/environment.types';
import { FarmContext } from '../shared/types/farm.types';
import { RiskEngine, RiskResult, RiskLevel, EnvironmentalFactorImpact, DiseaseVulnerabilityProfile } from '../shared/types/risk.types';

export class KnowledgeBasedRiskEngine implements RiskEngine {
  private diseaseKnowledgeBase: Map<string, any>;

  constructor() {
    this.diseaseKnowledgeBase = new Map();
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    const knowledgeRoot = path.join(process.cwd(), 'knowledge', 'diseases');
    if (!fs.existsSync(knowledgeRoot)) {
      return;
    }

    const traverseDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          traverseDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          try {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            const key = content.commonName ? content.commonName.toLowerCase() : path.basename(entry.name, '.json').toLowerCase();
            this.diseaseKnowledgeBase.set(key, content);
          } catch (e) {
            console.error(`Failed to load disease profile from ${fullPath}:`, e);
          }
        }
      }
    };

    traverseDir(knowledgeRoot);
  }

  calculateRisk(
    layer1: Layer1Analysis,
    environment: EnvironmentalProfile,
    farm: FarmContext
  ): RiskResult {
    const diseaseName = layer1.disease.name || 'Unknown Disease';
    const isHealthy = layer1.disease.status === 'healthy' || diseaseName.toLowerCase().includes('healthy');

    // Find profile in knowledge base or generate fallback profile
    const profile = this.findMatchingDiseaseProfile(diseaseName, layer1.crop.name);

    const weatherCurrent = environment.weather.current;
    const weatherHistory = environment.weather.historical?.last24Hours;
    const soil = environment.soil;

    const factors: EnvironmentalFactorImpact[] = [];
    let weightedScoreSum = 0;
    let totalWeight = 0;

    // Factor 1: Temperature Suitability
    const temp = weatherCurrent.temperatureC;
    const optTempMin = profile.optimalTempRangeC ? profile.optimalTempRangeC[0] : 22;
    const optTempMax = profile.optimalTempRangeC ? profile.optimalTempRangeC[1] : 28;
    const favTempMin = profile.favorableMinTempC ?? (optTempMin - 4);
    const favTempMax = profile.favorableMaxTempC ?? (optTempMax + 4);

    let tempImpact: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let tempScore = 0.2;
    let tempRationale = `Ambient temperature (${temp}°C) is outside the accelerated pathogen proliferation range.`;

    if (temp >= optTempMin && temp <= optTempMax) {
      tempImpact = 'high';
      tempScore = 0.95;
      tempRationale = `Temperature of ${temp}°C is within the prime pathogen germination window (${optTempMin}–${optTempMax}°C).`;
    } else if (temp >= favTempMin && temp <= favTempMax) {
      tempImpact = 'moderate';
      tempScore = 0.65;
      tempRationale = `Temperature of ${temp}°C is favorable for slow-to-moderate fungal mycelial growth.`;
    }

    const tempWeight = profile.factors?.temperatureWeight ?? 0.30;
    factors.push({
      factor: 'temperature',
      label: 'Ambient Temperature',
      observedValue: `${temp}°C`,
      optimalRangeDescription: `${optTempMin}°C – ${optTempMax}°C`,
      impactLevel: tempImpact,
      contributionWeight: tempWeight,
      rationale: tempRationale
    });
    weightedScoreSum += tempScore * tempWeight;
    totalWeight += tempWeight;

    // Factor 2: Relative Humidity & Leaf Wetness Risk
    const rh = weatherCurrent.relativeHumidityPercent;
    const critRh = profile.criticalHumidityThresholdPercent ?? 80;
    let humidImpact: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let humidScore = 0.2;
    let humidRationale = `Relative humidity (${rh}%) is below the critical sporulation threshold (${critRh}%).`;

    if (rh >= critRh + 5) {
      humidImpact = 'critical';
      humidScore = 1.0;
      humidRationale = `Persistent high humidity (${rh}%) drastically accelerates spore germination and leaf penetration.`;
    } else if (rh >= critRh) {
      humidImpact = 'high';
      humidScore = 0.85;
      humidRationale = `Relative humidity (${rh}%) meets or exceeds the critical pathogen threshold of ${critRh}%.`;
    } else if (rh >= critRh - 15) {
      humidImpact = 'moderate';
      humidScore = 0.5;
      humidRationale = `Humidity (${rh}%) is approaching conducive levels during night/morning hours.`;
    }

    const humidWeight = profile.factors?.humidityWeight ?? 0.35;
    factors.push({
      factor: 'relativeHumidity',
      label: 'Relative Humidity',
      observedValue: `${rh}%`,
      optimalRangeDescription: `>= ${critRh}% conducive`,
      impactLevel: humidImpact,
      contributionWeight: humidWeight,
      rationale: humidRationale
    });
    weightedScoreSum += humidScore * humidWeight;
    totalWeight += humidWeight;

    // Factor 3: Precipitation / Moisture Splash
    const rainfall24h = weatherHistory?.totalRainfallMm ?? weatherCurrent.precipitationMm;
    let rainImpact: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let rainScore = 0.15;
    let rainRationale = `Low rainfall (${rainfall24h}mm) minimizes soil splash and surface spore dispersal.`;

    if (rainfall24h >= 10) {
      rainImpact = 'high';
      rainScore = 0.90;
      rainRationale = `Significant recent precipitation (${rainfall24h}mm in last 24h) causes splash dispersal and keeps canopy damp.`;
    } else if (rainfall24h >= 2) {
      rainImpact = 'moderate';
      rainScore = 0.60;
      rainRationale = `Moderate precipitation (${rainfall24h}mm) provides canopy moisture conducive to pathogen survival.`;
    }

    const rainWeight = profile.factors?.rainfallWeight ?? 0.20;
    factors.push({
      factor: 'recentRainfall',
      label: 'Precipitation (24h)',
      observedValue: `${rainfall24h} mm`,
      optimalRangeDescription: '< 2.0 mm safe',
      impactLevel: rainImpact,
      contributionWeight: rainWeight,
      rationale: rainRationale
    });
    weightedScoreSum += rainScore * rainWeight;
    totalWeight += rainWeight;

    // Factor 4: Crop Growth Stage Susceptibility
    const stage = farm.growthStage || 'vegetative';
    const isStageSusceptible = (profile.susceptibleGrowthStages || ['flowering', 'fruiting', 'vegetative']).includes(stage);
    let stageImpact: 'low' | 'moderate' | 'high' | 'critical' = isStageSusceptible ? 'high' : 'low';
    let stageScore = isStageSusceptible ? 0.85 : 0.3;
    let stageRationale = isStageSusceptible
      ? `The current growth stage (${stage}) has active young vegetative/reproductive tissue vulnerable to infection.`
      : `Crop growth stage (${stage}) exhibits lower physiological vulnerability.`;

    const stageWeight = profile.factors?.growthStageWeight ?? 0.10;
    factors.push({
      factor: 'cropGrowthStage',
      label: 'Crop Growth Stage',
      observedValue: stage.toUpperCase(),
      optimalRangeDescription: 'Vegetative / Flowering most vulnerable',
      impactLevel: stageImpact,
      contributionWeight: stageWeight,
      rationale: stageRationale
    });
    weightedScoreSum += stageScore * stageWeight;
    totalWeight += stageWeight;

    // Factor 5: Soil Texture / Drainage Factor
    const soilTexture = soil.textureClass || 'Loam';
    const soilPh = soil.ph ?? 6.5;
    let soilImpact: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let soilScore = 0.3;
    let soilRationale = `Soil texture (${soilTexture}, pH ${soilPh}) provides standard drainage characteristics.`;

    if (soilTexture.toLowerCase().includes('clay') && (rainfall24h > 5 || rh > 80)) {
      soilImpact = 'moderate';
      soilScore = 0.7;
      soilRationale = `Heavy clay soil (${soilTexture}) retains surface moisture longer, maintaining localized microclimate humidity.`;
    }

    const soilWeight = profile.factors?.soilFactorWeight ?? 0.05;
    factors.push({
      factor: 'soilCondition',
      label: 'Soil Texture & Drainage',
      observedValue: `${soilTexture} (pH ${soilPh})`,
      optimalRangeDescription: 'Well-draining loam',
      impactLevel: soilImpact,
      contributionWeight: soilWeight,
      rationale: soilRationale
    });
    weightedScoreSum += soilScore * soilWeight;
    totalWeight += soilWeight;

    // Calculate Normalized Environmental Risk (0.0 to 1.0)
    let envRiskScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0.5;
    envRiskScore = Math.min(1.0, Math.max(0.0, Number(envRiskScore.toFixed(2))));

    if (isHealthy) {
      envRiskScore = Number((envRiskScore * 0.4).toFixed(2));
    }

    const envRiskLevel: RiskLevel = 
      envRiskScore >= 0.75 ? 'HIGH' :
      envRiskScore >= 0.50 ? 'MODERATE' : 'LOW';

    // Calculate Combined Overall Score (Layer 1 Image Severity + Layer 2 Environmental Suitability)
    const layer1SeverityWeight = layer1.severity.severityLevel === 'critical' ? 90 :
      layer1.severity.severityLevel === 'severe' ? 75 :
      layer1.severity.severityLevel === 'moderate' ? 55 :
      layer1.severity.severityLevel === 'mild' ? 35 : 10;

    const layer1RiskComponent = layer1.severity.riskScore ?? layer1SeverityWeight;
    const layer2RiskComponent = envRiskScore * 100;

    // 55% Image Visual Diagnosis + 45% Environmental Vector
    const combinedScore = Math.round((layer1RiskComponent * 0.55) + (layer2RiskComponent * 0.45));
    const combinedLevel: RiskLevel =
      combinedScore >= 75 ? 'HIGH' :
      combinedScore >= 45 ? 'MODERATE' : 'LOW';

    // Generate Explanations
    const summaryExplanation: string[] = [];
    if (envRiskScore >= 0.70) {
      summaryExplanation.push(`Critical environmental suitability for ${diseaseName} (${(envRiskScore * 100).toFixed(0)}% favorable).`);
    } else if (envRiskScore >= 0.45) {
      summaryExplanation.push(`Moderate weather favorability for disease spread.`);
    } else {
      summaryExplanation.push(`Current environmental conditions are generally unfavorable for rapid pathogen outbreak.`);
    }

    if (rh >= critRh) {
      summaryExplanation.push(`High relative humidity (${rh}%) exceeds the ${critRh}% critical threshold.`);
    }
    if (rainfall24h > 2) {
      summaryExplanation.push(`Recent precipitation (${rainfall24h} mm) increases leaf wetness duration.`);
    }
    if (temp >= optTempMin && temp <= optTempMax) {
      summaryExplanation.push(`Temperature of ${temp}°C falls squarely in the pathogen's optimal growth range.`);
    }

    const agronomicActionAdvice: string[] = profile.agronomicAdvice || [
      'Avoid overhead watering; switch to drip lines to keep canopy foliage dry.',
      'Maintain adequate inter-plant spacing to maximize airflow and promote rapid leaf drying.',
      'Scout lower canopy leaves twice weekly for early lesion development.'
    ];

    return {
      environmentalRiskScore: envRiskScore,
      environmentalRiskLevel: envRiskLevel,
      overallCombinedRiskScore: combinedScore,
      overallCombinedRiskLevel: combinedLevel,
      suitabilityScore: Math.round(envRiskScore * 100),
      factors,
      summaryExplanation,
      agronomicActionAdvice,
      calculatedAt: new Date().toISOString(),
      methodology: 'knowledge-based-environmental-rules-v1'
    };
  }

  private findMatchingDiseaseProfile(diseaseName: string, cropName: string): any {
    const cleanName = diseaseName.toLowerCase();
    for (const [key, profile] of this.diseaseKnowledgeBase.entries()) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return profile;
      }
    }

    // Default universal plant pathology baseline
    return {
      pathogen: 'Generic Plant Pathogen',
      commonName: diseaseName,
      targetCrops: [cropName],
      optimalTempRangeC: [20, 28],
      favorableMinTempC: 15,
      favorableMaxTempC: 32,
      criticalHumidityThresholdPercent: 80,
      favorableRainfallCondition: 'moderate',
      susceptibleGrowthStages: ['vegetative', 'flowering', 'fruiting'],
      factors: {
        temperatureWeight: 0.30,
        humidityWeight: 0.35,
        rainfallWeight: 0.20,
        growthStageWeight: 0.10,
        soilFactorWeight: 0.05
      },
      agronomicAdvice: [
        'Monitor foliage closely during sustained high-humidity weather.',
        'Prune dense foliage to optimize air movement through the crop canopy.',
        'Apply preventative bio-protectants or registered fungicides if weather conditions remain humid.'
      ]
    };
  }
}

export const riskEngine = new KnowledgeBasedRiskEngine();
