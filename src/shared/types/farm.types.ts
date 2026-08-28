export interface FarmCoordinates {
  latitude: number;
  longitude: number;
  accuracyM?: number;
}

export type CropGrowthStage = 
  | 'germination'
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'ripening'
  | 'harvest';

export type WaterSource = 
  | 'borewell'
  | 'canal'
  | 'rainfed'
  | 'drip_irrigation'
  | 'sprinkler'
  | 'river'
  | 'well'
  | 'pond'
  | 'other';

export type WaterCondition = 
  | 'abundant'
  | 'sufficient'
  | 'moderate'
  | 'scarce'
  | 'drought_stress';

export interface FarmContext {
  id: string;
  name?: string;
  location: FarmCoordinates;
  cropType: string;
  cropVariety?: string;
  plantingDate?: string; // YYYY-MM-DD
  growthStage: CropGrowthStage;
  waterSource: WaterSource;
  waterCondition: WaterCondition;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmInput {
  name?: string;
  latitude: number;
  longitude: number;
  accuracyM?: number;
  cropType: string;
  cropVariety?: string;
  plantingDate?: string;
  growthStage: CropGrowthStage;
  waterSource: WaterSource;
  waterCondition: WaterCondition;
  notes?: string;
}
