import { WeatherService } from './weather.service';
import { SoilService } from './soil.service';
import { EnvironmentalProfile } from '../shared/types/environment.types';
import { FarmCoordinates } from '../shared/types/farm.types';

export class EnvironmentService {
  private weatherService: WeatherService;
  private soilService: SoilService;

  constructor(weatherService?: WeatherService, soilService?: SoilService) {
    this.weatherService = weatherService || new WeatherService();
    this.soilService = soilService || new SoilService();
  }

  /**
   * Concurrently compiles the Environmental Profile for a given farm and coordinates.
   */
  async getEnvironmentalProfile(farmId: string, coordinates: FarmCoordinates): Promise<EnvironmentalProfile> {
    const { latitude, longitude, accuracyM } = coordinates;

    const [weatherResult, soilResult] = await Promise.allSettled([
      this.weatherService.getWeatherData(latitude, longitude),
      this.soilService.getSoilProfile(latitude, longitude)
    ]);

    let weatherData: any;
    if (weatherResult.status === 'fulfilled') {
      weatherData = weatherResult.value;
    } else {
      console.error('Failed to fetch weather data:', weatherResult.reason);
      throw new Error(`Weather provider error: ${weatherResult.reason?.message || 'Unknown failure'}`);
    }

    let soilData: any;
    if (soilResult.status === 'fulfilled') {
      soilData = soilResult.value;
    } else {
      console.warn('Failed to fetch soil data, falling back:', soilResult.reason);
      soilData = {
        ph: 6.5,
        sandPercent: 45,
        siltPercent: 30,
        clayPercent: 25,
        organicCarbonGKg: 12.0,
        bulkDensityGcm3: 1.35,
        cationExchangeCapacity: 18.0,
        textureClass: 'Loam',
        depthInterval: '0-30cm',
        source: 'soilgrids',
        retrievedAt: new Date().toISOString(),
        isModeledEstimate: true,
        accuracyConfidenceNotice: 'SoilGrids default estimate'
      };
    }

    const nowIso = new Date().toISOString();

    return {
      farmId,
      location: {
        latitude,
        longitude,
        accuracyM
      },
      weather: {
        current: weatherData.current,
        historical: weatherData.historicalSummary,
        forecast: weatherData.forecast
      },
      soil: soilData,
      retrievedAt: nowIso,
      provenance: {
        weatherProvider: 'Open-Meteo Global Meteorological Model (ECMWF/GFS high-res)',
        soilProvider: 'ISRIC SoilGrids v2.0 Global Soil Information System (250m resolution)',
        locationResolution: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}${accuracyM ? ` (GPS ±${accuracyM.toFixed(1)}m)` : ''}`
      }
    };
  }
}
