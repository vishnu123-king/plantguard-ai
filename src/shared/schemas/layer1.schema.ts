import { z } from 'zod';

export const Layer1PlantInfoSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(100).optional(),
});

export const Layer1DiseaseInfoSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(100).optional(),
  status: z.enum(['healthy', 'diseased', 'stressed', 'unknown']).default('diseased'),
});

export const Layer1SeverityInfoSchema = z.object({
  severityLevel: z.enum(['none', 'mild', 'moderate', 'severe', 'critical']).default('moderate'),
  riskScore: z.number().min(0).max(100).optional(),
  affectedRatePercent: z.number().min(0).max(100).optional(),
});

export const Layer1TreatmentsSchema = z.object({
  organic: z.array(z.string()).optional(),
  chemical: z.array(z.string()).optional(),
  prevention: z.array(z.string()).optional(),
});

export const Layer1AnalysisSchema = z.object({
  crop: Layer1PlantInfoSchema,
  disease: Layer1DiseaseInfoSchema,
  severity: Layer1SeverityInfoSchema,
  symptoms: z.array(z.string()).optional(),
  treatments: Layer1TreatmentsSchema.optional(),
  warnings: z.array(z.string()).optional(),
  imageQualityScore: z.number().min(0).max(100).optional(),
  analyzedAt: z.string().optional(),
  rawDiagnosisId: z.number().optional(),
});
