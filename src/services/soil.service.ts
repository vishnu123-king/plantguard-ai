import { SoilGridsClient } from './soilgrids.client';
import { SoilProperties } from '../shared/types/soil.types';

export class SoilService {
  private client: SoilGridsClient;
  private cache: Map<string, { data: SoilProperties; expiresAt: number }>;
  private ttlMs: number;

  constructor(client?: SoilGridsClient, ttlMs = 24 * 60 * 60 * 1000) { // 24 hours TTL for soil data
    this.client = client || new SoilGridsClient();
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  /**
   * Retrieves soil profile with 24-hour cache layer.
   */
  async getSoilProfile(latitude: number, longitude: number): Promise<SoilProperties> {
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await this.client.fetchSoilData(latitude, longitude);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs
    });

    return data;
  }
}
