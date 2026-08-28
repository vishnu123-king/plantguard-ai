import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
  accuracyM: z.number().positive().optional().nullable(),
});

export const CropGrowthStageSchema = z.enum([
  'germination',
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'ripening',
  'harvest'
]);

export const WaterSourceSchema = z.enum([
  'borewell',
  'canal',
  'rainfed',
  'drip_irrigation',
  'sprinkler',
  'river',
  'well',
  'pond',
  'other'
]);

export const WaterConditionSchema = z.enum([
  'abundant',
  'sufficient',
  'moderate',
  'scarce',
  'drought_stress'
]);

export const CreateFarmSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().positive().optional().nullable(),
  cropType: z.string().trim().min(1, 'Crop type is required').max(80),
  cropVariety: z.string().trim().max(80).optional().default('unknown'),
  plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Planting date must be YYYY-MM-DD').optional(),
  growthStage: CropGrowthStageSchema.default('vegetative'),
  waterSource: WaterSourceSchema.default('borewell'),
  waterCondition: WaterConditionSchema.default('moderate'),
  notes: z.string().max(500).optional(),
});

export const FarmContextSchema = CreateFarmSchema.extend({
  id: z.string().uuid().or(z.string().min(1)),
  location: CoordinatesSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
