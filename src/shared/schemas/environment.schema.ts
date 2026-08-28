import { z } from 'zod';
import { CoordinatesSchema } from './farm.schema';

export const WeatherObservationSchema = z.object({
  temperatureC: z.number(),
  relativeHumidityPercent: z.number().min(0).max(100),
  precipitationMm: z.number().min(0),
  windSpeedKmh: z.number().min(0),
  surfacePressureHpa: z.number().optional(),
  cloudCoverPercent: z.number().min(0).max(100).optional(),
  uvIndex: z.number().min(0).optional(),
  weatherCode: z.number().optional(),
  weatherDescription: z.string().optional(),
  observedAt: z.string(),
  retrievedAt: z.string(),
  source: z.literal('open-meteo'),
});

export const SoilPropertiesSchema = z.object({
  ph: z.number().nullable(),
  sandPercent: z.number().min(0).max(100).nullable(),
  siltPercent: z.number().min(0).max(100).nullable(),
  clayPercent: z.number().min(0).max(100).nullable(),
  organicCarbonGKg: z.number().min(0).nullable(),
  bulkDensityGcm3: z.number().nullable(),
  cationExchangeCapacity: z.number().nullable(),
  textureClass: z.string().optional(),
  depthInterval: z.string(),
  source: z.enum(['soilgrids', 'measured_lab', 'sensor']),
  retrievedAt: z.string(),
  isModeledEstimate: z.boolean(),
  accuracyConfidenceNotice: z.string(),
});

export const EnvironmentalProfileSchema = z.object({
  farmId: z.string(),
  location: CoordinatesSchema,
  weather: z.object({
    current: WeatherObservationSchema,
    historical: z.any().optional(),
    forecast: z.array(z.any()).optional(),
  }),
  soil: SoilPropertiesSchema,
  retrievedAt: z.string(),
  provenance: z.object({
    weatherProvider: z.string(),
    soilProvider: z.string(),
    locationResolution: z.string(),
  }),
});
