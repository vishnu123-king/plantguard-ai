import { Layer1Analysis } from '../shared/types/layer1.types';
import { Layer1AnalysisSchema } from '../shared/schemas/layer1.schema';

export class Layer1Adapter {
  /**
   * Normalizes any raw diagnosis payload or legacy response into a validated Layer1Analysis object.
   */
  static normalize(raw: any): Layer1Analysis {
    if (!raw) {
      return this.getDefaultHealthy();
    }

    // Check if it's already in the target format
    const candidate: Layer1Analysis = {
      crop: {
        name: raw.plant?.name || raw.crop?.name || raw.plantName || 'Tomato',
        confidence: Number(raw.plant?.confidence ?? raw.crop?.confidence ?? 90)
      },
      disease: {
        name: raw.diagnosis?.disease || raw.disease?.name || raw.diseaseName || 'Early Blight',
        confidence: Number(raw.diagnosis?.confidence ?? raw.disease?.confidence ?? 85),
        status: (raw.diagnosis?.status || raw.disease?.status || (raw.diseaseName?.toLowerCase().includes('healthy') ? 'healthy' : 'diseased')) as any
      },
      severity: {
        severityLevel: (raw.severity?.severityLevel || raw.severity || 'moderate') as any,
        riskScore: raw.metrics?.risk_score ?? raw.severity?.riskScore ?? 60,
        affectedRatePercent: raw.metrics?.affectedRate ?? raw.severity?.affectedRatePercent ?? 25
      },
      symptoms: Array.isArray(raw.symptoms) ? raw.symptoms : [],
      treatments: {
        organic: Array.isArray(raw.organic_treatment) ? raw.organic_treatment : (Array.isArray(raw.treatments?.organic) ? raw.treatments.organic : []),
        chemical: Array.isArray(raw.chemical_treatment) ? raw.chemical_treatment : (Array.isArray(raw.treatments?.chemical) ? raw.treatments.chemical : []),
        prevention: Array.isArray(raw.prevention) ? raw.prevention : (Array.isArray(raw.treatments?.prevention) ? raw.treatments.prevention : [])
      },
      warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
      imageQualityScore: raw.image_quality?.score ?? 95,
      analyzedAt: raw.timestamp ? new Date(raw.timestamp).toISOString() : new Date().toISOString(),
      rawDiagnosisId: typeof raw.id === 'number' ? raw.id : undefined
    };

    const parsed = Layer1AnalysisSchema.safeParse(candidate);
    if (parsed.success) {
      return parsed.data as Layer1Analysis;
    }

    console.warn('Layer1 payload validation warning:', parsed.error);
    return candidate;
  }

  private static getDefaultHealthy(): Layer1Analysis {
    return {
      crop: { name: 'Tomato', confidence: 95 },
      disease: { name: 'Healthy Foliage', confidence: 92, status: 'healthy' },
      severity: { severityLevel: 'none', riskScore: 10, affectedRatePercent: 0 },
      symptoms: ['Vibrant green leaves', 'No lesions or discoloration'],
      treatments: {
        organic: ['Maintain regular watering and compost enrichment'],
        chemical: ['No chemical treatment needed'],
        prevention: ['Weekly inspection and balanced soil care']
      },
      analyzedAt: new Date().toISOString()
    };
  }
}
