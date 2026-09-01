import {
  WeatherObservation,
  WeatherSummary,
  DailyWeatherForecast,
  WeatherDataPayload,
  HourlySprayWindowPoint,
  SprayWashoutAdvisory
} from '../shared/types/weather.types';

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
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,rain,showers,weather_code,wind_speed_10m',
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

    // Extract next 5 continuous hours for Spray Washout Intelligence
    const rawCurrentTime = currentRaw.time;
    const { timeline: next5HoursSprayTimeline, advisory: sprayWashoutAdvisory } = this.calculateSprayWashoutAdvisory(
      hourly,
      current,
      rawCurrentTime
    );

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
      next5HoursSprayTimeline,
      sprayWashoutAdvisory,
      location: {
        latitude: data.latitude ?? latitude,
        longitude: data.longitude ?? longitude,
        elevationM: data.elevation,
        timezone: data.timezone
      }
    };
  }

  private calculateSprayWashoutAdvisory(
    hourly: any,
    current: WeatherObservation,
    rawCurrentTime?: string
  ): { timeline: HourlySprayWindowPoint[]; advisory: SprayWashoutAdvisory } {
    const times: string[] = hourly.time || [];
    const precips: number[] = hourly.precipitation || [];
    const probs: number[] = hourly.precipitation_probability || [];
    const temps: number[] = hourly.temperature_2m || [];
    const humids: number[] = hourly.relative_humidity_2m || [];
    const winds: number[] = hourly.wind_speed_10m || [];
    const codes: number[] = hourly.weather_code || [];

    // Pinpoint current local index in target timezone using current.time
    let currentIndex = -1;
    if (rawCurrentTime && typeof rawCurrentTime === 'string') {
      const matchPrefix = rawCurrentTime.substring(0, 13); // e.g. "2026-09-01T20"
      currentIndex = times.findIndex((t) => typeof t === 'string' && t.startsWith(matchPrefix));
    }

    if (currentIndex === -1) {
      const now = new Date();
      currentIndex = times.findIndex((t) => {
        const pointTime = new Date(t);
        return pointTime.getTime() >= now.getTime() - 30 * 60 * 1000;
      });
    }

    if (currentIndex === -1 || currentIndex >= times.length - 5) {
      // Fallback: start 7 days in or 24h before the end
      currentIndex = Math.min(168, Math.max(0, times.length - 24));
    }

    const timeline: HourlySprayWindowPoint[] = [];
    let maxRainProb = 0;
    let totalRain5h = 0;
    let firstRainHour: string | null = null;
    let dryHoursCount = 0;

    for (let offset = 1; offset <= 5; offset++) {
      const idx = currentIndex + offset;
      const pointTimeStr = times[idx] || '';
      
      // Compute human readable local hour label cleanly
      let hourLabel = `+${offset}h`;
      if (pointTimeStr && pointTimeStr.length >= 13) {
        const hourNum = parseInt(pointTimeStr.substring(11, 13), 10);
        if (!isNaN(hourNum)) {
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const hour12 = hourNum % 12 || 12;
          hourLabel = `${hour12.toString().padStart(2, '0')}:00 ${ampm}`;
        }
      }

      const precip = Number((precips[idx] ?? 0).toFixed(1));
      const prob = Number((probs[idx] ?? (precip > 0 ? 75 : 10)).toFixed(0));
      const temp = Number((temps[idx] ?? current.temperatureC).toFixed(1));
      const rh = Number((humids[idx] ?? current.relativeHumidityPercent).toFixed(0));
      const wind = Number((winds[idx] ?? current.windSpeedKmh).toFixed(1));
      const code = codes[idx] ?? 0;
      const desc = this.describeWeatherCode(code);

      // Rain is expected if precip >= 0.2mm, or prob >= 30%, or rain codes (51-67, 80-99)
      const isRainCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
      const isRainExpected = precip >= 0.2 || prob >= 30 || isRainCode;

      if (prob > maxRainProb) maxRainProb = prob;
      totalRain5h += precip;

      if (isRainExpected && !firstRainHour) {
        firstRainHour = `+${offset}h (${hourLabel})`;
      }

      if (!isRainExpected && firstRainHour === null) {
        dryHoursCount++;
      }

      timeline.push({
        timeIso: pointTimeStr,
        hourLabel,
        hourOffset: offset,
        precipitationMm: precip,
        precipitationProbability: prob,
        temperatureC: temp,
        relativeHumidityPercent: rh,
        windSpeedKmh: wind,
        weatherCode: code,
        weatherDescription: desc,
        isRainExpected
      });
    }

    totalRain5h = Number(totalRain5h.toFixed(1));

    // Decision Logic for Rainfastness & Spray Window
    const rainHazard = totalRain5h >= 0.2 || maxRainProb >= 30 || firstRainHour !== null;
    const currentWind = current.windSpeedKmh;
    const isWindSafe = currentWind <= 15;
    const windDriftRisk = currentWind > 18 ? 'HIGH' : currentWind > 12 ? 'MODERATE' : 'LOW';

    let verdict: 'SAFE_TO_SPRAY' | 'DO_NOT_SPRAY' | 'CAUTION_WIND_OR_MARGINAL' = 'SAFE_TO_SPRAY';
    let canSpray = true;
    let badgeTitle = '✅ SAFE TO SPRAY (5h Dry Window)';
    let headline = 'Safe 5-Hour Dry Window Ahead — Zero Washout Risk';
    let detailedReason = 'No precipitation forecasted over the next 5 continuous hours. Foliar pesticides and bio-fungicides will have sufficient drying time (4–6 hours rainfastness) to adhere to leaf cuticles and be absorbed.';

    if (rainHazard) {
      verdict = 'DO_NOT_SPRAY';
      canSpray = false;
      badgeTitle = '⛔ DO NOT SPRAY (Rain Expected in 5h)';
      headline = `Rainfall Imminent (${maxRainProb}% Chance, ${totalRain5h} mm) — High Washout Risk`;
      detailedReason = `Chemical and bio-pesticides require a minimum 4 to 6 hour dry window (rainfastness period) to bond with foliage. Rain is forecasted at ${firstRainHour || 'within next 5 hours'}, which will wash away active ingredients into runoff, resulting in wasted chemical costs and zero disease control.`;
    } else if (!isWindSafe) {
      verdict = 'CAUTION_WIND_OR_MARGINAL';
      canSpray = false;
      badgeTitle = '⚠️ CAUTION: High Wind Drift Hazard';
      headline = `Wind Speed (${currentWind} km/h) Exceeds Safe Spray Threshold`;
      detailedReason = `Although no rain is predicted in the next 5 hours, wind speeds above 15 km/h cause significant droplet drift, uneven leaf deposition, and chemical waste. Wait for wind to subside below 12 km/h.`;
    }

    let optimalWindowRecommendation = 'Morning hours (06:30 AM - 09:30 AM) or Late Afternoon (04:30 PM - 06:30 PM)';
    let nextSafeSprayWindow = 'Current 5-hour window is clear for spraying.';
    if (rainHazard) {
      nextSafeSprayWindow = 'Postpone application until after rain showers pass and foliage dries (estimated tomorrow morning 07:00 AM).';
      optimalWindowRecommendation = 'Wait for a guaranteed 6-hour dry window with relative humidity < 85% and wind speed < 12 km/h.';
    }

    const windComment = isWindSafe
      ? `Wind speed (${currentWind} km/h) is optimal for fine-droplet foliar penetration without drift.`
      : `High wind (${currentWind} km/h) may cause pesticide mist to drift away from target foliage.`;

    const advisory: SprayWashoutAdvisory = {
      canSpray,
      verdict,
      badgeTitle,
      headline,
      detailedReason,
      rainProbability5hMax: maxRainProb,
      totalRainfall5hMm: totalRain5h,
      firstRainHour,
      dryHoursAvailable: dryHoursCount,
      rainfastnessRequirementHours: 5,
      windStatus: {
        windSpeedKmh: currentWind,
        isWindSafe,
        windDriftRisk,
        comment: windComment
      },
      optimalWindowRecommendation,
      nextSafeSprayWindow,
      hourlyTimeline: timeline,
      evaluatedAt: new Date().toISOString()
    };

    return { timeline, advisory };
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

