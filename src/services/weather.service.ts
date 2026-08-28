import { OpenMeteoClient } from './openmeteo.client';
import { WeatherDataPayload, WeatherObservation } from '../shared/types/weather.types';

export class WeatherService {
  private client: OpenMeteoClient;
  private cache: Map<string, { data: WeatherDataPayload; expiresAt: number }>;
  private ttlMs: number;

  constructor(client?: OpenMeteoClient, ttlMs = 15 * 60 * 1000) { // 15 minutes TTL
    this.client = client || new OpenMeteoClient();
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  /**
   * Retrieves full weather package (current + history + forecast) with memory caching.
   */
  async getWeatherData(latitude: number, longitude: number): Promise<WeatherDataPayload> {
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await this.client.fetchWeatherData(latitude, longitude);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs
    });

    return data;
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherObservation> {
    const payload = await this.getWeatherData(latitude, longitude);
    return payload.current;
  }
}
