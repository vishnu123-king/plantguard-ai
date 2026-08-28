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

export interface WeatherDataPayload {
  current: WeatherObservation;
  historicalSummary: {
    last24Hours: WeatherSummary;
    last3Days: WeatherSummary;
    last7Days: WeatherSummary;
  };
  forecast: DailyWeatherForecast[];
  location: {
    latitude: number;
    longitude: number;
    elevationM?: number;
    timezone?: string;
  };
}
