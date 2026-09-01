export interface WeatherObservation {
  temperatureC: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  surfacePressureHpa?: number;
  cloudCoverPercent?: number;
  uvIndex?: number;
  weatherCode?: number;
  weatherDescription?: string;
  observedAt: string;
  retrievedAt: string;
  source: 'open-meteo';
}

export interface WeatherSummary {
  period: '24h' | '3d' | '7d';
  totalRainfallMm: number;
  averageTemperatureC: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  averageHumidityPercent: number;
  maxHumidityPercent: number;
  highHumidityHoursCount: number; // consecutive hours with RH > 85%
  dewPointApproximatedC?: number;
}

export interface DailyWeatherForecast {
  date: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityPercent?: number;
  windSpeedMaxKmh: number;
  weatherCode?: number;
}

export interface HourlySprayWindowPoint {
  timeIso: string;
  hourLabel: string;
  hourOffset: number; // +1, +2, +3, +4, +5
  precipitationMm: number;
  precipitationProbability: number; // 0 to 100%
  temperatureC: number;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherDescription: string;
  isRainExpected: boolean;
}

export interface SprayWashoutAdvisory {
  canSpray: boolean;
  verdict: 'SAFE_TO_SPRAY' | 'DO_NOT_SPRAY' | 'CAUTION_WIND_OR_MARGINAL';
  badgeTitle: string;
  headline: string;
  detailedReason: string;
  rainProbability5hMax: number;
  totalRainfall5hMm: number;
  firstRainHour: string | null;
  dryHoursAvailable: number;
  rainfastnessRequirementHours: number;
  windStatus: {
    windSpeedKmh: number;
    isWindSafe: boolean;
    windDriftRisk: 'LOW' | 'MODERATE' | 'HIGH';
    comment: string;
  };
  optimalWindowRecommendation: string;
  nextSafeSprayWindow: string;
  hourlyTimeline: HourlySprayWindowPoint[];
  evaluatedAt: string;
}

export interface DistrictWeatherNewsAlert {
  district: string;
  state: string;
  country: string;
  locality?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  alertLevel: 'GREEN_CLEAR' | 'YELLOW_WATCH' | 'ORANGE_ALERT' | 'RED_WARNING';
  alertColor: string;
  headline: string;
  bulletinText: string;
  source: string;
  issuedAt: string;
  bulletinCode?: string;
  agroClimateZone?: string;
  stationName?: string;
  diseasePressureAdvisory?: string;
  rainForecastSummary: string;
  sprayRecommendation: string;
  fieldDrainageAdvisory?: string;
}

export interface WeatherDataPayload {
  current: WeatherObservation;
  historicalSummary: {
    last24Hours: WeatherSummary;
    last3Days: WeatherSummary;
    last7Days: WeatherSummary;
  };
  forecast: DailyWeatherForecast[];
  next5HoursSprayTimeline?: HourlySprayWindowPoint[];
  sprayWashoutAdvisory?: SprayWashoutAdvisory;
  districtNewsAlert?: DistrictWeatherNewsAlert;
  location: {
    latitude: number;
    longitude: number;
    elevationM?: number;
    timezone?: string;
    district?: string;
    state?: string;
  };
}

