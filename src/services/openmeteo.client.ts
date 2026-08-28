import { WeatherObservation, WeatherSummary, DailyWeatherForecast, WeatherDataPayload } from '../shared/types/weather.types';

export class OpenMeteoClient {
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options?: { baseUrl?: string; timeoutMs?: number; maxRetries?: number }) {
    this.baseUrl = options?.baseUrl || process.env.OPENMETEO_API_URL || 'https://api.open-meteo.com/v1/forecast';
    this.timeoutMs = options?.timeoutMs || 8000;
    this.maxRetries = options?.maxRetries || 2;
  }

  /**
   * Fetches current, historical (past 7 days), and forecast weather for geographic coordinates.
   */
  async fetchWeatherData(latitude: number, longitude: number): Promise<WeatherDataPayload> {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure,cloud_cover,weather_code',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code',
      past_days: '7',
      forecast_days: '7',
      timezone: 'auto'
    });

    const url = `${this.baseUrl}?${params.toString()}`;
    const rawData = await this.executeWithRetry(url);

    return this.normalizeOpenMeteoResponse(rawData, latitude, longitude);
  }

  private async executeWithRetry(url: string, attempt = 1): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriSentinel-SIH26131/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned status ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (attempt < this.maxRetries) {
        const backoffMs = attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.executeWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  private normalizeOpenMeteoResponse(data: any, latitude: number, longitude: number): WeatherDataPayload {
    const currentRaw = data.current || {};
    const nowIso = new Date().toISOString();

    const current: WeatherObservation = {
      temperatureC: Number((currentRaw.temperature_2m ?? 26.5).toFixed(1)),
      relativeHumidityPercent: Number((currentRaw.relative_humidity_2m ?? 72).toFixed(1)),
      precipitationMm: Number((currentRaw.precipitation ?? 0).toFixed(1)),
      windSpeedKmh: Number((currentRaw.wind_speed_10m ?? 8.5).toFixed(1)),
      surfacePressureHpa: currentRaw.surface_pressure,
      cloudCoverPercent: currentRaw.cloud_cover,
      weatherCode: currentRaw.weather_code,
      weatherDescription: this.describeWeatherCode(currentRaw.weather_code),
      observedAt: currentRaw.time ? new Date(currentRaw.time).toISOString() : nowIso,
      retrievedAt: nowIso,
      source: 'open-meteo'
    };

    // Process hourly history into 24h, 3d, and 7d summaries
    const hourly = data.hourly || { time: [], temperature_2m: [], relative_humidity_2m: [], precipitation: [] };
    const last24Hours = this.calculateSummary(hourly, 24, '24h');
    const last3Days = this.calculateSummary(hourly, 72, '3d');
    const last7Days = this.calculateSummary(hourly, 168, '7d');

    // Process daily forecast
    const dailyRaw = data.daily || { time: [] };
    const forecast: DailyWeatherForecast[] = [];
    if (Array.isArray(dailyRaw.time)) {
      for (let i = 0; i < dailyRaw.time.length; i++) {
        forecast.push({
          date: dailyRaw.time[i],
          temperatureMaxC: Number((dailyRaw.temperature_2m_max?.[i] ?? 30).toFixed(1)),
          temperatureMinC: Number((dailyRaw.temperature_2m_min?.[i] ?? 20).toFixed(1)),
          precipitationSumMm: Number((dailyRaw.precipitation_sum?.[i] ?? 0).toFixed(1)),
          precipitationProbabilityPercent: dailyRaw.precipitation_probability_max?.[i] ?? 20,
          windSpeedMaxKmh: Number((dailyRaw.wind_speed_10m_max?.[i] ?? 12).toFixed(1)),
          weatherCode: dailyRaw.weather_code?.[i]
        });
      }
    }

    return {
      current,
      historicalSummary: {
        last24Hours,
        last3Days,
        last7Days
      },
      forecast,
      location: {
        latitude: data.latitude ?? latitude,
        longitude: data.longitude ?? longitude,
        elevationM: data.elevation,
        timezone: data.timezone
      }
    };
  }

  private calculateSummary(hourly: any, hoursCount: number, period: '24h' | '3d' | '7d'): WeatherSummary {
    const totalPoints = hourly.time?.length || 0;
    if (totalPoints === 0) {
      return {
        period,
        totalRainfallMm: 0,
        averageTemperatureC: 25,
        minTemperatureC: 20,
        maxTemperatureC: 30,
        averageHumidityPercent: 70,
        maxHumidityPercent: 85,
        highHumidityHoursCount: 0
      };
    }

    // Take the most recent `hoursCount` slices
    const startIndex = Math.max(0, totalPoints - hoursCount);
    const temps: number[] = hourly.temperature_2m?.slice(startIndex) || [];
    const humids: number[] = hourly.relative_humidity_2m?.slice(startIndex) || [];
    const precips: number[] = hourly.precipitation?.slice(startIndex) || [];

    const totalRainfallMm = precips.reduce((sum, val) => sum + (Number(val) || 0), 0);
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 25;
    const minTemp = temps.length > 0 ? Math.min(...temps) : 20;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 30;
    const avgHumid = humids.length > 0 ? humids.reduce((a, b) => a + b, 0) / humids.length : 70;
    const maxHumid = humids.length > 0 ? Math.max(...humids) : 85;
    const highHumidityHoursCount = humids.filter((h) => h >= 85).length;

    return {
      period,
      totalRainfallMm: Number(totalRainfallMm.toFixed(2)),
      averageTemperatureC: Number(avgTemp.toFixed(1)),
      minTemperatureC: Number(minTemp.toFixed(1)),
      maxTemperatureC: Number(maxTemp.toFixed(1)),
      averageHumidityPercent: Number(avgHumid.toFixed(1)),
      maxHumidityPercent: Number(maxHumid.toFixed(1)),
      highHumidityHoursCount
    };
  }

  private describeWeatherCode(code?: number): string {
    if (code === undefined || code === null) return 'Clear';
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
    if (code >= 45 && code <= 48) return 'Foggy / Dew deposit';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain showers';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Heavy rain showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Overcast';
  }
}
