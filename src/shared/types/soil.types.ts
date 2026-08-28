export interface SoilProperties {
  ph: number | null; // e.g. 6.4 (pH in H2O)
  sandPercent: number | null; // Sand fraction (0-100%)
  siltPercent: number | null; // Silt fraction (0-100%)
  clayPercent: number | null; // Clay fraction (0-100%)
  organicCarbonGKg: number | null; // Soil Organic Carbon (g/kg)
  bulkDensityGcm3: number | null; // Bulk density (cg/cm3 or g/cm3)
  cationExchangeCapacity: number | null; // CEC (mmol(c)/kg)
  textureClass?: string; // Sandy Loam, Clay Loam, etc.
  depthInterval: string; // e.g. '0-30cm'
  source: 'soilgrids' | 'measured_lab' | 'sensor';
  retrievedAt: string;
  isModeledEstimate: boolean;
  accuracyConfidenceNotice: string;
}
