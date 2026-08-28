import { FarmCoordinates } from './farm.types';
import { WeatherObservation, WeatherSummary, DailyWeatherForecast } from './weather.types';
import { SoilProperties } from './soil.types';

export interface EnvironmentalProfile {
  farmId: string;
  location: FarmCoordinates;
  weather: {
    current: WeatherObservation;
    historical?: {
      last24Hours: WeatherSummary;
      last3Days: WeatherSummary;
      last7Days: WeatherSummary;
    };
    forecast?: DailyWeatherForecast[];
  };
  soil: SoilProperties;
  retrievedAt: string;
  provenance: {
    weatherProvider: string;
    soilProvider: string;
    locationResolution: string;
  };
}
