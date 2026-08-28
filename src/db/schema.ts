/**
 * PostgreSQL + PostGIS Drizzle Schema definition for AgriSentinel SIH26131 Layer 2
 */
export const schemaSqlDefinition = `
-- Enable PostGIS extension for spatial analysis
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Farms Table
CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  location GEOGRAPHY(Point, 4326),
  accuracy_m NUMERIC(6,2),
  crop_type VARCHAR(100) NOT NULL,
  crop_variety VARCHAR(100) DEFAULT 'unknown',
  planting_date DATE,
  growth_stage VARCHAR(50) NOT NULL DEFAULT 'vegetative',
  water_source VARCHAR(50) NOT NULL DEFAULT 'borewell',
  water_condition VARCHAR(50) NOT NULL DEFAULT 'moderate',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS Spatial Index on farm location
CREATE INDEX IF NOT EXISTS idx_farms_location ON farms USING GIST(location);

-- 2. Weather Observations Table
CREATE TABLE IF NOT EXISTS weather_observations (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64) REFERENCES farms(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL,
  temperature_c NUMERIC(4,1) NOT NULL,
  relative_humidity_percent NUMERIC(4,1) NOT NULL,
  precipitation_mm NUMERIC(6,2) NOT NULL,
  wind_speed_kmh NUMERIC(5,2) NOT NULL,
  surface_pressure_hpa NUMERIC(6,1),
  cloud_cover_percent NUMERIC(4,1),
  weather_code INTEGER,
  source VARCHAR(50) NOT NULL DEFAULT 'open-meteo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_farm_observed ON weather_observations(farm_id, observed_at DESC);

-- 3. Soil Profiles Table
CREATE TABLE IF NOT EXISTS soil_profiles (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64) REFERENCES farms(id) ON DELETE CASCADE,
  ph NUMERIC(3,1),
  sand_percent NUMERIC(4,1),
  silt_percent NUMERIC(4,1),
  clay_percent NUMERIC(4,1),
  organic_carbon_gkg NUMERIC(6,2),
  bulk_density_gcm3 NUMERIC(4,2),
  cation_exchange_capacity NUMERIC(5,2),
  texture_class VARCHAR(50),
  depth_interval VARCHAR(50) DEFAULT '0-30cm',
  source VARCHAR(50) NOT NULL DEFAULT 'soilgrids',
  is_modeled_estimate BOOLEAN NOT NULL DEFAULT TRUE,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soil_farm_id ON soil_profiles(farm_id);

-- 4. Environmental Profiles Snapshot Table
CREATE TABLE IF NOT EXISTS environmental_profiles (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64) REFERENCES farms(id) ON DELETE CASCADE,
  location_snapshot JSONB NOT NULL,
  weather_snapshot JSONB NOT NULL,
  soil_snapshot JSONB NOT NULL,
  provenance JSONB NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enhanced Crop Health Analyses (Layer 1 + Layer 2 Combined)
CREATE TABLE IF NOT EXISTS enhanced_crop_analyses (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64) REFERENCES farms(id) ON DELETE CASCADE,
  layer1_prediction JSONB NOT NULL,
  environmental_risk_score NUMERIC(3,2) NOT NULL,
  environmental_risk_level VARCHAR(20) NOT NULL,
  overall_combined_risk_score NUMERIC(5,2) NOT NULL,
  overall_combined_risk_level VARCHAR(20) NOT NULL,
  factors_breakdown JSONB NOT NULL,
  summary_explanation JSONB NOT NULL,
  agronomic_advice JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_farm ON enhanced_crop_analyses(farm_id, created_at DESC);
`;
